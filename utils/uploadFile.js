const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { Readable } = require("stream");

// Configure default Cloudinary (for videos, images, etc.)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // Cloud name
  api_key: process.env.CLOUDINARY_API_KEY, // API key
  api_secret: process.env.CLOUDINARY_API_SECRET, // API secret
});

// Get separate Cloudinary configuration for meeting content resources (large files)
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

// Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Convert Buffer to Stream
function bufferToStream(buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

// Upload file to default Cloudinary
const uploadToCloudinary = (
  file,
  folder = "default_folder",
  resourceType = "auto"
) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: resourceType, // "auto" for images/videos, "raw" for documents (PDF, DOC, etc.)
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url); // Return the uploaded file's URL
      }
    );

    bufferToStream(file.buffer).pipe(stream);
  });
};

// Upload file to separate Cloudinary for meeting content resources (large files)
const uploadToCloudinaryResources = (
  file,
  folder = "meeting_content_resources",
  resourceType = "raw"
) => {
  return new Promise((resolve, reject) => {
    const resourcesConfig = getResourcesCloudinaryConfig();

    // Temporarily switch to resources Cloudinary config
    cloudinary.config(resourcesConfig);

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: resourceType, // "raw" for documents (PDF, DOC, etc.)
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url); // Return the uploaded file's URL
      }
    );

    bufferToStream(file.buffer).pipe(stream);
  });
};

module.exports = { upload, uploadToCloudinary, uploadToCloudinaryResources };
