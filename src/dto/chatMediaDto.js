const toChatMedia = (row) => {
  if (!row) return null;

  return {
    id: row.id,
    file_name: row.file_name,
    media_url: row.media_url,
    media_type: row.media_type,
    created_at: row.created_at,
    group: {
      id: row.group_id,
      name: row.group_name,
    },
    sender: {
      id: row.sender_id,
      name: row.sender_name,
      user_photo: row.sender_photo ?? null,
    },
    message: {
      id: row.message_id,
      text: row.message ?? null,
    },
  };
};

const toChatMediaList = (rows) => (rows || []).map(toChatMedia);

module.exports = {
  toChatMedia,
  toChatMediaList,
};
