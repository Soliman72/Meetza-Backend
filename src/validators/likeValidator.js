exports.validateAuthenticatedUser = (req) => {
  if (!req.user?.id) {
    throw { status: 401, message: "Unauthorized: user not found" };
  }
};

exports.validateCreateLikeBody = (body) => {
  const { video_id, like_type } = body || {};
  if (video_id == null || String(video_id).trim() === "") {
    throw { status: 400, message: "video_id and like_type are required" };
  }
  if (like_type === undefined || like_type === null || like_type === "") {
    throw { status: 400, message: "video_id and like_type are required" };
  }
  const n = Number(like_type);
  if (![0, 1].includes(n)) {
    throw { status: 400, message: "like_type must be 0 (dislike) or 1 (like)" };
  }
};

exports.validateVideoIdParam = (video_id) => {
  if (video_id == null || String(video_id).trim() === "") {
    throw { status: 400, message: "video_id is required" };
  }
};

exports.validateUpdateLikeBody = (body) => {
  const { video_id, like_type } = body || {};
  if (video_id == null || String(video_id).trim() === "") {
    throw { status: 400, message: "video_id is required" };
  }
  if (![0, 1].includes(Number(like_type))) {
    throw { status: 400, message: "like_type must be 0 (dislike) or 1 (like)" };
  }
};
