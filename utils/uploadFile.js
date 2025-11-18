const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { Readable } = require("stream");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // Cloud name
  api_key: process.env.CLOUDINARY_API_KEY,       // API key
  api_secret: process.env.CLOUDINARY_API_SECRET, // API secret
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

// Upload file to Cloudinary
const uploadToCloudinary = (file, folder = "default_folder") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: "auto", // Cloudinary automatically detects file type (image or video)
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url); // Return the uploaded file's URL
      }
    );

    bufferToStream(file.buffer).pipe(stream);
  });
};

module.exports = { upload, uploadToCloudinary };
