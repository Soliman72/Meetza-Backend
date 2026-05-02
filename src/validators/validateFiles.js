const imageExtensions = ["jpg", "jpeg", "png", "webp", "gif", "svg", "avif"];
const videoExtensions = ["mp4", "mov", "mkv", "avi"];

exports.validateFileType = (file, type) => {
  let ext = "";

  // Check if file is a URL or file object
  if (typeof file === 'string') {
    // If it's a URL, extract the extension
    ext = file.split('.').pop().toLowerCase();
  } else {
    // If it's a file object, use the file's original name
    ext = file.originalname.split(".").pop().toLowerCase();
  }

  if (type === "video" && !videoExtensions.includes(ext)) {
    throw new Error("Invalid video format. Only video files allowed.");
  }

  if (type === "image" && !imageExtensions.includes(ext)) {
    throw new Error("Invalid image format. Only image files allowed.");
  }
};
