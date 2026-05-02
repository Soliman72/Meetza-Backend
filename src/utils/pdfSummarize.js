const axios = require("axios");
const FormData = require("form-data");
const repo = require("../repositories/groupContentRepository");
const { normalizeTopics } = require("./normalizeTopicsVideo");
const httpError = require("./httpError");

/**
 * Internal logic for PDF summarization.
 * Calls an external API to get text, summary, and topics.
 */
const internalSummarizePdf = async (resourceId, url, localization, file = null) => {
  const apiUrl = process.env.SUMMARIZE_PDF_API_URL || "http://127.0.0.1:8000/summarize_pdf";
  const apiKey = process.env.SUMMARIZE_API_KEY || "#$$0limaaaannnn##sddsdsd23233522dd";
  const timeoutMs = Number(process.env.SUMMARIZE_API_TIMEOUT_MS) || 1800000;

  const form = new FormData();
  if (file?.buffer) {
    form.append("file", file.buffer, {
      filename: file.originalname || "file.pdf",
      contentType: file.mimetype || "application/pdf",
    });
  } else {
    form.append("url", url);
  }

  let apiData;
  try {
    const apiRes = await axios.post(apiUrl, form, {
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
      const detail = err.response.data.detail || err.response.data.message || "Unknown error";
      const error = httpError(500, `Summarization API error: ${detail}`);
      error.details = err.response.data;
      throw error;
    }
    const error = httpError(500, "Summarization API connection error");
    error.details = err.message || err;
    throw error;
  }

  const transcript = apiData?.text ?? null;
  const summary = apiData?.summary ?? null;
  const topics = normalizeTopics(apiData?.topics ?? null);
  const storedLanguage = apiData?.language ?? localization;

  const topicsForDb = topics == null ? null : typeof topics === "string" ? topics : JSON.stringify(topics);

  await repo.upsertResourceAiMetadata({
    resourceId,
    language: storedLanguage,
    transcript,
    summary,
    topics: topicsForDb,
  });

  return {
    resource_id: resourceId,
    language: storedLanguage,
    transcript,
    summary,
    topics,
  };
};

module.exports = { internalSummarizePdf };
