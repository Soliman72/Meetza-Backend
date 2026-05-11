const { upload, cleanupRequestFiles } = require("./uploadFile");

const fields = [
  { name: "user_photo", maxCount: 1 },
  { name: "company_logo", maxCount: 1 },
  { name: "group_photo", maxCount: 1 },
  { name: "content_photo", maxCount: 1 },
  { name: "resource_file", maxCount: 1 },
  { name: "poster_file", maxCount: 1 },
  { name: "video_file", maxCount: 1 },
  { name: "files", maxCount: 20 },
];

const multerHandler = upload.fields(fields);

const handleMulterError = (res, err) =>
  res.status(400).json({ success: false, message: err.message });

/**
 * Shared multipart parser for routes that may send any of the declared fields.
 * Responds with JSON 400 on multer errors (e.g. file size / type).
 */
function uploadMiddleware(req, res, next) {
  multerHandler(req, res, (err) => {
    if (err) {
      return handleMulterError(res, err);
    }

    // Automatically clean up files when the response is sent or the connection is closed
    const cleanup = () => cleanupRequestFiles(req);
    res.on("finish", cleanup);
    res.on("close", cleanup);

    next();
  });
}

function summarizeVideoUpload(req, res, next) {
  upload.single("file")(req, res, (err) => {
    if (err) {
      return handleMulterError(res, err);
    }

    const cleanup = () => cleanupRequestFiles(req);
    res.on("finish", cleanup);
    res.on("close", cleanup);

    next();
  });
}

module.exports = uploadMiddleware;
module.exports.summarizeVideoUpload = summarizeVideoUpload;
