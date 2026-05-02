jest.mock("../../../src/repositories/videoRepository");
jest.mock("../../../src/utils/uploadVideoFiles");
jest.mock("../../../src/utils/slug");
jest.mock("../../../src/utils/videoDuration");
jest.mock("../../../src/validators/videoValidator");
jest.mock("../../../src/repositories/groupRepository");
jest.mock("../../../src/repositories/commentRepository");
jest.mock("../../../src/utils/mapper");
jest.mock("../../../src/utils/localization");
jest.mock("../../../src/utils/normalizeTopicsVideo");
jest.mock("../../../src/utils/videoSummarize");
jest.mock("../../../src/utils/httpError");

const videoService = require("../../../src/services/videoService");
const videoRepo = require("../../../src/repositories/videoRepository");
const groupRepo = require("../../../src/repositories/groupRepository");
const commentRepo = require("../../../src/repositories/commentRepository");
const { uploadFiles } = require("../../../src/utils/uploadVideoFiles");
const { createUniqueVideoSlug } = require("../../../src/utils/slug");
const { createVideoDuration } = require("../../../src/utils/videoDuration");
const videoValidator = require("../../../src/validators/videoValidator");
const { mapVideoDetails, mapVideoRow } = require("../../../src/utils/mapper");
const { getRequestedLocalization } = require("../../../src/utils/localization");
const { normalizeTopics } = require("../../../src/utils/normalizeTopicsVideo");
const { internalSummarizeVideo } = require("../../../src/utils/videoSummarize");
const httpError = require("../../../src/utils/httpError");

describe("videoService", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default implementations for some mocked functions
    httpError.mockImplementation((status, msg) => {
      const err = new Error(msg);
      err.status = status;
      return err;
    });
    getRequestedLocalization.mockReturnValue("en");
    normalizeTopics.mockImplementation((t) => t);
  });

  describe("createVideo", () => {
    test("creates video successfully and returns it", async () => {
      videoValidator.createVideoValidator.mockResolvedValue(true);
      uploadFiles.mockResolvedValue({ videoUrl: "url1", posterUrl: "poster1" });
      createVideoDuration.mockResolvedValue(120);
      createUniqueVideoSlug.mockResolvedValue("slug1");
      groupRepo.getGroupOwner.mockResolvedValue({ user_id: "u1" });
      videoRepo.createVideo.mockResolvedValue({ id: "v1" });
      internalSummarizeVideo.mockResolvedValue(true);
      
      // Mocks for getVideoById which is called at the end
      videoRepo.getVideoById.mockResolvedValue({ id: "v1", title: "Test" });
      commentRepo.getCommentsByVideo.mockResolvedValue([]);
      mapVideoDetails.mockReturnValue({ id: "v1", mapped: true });

      const req = {
        body: { title: "Test", duration: "120", group_id: "g1" },
        user: { id: "u1" },
      };

      const result = await videoService.createVideo(req);

      expect(videoRepo.createVideo).toHaveBeenCalled();
      expect(internalSummarizeVideo).toHaveBeenCalledWith("v1", "url1", "en", null);
      expect(result).toEqual({ id: "v1", mapped: true });
    });

    test("throws if owner not found", async () => {
      uploadFiles.mockResolvedValue({});
      groupRepo.getGroupOwner.mockResolvedValue(null);

      const req = { body: { group_id: "g1" } };
      await expect(videoService.createVideo(req)).rejects.toThrow("Owner not found");
    });

    test("deletes video if summarization fails", async () => {
      uploadFiles.mockResolvedValue({ videoUrl: "url1", posterUrl: "poster1" });
      groupRepo.getGroupOwner.mockResolvedValue({ user_id: "u1" });
      videoRepo.createVideo.mockResolvedValue({ id: "v1" });
      internalSummarizeVideo.mockRejectedValue(new Error("Summarize failed"));

      const req = { body: { group_id: "g1" } };
      await expect(videoService.createVideo(req)).rejects.toThrow("Summarize failed");
      expect(videoRepo.deleteVideo).toHaveBeenCalledWith("v1", req);
    });
  });

  describe("getAllVideos", () => {
    test("returns mapped videos", async () => {
      videoRepo.getVideos.mockResolvedValue([{ id: "v1" }, { id: "v2" }]);
      mapVideoRow.mockImplementation((v) => ({ ...v, mapped: true }));

      const result = await videoService.getAllVideos({ user: { id: "u1" } });
      expect(result).toEqual([{ id: "v1", mapped: true }, { id: "v2", mapped: true }]);
    });
  });

  describe("getVideoById", () => {
    test("returns mapped video details", async () => {
      videoRepo.getVideoById.mockResolvedValue({ id: "v1" });
      commentRepo.getCommentsByVideo.mockResolvedValue([{ id: "c1" }]);
      mapVideoDetails.mockReturnValue({ id: "v1", mapped: true });

      const result = await videoService.getVideoById({ params: { id: "v1" } });
      expect(result).toEqual({ id: "v1", mapped: true });
    });

    test("throws 404 if video not found", async () => {
      videoRepo.getVideoById.mockResolvedValue(null);
      await expect(videoService.getVideoById({ params: { id: "v1" } })).rejects.toThrow("Video not found");
    });
  });

  describe("getRelatedVideos", () => {
    test("returns related videos mapped", async () => {
      videoRepo.getRelatedVideos.mockResolvedValue([{ id: "v2" }]);
      mapVideoRow.mockReturnValue({ mapped: true });

      const result = await videoService.getRelatedVideos({ params: { id: "v1" } });
      expect(result).toEqual([{ mapped: true }]);
    });
  });

  describe("updateVideo", () => {
    test("updates and returns video details", async () => {
      videoRepo.resolveVideoId.mockResolvedValue("v1");
      createVideoDuration.mockResolvedValue(60);
      uploadFiles.mockResolvedValue({ videoUrl: "newUrl" });
      videoRepo.updateVideo.mockResolvedValue(1); // 1 affected row
      videoRepo.getVideoById.mockResolvedValue({ id: "v1" });
      commentRepo.getCommentsByVideo.mockResolvedValue([]);
      mapVideoDetails.mockReturnValue({ id: "v1", mapped: true });

      const req = {
        params: { id: "v1" },
        body: { duration: 60 },
        files: { video_file: [{}] },
      };

      const result = await videoService.updateVideo(req);
      expect(videoRepo.updateVideo).toHaveBeenCalled();
      expect(result).toEqual({ id: "v1", mapped: true });
    });

    test("throws 404 if not found during resolve", async () => {
      videoRepo.resolveVideoId.mockResolvedValue(null);
      await expect(videoService.updateVideo({ params: { id: "v1" } })).rejects.toThrow("Video not found");
    });

    test("throws 404 if update affects 0 rows", async () => {
      videoRepo.resolveVideoId.mockResolvedValue("v1");
      videoRepo.updateVideo.mockResolvedValue(0);
      await expect(videoService.updateVideo({ params: { id: "v1" }, body: {} })).rejects.toThrow("Video not found or update not allowed");
    });
  });

  describe("deleteVideo", () => {
    test("deletes successfully", async () => {
      videoRepo.resolveVideoId.mockResolvedValue("v1");
      videoRepo.deleteVideo.mockResolvedValue(1);

      await expect(videoService.deleteVideo({ params: { id: "v1" } })).resolves.toBeUndefined();
    });

    test("throws if resolve fails", async () => {
      videoRepo.resolveVideoId.mockResolvedValue(null);
      await expect(videoService.deleteVideo({ params: { id: "v1" } })).rejects.toThrow("Video not found");
    });

    test("throws if delete affects 0 rows", async () => {
      videoRepo.resolveVideoId.mockResolvedValue("v1");
      videoRepo.deleteVideo.mockResolvedValue(0);
      await expect(videoService.deleteVideo({ params: { id: "v1" } })).rejects.toThrow("Video not found or delete not allowed");
    });
  });

  describe("summarizeVideo", () => {
    test("returns cached summary if available", async () => {
      videoRepo.resolveVideoId.mockResolvedValue("v1");
      videoRepo.getVideoSourceById.mockResolvedValue({ video_url: "url1" });
      videoRepo.getTranscriptSummaryByVideoAndLanguage.mockResolvedValue({
        language: "en",
        transcript: "trans",
        summary: "sum",
        topics: ["t1"],
      });

      const result = await videoService.summarizeVideo({ params: { video_id: "v1" } });
      expect(result.cached).toBe(true);
      expect(result.summary).toBe("sum");
    });

    test("calls internalSummarizeVideo if not cached", async () => {
      videoRepo.resolveVideoId.mockResolvedValue("v1");
      videoRepo.getVideoSourceById.mockResolvedValue({ video_url: "url1" });
      videoRepo.getTranscriptSummaryByVideoAndLanguage.mockResolvedValue(null);
      internalSummarizeVideo.mockResolvedValue({ summary: "new" });

      const result = await videoService.summarizeVideo({ params: { video_id: "v1" } });
      expect(internalSummarizeVideo).toHaveBeenCalledWith("v1", "url1", "en", null);
      expect(result).toEqual({ summary: "new" });
    });

    test("throws if missing video_id", async () => {
      await expect(videoService.summarizeVideo({ params: {} })).rejects.toThrow("Missing video_id");
    });

    test("throws if resolve fails", async () => {
      videoRepo.resolveVideoId.mockResolvedValue(null);
      await expect(videoService.summarizeVideo({ params: { video_id: "v1" } })).rejects.toThrow("Video not found");
    });
  });
});
