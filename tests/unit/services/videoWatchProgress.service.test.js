jest.mock("../../../src/repositories/videoWatchProgressRepository", () => ({
  checkAccess: jest.fn(),
  findOne: jest.fn(),
  findByUser: jest.fn(),
  upsert: jest.fn(),
  remove: jest.fn(),
}));
jest.mock("../../../src/repositories/videoRepository", () => ({
  resolveVideoId: jest.fn(),
}));
jest.mock("../../../src/utils/videoVisibility", () => ({
  getVideoVisibility: jest.fn(),
}));
jest.mock("../../../src/validators/videoWatchProgressValidator", () => ({
  requireUserId: jest.fn(),
  parseUpsertBody: jest.fn(),
}));

const repo = require("../../../src/repositories/videoWatchProgressRepository");
const videoRepo = require("../../../src/repositories/videoRepository");
const { getVideoVisibility } = require("../../../src/utils/videoVisibility");
const validator = require("../../../src/validators/videoWatchProgressValidator");
const service = require("../../../src/services/videoWatchProgressService");

describe("videoWatchProgressService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getVideoVisibility.mockReturnValue({ whereClause: "v.visibility='public'", params: [] });
  });

  test("buildProgressPayload handles null and computed fields", () => {
    expect(service.buildProgressPayload(null)).toBeNull();
    expect(
      service.buildProgressPayload({
        video_id: "v1",
        progress_seconds: 50,
        duration_seconds: 200,
        completed: 0,
        updated_at: "now",
      })
    ).toEqual({
      video_id: "v1",
      progress_seconds: 50,
      completed: false,
      updated_at: "now",
      watch_status: "watching",
      progress_percentage: 25,
    });
  });

  test("listByUser maps rows with payload fields", async () => {
    repo.findByUser.mockResolvedValue([
      {
        video_id: "v1",
        progress_seconds: 20,
        duration_seconds: 100,
        completed: 0,
        updated_at: "t1",
        title: "Video",
        slug: "video",
        poster_url: "p",
      },
    ]);

    const req = { user: { id: "u1" } };
    const rows = await service.listByUser(req, { limit: 10, offset: 0 });
    expect(repo.findByUser).toHaveBeenCalledWith("u1", 10, 0, expect.any(Object));
    expect(rows[0]).toEqual(
      expect.objectContaining({
        video_id: "v1",
        title: "Video",
        watch_status: "watching",
      })
    );
  });

  test("getWatchProgressForRequest handles not found/not accessible/success", async () => {
    const req = { user: { id: "u1" } };
    videoRepo.resolveVideoId.mockResolvedValueOnce(null);
    await expect(service.getWatchProgressForRequest(req, "slug")).rejects.toMatchObject({
      status: 404,
    });

    videoRepo.resolveVideoId.mockResolvedValueOnce("v1");
    repo.checkAccess.mockResolvedValueOnce(false);
    await expect(service.getWatchProgressForRequest(req, "slug")).rejects.toMatchObject({
      status: 404,
    });

    videoRepo.resolveVideoId.mockResolvedValueOnce("v1");
    repo.checkAccess.mockResolvedValueOnce(true);
    repo.findOne.mockResolvedValueOnce({
      video_id: "v1",
      progress_seconds: 0,
      duration_seconds: 100,
      completed: 1,
      updated_at: "t",
    });
    await expect(service.getWatchProgressForRequest(req, "slug")).resolves.toEqual(
      expect.objectContaining({ progress_percentage: 100, completed: true })
    );
  });

  test("upsertWatchProgressForRequest handles body merge and errors", async () => {
    const req = { user: { id: "u1" }, body: {} };
    videoRepo.resolveVideoId.mockResolvedValueOnce("v1");
    repo.checkAccess.mockResolvedValueOnce(true);
    validator.parseUpsertBody.mockReturnValueOnce({
      progress_seconds: undefined,
      completed: undefined,
    });
    repo.findOne.mockResolvedValueOnce({
      progress_seconds: 15,
      completed: 1,
    });
    repo.upsert.mockResolvedValueOnce({
      video_id: "v1",
      progress_seconds: 15,
      duration_seconds: 100,
      completed: 1,
      updated_at: "t",
    });
    await expect(service.upsertWatchProgressForRequest(req, "v1")).resolves.toEqual(
      expect.objectContaining({ progress_seconds: 15, completed: true })
    );

    videoRepo.resolveVideoId.mockResolvedValueOnce(null);
    await expect(service.upsertWatchProgressForRequest(req, "x")).rejects.toMatchObject({
      status: 404,
    });
  });

  test("deleteWatchProgressForRequest handles branches", async () => {
    const req = { user: { id: "u1" } };
    videoRepo.resolveVideoId.mockResolvedValueOnce("v1");
    repo.checkAccess.mockResolvedValueOnce(true);
    repo.remove.mockResolvedValueOnce(0);
    await expect(service.deleteWatchProgressForRequest(req, "v1")).rejects.toMatchObject({
      status: 404,
    });

    videoRepo.resolveVideoId.mockResolvedValueOnce("v1");
    repo.checkAccess.mockResolvedValueOnce(true);
    repo.remove.mockResolvedValueOnce(1);
    await expect(service.deleteWatchProgressForRequest(req, "v1")).resolves.toBe(true);
  });
});
