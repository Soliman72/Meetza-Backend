const { normalizeTopics } = require("./normalizeTopicsVideo");
const { mapWatchProgressFromRow } = require("./videoWatchProgressFields");

function mapVideoRow(row, withWatch = false) {
  if (!row) return null;

  const watch_progress = withWatch
    ? mapWatchProgressFromRow(row)
    : null;

  const {
    admin_name,
    admin_photo,

    likes_count,
    dislikes_count,
    saved_count,

    topics_ar,
    topics_en,

    summary_ar,
    summary_en,

    user_like,
    user_dislike,

    watch_progress_seconds: _wps,
    watch_completed: _wc,
    watch_status: _ws,
    watch_progress_percentage: _wpp,

    ...video
  } = row;

  return {
    ...video,

    admin: {
      name: admin_name,
      user_photo: admin_photo,
    },

    likes_count: Number(likes_count) || 0,
    dislikes_count: Number(dislikes_count) || 0,
    saved_count: Number(saved_count) || 0,

    topics: {
      ar: normalizeTopics(topics_ar),
      en: normalizeTopics(topics_en),
    },

    summary: {
      ar: summary_ar,
      en: summary_en,
    },

    user_like: !!user_like,
    user_dislike: !!user_dislike,

    watch_progress,
  };
}

function mapCommentRow(c) {
  return {
    id: c.id,
    member_id: c.member_id,
    video_id: c.video_id,
    comment_text: c.comment_text,
    timestamp: c.timestamp,
    member_name: c.member_name,
    member_photo: c.member_photo,
  };
}

function mapVideoDetails(row, commentsRows = [], withWatch = false) {
  if (!row) return null;

  const watch_progress = withWatch
    ? mapWatchProgressFromRow(row)
    : null;

  const {
    admin_name,
    admin_photo,

    likes_count,
    dislikes_count,
    saved_count,

    topics_ar,
    topics_en,

    summary_ar,
    summary_en,

    user_like,
    user_dislike,

    watch_progress_seconds: _wps,
    watch_completed: _wc,
    watch_status: _ws,
    watch_progress_percentage: _wpp,

    ...video
  } = row;

  const comments = (commentsRows || []).map(mapCommentRow);

  return {
    video,

    admin: {
      name: admin_name,
      user_photo: admin_photo,
    },

    likes_count: Number(likes_count) || 0,
    dislikes_count: Number(dislikes_count) || 0,
    saved_count: Number(saved_count) || 0,

    topics: {
      ar: normalizeTopics(topics_ar),
      en: normalizeTopics(topics_en),
    },

    summary: {
      ar: summary_ar,
      en: summary_en,
    },

    user_like: !!user_like,
    user_dislike: !!user_dislike,

    watch_progress,

    description: video.description,

    comments,
    commentCount: comments.length,
  };
}

function mapResourceRow(row) {
  if (!row) return null;

  const {
    topics_ar,
    topics_en,
    summary_ar,
    summary_en,
    ...resource
  } = row;

  return {
    ...resource,
    topics: {
      ar: normalizeTopics(topics_ar),
      en: normalizeTopics(topics_en),
    },
    summary: {
      ar: summary_ar,
      en: summary_en,
    },
  };
}


module.exports = { mapVideoRow, mapVideoDetails, mapCommentRow, mapResourceRow };