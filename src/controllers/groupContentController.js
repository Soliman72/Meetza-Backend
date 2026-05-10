const groupContentService = require("../services/groupContentService");
const { upload, cleanupRequestFiles } = require("../middleware/uploadFile");

const sendError = (res, err) => {
  const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 500;
  const body = { success: false, message: err.message };
  if (status >= 500) body.error = err.message;
  return res.status(status).json(body);
};

exports.getAllGroupContents = async (req, res) => {
  try {
    const data = await groupContentService.getAllGroupContentsWithResources(req);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.createGroupContentFromBody = async (req, res) => {
  try {
    const data = await groupContentService.createGroupContent(req);
    return res.status(201).json({ success: true, data });
  } catch (e) {
    return sendError(res, e);
  }
};

exports.getGroupContentById = async (req, res) => {
  try {
    const data = await groupContentService.getGroupContentById(req);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.updateGroupContentById = async (req, res) => {
  try {
    await groupContentService.updateGroupContentById(req);
    return res
      .status(200)
      .json({ success: true, message: "Group content updated successfully" });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.addFilesToGroupContent = (req, res) => {
  upload.array("files", 20)(req, res, async (multerErr) => {
    if (multerErr) {
      return res.status(400).json({
        success: false,
        message: multerErr.message,
      });
    }
    try {
      const data = await groupContentService.addFilesToGroupContent(req);
      return res.status(200).json({
        success: true,
        message: "Files added successfully",
        data,
      });
    } catch (err) {
      return sendError(res, err);
    } finally {
      cleanupRequestFiles(req);
    }
  });
};

exports.deleteFileFromGroupContent = async (req, res) => {
  try {
    await groupContentService.deleteFileFromGroupContent(req);
    return res.status(200).json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.getGroupContentResourcesByMeetingId = async (req, res) => {
  try {
    const data =
      await groupContentService.getGroupContentResourcesByMeetingId(req);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return sendError(res, err);
  }
};
