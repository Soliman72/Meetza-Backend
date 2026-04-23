const { uploadVideo, uploadPhoto } = require("./upload");

exports.uploadFiles = async (req) => {
  let videoUrl = "";
  let posterUrl = "";

  if (req.files?.video_file) {
    videoUrl = await uploadVideo(req.files.video_file[0]);
  } else if (req.body?.video_file) {
    videoUrl = await uploadVideo(req.body.video_file);
  }

  if (req.files?.poster_file) {
    posterUrl = await uploadPhoto(req.files.poster_file[0]);
  } else if (req.body?.poster_file) {
    posterUrl = await uploadPhoto(req.body.poster_file);
  }

  return { videoUrl, posterUrl };
};