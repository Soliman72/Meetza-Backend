const { v4: uuidv4 } = require("uuid");
const likeRepository = require("../repositories/likeRepository");
const userRepository = require("../repositories/userRepository");
const { createNotification } = require("./notificatioService");
const likeValidator = require("../validators/likeValidator");

async function notifyOwnerReaction({ video, user_id, like_type, actorName }) {
  try {
    if (video.group_admin_id && video.group_admin_id !== user_id) {
      await createNotification({
        senderId: user_id,
        memberId: video.group_admin_id,
        title:
          like_type === 1
            ? "New like on your group video"
            : "New dislike on your group video",
        message: `${actorName} ${
          like_type === 1 ? "liked" : "disliked"
        } the video "${video.title}" in the group "${video.group_name}".`,
      });
    }
  } catch (notifyErr) {
    console.error("Like notification error:", notifyErr);
  }
}

async function notifyOwnerReactionUpdated({ video, user_id, like_type, actorName }) {
  try {
    if (video.group_admin_id && video.group_admin_id !== user_id) {
      await createNotification({
        senderId: user_id,
        memberId: video.group_admin_id,
        title: "Reaction updated on your group video",
        message: `${actorName} updated their reaction on the video "${video.title}" in the group "${video.group_name}".`,
      });
    }
  } catch (notifyErr) {
    console.error("Like notification error:", notifyErr);
  }
}

exports.createLike = async (req) => {
  likeValidator.validateAuthenticatedUser(req);
  const { video_id, like_type } = req.body;
  const user_id = req.user.id;
  likeValidator.validateCreateLikeBody(req.body);

  const video = await likeRepository.getVideo(video_id);
  if (!video) {
    throw { status: 404, message: "Video not found" };
  }

  const user = await userRepository.findById(user_id);
  if (!user) {
    throw { status: 404, message: "User not found" };
  }

  const existing = await likeRepository.getExistingLike(user_id, video_id);
  const actorName = (await likeRepository.getUserName(user_id)) || "Someone";

  if (existing) {
    if (existing.like_type === Number(like_type)) {
      return {
        status: 200,
        body: {
          success: true,
          message:
            Number(like_type) === 1
              ? "Already liked this video"
              : "Already disliked this video",
        },
      };
    }

    await likeRepository.updateLike(existing.id, like_type);
    await notifyOwnerReactionUpdated({
      video,
      user_id,
      like_type: Number(like_type),
      actorName,
    });

    return {
      status: 200,
      body: {
        success: true,
        message:
          Number(like_type) === 1
            ? "Changed to Like successfully"
            : "Changed to Dislike successfully",
      },
    };
  }

  const id = uuidv4();
  await likeRepository.insertLike(id, user_id, video_id, Number(like_type));
  await notifyOwnerReaction({
    video,
    user_id,
    like_type: Number(like_type),
    actorName,
  });

  return {
    status: 201,
    body: {
      success: true,
      message:
        Number(like_type) === 1
          ? "Video liked successfully"
          : "Video disliked successfully",
      data: { id, user_id, video_id, like_type: Number(like_type) },
    },
  };
};

exports.getLikesByVideoId = async (video_id) => {
  likeValidator.validateVideoIdParam(video_id);
  const likeCounts = await likeRepository.getCounts(video_id);
  const data = await likeRepository.getLikesByVideo(video_id);
  return { likeCounts, data };
};

exports.getLikesByUserId = async (user_id) => {
  return likeRepository.getLikesByUser(user_id);
};

exports.updateLike = async (req) => {
  likeValidator.validateAuthenticatedUser(req);
  likeValidator.validateUpdateLikeBody(req.body);
  const user_id = req.user.id;
  const { video_id, like_type } = req.body;

  const existingLike = await likeRepository.getExistingLike(user_id, video_id);
  if (!existingLike) {
    throw { status: 404, message: "Like/Dislike not found" };
  }

  await likeRepository.updateLikeByUser(user_id, video_id, Number(like_type));
  return { message: "Like/Dislike updated successfully" };
};

exports.deleteLike = async (user_id, video_id) => {
  likeValidator.validateAuthenticatedUser({ user: { id: user_id } });
  likeValidator.validateVideoIdParam(video_id);

  const affected = await likeRepository.deleteLike(user_id, video_id);
  if (affected === 0) {
    throw { status: 404, message: "Like/Dislike not found" };
  }
  return { message: "Like/Dislike removed successfully" };
};
