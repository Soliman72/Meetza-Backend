exports.validateAuthenticatedUser = (req) => {
  if (!req.user?.id) {
    throw { status: 401, message: "Unauthorized: user not found" };
  }
};

exports.validateVideoIdBody = (body) => {
  const { video_id } = body || {};
  if (video_id == null || String(video_id).trim() === "") {
    throw { status: 400, message: "video_id is required" };
  }
};

exports.validateVideoIdParam = (video_id) => {
  if (video_id == null || String(video_id).trim() === "") {
    throw { status: 400, message: "id is required" };
  }
};

exports.validateDeleteParams = (user_id, video_id) => {
  if (!user_id) {
    throw { status: 401, message: "Unauthorized: user not found" };
  }
  if (video_id == null || String(video_id).trim() === "") {
    throw { status: 400, message: "user_id and video_id are required" };
  }
};
