const userDto = require("../dto/userDto");
const chatMediaDto = require("../dto/chatMediaDto");
const userRepository = require("../repositories/userRepository");
const chatRepository = require("../repositories/chatRepository");
const profileValidator = require("../validators/profileValidator");
const httpError = require("../utils/httpError");

exports.getMyProfile = async (req) => {
  profileValidator.requireAuthenticatedUser(req);

  const userId = req.user.id;
  const user = await userRepository.findById(userId);

  if (!user) {
    throw httpError(404, "User not found");
  }

  const positions = await userRepository.findPositionsByUserId(userId);
  return userDto.toProfile(user, positions);
};

exports.getMyChatMedia = async (req) => {
  profileValidator.requireAuthenticatedUser(req);

  const userId = req.user.id;
  const rows = await chatRepository.findChatMediaByUserId(userId, req.user.role);

  return chatMediaDto.toChatMediaList(rows);
};
