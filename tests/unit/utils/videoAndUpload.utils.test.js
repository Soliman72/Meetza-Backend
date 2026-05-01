jest.mock("../../../src/utils/upload", () => ({
  uploadVideo: jest.fn(),
  uploadPhoto: jest.fn(),
}));

const { getVideoVisibility } = require("../../../src/utils/videoVisibility");
const { buildVideoSearchCondition } = require("../../../src/utils/videoSearch");
const { uploadFiles } = require("../../../src/utils/uploadVideoFiles");
const { uploadVideo, uploadPhoto } = require("../../../src/utils/upload");

describe("video and upload utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("getVideoVisibility handles roles and anonymous users", () => {
    expect(getVideoVisibility({}, "v")).toEqual({ whereClause: "", params: [] });

    expect(
      getVideoVisibility({ user: { id: "u1", role: "Super_Admin" } }, "v")
    ).toEqual({ whereClause: "", params: [] });

    const admin = getVideoVisibility({ user: { id: "u2", role: "Administrator" } }, "x");
    expect(admin.whereClause).toContain("v.group_id IN (SELECT group_id FROM group_admin");
    expect(admin.params).toEqual(["u2"]);

    const member = getVideoVisibility({ user: { id: "u3", role: "Member" } }, "v");
    expect(member.whereClause).toContain(
      "v.group_id IN (SELECT group_id FROM group_membership"
    );
    expect(member.params).toEqual(["u3"]);
  });

  test("buildVideoSearchCondition returns empty or populated condition", () => {
    expect(buildVideoSearchCondition("")).toEqual({ clause: "", params: [] });

    const out = buildVideoSearchCondition("hello", "x");
    expect(out.clause).toContain("v.title LIKE ?");
    expect(out.params).toEqual(["%hello%", "%hello%", "%hello%"]);
  });

  test("uploadFiles handles files/body combinations", async () => {
    uploadVideo.mockResolvedValueOnce("video-from-file");
    uploadPhoto.mockResolvedValueOnce("poster-from-file");
    const reqFiles = {
      files: {
        video_file: [{ name: "video.mp4" }],
        poster_file: [{ name: "poster.png" }],
      },
      body: {},
    };
    await expect(uploadFiles(reqFiles)).resolves.toEqual({
      videoUrl: "video-from-file",
      posterUrl: "poster-from-file",
    });

    uploadVideo.mockResolvedValueOnce("video-from-body");
    uploadPhoto.mockResolvedValueOnce("poster-from-body");
    const reqBody = {
      files: {},
      body: {
        video_file: "video-url",
        poster_file: "poster-url",
      },
    };
    await expect(uploadFiles(reqBody)).resolves.toEqual({
      videoUrl: "video-from-body",
      posterUrl: "poster-from-body",
    });

    await expect(uploadFiles({ files: {}, body: {} })).resolves.toEqual({
      videoUrl: "",
      posterUrl: "",
    });
  });
});
