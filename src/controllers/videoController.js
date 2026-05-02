const videoService = require("../services/videoService");
const sendError = require("../utils/sendError");

exports.createVideo = async (req, res) => {
  try {
    const data = await videoService.createVideo(req);
    return res.status(201).json({ success: true, data });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.getAllVideos = async (req, res) => {
  try {
    const data = await videoService.getAllVideos(req);
    return res.json({ success: true, data });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.getVideoById = async (req, res) => {
  try {
    const data = await videoService.getVideoById(req);
    return res.json({ success: true, data });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.getRelatedVideos = async (req, res) => {
  try {
    const data = await videoService.getRelatedVideos(req);
    return res.json({ success: true, data });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.updateVideo = async (req, res) => {
  try {
    const data = await videoService.updateVideo(req);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.deleteVideo = async (req, res) => {
  try {
    await videoService.deleteVideo(req);
    return res.json({ success: true, message: "Deleted" });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.summarizeVideo = async (req, res) => {
  try {
    const data = await videoService.summarizeVideo(req);
    return res.json({ success: true, data });
  } catch (err) {
    return sendError(res, err);
  }
};
