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
    WHEN TIME_TO_SEC(v.duration) > 0 
         AND COALESCE(vwp.progress_seconds, 0) > 0
      THEN LEAST(
        100,
        ROUND(100 * vwp.progress_seconds / TIME_TO_SEC(v.duration))
      )
    ELSE NULL
  END AS watch_progress_percentage
`;
function mapWatchProgressFromRow(row) {
  if (!row) return null;

  return {
    progress_seconds: Number(row.watch_progress_seconds) || 0,
    completed: row.watch_completed === 1,
  };
}

module.exports = { mapWatchProgressFromRow, WATCH_PROGRESS_SELECT };