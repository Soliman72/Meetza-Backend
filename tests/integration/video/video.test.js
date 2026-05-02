const express = require("express");
const request = require("supertest");

jest.mock("../../../src/middleware/verifyToken", () => ({
  verifyToken: (req, res, next) => next(),
}));
jest.mock("../../../src/middleware/checkAdminPermission", () => ({
  checkAdminPermission: (req, res, next) => next(),
}));
jest.mock("../../../src/middleware/uploadMiddleware", () => {
  const middleware = (req, res, next) => next();
  middleware.summarizeVideoUpload = (req, res, next) => next();
  return middleware;
});
jest.mock("../../../src/routes/videoWatchProgressRoute", () => {
  const router = require("express").Router();
  return router;
});

jest.mock("../../../src/repositories/videoRepository", () => ({
  createVideo: jest.fn(),
  getVideos: jest.fn(),
  getVideoById: jest.fn(),
  getRelatedVideos: jest.fn(),
  updateVideo: jest.fn(),
  deleteVideo: jest.fn(),
  resolveVideoId: jest.fn(),
  getVideoSourceById: jest.fn(),
  getTranscriptSummaryByVideoAndLanguage: jest.fn(),
}));
jest.mock("../../../src/repositories/commentRepository", () => ({
  getCommentsByVideo: jest.fn(),
}));
jest.mock("../../../src/repositories/groupRepository", () => ({
  getGroupOwner: jest.fn(),
}));
jest.mock("../../../src/utils/uploadVideoFiles", () => ({
  uploadFiles: jest.fn(),
}));
jest.mock("../../../src/utils/slug", () => ({
  createUniqueVideoSlug: jest.fn(),
}));
jest.mock("../../../src/utils/videoDuration", () => ({
  createVideoDuration: jest.fn(),
}));
jest.mock("../../../src/validators/videoValidator", () => ({
  createVideoValidator: jest.fn(),
}));
jest.mock("../../../src/utils/videoSummarize", () => ({
  internalSummarizeVideo: jest.fn(),
}));

const videoRoute = require("../../../src/routes/videoRoute");
const videoRepository = require("../../../src/repositories/videoRepository");
const commentRepository = require("../../../src/repositories/commentRepository");
const groupRepository = require("../../../src/repositories/groupRepository");
const { uploadFiles } = require("../../../src/utils/uploadVideoFiles");
const { createUniqueVideoSlug } = require("../../../src/utils/slug");
const { createVideoDuration } = require("../../../src/utils/videoDuration");
const videoValidator = require("../../../src/validators/videoValidator");
const { internalSummarizeVideo } = require("../../../src/utils/videoSummarize");

describe("video", () => {
  const app = express();
  app.use(express.json());
  app.use("/api/video", videoRoute);

  beforeEach(() => {
    jest.clearAllMocks();
    videoRepository.getVideos.mockResolvedValue([]);
    videoRepository.getVideoById.mockResolvedValue({ id: "v1", title: "Video 1", description: "desc" });
    videoRepository.getRelatedVideos.mockResolvedValue([]);
    videoRepository.resolveVideoId.mockResolvedValue("v1");
    videoRepository.updateVideo.mockResolvedValue(1);
    videoRepository.deleteVideo.mockResolvedValue(1);
    commentRepository.getCommentsByVideo.mockResolvedValue([]);
    videoValidator.createVideoValidator.mockResolvedValue();
    uploadFiles.mockResolvedValue({ videoUrl: "https://example.com/video.mp4", posterUrl: "https://example.com/poster.jpg" });
    createVideoDuration.mockResolvedValue(120);
    createUniqueVideoSlug.mockResolvedValue("video-1");
    groupRepository.getGroupOwner.mockResolvedValue({ user_id: "admin-1" });
    videoRepository.createVideo.mockResolvedValue({ id: "v1", title: "Video 1", slug: "video-1", description: "desc" });
    internalSummarizeVideo.mockResolvedValue({ summary: "ok", topics: [] });
  });

  test("GET /api/video returns 200", async () => {
    const res = await request(app).get("/api/video");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(videoRepository.getVideos).toHaveBeenCalledTimes(1);
  });

  test("POST /api/video/create returns 201", async () => {
    const res = await request(app).post("/api/video/create").send({
      title: "Video 1",
      duration: "00:02:00",
      group_id: "g1",
      description: "desc",
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(videoRepository.createVideo).toHaveBeenCalledTimes(1);
    expect(groupRepository.getGroupOwner).toHaveBeenCalledWith("g1");
    expect(internalSummarizeVideo).toHaveBeenCalledTimes(1);
  });

  test("GET /api/video/:id returns 200", async () => {
    const res = await request(app).get("/api/video/v1");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(videoRepository.getVideoById).toHaveBeenCalledWith("v1", expect.any(Object));
    expect(commentRepository.getCommentsByVideo).toHaveBeenCalledWith("v1");
  });

  test("POST /api/video/:id returns 200", async () => {
    const res = await request(app).post("/api/video/v1").send({ title: "Updated" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(videoRepository.resolveVideoId).toHaveBeenCalledWith("v1");
    expect(videoRepository.updateVideo).toHaveBeenCalledTimes(1);
  });

  test("DELETE /api/video/:id returns 200", async () => {
    const res = await request(app).delete("/api/video/v1");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(videoRepository.deleteVideo).toHaveBeenCalledTimes(1);
  });
});
