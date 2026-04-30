jest.mock("../../../src/repositories/groupRepository", () => ({
  getGroupById: jest.fn(),
  getGroupAdmins: jest.fn(),
}));
jest.mock("../../../src/repositories/meetingRepository", () => ({
  getMeetingById: jest.fn(),
}));

const videoValidator = require("../../../src/validators/videoValidator");
const groupRepository = require("../../../src/repositories/groupRepository");

describe("videoValidator", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("validateVideoIdParam throws for empty id", () => {
    expect(() => videoValidator.validateVideoIdParam("")).toThrow(
      "Video id is required"
    );
  });

  test("createVideoValidator passes valid payload", async () => {
    groupRepository.getGroupById.mockResolvedValue({ id: "g1" });
    groupRepository.getGroupAdmins.mockResolvedValue([{ user_id: "u1" }]);

    await expect(
      videoValidator.createVideoValidator({
        body: { group_id: "g1", title: "Intro Video" },
        files: { video_file: [{}], poster_file: [{}] },
      })
    ).resolves.toBeUndefined();
  });
});
