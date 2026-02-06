// scripts/test-meeting-socket.js
// Simple Node test client for the meeting WebSocket.
// Use this to verify joinMeetingRoom, participants, reactions, etc.
//
// 1. Set SERVER_URL, JWT, and MEETING_ID below.
// 2. Run `node scripts/test-meeting-socket.js` from the project root.
// 3. Run it in two terminals (with two different JWTs) to simulate two users.

const { io } = require("socket.io-client");

const SERVER_URL = "http://localhost:3000"; // TODO: change to your backend URL/port
const JWT = "PASTE_YOUR_JWT_HERE";
const MEETING_ID = "PASTE_MEETING_ID_HERE";

if (!JWT || JWT === "PASTE_YOUR_JWT_HERE" || !MEETING_ID || MEETING_ID === "PASTE_MEETING_ID_HERE") {
  console.error("Set SERVER_URL, JWT and MEETING_ID at the top of test-meeting-socket.js before running.");
  process.exit(1);
}

const socket = io(SERVER_URL, {
  auth: { token: JWT },
  transports: ["websocket"],
});

socket.on("connect", () => {
  console.log("Connected:", socket.id);

  socket.emit("joinMeetingRoom", { meetingId: MEETING_ID }, (ack) => {
    console.log("joinMeetingRoom ack:", ack);

    if (!ack?.ok) return;

    // Example: send some in-meeting events
    socket.emit(
      "raiseHand",
      { meetingId: MEETING_ID, raised: true },
      (res) => console.log("raiseHand ack:", res)
    );

    socket.emit(
      "reaction",
      { meetingId: MEETING_ID, type: "like" },
      (res) => console.log("reaction ack:", res)
    );

    socket.emit(
      "updateMediaState",
      { meetingId: MEETING_ID, audioMuted: true, videoMuted: false },
      (res) => console.log("updateMediaState ack:", res)
    );
  });
});

socket.on("participantJoined", (data) => {
  console.log("participantJoined:", data);
});

socket.on("participantLeft", (data) => {
  console.log("participantLeft:", data);
});

socket.on("mediaStateUpdated", (data) => {
  console.log("mediaStateUpdated:", data);
});

socket.on("handRaised", (data) => {
  console.log("handRaised:", data);
});

socket.on("reaction", (data) => {
  console.log("reaction event:", data);
});

socket.on("connect_error", (err) => {
  console.error("connect_error:", err.message);
});

socket.on("disconnect", (reason) => {
  console.log("Disconnected:", reason);
});

