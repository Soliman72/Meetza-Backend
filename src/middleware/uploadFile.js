const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { compressVideo } = require("../utils/videoCompressor");

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

// Use Disk Storage to support large files without crashing RAM
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, "../../uploads/temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 1024 * 1024 * 500 } // 500MB limit
});

/**
 * Uploads a file to Cloudinary using the Large Upload API (for videos/large files).
 * Automatically compresses videos if they exceed the 100MB Cloudinary limit.
 */
const uploadToCloudinary = (
  file,
  folder = "default_folder",
  resourceType = "auto"
) => {
  return new Promise(async (resolve, reject) => {
    if (!file || !file.path) {
      return reject(new Error("No file path provided for upload"));
    }

    let uploadPath = file.path;
    let isCompressed = false;

    // Trigger compression for videos over 95MB to stay under Cloudinary's 100MB free limit
    if (resourceType === "video" && file.size > 95 * 1024 * 1024) {
      try {
        console.log(`[Uploader] File is ${ (file.size / (1024*1024)).toFixed(2) }MB. Compressing to stay under 100MB limit...`);
        uploadPath = await compressVideo(file.path);
        isCompressed = true;
      } catch (compressError) {
        console.error("[Uploader] Compression failed, attempting original upload:", compressError.message);
      }
    }

    console.log(`Starting Cloudinary upload for: ${file.originalname} (${resourceType})`);

    const options = {
      folder: folder,
      resource_type: resourceType,
      timeout: 1800000, // 30 minutes
    };

    cloudinary.uploader.upload_large(
      uploadPath,
      options,
      (error, result) => {
        // Clean up: delete temp file(s) from local disk
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        if (isCompressed && fs.existsSync(uploadPath)) fs.unlinkSync(uploadPath);

        if (error) {
          console.error("Cloudinary Upload Error:", error);
          return reject(error);
        }

        console.log("Cloudinary Upload Success:", result.secure_url);
        resolve(result.secure_url);
      }
    );
  });
};

const uploadToCloudinaryResources = (
  file,
  folder = "meeting_content_resources",
  resourceType = "raw"
) => {
  return uploadToCloudinary(file, folder, resourceType);
};

module.exports = { upload, uploadToCloudinary, uploadToCloudinaryResources };
