const savedVideoRepository = require("../repositories/saved_videoRepository");
const {
  buildVideoSearchCondition,
  mapSavedVideoRow,
} = require("./videoSearchService");
const savedVideoValidator = require("../validators/saved_videoValidator");

exports.createSavedVideo = async (req) => {
  savedVideoValidator.validateAuthenticatedUser(req);
  savedVideoValidator.validateVideoIdBody(req.body);
  const { video_id } = req.body;
  const user_id = req.user.id;

  const exists = await savedVideoRepository.videoExistsById(video_id);
  if (!exists) {
    throw { status: 400, message: "Invalid video_id: not found" };
  }

  await savedVideoRepository.insertSaved(user_id, video_id);
  return {
    user_id,
    video_id,
    timestamp: new Date(),
  };
};

exports.getSavedVideosByUserId = async (req) => {
  savedVideoValidator.validateAuthenticatedUser(req);
  const user_id = req.user.id;
  const searchTerm = req.query?.q;
  const searchFilter = buildVideoSearchCondition(searchTerm, "v");
  const rows = await savedVideoRepository.listForMember(user_id, searchFilter);
  return (rows || []).map((row) => mapSavedVideoRow(row, true));
};

exports.getSavedVideoById = async (req) => {
  savedVideoValidator.validateAuthenticatedUser(req);
  savedVideoValidator.validateVideoIdParam(req.params.video_id);
  const user_id = req.user.id;
  const { video_id } = req.params;

  const savedVideoCount = await savedVideoRepository.countByVideoId(video_id);
  const rows = await savedVideoRepository.listForMemberAndVideo(
    user_id,
    video_id
  );
  const saved_video = (rows || []).map((row) => mapSavedVideoRow(row, true));
  return { savedVideoCount, saved_video };
};

exports.getAllSavedVideos = async (req) => {
  const { group_id } = req.query;
  const searchTerm = req.query?.q;
  const viewerId = req.user?.id;
  const searchFilter = buildVideoSearchCondition(searchTerm, "v");
  const rows = await savedVideoRepository.listAllWithFilters({
    viewerId,
    group_id,
    searchFilter,
  });
  return (rows || []).map((row) => mapSavedVideoRow(row, !!viewerId));
};

exports.deleteSavedVideo = async (user_id, video_id) => {
  savedVideoValidator.validateDeleteParams(user_id, video_id);
  return savedVideoRepository.deleteByMemberAndVideo(user_id, video_id);
};
