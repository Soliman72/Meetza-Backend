const videoRepo = require("../repositories/videoRepository");
const { uploadFiles } = require("../utils/uploadVideoFiles");
const { createUniqueVideoSlug } = require("../utils/slug");
const { createVideoDuration } = require("../utils/videoDuration");
const videoValidator = require("../validators/videoValidator");
const groupRepository = require("../repositories/groupRepository");
const commentRepository = require("../repositories/commentRepository");
const { mapVideoDetails, mapVideoRow } = require("../utils/mapper");

const httpError = (status, message) => {
  const e = new Error(message);
  e.status = status;
  return e;
};

exports.createVideo = async (req) => {
  await videoValidator.createVideoValidator(req);

  const { videoUrl, posterUrl } = await uploadFiles(req);

  const duration = await createVideoDuration(req.body.duration);
  const slug = await createUniqueVideoSlug(req.body.title);
  const owner = await groupRepository.getGroupOwner(req.body.group_id);
  if (!owner) {
    throw httpError(404, "Owner not found");
  }

  return videoRepo.createVideo({
    title: req.body.title,
    video_url: videoUrl,
    poster_url: posterUrl,
    slug,
    duration,
    administrator_id: owner.user_id,
    description: req.body.description,
    meeting_id: req.body.meeting_id,
    group_id: req.body.group_id,
  });
};

exports.getAllVideos = async (req) => {
  const videos = await videoRepo.getVideos(req);
  return videos.map((video) => mapVideoRow(video, !!req.user?.id));
};

exports.getVideoById = async (req) => {
  const video = await videoRepo.getVideoById(req.params.id, req);
  if (!video) {
    throw httpError(404, "Video not found");
  }
  const comments = await commentRepository.getCommentsByVideo(video.id);
  return mapVideoDetails(video, comments, !!req.user?.id);
};

exports.getRelatedVideos = async (req) => {
  const videos = await videoRepo.getRelatedVideos(req);
  return videos.map((video) => mapVideoRow(video, !!req.user?.id));
};

exports.updateVideo = async (req) => {
  const videoId = await videoRepo.resolveVideoId(req.params.id);
  if (!videoId) {
    throw httpError(404, "Video not found");
  }

  const data = { ...req.body };
  if (req.body.duration !== undefined) {
    data.duration = await createVideoDuration(req.body.duration);
  }

  if (req.files && (req.files.video_file || req.files.poster_file)) {
    const { videoUrl, posterUrl } = await uploadFiles(req);
    if (videoUrl) data.video_url = videoUrl;
    if (posterUrl) data.poster_url = posterUrl;
  }

  const affected = await videoRepo.updateVideo(videoId, data, req);
  if (!affected) {
    throw httpError(404, "Video not found or update not allowed");
  }

  const video = await videoRepo.getVideoById(videoId, req);
  if (!video) {
    throw httpError(404, "Video not found");
  }
  const comments = await commentRepository.getCommentsByVideo(video.id);
  return mapVideoDetails(video, comments, !!req.user?.id);
};

exports.deleteVideo = async (req) => {
  const videoId = await videoRepo.resolveVideoId(req.params.id);
  if (!videoId) {
    throw httpError(404, "Video not found");
  }
  const affected = await videoRepo.deleteVideo(videoId, req);
  if (!affected) {
    throw httpError(404, "Video not found or delete not allowed");
  }
};

exports.summarizeVideo = async (req) => {
  const video = await videoRepo.getVideoById(req.params.video_id, req);
  if (!video) {
    throw httpError(404, "Video not found");
  }
  return videoRepo.listTranscriptSummariesByVideoId(video.id);
};
