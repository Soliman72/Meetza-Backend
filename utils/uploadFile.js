const multer = require("multer");
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { OAuth2Client } = require("google-auth-library");

// Set up OAuth2 credentials (make sure you've downloaded 'credentials.json' from Google Developer Console)
const oAuth2Client = new OAuth2Client(
  "YOUR_CLIENT_ID",
  "YOUR_CLIENT_SECRET",
  "YOUR_REDIRECT_URI"
);

const drive = google.drive({ version: "v3", auth: oAuth2Client });

// Authenticate with Google OAuth2
const authenticateGoogle = async () => {
  const tokenPath = "token.json";
  try {
    const token = fs.readFileSync(tokenPath);
    oAuth2Client.setCredentials(JSON.parse(token));
  } catch (err) {
    console.error("Error loading token:", err);
  }
};

// Set up multer file filter (for video and poster files)
const fileFilter = (req, file, cb) => {
  if (file.fieldname === "video_file") {
    const filetypes = /mp4|avi|mov|mkv/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Invalid video file type. Only mp4, avi, mov, mkv are allowed."), false);
    }
  } else if (file.fieldname === "poster_file") {
    const posterFiletypes = /jpg|jpeg|png|gif/;
    const extname = posterFiletypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = posterFiletypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Invalid poster file type. Only jpg, jpeg, png, gif are allowed."), false);
    }
  } else {
    cb(new Error("Invalid file field."), false);
  }
};

// Set up multer storage (temporarily store file before uploading to Google Drive)
const storage = multer.memoryStorage(); // Use memory storage for direct upload

const upload = multer({ storage: storage, fileFilter: fileFilter });

// Upload file to Google Drive
const uploadToDrive = async (file, folderId) => {
  try {
    const fileMetadata = {
      name: uuidv4() + path.extname(file.originalname),
      parents: [folderId], // Optionally specify a folder ID in Google Drive
    };

    const media = {
      mimeType: file.mimetype,
      body: file.buffer, // File content from multer's memory storage
    };

    const res = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id",
    });

    return res.data.id; // Return the Google Drive file ID
  } catch (err) {
    console.error("Error uploading file to Google Drive:", err);
    throw new Error("Failed to upload to Google Drive.");
  }
};

module.exports = { upload, uploadToDrive, authenticateGoogle };
