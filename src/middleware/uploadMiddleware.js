const { upload } = require("./uploadFile");

const fields = [
  { name: "user_photo", maxCount: 1 },
  { name: "group_photo", maxCount: 1 },
  { name: "content_photo", maxCount: 1 },
  { name: "resource_file", maxCount: 1 },
  { name: "poster_file", maxCount: 1 },
  { name: "video_file", maxCount: 1 },
  { name: "files", maxCount: 20 },
];

const multerHandler = upload.fields(fields);

/**
 * Shared multipart parser for routes that may send any of the declared fields.
 * Responds with JSON 400 on multer errors (e.g. file size / type).
 */
module.exports = function uploadMiddleware(req, res, next) {
  multerHandler(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};
