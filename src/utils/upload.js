const { uploadToCloudinary } = require("../middleware/uploadFile");
const { validateFileType } = require("../validators/validateFiles");


exports.uploadDocument = async (file) => {
  validateFileType(file, "document");
  return await uploadToCloudinary(file, "documents");
};

exports.uploadPhoto = async (file) => {
  validateFileType(file, "image");
  return await uploadToCloudinary(file, "posters");
};

exports.uploadVideo = async (file) => {
  validateFileType(file, "video");
  console.log("file here videoUrl:", file)
  return await uploadToCloudinary(file, "videos");
};



