// scripts/test-socket.js
const { io } = require("socket.io-client");

const SERVER_URL = "PASTE_YOUR_SERVER_URL_HERE"; // meetza backend url
const JWT = "PASTE_YOUR_JWT_HERE";
const GROUP_ID = "PASTE_GROUP_ID_HERE";

if (!JWT || !GROUP_ID) {
  console.error("Set JWT and GROUP_ID before running the test.");
  process.exit(1);
}

const socket = io(SERVER_URL, {
  auth: { token: JWT },
  transports: ["websocket"], // quickest handshake
});

socket.on("connect", () => {
  console.log("Connected:", socket.id);

  socket.emit("joinGroup", { groupId: GROUP_ID }, (ack) => {
    console.log("joinGroup ack:", ack);

    socket.emit(
      "sendMessage",
      { groupId: GROUP_ID, message: "Hello Shooosh from socket 👋" },
      (ackMsg) => console.log("sendMessage ack:", ackMsg)
    );
  });
});

socket.on("message", (msg) => {
  console.log("message event:", msg);
});

socket.on("connect_error", (err) => {
  console.error("connect_error:", err.message);
});

socket.on("disconnect", (reason) => {
  console.log("Disconnected:", reason);
});
