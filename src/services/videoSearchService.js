const { mapWatchProgressFromRow } = require("../utils/videoWatchProgressFields");
const { normalizeTopics } = require("../utils/normalizeTopicsVideo");

function getRequestedLocalization(req) {
  const requestedLocalization = (req.header("X-Localization") || "ar")
    .toString()
    .toLowerCase()
    .trim();
  return requestedLocalization === "en" || requestedLocalization === "ar"
    ? requestedLocalization
    : "ar";
}

function buildVideoSearchCondition(searchTerm, videoAlias = "v") {
  const term = (searchTerm || "").toString().trim();
  if (!term) return { clause: "", params: [] };
  const likeTerm = `%${term}%`;
  return {
    clause: `(
      ${videoAlias}.title LIKE ?
      OR EXISTS (
        SELECT 1
        FROM video_transcript_summary vts
        WHERE vts.video_id = ${videoAlias}.id
          AND (vts.transcript LIKE ? OR vts.topics LIKE ?)
      )
    )`,
    params: [likeTerm, likeTerm, likeTerm],
  };
}

function mapSavedVideoRow(row, withWatch) {
  const watch_progress = withWatch ? mapWatchProgressFromRow(row) : null;
  const {
    topics_ar,
    topics_en,
    watch_progress_seconds: _wps,
    watch_completed: _wc,
    watch_status: _ws,
    watch_progress_percentage: _wpp,
    ...rest
  } = row;
  return {
    ...rest,
    topics: {
      ar: normalizeTopics(topics_ar),
      en: normalizeTopics(topics_en),
    },
    watch_progress,
  };
}

module.exports = {
  getRequestedLocalization,
  normalizeTopics,
  buildVideoSearchCondition,
  mapSavedVideoRow,
};
