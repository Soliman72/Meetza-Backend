require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const authRouter = require("./router/authRouter");
const groupContentRouter = require("./router/groupContentRouter");
const meetingRouter = require("./router/meetingRouter");
const passport = require("./config/passport");
const chatRouter = require("./router/chatRouter");
const chatController = require("./controller/chatController");
const registerChatSocket = require("./sockets/chatSocket");

require("./config/db");
const socialAuthRouter = require("./router/social_authRouter");
const memberRouter = require("./router/memberRouter");
const administratorRouter = require("./router/administratorRouter");
const userRouter = require("./router/userRouter");
const videoRouter = require("./router/videoRouter");
const groupRouter = require("./router/groupRouter"); // Use group router
const groupMembershipRouter = require("./router/group_membershipRouter");
const positionRouter = require("./router/positionRouter"); // Use position router
const commentRouter = require("./router/commentRouter");
const saved_videoRouter = require("./router/saved_videoRouter");

const { initNotificationSocket } = require("./services/notificationService");
const registerNotificationSocket = require("./sockets/notificationSocket");
const notificationRouter = require("./router/notificationRouter");
const contactRouter = require("./router/contactRouter");
const os = require("os");
const fs = require("fs");

// Use video router

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
  allowEIO3: true,
});
chatController.registerChatIo(io);
registerChatSocket(io);

// Register notification socket
initNotificationSocket(io);
registerNotificationSocket(io);

// Serve static files (videos, posters) from the uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const port = process.env.PORT;
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

app.use("/api/auth", authRouter);

app.use("/api/user", userRouter);
app.use("/api/social_auth", socialAuthRouter);
app.use("/api/member", memberRouter);
app.use("/api/administrator", administratorRouter);

app.use("/api/position", positionRouter);
app.use("/api/group", groupRouter);
app.use("/api/group-membership", groupMembershipRouter);
app.use("/api/group-contents", groupContentRouter);
app.use("/api/meeting", meetingRouter);
app.use("/api/video", videoRouter);
app.use("/api/like", require("./router/likeRouter"));
app.use("/api/comment", commentRouter);
app.use("/api/saved_video", saved_videoRouter);
app.use("/api/chat", chatRouter);
app.use("/api/notification", notificationRouter);
app.use("/api/contact", contactRouter);

app.get("/", (req, res) => {
  res.send("اهلا يا شهد يا رخمهههه!!!");
});

// Get local IP address for network access
// Prefer Wi-Fi/Ethernet over virtual adapters
const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  const preferredNames = ["Wi-Fi", "Ethernet", "eth0", "wlan0"];
  const virtualNames = ["vEthernet", "WSL", "Hyper-V", "VMware", "VirtualBox"];
  
  // First pass: Look for preferred interfaces (Wi-Fi, Ethernet)
  for (const preferredName of preferredNames) {
    for (const name of Object.keys(interfaces)) {
      if (name.includes(preferredName)) {
        for (const iface of interfaces[name]) {
          if (iface.family === "IPv4" && !iface.internal) {
            return iface.address;
          }
        }
      }
    }
  }
  
  // Second pass: Look for any non-virtual interface
  for (const name of Object.keys(interfaces)) {
    const isVirtual = virtualNames.some(virtualName => name.includes(virtualName));
    if (isVirtual) continue;
    
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  
  // Fallback: Return first available (even if virtual)
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  
  return "localhost";
};

server.listen(port, "0.0.0.0", () => {
  const localIP = getLocalIP();
  const isDocker = process.env.DOCKER_ENV === "true" || process.env.IN_DOCKER === "true" || fs.existsSync("/.dockerenv");
  
  console.log("\n" + "=".repeat(60));
  console.log(`✅ Server is running!`);
  console.log("=".repeat(60));
  console.log(`📱 Local access:    http://localhost:${port}`);
  
  // In Docker, the internal IP isn't useful for external access
  if (!isDocker && localIP !== "localhost") {
    console.log(`🌐 Network access:  http://${localIP}:${port}`);
    console.log(`🔌 Socket.IO URL:   http://${localIP}:${port}`);
    console.log("=".repeat(60));
    console.log(`\n💡 To access from another device:`);
    console.log(`   1. Same network: Use http://${localIP}:${port}`);
    console.log(`   2. Different network: Use ngrok (see docker-compose.yml)`);
    console.log(`   3. Check Windows Firewall if same-network access fails\n`);
  } else if (isDocker) {
    console.log(`🌐 Docker container running on port ${port}`);
    console.log(`🔌 Socket.IO URL:   http://localhost:${port}`);
    console.log("=".repeat(60));
    console.log(`\n💡 Access options:`);
    console.log(`   1. Same network: Use your host IP address (run 'npm run get-ip' on host)`);
    console.log(`   2. Different network: Use ngrok service (if enabled in docker-compose)`);
    console.log(`   3. Check docker-compose.yml for ngrok public URL\n`);
  } else {
    console.log(`🌐 Network access:  http://${localIP}:${port}`);
    console.log(`🔌 Socket.IO URL:   http://${localIP}:${port}`);
    console.log("=".repeat(60));
    console.log(`\n💡 To access from another device on the same network:`);
    console.log(`   Use: http://${localIP}:${port}\n`);
  }
});
