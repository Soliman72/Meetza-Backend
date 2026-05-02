const getMediaCategory = (mediaType = "") => {
  const type = String(mediaType || "").toLowerCase();
  if (type === "image" || type.startsWith("image/")) return "photos";
  if (type === "video" || type.startsWith("video/")) return "videos";
  if (type === "voice" || type === "audio" || type.startsWith("audio/")) return "audio";
  if (type === "link" || type.includes("link")) return "links";
  if (type === "file") return "documents";
  return "other";
};

const toChatMedia = (row) => {
  if (!row) return null;

  const mediaUrl = row.media_url || row.url || null;
  const mediaType = row.media_type || row.file_type || null;

  return {
    id: row.id,
    file_name: row.file_name,
    media_url: mediaUrl,
    url: mediaUrl,
    media_type: mediaType,
    file_type: row.file_type || mediaType,
    category: getMediaCategory(mediaType),
    source: row.source || "chat",
    created_at: row.created_at,
    group: {
      id: row.group_id,
      name: row.group_name,
      photo: row.group_photo ?? null,
    },
    sender: {
      id: row.sender_id,
      name: row.sender_name,
      email: row.sender_email ?? null,
      user_photo: row.sender_photo ?? null,
    },
    message: {
      id: row.message_id,
      text: row.message ?? null,
      created_at: row.message_created_at ?? null,
    },
  };
};

const toChatMediaList = (rows) => (rows || []).map(toChatMedia);

module.exports = {
  toChatMedia,
  toChatMediaList,
};
