const { sanitizeAlias } = require("../utils/sqlSanitizeAlias");

function buildVideoSearchCondition(searchTerm, videoAlias = "v") {
  const alias = sanitizeAlias(videoAlias);

  const term = (searchTerm || "").toString().trim();
  if (!term) return { clause: "", params: [] };

  const likeTerm = `%${term}%`;

  return {
    clause: `(
      ${alias}.title LIKE ?
      OR EXISTS (
        SELECT 1
        FROM video_transcript_summary vts
        WHERE vts.video_id = ${alias}.id
          AND (vts.transcript LIKE ? OR vts.topics LIKE ?)
      )
    )`,
    params: [likeTerm, likeTerm, likeTerm],
  };
}

module.exports = { buildVideoSearchCondition };