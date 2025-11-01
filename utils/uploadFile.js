const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

// Set up multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    cb(null, uploadDir); // Set the destination directory for file uploads
  },
  filename: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname);
    const fileName = uuidv4() + fileExtension;
    cb(null, fileName); // Set the filename to a UUID to ensure uniqueness
  },
});

// Set up the file filter (to validate video and poster files)
const fileFilter = (req, file, cb) => {
  if (file.fieldname === "video_file") {
    const filetypes = /mp4|avi|mov|mkv/; // Allow only video files
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid video file type. Only mp4, avi, mov, mkv are allowed."
        ),
        false
      );
    }
  } else if (file.fieldname === "poster_file") {
    const posterFiletypes = /jpg|jpeg|png|gif/; // Allow only image files for poster
    const extname = posterFiletypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = posterFiletypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid poster file type. Only jpg, jpeg, png, gif are allowed."
        ),
        false
      );
    }
  } else {
    cb(new Error("Invalid file field."), false); // Reject if an unknown file field is used
  }
};

// Set up multer upload for both video and poster files
const upload = multer({ storage: storage, fileFilter: fileFilter });

module.exports = upload;
