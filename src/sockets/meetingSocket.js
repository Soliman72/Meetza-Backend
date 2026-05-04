const db = require("../config/db");

/** Check if user can access the meeting (meeting admin, group admin, group member, or super admin) */
const canAccessMeeting = async (userId, meetingId) => {
  const [rows] = await db.promise().query(
    `SELECT m.id, m.group_id
     FROM meeting m
     WHERE m.id = ?`,
    [meetingId],
  );
  if (!rows.length) return { ok: false, message: "Meeting not found" };
  const meeting = rows[0];
  // Check super admin
  const [userRows] = await db
    .promise()
    .query("SELECT role FROM user WHERE id = ? LIMIT 1", [userId]);
  if (userRows[0]?.role === "Super_Admin") return { ok: true, meeting };
  // Check meeting admin table
  const [meetingAdminRows] = await db
    .promise()
    .query(
      "SELECT id FROM meeting_admin WHERE meeting_id = ? AND user_id = ? LIMIT 1",
      [meetingId, userId],
    );
  if (meetingAdminRows.length > 0) return { ok: true, meeting };
  // Check group admin table
  const [groupAdminRows] = await db
    .promise()
    .query(
      "SELECT id FROM group_admin WHERE group_id = ? AND user_id = ? LIMIT 1",
      [meeting.group_id, userId],
    );
  if (groupAdminRows.length > 0) return { ok: true, meeting };
  // Check group membership
  const [membership] = await db
    .promise()
    .query(
      "SELECT id FROM group_membership WHERE group_id = ? AND member_id = ?",
      [meeting.group_id, userId],
    );
  if (membership.length === 0)
    return { ok: false, message: "You do not have access to this meeting" };
  return { ok: true, meeting };
};

/** Check if user is registered as participant in DB (must join via REST first) */
const isParticipantInMeeting = async (userId, meetingId) => {
  const [rows] = await db
    .promise()
    .query(
      "SELECT id FROM meeting_participant WHERE meeting_id = ? AND user_id = ? LIMIT 1",
      [meetingId, userId],
    );
  return rows.length > 0;
};

/** Check if user is the meeting admin (or Super_Admin) and can mute others */
const canAdminMuteInMeeting = async (userId, meetingId) => {
  const [userRows] = await db
    .promise()
    .query("SELECT role FROM user WHERE id = ? LIMIT 1", [userId]);
  if (userRows[0]?.role === "Super_Admin") return true;
  // Check meeting_admin table
  const [meetingAdminRows] = await db
    .promise()
    .query(
      "SELECT id FROM meeting_admin WHERE meeting_id = ? AND user_id = ? LIMIT 1",
      [meetingId, userId],
    );
  if (meetingAdminRows.length > 0) return true;
  // Fallback: check group_admin
  const [meetingRows] = await db
    .promise()
    .query("SELECT group_id FROM meeting WHERE id = ? LIMIT 1", [meetingId]);
  if (!meetingRows.length) return false;
  const [groupAdminRows] = await db
    .promise()
    .query(
      "SELECT id FROM group_admin WHERE group_id = ? AND user_id = ? LIMIT 1",
      [meetingRows[0].group_id, userId],
    );
  return groupAdminRows.length > 0;
};

const MEETING_ROOM_PREFIX = "meeting:";
const activeScreenShareByMeeting = new Map();

const registerMeetingSocket = (io) => {
  io.on("connection", (socket) => {
    const meetingRooms = new Set();

    const getParticipantsInRoom = async (meetingId) => {
      const room = MEETING_ROOM_PREFIX + meetingId;
      const sockets = await io.in(room).fetchSockets();
      return sockets.map((s) => ({
        socketId: s.id,
        userId: s.user?.id,
        name: s.user?.name,
        email: s.user?.email,
        user_photo: s.user?.user_photo,
      }));
    };

    socket.on("joinMeetingRoom", async (payload, ack) => {
      try {
        const meetingId =
          typeof payload === "string" ? payload : payload?.meetingId;
        if (!meetingId) {
          throw new Error("meetingId is required");
        }
        const access = await canAccessMeeting(socket.user.id, meetingId);
        if (!access.ok) {
          throw new Error(access.message || "Access denied");
        }
        const inDb = await isParticipantInMeeting(socket.user.id, meetingId);
        if (!inDb) {
          throw new Error(
            "You must join the meeting first (via API) before joining the room",
          );
        }
        const room = MEETING_ROOM_PREFIX + meetingId;
        await socket.join(room);
        meetingRooms.add(meetingId);

        const participants = await getParticipantsInRoom(meetingId);
        const others = participants
          .filter((p) => p.socketId !== socket.id)
          .map((p) => ({
            socketId: p.socketId,
            user_id: p.userId,
            member_name: p.name,
            member_email: p.email,
            member_photo: p.user_photo,
          }));
        if (typeof ack === "function") {
          ack({
            ok: true,
            participants: others,
            meetingId,
          });
        }

        const activeScreenShare = activeScreenShareByMeeting.get(meetingId);
        if (activeScreenShare) {
          socket.emit("screenShareStarted", {
            meetingId,
            socketId: activeScreenShare.socketId,
            userId: activeScreenShare.userId,
          });
        }
        socket.to(room).emit("participantJoined", {
          socketId: socket.id,
          userId: socket.user.id,
          name: socket.user.name,
          email: socket.user.email,
          user_photo: socket.user.user_photo,
          meetingId,
        });

        // -----------------------------------------------------------------------------------
      } catch (error) {
        if (typeof ack === "function") {
          ack({ ok: false, message: error.message });
        }
      }
    });

    socket.on("leaveMeetingRoom", async (payload) => {
      const meetingId =
        typeof payload === "string" ? payload : payload?.meetingId;
      if (!meetingId) return;
      const room = MEETING_ROOM_PREFIX + meetingId;
      const activeScreenShare = activeScreenShareByMeeting.get(meetingId);
      if (activeScreenShare?.socketId === socket.id) {
        activeScreenShareByMeeting.delete(meetingId);
        socket.to(room).emit("screenShareStopped", {
          meetingId,
          socketId: socket.id,
          userId: socket.user?.id,
        });
      }
      meetingRooms.delete(meetingId);
      socket.to(room).emit("participantLeft", {
        socketId: socket.id,
        userId: socket.user?.id,
        meetingId,
      });
      socket.leave(room);
    });

    // Real-time temporary meeting chat (no DB storage; messages exist only while in room)
    const MEETING_CHAT_MAX_LENGTH = 2000;
    socket.on("meetingChatMessage", (payload, ack) => {
      const { meetingId, text } = payload || {};
      if (!meetingId || typeof text !== "string") {
        if (typeof ack === "function")
          ack({ ok: false, message: "meetingId and text are required" });
        return;
      }
      const trimmed = text.trim();
      if (!trimmed) {
        if (typeof ack === "function")
          ack({ ok: false, message: "Message cannot be empty" });
        return;
      }
      if (trimmed.length > MEETING_CHAT_MAX_LENGTH) {
        if (typeof ack === "function")
          ack({
            ok: false,
            message: `Message must be at most ${MEETING_CHAT_MAX_LENGTH} characters`,
          });
        return;
      }
      if (!meetingRooms.has(meetingId)) {
        if (typeof ack === "function")
          ack({
            ok: false,
            message: "You must be in the meeting room to send messages",
          });
        return;
      }
      const room = MEETING_ROOM_PREFIX + meetingId;
      io.to(room).emit("meetingChatMessage", {
        meetingId,
        userId: socket.user?.id,
        userName: socket.user?.name ?? "",
        userPhoto: socket.user?.user_photo ?? null,
        socketId: socket.id,
        text: trimmed,
        timestamp: new Date().toISOString(),
      });
      if (typeof ack === "function") ack({ ok: true });
    });

    socket.on("webrtcOffer", (payload, ack) => {
      const { toSocketId, meetingId, sdp } = payload || {};
      if (!toSocketId || !meetingId || !sdp) {
        if (typeof ack === "function")
          ack({
            ok: false,
            message: "toSocketId, meetingId, and sdp are required",
          });
        return;
      }
      if (!meetingRooms.has(meetingId)) {
        if (typeof ack === "function")
          ack({ ok: false, message: "Not in this meeting" });
        return;
      }
      io.to(toSocketId).emit("webrtcOffer", {
        fromSocketId: socket.id,
        fromUserId: socket.user?.id,
        fromName: socket.user?.name,
        meetingId,
        sdp,
      });
      if (typeof ack === "function") ack({ ok: true });
    });

    socket.on("webrtcAnswer", (payload, ack) => {
      const { toSocketId, meetingId, sdp } = payload || {};
      if (!toSocketId || !meetingId || !sdp) {
        if (typeof ack === "function")
          ack({
            ok: false,
            message: "toSocketId, meetingId, and sdp are required",
          });
        return;
      }
      if (!meetingRooms.has(meetingId)) {
        if (typeof ack === "function")
          ack({ ok: false, message: "Not in this meeting" });
        return;
      }
      io.to(toSocketId).emit("webrtcAnswer", {
        fromSocketId: socket.id,
        fromUserId: socket.user?.id,
        meetingId,
        sdp,
      });
      if (typeof ack === "function") ack({ ok: true });
    });

    socket.on("webrtcIceCandidate", (payload, ack) => {
      const { toSocketId, meetingId, candidate } = payload || {};
      if (!toSocketId || !meetingId) {
        if (typeof ack === "function")
          ack({ ok: false, message: "toSocketId and meetingId are required" });
        return;
      }
      if (!meetingRooms.has(meetingId)) {
        if (typeof ack === "function")
          ack({ ok: false, message: "Not in this meeting" });
        return;
      }
      io.to(toSocketId).emit("webrtcIceCandidate", {
        fromSocketId: socket.id,
        meetingId,
        candidate: candidate || null,
      });
      if (typeof ack === "function") ack({ ok: true });
    });

    // In-meeting controls & reactions (mute state, hand raise, like, etc.)

    // Broadcast updated media state (e.g., mic/video muted) to everyone in the meeting
    socket.on("updateMediaState", (payload = {}, ack) => {
      const { meetingId, audioMuted, videoMuted } = payload;
      if (!meetingId) {
        if (typeof ack === "function") {
          ack({ ok: false, message: "meetingId is required" });
        }
        return;
      }
      if (!meetingRooms.has(meetingId)) {
        if (typeof ack === "function") {
          ack({ ok: false, message: "Not in this meeting" });
        }
        return;
      }
      const room = MEETING_ROOM_PREFIX + meetingId;
      socket.to(room).emit("mediaStateUpdated", {
        socketId: socket.id,
        userId: socket.user?.id,
        meetingId,
        audioMuted: !!audioMuted,
        videoMuted: !!videoMuted,
      });
      if (typeof ack === "function") {
        ack({ ok: true });
      }
    });

    // Raise or lower hand in the meeting
    socket.on("raiseHand", (payload = {}, ack) => {
      const { meetingId, raised } = payload;
      if (!meetingId) {
        if (typeof ack === "function") {
          ack({ ok: false, message: "meetingId is required" });
        }
        return;
      }
      if (!meetingRooms.has(meetingId)) {
        if (typeof ack === "function") {
          ack({ ok: false, message: "Not in this meeting" });
        }
        return;
      }

      const room = MEETING_ROOM_PREFIX + meetingId;
      socket.to(room).emit("handRaised", {
        socketId: socket.id,
        userId: socket.user?.id,
        meetingId,
        raised: raised !== false, // default true
      });
      if (typeof ack === "function") {
        ack({ ok: true });
      }
    });

    // Quick reactions (like, emoji, etc.)
    socket.on("reaction", (payload = {}, ack) => {
      const { meetingId, type } = payload;
      if (!meetingId || !type) {
        if (typeof ack === "function") {
          ack({ ok: false, message: "meetingId and type are required" });
        }
        return;
      }
      if (!meetingRooms.has(meetingId)) {
        if (typeof ack === "function") {
          ack({ ok: false, message: "Not in this meeting" });
        }
        return;
      }
      const room = MEETING_ROOM_PREFIX + meetingId;
      socket.to(room).emit("reaction", {
        socketId: socket.id,
        userId: socket.user?.id,
        meetingId,
        type,
      });
      if (typeof ack === "function") {
        ack({ ok: true });
      }
    });

    // Admin mutes a participant (meeting admin or Super_Admin only). Target client receives "adminMuteYou" and applies mute.
    socket.on("adminMuteParticipant", async (payload = {}, ack) => {
      try {
        const { meetingId, targetUserId, audioMuted, videoMuted } = payload;
        if (!meetingId || !targetUserId) {
          if (typeof ack === "function") {
            ack({
              ok: false,
              message: "meetingId and targetUserId are required",
            });
          }
          return;
        }
        if (!meetingRooms.has(meetingId)) {
          if (typeof ack === "function") {
            ack({ ok: false, message: "Not in this meeting" });
          }
          return;
        }
        const allowed = await canAdminMuteInMeeting(socket.user.id, meetingId);
        if (!allowed) {
          if (typeof ack === "function") {
            ack({
              ok: false,
              message: "Only the meeting admin can mute participants",
            });
          }
          return;
        }
        const room = MEETING_ROOM_PREFIX + meetingId;
        const participants = await getParticipantsInRoom(meetingId);
        const target = participants.find((p) => p.userId === targetUserId);
        if (!target) {
          if (typeof ack === "function") {
            ack({ ok: false, message: "Participant not in this meeting room" });
          }
          return;
        }
        const audio = audioMuted !== false;
        const video = videoMuted === true;
        io.to(target.socketId).emit("adminMuteYou", {
          meetingId,
          audioMuted: audio,
          videoMuted: video,
        });
        socket.to(room).emit("participantMutedByAdmin", {
          meetingId,
          targetUserId,
          targetSocketId: target.socketId,
          audioMuted: audio,
          videoMuted: video,
        });
        if (typeof ack === "function") {
          ack({ ok: true });
        }
      } catch (error) {
        if (typeof ack === "function") {
          ack({
            ok: false,
            message: error.message || "Failed to mute participant",
          });
        }
      }
    });

    // Screen share: listen and re-broadcast to the rest of the room (same meetingId, socketId)
    socket.on("screenShareStarted", (payload = {}, ack) => {
      const { meetingId } = payload;
      if (!meetingId) {
        if (typeof ack === "function")
          ack({ ok: false, message: "meetingId is required" });
        return;
      }
      if (!meetingRooms.has(meetingId)) {
        if (typeof ack === "function")
          ack({ ok: false, message: "Not in this meeting" });
        return;
      }

      const room = MEETING_ROOM_PREFIX + meetingId;
      activeScreenShareByMeeting.set(meetingId, {
        socketId: socket.id,
        userId: socket.user?.id,
      });
      socket
        .to(room)
        .emit("screenShareStarted", {
          meetingId,
          socketId: socket.id,
          userId: socket.user?.id,
        });
      if (typeof ack === "function") ack({ ok: true });
    });

    socket.on("screenShareStopped", (payload = {}, ack) => {
      const { meetingId } = payload;
      if (!meetingId) {
        if (typeof ack === "function")
          ack({ ok: false, message: "meetingId is required" });
        return;
      }
      if (!meetingRooms.has(meetingId)) {
        if (typeof ack === "function")
          ack({ ok: false, message: "Not in this meeting" });
        return;
      }

      const room = MEETING_ROOM_PREFIX + meetingId;
      const activeScreenShare = activeScreenShareByMeeting.get(meetingId);
      if (activeScreenShare?.socketId === socket.id) {
        activeScreenShareByMeeting.delete(meetingId);
      }
      socket
        .to(room)
        .emit("screenShareStopped", {
          meetingId,
          socketId: socket.id,
          userId: socket.user?.id,
        });
      if (typeof ack === "function") ack({ ok: true });
    });

    socket.on("getMeetingParticipants", async (payload, ack) => {
      try {
        const meetingId =
          typeof payload === "string" ? payload : payload?.meetingId;
        if (!meetingId) throw new Error("meetingId is required");
        const access = await canAccessMeeting(socket.user.id, meetingId);
        if (!access.ok) throw new Error(access.message || "Access denied");
        const participants = await getParticipantsInRoom(meetingId);
        if (typeof ack === "function") {
          ack({ ok: true, participants });
        }
      } catch (error) {
        if (typeof ack === "function") {
          ack({ ok: false, message: error.message });
        }
      }
    });

    socket.on("disconnect", () => {
      meetingRooms.forEach((meetingId) => {
        const room = MEETING_ROOM_PREFIX + meetingId;
        const activeScreenShare = activeScreenShareByMeeting.get(meetingId);
        if (activeScreenShare?.socketId === socket.id) {
          activeScreenShareByMeeting.delete(meetingId);
          socket.to(room).emit("screenShareStopped", {
            meetingId,
            socketId: socket.id,
            userId: socket.user?.id,
          });
        }
        socket.to(room).emit("participantLeft", {
          socketId: socket.id,
          userId: socket.user?.id,
          meetingId,
        });
      });
    });
  });
};

module.exports = registerMeetingSocket;
