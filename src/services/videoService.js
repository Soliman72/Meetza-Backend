const videoRepo = require("../repositories/videoRepository");
const axios = require("axios");
const FormData = require("form-data");
const { uploadFiles } = require("../utils/uploadVideoFiles");
const { createUniqueVideoSlug } = require("../utils/slug");
const { createVideoDuration } = require("../utils/videoDuration");
const videoValidator = require("../validators/videoValidator");
const groupRepository = require("../repositories/groupRepository");
const commentRepository = require("../repositories/commentRepository");
const { mapVideoDetails, mapVideoRow } = require("../utils/mapper");
const { getRequestedLocalization } = require("../utils/localization");
const { normalizeTopics } = require("../utils/normalizeTopicsVideo");

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
  const apiUrl =
    process.env.SUMMARIZE_API_URL || "http://127.0.0.1:8000/summarize_video";
  const apiKey =
    process.env.SUMMARIZE_API_KEY || "#$$0limaaaannnn##sddsdsd23233522dd";
  const timeoutMs = Number(process.env.SUMMARIZE_API_TIMEOUT_MS) || 1800000;
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

  const cachedRow = await videoRepo.getTranscriptSummaryByVideoAndLanguage(
    resolvedVideoId,
    localization
  );
  if (cachedRow?.transcript || cachedRow?.summary) {
    return {
      video_id: resolvedVideoId,
      language: cachedRow.language,
      transcript: cachedRow.transcript,
      summary: cachedRow.summary,
      topics: normalizeTopics(cachedRow.topics),
      cached: true,
    };
  }

  const fileBuffer = req.file?.buffer || null;
  const url = req.body?.url || video.video_url;

  if (!fileBuffer && !url) {
    throw httpError(400, "No file or url provided");
  }

  const form = new FormData();
  if (fileBuffer) {
    form.append("file", fileBuffer, {
      filename: req.file?.originalname || "file.mp4",
      contentType: req.file?.mimetype || "video/mp4",
    });
  } else {
    form.append("url", url);
  }

  let apiData;
  try {
    const apiRes = await axios.post(`${apiUrl}/${resolvedVideoId}`, form, {
      headers: {
        ...form.getHeaders(),
        "X-API-Key": apiKey,
        "X-Localization": localization,
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: timeoutMs,
    });
    apiData = apiRes.data;
  } catch (err) {
    if (err.response?.data) {
      const detail =
        err.response.data.detail ||
        err.response.data.message ||
        "Unknown error";
      const error = httpError(500, `Summarization API error: ${detail}`);
      error.details = err.response.data;
      throw error;
    }

    const error = httpError(500, "Summarization API connection error");
    error.details = err.message || err;
    throw error;
  }

  const transcript = apiData?.data?.transcript ?? apiData?.transcript ?? null;
  const summary = apiData?.data?.summary ?? apiData?.summary ?? null;
  const topics = normalizeTopics(apiData?.data?.topics ?? apiData?.topics ?? null);
  const storedLanguage =
    apiData?.data?.language ?? apiData?.language ?? localization;
  const topicsForDb =
    topics == null
      ? null
      : typeof topics === "string"
        ? topics
        : JSON.stringify(topics);

  await videoRepo.upsertTranscriptSummary({
    videoId: resolvedVideoId,
    language: storedLanguage,
    transcript,
    summary,
    topics: topicsForDb,
  });

  return {
    video_id: resolvedVideoId,
    language: storedLanguage,
    transcript,
    summary,
    topics,
    cached: false,
  };
};
