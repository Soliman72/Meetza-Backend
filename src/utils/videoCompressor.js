const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");

/**
 * Compresses a video file to bring it under a target size (default 95MB for Cloudinary free tier).
 * Uses dynamic bitrate calculation based on video duration.
 * @param {string} inputPath - Path to the original video file.
 * @returns {Promise<string>} - Path to the compressed video file.
 */
async function compressVideo(inputPath) {
  const outputPath = inputPath.replace(path.extname(inputPath), "-compressed" + path.extname(inputPath));
  
  return new Promise((resolve, reject) => {
    // 1. Get metadata (duration) to calculate bitrate
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) return reject(err);

      const duration = metadata.format.duration; // in seconds
      const targetSizeMb = 95; // Target 95MB to be safe under 100MB
      
      // Calculate bitrate: (Target Size in bits) / Duration
      // Formula: (targetSizeMb * 8192) / duration = bitrate in kbps
      let targetBitrate = Math.floor((targetSizeMb * 8192) / duration);
      
      // Safety limits for bitrate
      if (targetBitrate > 5000) targetBitrate = 5000; // Don't go over 5Mbps
      if (targetBitrate < 200) targetBitrate = 200;   // Don't go under 200kbps (quality will be very low)

      console.log(`[Compression] Duration: ${duration.toFixed(2)}s, Target Bitrate: ${targetBitrate}kbps`);
      console.log(`[Compression] Starting smart compression for ${inputPath}...`);
      
      ffmpeg(inputPath)
        .outputOptions([
          "-vcodec libx264",
          `-b:v ${targetBitrate}k`, // Use calculated bitrate
          "-maxrate 5000k",         // Prevent spikes
          "-bufsize 2000k",
          "-preset faster",
          "-acodec aac",
          "-b:a 96k",               // Lower audio bitrate to save space for video
          "-vf scale=-2:720"        // Scale to 720p
        ])
        .on("start", (commandLine) => {
          console.log("[Compression] FFmpeg spawned with: " + commandLine);
        })
        .on("error", (err) => {
          console.error("[Compression] Error:", err.message);
          reject(err);
        })
        .on("end", () => {
          console.log(`[Compression] Finished! Saved to ${outputPath}`);
          const stats = fs.statSync(outputPath);
          const sizeMb = stats.size / (1024 * 1024);
          console.log(`[Compression] Final size: ${sizeMb.toFixed(2)} MB`);
          resolve(outputPath);
        })
        .save(outputPath);
    });
  });
}

module.exports = { compressVideo };
