const { v4: uuidv4 } = require("uuid");
const commentRepo = require("../repositories/commentRepository");
const userRepository = require("../repositories/userRepository");
const { handleCommentNotifications } = require("./notificatioService");
const commentValidator = require("../validators/commentValidator");

function nestCommentRows(rows) {
  const byId = {};
  rows.forEach((r) => {
    byId[r.id] = { ...r, replies: [] };
  });
  const topLevel = [];
  rows.forEach((r) => {
    const item = byId[r.id];
    if (r.parent_id && byId[r.parent_id]) {
      byId[r.parent_id].replies.push(item);
    } else {
      topLevel.push(item);
    }
  });
  return topLevel;
}

exports.createComment = async (req) => {
  const { video_id, comment_text, parent_id } = req.body;
  const user_id = req.user?.id;

  commentValidator.validateCreateComment(req);

  const video = await commentRepo.getVideoBasicsForComment(video_id);
  if (!video) {
    throw { status: 400, message: "Invalid video" };
  }

  let parent = null;
  if (parent_id) {
    parent = await commentRepo.getCommentById(parent_id);
    if (!parent || parent.video_id !== video.id) {
      throw { status: 400, message: "Invalid parent comment" };
    }
  }

  const id = uuidv4();
  await commentRepo.createComment({
    id,
    user_id,
    video_id: video.id,
    parent_id: parent_id || null,
    comment_text,
  });

  const commenter = await userRepository.findById(user_id);
  const videoOwnerUser = await userRepository.findById(video.administrator_id);
  const video_owner = videoOwnerUser
    ? { user_id: videoOwnerUser.id, name: videoOwnerUser.name }
    : null;

  const parentForNotify = parent
    ? { ...parent, user_id: parent.member_id }
    : null;

  try {
    await handleCommentNotifications({
      user_id,
      video,
      parent: parentForNotify,
      commenter: { name: commenter?.name || "Someone" },
      video_owner,
    });
  } catch (notifyErr) {
    console.error("Comment notification error:", notifyErr);
  }

  return {
    status: 201,
    body: {
      success: true,
      data: {
        id,
        user_id,
        video_id: video.id,
        parent_id: parent_id || null,
        comment_text,
      },
    },
  };
};

exports.getCommentsByVideoId = async (video_id) => {
  commentValidator.validateVideoIdParam(video_id);
  const commentCount = await commentRepo.countByVideoId(video_id);
  const rows = await commentRepo.getCommentsByVideo(video_id);
  const comments = nestCommentRows(rows);
  return { commentCount, comments };
};

exports.getCommentById = async (id) => {
  commentValidator.validateCommentIdParam(id);
  const row = await commentRepo.getCommentById(id);
  if (!row) {
    throw { status: 404, message: "Record not found" };
  }
  return row;
};

exports.getCommentsByUserId = async (user_id) => {
  if (!user_id) {
    throw { status: 400, message: "user_id is required" };
  }
  const rows = await commentRepo.getCommentsByUser(user_id);
  if (!rows.length) {
    throw { status: 404, message: "Record not found" };
  }
  return rows;
};

exports.updateComment = async (id, comment_text) => {
  commentValidator.validateUpdateComment(id, comment_text);
  const affected = await commentRepo.updateComment(id, comment_text);
  if (affected === 0) {
    throw { status: 404, message: "Record not found" };
  }
  return { id, comment_text };
};

exports.deleteComment = async (id) => {
  commentValidator.validateCommentIdParam(id);
  const affected = await commentRepo.deleteComment(id);
  if (affected === 0) {
    throw { status: 404, message: "Record not found" };
  }
};
