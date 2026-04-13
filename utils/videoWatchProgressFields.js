/** SQL fragments: current user's watch progress (join `video_watch_progress` as vwp). */
const WATCH_PROGRESS_SELECT = `
        vwp.progress_seconds AS watch_progress_seconds,
        vwp.completed AS watch_completed,
        CASE
          WHEN vwp.completed = 1 THEN 'completed'
          WHEN COALESCE(vwp.progress_seconds, 0) > 0 THEN 'watching'
          ELSE NULL
        END AS watch_status,
        CASE
          WHEN vwp.completed = 1 THEN 100
          WHEN TIME_TO_SEC(v.duration) > 0 AND COALESCE(vwp.progress_seconds, 0) > 0
            THEN LEAST(100, ROUND(100 * vwp.progress_seconds / TIME_TO_SEC(v.duration)))
          ELSE NULL
        END AS watch_progress_percentage`;

function mapWatchProgressFromRow(row) {
  if (!row) return null;
  if (row.watch_progress_seconds == null && row.watch_completed == null) {
    return null;
  }
  return {
    progress_seconds: Number(row.watch_progress_seconds) || 0,
    completed: row.watch_completed === 1 || row.watch_completed === true,
    watch_status: row.watch_status,
    progress_percentage:
      row.watch_progress_percentage == null
        ? null
        : Math.min(100, Math.max(0, Number(row.watch_progress_percentage))),
  };
}

module.exports = {
  WATCH_PROGRESS_SELECT,
  mapWatchProgressFromRow,
};
