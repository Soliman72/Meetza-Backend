const WATCH_PROGRESS_USER_JOIN = `
  LEFT JOIN video_watch_progress vwp
    ON vwp.video_id = v.id AND vwp.user_id = ?
`;

const WATCH_PROGRESS_USER_FIELDS = `
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
  END AS watch_progress_percentage
`;

const USER_REACTIONS_FIELDS = `
  EXISTS(
    SELECT 1 FROM \`like\` l2
    WHERE l2.video_id = v.id AND l2.member_id = ? AND l2.like_type = 1
  ) AS user_like,

  EXISTS(
    SELECT 1 FROM \`like\` l3
    WHERE l3.video_id = v.id AND l3.member_id = ? AND l3.like_type = 0
  ) AS user_dislike
`;

const getUserExtras = (userId) => {
  if (!userId) {
    return {
      join: "",
      fields: "",
      params: [],
    };
  }

  return {
    join: WATCH_PROGRESS_USER_JOIN,
    fields: `${WATCH_PROGRESS_USER_FIELDS}, ${USER_REACTIONS_FIELDS}`,
    params: [userId, userId, userId],
  };
};

module.exports = {
  getUserExtras,
};