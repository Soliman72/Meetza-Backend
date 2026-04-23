const { mapWatchProgressFromRow } = require("./videoWatchProgressFields");
const { normalizeTopics } = require("./normalizeTopicsVideo");

function mapSavedVideoRow(row, withWatch = false) {
  const watch_progress = withWatch
    ? mapWatchProgressFromRow(row)
    : null;

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

module.exports = { mapSavedVideoRow };