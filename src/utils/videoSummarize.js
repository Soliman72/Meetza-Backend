const axios = require("axios");
const FormData = require("form-data");
const videoRepo = require("../repositories/videoRepository");
const { normalizeTopics } = require("./normalizeTopicsVideo");
const httpError = require("./httpError");
const { ensureBilingualAiMetadata } = require("./aiTranslator");

/**
 * Internal logic for video summarization.
 * Calls an external API to get transcript, summary, and topics.
 */
const internalSummarizeVideo = async (videoId, url, localization, file = null) => {
  const apiUrl = process.env.SUMMARIZE_API_URL;
  const apiKey = process.env.SUMMARIZE_API_KEY;
  const timeoutMs = Number(process.env.SUMMARIZE_API_TIMEOUT_MS) || 1800000;

  const form = new FormData();
  if (file?.buffer) {
    form.append("file", file.buffer, {
      filename: file.originalname || "file.mp4",
      contentType: file.mimetype || "video/mp4",
    });
  } else {
    form.append("url", url);
  }

  let apiData;
  try {
    const apiRes = await axios.post(`${apiUrl}/${videoId}`, form, {
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
    if (err.response) {
      if (err.response.status === 413) {
        const error = httpError(413, "The video file is too large for the summarization service.");
        error.details = "Try uploading a shorter or lower resolution video.";
        throw error;
      }
      const detail = err.response.data?.detail || err.response.data?.message || "Unknown error";
      const error = httpError(err.response.status || 500, `Summarization API error: ${detail}`);
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
  const storedLanguage = apiData?.data?.language ?? apiData?.language ?? localization;

  const topicsForDb = topics == null ? null : typeof topics === "string" ? topics : JSON.stringify(topics);

  // Save the original language
  await videoRepo.upsertTranscriptSummary({
    videoId,
    language: storedLanguage,
    transcript,
    summary,
    topics: topicsForDb,
  });

  // Handle bilingual requirement - Get both versions in one go
  let bilingualData = null;
  try {
    bilingualData = await ensureBilingualAiMetadata(summary, topics);
    
    if (bilingualData) {
      // Save Arabic
      await videoRepo.upsertTranscriptSummary({
        videoId,
        language: "ar",
        transcript,
        summary: bilingualData.ar.summary,
        topics: JSON.stringify(bilingualData.ar.topics),
      });

      // Save English
      await videoRepo.upsertTranscriptSummary({
        videoId,
        language: "en",
        transcript,
        summary: bilingualData.en.summary,
        topics: JSON.stringify(bilingualData.en.topics),
      });
    }
  } catch (error) {
    console.error(`[Bilingual Generation Error] Video ${videoId}:`, error);
    // Fallback: just save the original from Python (already done above in previous steps, 
    // but wait, I should make sure I don't double save or miss any)
  }

  return {
    video_id: videoId,
    language: storedLanguage,
    transcript,
    summary: bilingualData?.ar?.summary || summary,
    topics: bilingualData?.ar?.topics || topics,
    translations: bilingualData || null,
    cached: false,
  };
};

module.exports = { internalSummarizeVideo };
