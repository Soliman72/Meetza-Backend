const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { Readable } = require("stream");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const getResourcesCloudinaryConfig = () => ({
  cloud_name:
    process.env.CLOUDINARY_RESOURCES_CLOUD_NAME ||
    process.env.CLOUDINARY_CLOUD_NAME,
  api_key:
    process.env.CLOUDINARY_RESOURCES_API_KEY || process.env.CLOUDINARY_API_KEY,
  api_secret:
    process.env.CLOUDINARY_RESOURCES_API_SECRET ||
    process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

function bufferToStream(buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

const uploadToCloudinary = (
  file,
  folder = "default_folder",
  resourceType = "auto"
) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );

    bufferToStream(file.buffer).pipe(stream);
  });
};

const uploadToCloudinaryResources = (
  file,
  folder = "meeting_content_resources",
  resourceType = "raw"
) => {
  return new Promise((resolve, reject) => {
    const resourcesConfig = getResourcesCloudinaryConfig();

    cloudinary.config(resourcesConfig);

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );

    bufferToStream(file.buffer).pipe(stream);
  });
};

module.exports = { upload, uploadToCloudinary, uploadToCloudinaryResources };
