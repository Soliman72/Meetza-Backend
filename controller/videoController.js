const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");
const { upload, uploadToCloudinary } = require("../utils/uploadFile");
const { validateFileType } = require("../utils/validateFiles");

/**
 * Single visibility rule for all video operations.
 * Super_Admin: all videos. Administrator: own videos. Member: videos from groups they're in.
 * @param {object} req - request with req.user (id, role), req.isSuperAdmin, req.administratorId
 * @param {string} [tableAlias='v'] - table alias used in the query
 * @returns {{ whereClause: string, params: any[] }} - append with " AND " + whereClause when non-empty
 */
function getVideoVisibility(req, tableAlias = "v") {
  const v = tableAlias;
  const userId = req.user?.id;
  if (!userId) return { whereClause: "", params: [] };
  if (req.isSuperAdmin === true || req.user?.role === "Super_Admin") {
    return { whereClause: "", params: [] };
  }
  if (req.user?.role === "Administrator" || req.administratorId) {
    return { whereClause: `${v}.administrator_id = ?`, params: [userId] };
  }
  if (req.user?.role === "Member") {
    return {
      whereClause: `${v}.group_id IN (SELECT group_id FROM group_membership WHERE member_id = ?)`,
      params: [userId],
    };
  }
  return { whereClause: "", params: [] };
}

// Create a video with file upload
exports.createVideo = (req, res) => {
  // Apply multer upload middleware to handle file uploads
  upload.fields([
    { name: "video_file", maxCount: 1 },
    { name: "poster_file", maxCount: 1 },
  ])(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    try {
      const { title, meeting_id, group_id , duration, description } = req.body;
      const id = uuidv4();

      // Ensure both files are uploaded
      if (!req.files && (!req.body.video_file || !req.body.poster_file)) { 
          return res.status(400).json({ success: false, message: "Both video and poster files are required" });
      }

      let videoUrl = "";
      let posterUrl = "";

      if (req.files.video_file && req.files.poster_file) {
        const videoFile = req.files.video_file[0];
        const posterFile = req.files.poster_file[0];

        // Validate file types BEFORE uploading
        validateFileType(videoFile, "video");
        validateFileType(posterFile, "image");

        // Upload files to Cloudinary
        videoUrl = await uploadToCloudinary(videoFile, "videos");
        posterUrl = await uploadToCloudinary(posterFile, "posters");
      } else if (req.body.video_file && req.body.poster_file) {
        // If URLs are provided in the body (from OneDrive or SharePoint directly)

        // Validate file types BEFORE uploading
        validateFileType(req.body.video_file, "video");
        validateFileType(req.body.poster_file, "image");

        videoUrl = req.body.video_file; // Assuming it's a URL
        posterUrl = req.body.poster_file; // Assuming it's a URL
      }

      // Validate required fields
      if (! group_id || !title ) {
        return res.status(400).json({ success: false, message: "group_id and title are required" });
      }

      if ( meeting_id )
      {
        const meetingCheckQuery = "SELECT * FROM meeting WHERE id = ?";
        const [meetingRows] = await db
          .promise()
          .query(meetingCheckQuery, [meeting_id]);
  
        if (meetingRows.length === 0) {
          return res.status(404).json({ success: false, message: "Meeting not found" });
        }
      }

      // check if group exists
      const groupCheckQuery = "SELECT * FROM `group` WHERE id = ?";
      const [groupRows] = await db
        .promise()
        .query( groupCheckQuery, [ group_id ] );
      if ( groupRows.length === 0 ) {
        return res.status(404).json({ success: false, message: "Group not found" });
      }


      // Check if user is authenticated and has a valid id
      if (req.user && req.user.id !== undefined) {
        req.body.administrator_id = req.user.id;
      } else {
        return res.status(401).json({ success: false, message: "Unauthorized: administrator_id is required" });
      }

      // Duration from frontend is in seconds; DB column is TIME. Convert so MySQL stores correctly (e.g. 130 -> 00:02:10).
      const finalDuration = Math.max(0, parseInt(duration, 10) || 0);

      // Insert the video into the database (SEC_TO_TIME converts seconds to TIME)
      const query =
        "INSERT INTO video (id,title , meeting_id, video_url, poster_url, administrator_id, duration, description, group_id ) VALUES (?, ?, ?, ?, ?, ?, SEC_TO_TIME(?) ,? , ?)";
        await db.promise().query(query, [
        id,
        title,
        meeting_id || null,
        videoUrl, // Store the video file path
        posterUrl, // Store the poster file path
        req.body.administrator_id,
        finalDuration,
        description || null,
        group_id
      ]);

      return res.status(201).json({
        success: true,
        message: "Video created successfully",
        data: {
          id,
          title,
          meeting_id: meeting_id || null,
          video_url: videoUrl,
          poster_url: posterUrl,
          duration: finalDuration,
          description: description || null,
          administrator_id: req.body.administrator_id,
          group_id,
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Database error", error: err.message });
    }
  });
};

exports.getAllVideos = async (req, res) => {
  try {
    const { title, group_id } = req.query;
    const visibility = getVideoVisibility(req, "v");
    const conditions = [];
    const params = [];

    // Base: video + group_name + admin (name, photo) + like/dislike/saved counts
    let query = `
      SELECT v.*, g.group_name,
        u.name AS admin_name, u.user_photo AS admin_photo,
        (SELECT COUNT(*) FROM \`like\` l WHERE l.video_id = v.id AND l.like_type = 1) AS likes_count,
        (SELECT COUNT(*) FROM \`like\` l WHERE l.video_id = v.id AND l.like_type = 0) AS dislikes_count,
        (SELECT COUNT(*) FROM saved_video sv WHERE sv.video_id = v.id) AS saved_count
      FROM video v
      LEFT JOIN \`group\` g ON g.id = v.group_id
      LEFT JOIN user u ON u.id = v.administrator_id
    `;

    if (visibility.whereClause) {
      conditions.push(visibility.whereClause);
      params.push(...visibility.params);
    }
    if (group_id) {
      conditions.push("v.group_id = ?");
      params.push(group_id);
    }
    if (title) {
      conditions.push("v.title LIKE ?");
      params.push(`%${title}%`);
    }
    if (conditions.length) {
      query += " WHERE " + conditions.join(" AND ");
    }

    const [rows] = await db.promise().query(query, params);
    const data = (rows || []).map((row) => {
      const { admin_name, admin_photo, likes_count: lc, dislikes_count: dc, saved_count: sc, ...video } = row;
      return {
        ...video,
        admin: { name: admin_name, user_photo: admin_photo },
        likes_count: Number(lc) || 0,
        dislikes_count: Number(dc) || 0,
        saved_count: Number(sc) || 0,
      };
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Database error", error: err.message });
  }
};

exports.getVideoById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: "Video id is required" });
    }
    const visibility = getVideoVisibility(req, "v");
    let query = `
      SELECT v.*, g.group_name,
        u.name AS admin_name, u.user_photo AS admin_photo,
        (SELECT COUNT(*) FROM \`like\` l WHERE l.video_id = v.id AND l.like_type = 1) AS likes_count,
        (SELECT COUNT(*) FROM \`like\` l WHERE l.video_id = v.id AND l.like_type = 0) AS dislikes_count,
        (SELECT COUNT(*) FROM saved_video sv WHERE sv.video_id = v.id) AS saved_count
      FROM video v
      LEFT JOIN \`group\` g ON g.id = v.group_id
      LEFT JOIN user u ON u.id = v.administrator_id
      WHERE v.id = ?
    `;
    const params = [id];
    if (visibility.whereClause) {
      query += " AND " + visibility.whereClause;
      params.push(...visibility.params);
    }

    const [videoRows] = await db.promise().query(query, params);
    if (!videoRows.length) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }
    const row = videoRows[0];
    const video = {
      id: row.id,
      title: row.title,
      meeting_id: row.meeting_id,
      video_url: row.video_url,
      poster_url: row.poster_url,
      administrator_id: row.administrator_id,
      duration: row.duration,
      description: row.description,
      group_id: row.group_id,
      group_name: row.group_name,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
    const admin = { name: row.admin_name, user_photo: row.admin_photo };
    const likes_count = Number(row.likes_count) || 0;
    const dislikes_count = Number(row.dislikes_count) || 0;
    const saved_count = Number(row.saved_count) || 0;

    // Comments with member name and photo
    const [commentsRows] = await db.promise().query(
      `SELECT c.id, c.member_id, c.video_id, c.comment_text, c.timestamp,
              u.name AS member_name, u.user_photo AS member_photo
       FROM comment c
       JOIN user u ON u.id = c.member_id
       WHERE c.video_id = ?
       ORDER BY c.timestamp ASC`,
      [id]
    );
    const comments = (commentsRows || []).map((c) => ({
      id: c.id,
      member_id: c.member_id,
      video_id: c.video_id,
      comment_text: c.comment_text,
      timestamp: c.timestamp,
      member_name: c.member_name,
      member_photo: c.member_photo,
    }));

    // Related: 1) same group, 2) same admin from other groups, 3) rest from groups user is in
    const groupId = row.group_id;
    const adminId = row.administrator_id;
    const vis = getVideoVisibility(req, "v");

    const relatedBaseSelect = `
      SELECT v.id, v.title, v.poster_url, v.duration, v.description, v.group_id, v.administrator_id, v.created_at,
             g.group_name, u.name AS admin_name, u.user_photo AS admin_photo,
             (SELECT COUNT(*) FROM \`like\` l WHERE l.video_id = v.id AND l.like_type = 1) AS likes_count,
             (SELECT COUNT(*) FROM \`like\` l WHERE l.video_id = v.id AND l.like_type = 0) AS dislikes_count,
             (SELECT COUNT(*) FROM saved_video sv WHERE sv.video_id = v.id) AS saved_count
      FROM video v
      LEFT JOIN \`group\` g ON g.id = v.group_id
      LEFT JOIN user u ON u.id = v.administrator_id
    `;
    const relatedTail = vis.whereClause ? " AND " + vis.whereClause : "";
    const relatedOrder = " ORDER BY v.created_at DESC LIMIT 8";

    const [relatedSameGroup] = await db.promise().query(
      `${relatedBaseSelect} WHERE v.group_id = ? AND v.id != ?${relatedTail}${relatedOrder}`,
      [groupId, id, ...vis.params]
    );
    const [relatedSameAdmin] = await db.promise().query(
      `${relatedBaseSelect} WHERE v.administrator_id = ? AND v.id != ? AND v.group_id != ?${relatedTail}${relatedOrder}`,
      [adminId, id, groupId, ...vis.params]
    );
    const [relatedOtherFromMyGroups] = await db.promise().query(
      `${relatedBaseSelect} WHERE v.id != ? AND v.group_id != ? AND v.administrator_id != ?${relatedTail}${relatedOrder}`,
      [id, groupId, adminId, ...vis.params]
    );

    const formatRelated = (rows) =>
      (rows || []).map((r) => {
        const { admin_name: an, admin_photo: ap, ...v } = r;
        return {
          ...v,
          admin: { name: an, user_photo: ap },
          likes_count: Number(r.likes_count) || 0,
          dislikes_count: Number(r.dislikes_count) || 0,
          saved_count: Number(r.saved_count) || 0,
        };
      });

    const relatedVideos = {
      sameGroup: formatRelated(relatedSameGroup),
      sameAdmin: formatRelated(relatedSameAdmin),
      otherFromMyGroups: formatRelated(relatedOtherFromMyGroups),
    };

    return res.status(200).json({
      success: true,
      data: {
        video,
        admin,
        likes_count,
        dislikes_count,
        saved_count,
        description: video.description,
        comments,
        commentCount: comments.length,
        relatedVideos,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Database error", error: err.message });
  }
};

exports.deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: "Video id is required" });
    }
    const visibility = getVideoVisibility(req, "video");
    let query = "DELETE FROM video WHERE id = ?";
    const params = [id];
    if (visibility.whereClause) {
      query += " AND " + visibility.whereClause;
      params.push(...visibility.params);
    }
    const [result] = await db.promise().query(query, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }
    return res.status(200).json({ success: true, message: "Video deleted successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Database error", error: err.message });
  }
};

// Update video by ID
exports.updateVideo = (req, res) => {
  upload.fields([
    { name: "video_file", maxCount: 1 },
    { name: "poster_file", maxCount: 1 },
  ])(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ success: false, message: "id is required" });
      }

      const visibility = getVideoVisibility(req, "video");
      let checkQuery = "SELECT * FROM video WHERE id = ?";
      const checkParams = [id];
      if (visibility.whereClause) {
        checkQuery += " AND " + visibility.whereClause;
        checkParams.push(...visibility.params);
      }
      const [oldVideo] = await db.promise().query(checkQuery, checkParams);
      if (oldVideo.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Video not found",
        });
      }

      const updateFields = [];
      const updateParams = [];

      // Handle basic fields from body
      const { title, meeting_id, group_id ,  duration, description } = req.body;
      if ( title) {
        updateFields.push("title = ?");
        updateParams.push(title);
      }
      if (meeting_id) {
        // Check if meeting exists if updating meeting_id
        const meetingCheckQuery = "SELECT * FROM meeting WHERE id = ?";
        const [meetingRows] = await db
          .promise()
          .query(meetingCheckQuery, [meeting_id]);
        if (meetingRows.length === 0) {
          return res.status(404).json({ success: false, message: "Meeting not found" });
        }
        updateFields.push("meeting_id = ?");
        updateParams.push(meeting_id);
      }
      if (duration!==undefined && duration!==null && duration!=='') {
        // Duration from frontend is in seconds; DB column is TIME. Convert so MySQL stores correctly (e.g. 130 -> 00:02:10).
        const finalDuration = Math.max(0, parseInt(duration, 102) || 0);
        updateFields.push("duration = SEC_TO_TIME(?)");
        updateParams.push(finalDuration);
      }
      if (description) {
        updateFields.push("description = ?");
        updateParams.push(description);
      }
      if ( group_id ) {
        updateFields.push("group_id = ?");
        updateParams.push( group_id );
      }
      // Handle video/poster file updates
      let newVideoUrl, newPosterUrl;

      if (req.files && req.files.video_file) {
        const videoFile = req.files.video_file[0];
        validateFileType(videoFile, "video");
        newVideoUrl = await uploadToCloudinary(videoFile, "videos");
        updateFields.push("video_url = ?");
        updateParams.push(newVideoUrl);
      } else if (req.body.video_file) {
        validateFileType(req.body.video_file, "video");
        newVideoUrl = req.body.video_file;
        updateFields.push("video_url = ?");
        updateParams.push(newVideoUrl);
      }

      if (req.files && req.files.poster_file) {
        const posterFile = req.files.poster_file[0];
        validateFileType(posterFile, "image");
        newPosterUrl = await uploadToCloudinary(posterFile, "posters");
        updateFields.push("poster_url = ?");
        updateParams.push(newPosterUrl);
      } else if (req.body.poster_file) {
        validateFileType(req.body.poster_file, "image");
        newPosterUrl = req.body.poster_file;
        updateFields.push("poster_url = ?");
        updateParams.push(newPosterUrl);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ success: false, message: "No new data provided for update" });
      }

      updateParams.push(id);

      const sql = `UPDATE video SET ${updateFields.join(", ")} WHERE id = ?`;
      const [result] = await db.promise().query(sql, [...updateParams, id]);

      return res.status(200).json({ success: true, message: "Video updated successfully" });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Database error", error: err.message });
    }
  });
};
