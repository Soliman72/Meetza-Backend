jest.mock("../../../src/services/videoService");
jest.mock("../../../src/utils/sendError");

const videoController = require("../../../src/controllers/videoController");
const videoService = require("../../../src/services/videoService");
const sendError = require("../../../src/utils/sendError");

describe("videoController", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { body: {}, params: {}, query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe("createVideo", () => {
    test("returns 201 on success", async () => {
      videoService.createVideo.mockResolvedValue({ id: "v1" });
      await videoController.createVideo(req, res);
      
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: { id: "v1" } }));
    });

    test("calls sendError on failure", async () => {
      const err = new Error("fail");
      videoService.createVideo.mockRejectedValue(err);
      await videoController.createVideo(req, res);
      expect(sendError).toHaveBeenCalledWith(res, err);
    });
  });

  describe("getAllVideos", () => {
    test("returns 200 on success", async () => {
      videoService.getAllVideos.mockResolvedValue([{ id: "v1" }]);
      await videoController.getAllVideos(req, res);
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: [{ id: "v1" }] }));
    });

    test("calls sendError on failure", async () => {
      const err = new Error("fail");
      videoService.getAllVideos.mockRejectedValue(err);
      await videoController.getAllVideos(req, res);
      expect(sendError).toHaveBeenCalledWith(res, err);
    });
  });

  describe("getVideoById", () => {
    test("returns 200 on success", async () => {
      videoService.getVideoById.mockResolvedValue({ id: "v1" });
      await videoController.getVideoById(req, res);
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: { id: "v1" } }));
    });
  });

  describe("getRelatedVideos", () => {
    test("returns 200 on success", async () => {
      videoService.getRelatedVideos.mockResolvedValue([{ id: "v2" }]);
      await videoController.getRelatedVideos(req, res);
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: [{ id: "v2" }] }));
    });
  });

  describe("updateVideo", () => {
    test("returns 200 on success", async () => {
      videoService.updateVideo.mockResolvedValue({ id: "v1" });
      await videoController.updateVideo(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: { id: "v1" } }));
    });
  });

  describe("deleteVideo", () => {
    test("returns 200 on success", async () => {
      videoService.deleteVideo.mockResolvedValue(true);
      await videoController.deleteVideo(req, res);
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, message: "Deleted" }));
    });
  });

  describe("summarizeVideo", () => {
    test("returns 200 on success", async () => {
      videoService.summarizeVideo.mockResolvedValue({ summary: "abc" });
      await videoController.summarizeVideo(req, res);
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: { summary: "abc" } }));
    });
  });
});
