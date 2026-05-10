const { uploadToCloudinary, deleteFile } = require("../middleware/uploadFile");
const { validateFileType } = require("../validators/validateFiles");


exports.uploadDocument = async (file) => {
  try {
    validateFileType(file, "document");
    return await uploadToCloudinary(file, "documents");
  } catch (err) {
    if (file && file.path) deleteFile(file.path);
    throw err;
  }
};

exports.uploadPhoto = async (file) => {
  try {
    validateFileType(file, "image");
    return await uploadToCloudinary(file, "posters");
  } catch (err) {
    if (file && file.path) deleteFile(file.path);
    throw err;
  }
};

exports.uploadVideo = async (file) => {
  try {
    validateFileType(file, "video");
    return await uploadToCloudinary(file, "videos", "video");
  } catch (err) {
    if (file && file.path) deleteFile(file.path);
    throw err;
  }
};



