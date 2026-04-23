const VIDEO_AGGREGATIONS = `
  (SELECT COUNT(*) FROM \`like\` l
   WHERE l.video_id = v.id AND l.like_type = 1) AS likes_count,

  (SELECT COUNT(*) FROM \`like\` l
   WHERE l.video_id = v.id AND l.like_type = 0) AS dislikes_count,

  (SELECT COUNT(*) FROM saved_video sv
   WHERE sv.video_id = v.id) AS saved_count,

  (
    SELECT vts.topics
    FROM video_transcript_summary vts
    WHERE vts.video_id = v.id AND vts.language = 'ar'
    ORDER BY vts.updated_at DESC
    LIMIT 1
  ) AS topics_ar,

  (
    SELECT vts.topics
    FROM video_transcript_summary vts
    WHERE vts.video_id = v.id AND vts.language = 'en'
    ORDER BY vts.updated_at DESC
    LIMIT 1
  ) AS topics_en
`;

module.exports = {
  VIDEO_AGGREGATIONS,
};