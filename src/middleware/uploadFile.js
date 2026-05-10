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

/**
 * Utility to delete a file safely
 */
const deleteFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error(`[Cleanup] Failed to delete file: ${filePath}`, err.message);
    }
  }
};

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

    try {
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
          // Always clean up: delete temp file(s) from local disk
          deleteFile(file.path);
          if (isCompressed) deleteFile(uploadPath);

          if (error) {
            console.error("Cloudinary Upload Error:", error);
            return reject(error);
          }

          console.log("Cloudinary Upload Success:", result.secure_url);
          resolve(result.secure_url);
        }
      );
    } catch (err) {
      // Cleanup on early errors (e.g. compression crash or cloudinary setup error)
      deleteFile(file.path);
      if (isCompressed) deleteFile(uploadPath);
      reject(err);
    }
  });
};

/**
 * Clears all files in the uploads/temp directory
 */
const clearTempFolder = () => {
  const tempDir = path.join(__dirname, "../../uploads/temp");
  if (fs.existsSync(tempDir)) {
    try {
      const files = fs.readdirSync(tempDir);
      for (const file of files) {
        deleteFile(path.join(tempDir, file));
      }
      console.log(`[Cleanup] Cleared temp folder: ${tempDir}`);
    } catch (err) {
      console.error("[Cleanup] Error clearing temp folder:", err.message);
    }
  }
};

const uploadToCloudinaryResources = (
  file,
  folder = "meeting_content_resources",
  resourceType = "raw"
) => {
  return uploadToCloudinary(file, folder, resourceType);
};

/**
 * Cleans up all files in req.files (array or object fields)
 */
const cleanupRequestFiles = (req) => {
  if (req.files) {
    if (Array.isArray(req.files)) {
      req.files.forEach((f) => deleteFile(f.path));
    } else {
      Object.keys(req.files).forEach((key) => {
        const files = req.files[key];
        if (Array.isArray(files)) {
          files.forEach((f) => deleteFile(f.path));
        } else {
          deleteFile(files.path);
        }
      });
    }
  }
  if (req.file) {
    deleteFile(req.file.path);
  }
};

module.exports = {
  upload,
  uploadToCloudinary,
  uploadToCloudinaryResources,
  clearTempFolder,
  deleteFile,
  cleanupRequestFiles,
};
