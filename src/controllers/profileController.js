const profileService = require("../services/profileService");
const { success: resSuccess } = require("../dto");
const sendError = require("../utils/sendError");

exports.getMyProfile = async (req, res) => {
  try {
    const data = await profileService.getMyProfile(req);
    return res.status(200).json(resSuccess(data));
  } catch (err) {
    return sendError(res, err);
  }
};

exports.getMyChatMedia = async (req, res) => {
  try {
    const data = await profileService.getMyChatMedia(req);
    return res.status(200).json(resSuccess(data));
  } catch (err) {
    return sendError(res, err);
  }
};
