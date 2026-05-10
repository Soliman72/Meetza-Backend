const videoRepo = require("../repositories/videoRepository");
const { uploadFiles } = require("../utils/uploadVideoFiles");
const { createUniqueVideoSlug } = require("../utils/slug");
const { createVideoDuration } = require("../utils/videoDuration");
const videoValidator = require("../validators/videoValidator");
const groupRepository = require("../repositories/groupRepository");
const commentRepository = require("../repositories/commentRepository");
const { mapVideoDetails, mapVideoRow } = require("../utils/mapper");
const { getRequestedLocalization } = require("../utils/localization");
const { normalizeTopics } = require("../utils/normalizeTopicsVideo");
const { internalSummarizeVideo } = require("../utils/videoSummarize");
const httpError = require("../utils/httpError");

exports.createVideo = async (req) => {
  await videoValidator.createVideoValidator(req);

  const { videoUrl, posterUrl } = await uploadFiles(req);

  const duration = await createVideoDuration(req.body.duration);
  const slug = await createUniqueVideoSlug(req.body.title);
  const owner = await groupRepository.getGroupOwner(req.body.group_id);
  if (!owner) {
    throw httpError(404, "Owner not found");
  }
  
  const video = await videoRepo.createVideo({
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

  const localization = getRequestedLocalization(req);
  const file = req.files?.video_file ? req.files.video_file[0] : null;

  // Run summarization in the background to avoid timeouts
  internalSummarizeVideo(video.id, videoUrl, localization, file).catch((err) => {
    console.error(`[Background Summary Error] Video ${video.id}:`, err.message);
  });

  // Return the full video object (with summary and topics)
  return exports.getVideoById({ params: { id: video.id }, user: req.user });
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
  const localization = getRequestedLocalization(req);
  const { video_id } = req.params;

  if (!video_id) {
    throw httpError(400, "Missing video_id in request");
  }

  const resolvedVideoId = await videoRepo.resolveVideoId(video_id);
  if (!resolvedVideoId) {
    throw httpError(404, "Video not found");
  }

  const video = await videoRepo.getVideoSourceById(resolvedVideoId);
  if (!video) {
    throw httpError(404, "Video not found");
  }

  const allRows = await videoRepo.listTranscriptSummariesByVideoId(resolvedVideoId);
  if (allRows && allRows.length > 0) {
    const response = {
      video_id: resolvedVideoId,
      summaries: {},
      cached: true,
    };

    allRows.forEach((row) => {
      response.summaries[row.language] = {
        summary: row.summary,
        topics: normalizeTopics(row.topics),
        transcript: row.transcript,
      };
    });

    // For backward compatibility, also return at top level if requested language exists
    const requested = allRows.find(r => r.language === localization);
    if (requested) {
      response.language = requested.language;
      response.summary = requested.summary;
      response.topics = normalizeTopics(requested.topics);
      response.transcript = requested.transcript;
    }

    return response;
  }

  const file = req.file || null;
  const url = req.body?.url || video.video_url;

  if (!file && !url) {
    throw httpError(400, "No file or url provided");
  }

  return internalSummarizeVideo(resolvedVideoId, url, localization, file);
};
