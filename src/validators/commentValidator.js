exports.validateAuthenticatedUser = (req) => {
  if (!req.user?.id) {
    throw { status: 401, message: "Unauthorized: user not found" };
  }
};

exports.validateCreateComment = (req) => {
  exports.validateAuthenticatedUser(req);
  const { video_id, comment_text } = req.body || {};
  if (video_id == null || String(video_id).trim() === "") {
    throw { status: 400, message: "video_id and comment_text are required" };
  }
  if (comment_text == null || String(comment_text).trim() === "") {
    throw { status: 400, message: "video_id and comment_text are required" };
  }
};

/** @deprecated use validateCreateComment */
exports.createCommentValidator = (req) => {
  exports.validateCreateComment(req);
};

exports.validateVideoIdParam = (video_id) => {
  if (video_id == null || String(video_id).trim() === "") {
    throw { status: 400, message: "video_id is required" };
  }
};

exports.validateCommentIdParam = (id) => {
  if (id == null || String(id).trim() === "") {
    throw { status: 400, message: "id is required" };
  }
};

exports.validateUpdateComment = (id, comment_text) => {
  exports.validateCommentIdParam(id);
  if (comment_text == null || String(comment_text).trim() === "") {
    throw { status: 400, message: "id and comment_text are required" };
  }
};
