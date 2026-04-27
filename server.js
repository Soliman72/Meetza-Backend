require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const setupSwagger = require("./src/config/setupSwagger");

const authRouter = require("./src/routes/authRoute");
const groupContentRouter = require("./src/routes/groupContentRoute");
const meetingRouter = require("./src/routes/meetingRoute");
const passport = require("./src/config/passport");
const chatRouter = require("./src/routes/chatRoute");
const chatController = require("./src/controllers/chatController");
const registerChatSocket = require("./src/sockets/chatSocket");

require("./src/config/db");
const socialAuthRouter = require("./src/routes/social_authRoute");
const memberRouter = require("./src/routes/memberRoute");
const administratorRouter = require("./src/routes/administratorRoute");
const userRouter = require("./src/routes/userRoute");
const videoRouter = require("./src/routes/videoRoute");
const groupRouter = require("./src/routes/groupRoute");
const groupMembershipRouter = require("./src/routes/group_memberShipRoute");
const positionRouter = require("./src/routes/positionRoute");
const commentRouter = require("./src/routes/commentRoute");
const saved_videoRouter = require("./src/routes/saved_videoRoute");

const notificationSocket = require("./src/sockets/notificationSocket");
const registerNotificationSocket = notificationSocket.registerNotificationSocket;
const authenticateSocket = require("./src/middleware/soketAuth");
const notificationRouter = require("./src/routes/notificationRoute");
const contactRouter = require("./src/routes/contactRoute");
const homeRouter = require("./src/routes/homeRoute");
const profileRouter = require("./src/routes/profileRoute");
const reportRouter = require("./src/routes/reportRoute");
const domainRouter = require("./src/routes/domainRoute");
const companyRouter = require("./src/routes/companyRoute");
const chatBotRouter = require("./src/routes/chatBotRoute");

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
app.set("io", io);
io.use(authenticateSocket);
chatController.registerChatIo(io);
registerChatSocket(io);
const registerMeetingSocket = require("./src/sockets/meetingSocket");
const {
  bootstrapMeetingRecurrenceJobs,
} = require("./src/services/meetingRecurrenceScheduler");

registerMeetingSocket(io);

// Register notification socket (io for emitters used by notificatioService)
notificationSocket.setSocket(io);
registerNotificationSocket(io);

// Serve static files (videos, posters) from the uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// Simple static test front-end (e.g. /meeting-test.html)
app.use(express.static(path.join(__dirname, "public")));

const port = process.env.PORT;
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

setupSwagger(app);

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
app.use("/api/like", require("./src/routes/likeRoute"));
app.use("/api/comment", commentRouter);
app.use("/api/saved_video", saved_videoRouter);
app.use("/api/chat", chatRouter);
app.use("/api/chat-bot", chatBotRouter);
app.use("/api/notification", notificationRouter);
app.use("/api/contact", contactRouter);
app.use("/api/home", homeRouter);
app.use("/api/profile", profileRouter);
app.use("/api/reports", reportRouter);
app.use("/api/organization-domain", domainRouter);
app.use("/api/companies", companyRouter);



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
    const isVirtual = virtualNames.some((virtualName) =>
      name.includes(virtualName),
    );
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
  bootstrapMeetingRecurrenceJobs().catch((err) => {
    console.error("[meeting recurrence] Bootstrap failed:", err.message);
  });

  const localIP = getLocalIP();
  const isDocker =
    process.env.DOCKER_ENV === "true" ||
    process.env.IN_DOCKER === "true" ||
    fs.existsSync("/.dockerenv");

  console.log("\n" + "=".repeat(60));
  console.log(`Server is running!`);
  console.log("=".repeat(60));
  console.log(`Local access:    http://localhost:${port}`);

  // In Docker, the internal IP isn't useful for external access
  if (!isDocker && localIP !== "localhost") {
    console.log(`Network access:  http://${localIP}:${port}`);
    console.log(`Socket.IO URL:   http://${localIP}:${port}`);
    console.log("=".repeat(60));
    console.log(`\nTo access from another device:`);
    console.log(`   1. Same network: Use http://${localIP}:${port}`);
    console.log(`   2. Different network: Use ngrok (see docker-compose.yml)`);
    console.log(`   3. Check Windows Firewall if same-network access fails\n`);
  } else if (isDocker) {
    console.log(`Docker container running on port ${port}`);
    console.log(`Socket.IO URL:   http://localhost:${port}`);
    console.log("=".repeat(60));
    console.log(`\nAccess options:`);
    console.log(
      `   1. Same network: Use your host IP address (run 'npm run get-ip' on host)`,
    );
    console.log(
      `   2. Different network: Use ngrok service (if enabled in docker-compose)`,
    );
    console.log(`   3. Check docker-compose.yml for ngrok public URL\n`);
  } else {
    console.log(`Network access:  http://${localIP}:${port}`);
    console.log(`Socket.IO URL:   http://${localIP}:${port}`);
    console.log("=".repeat(60));
    console.log(`\nTo access from another device on the same network:`);
    console.log(`   Use: http://${localIP}:${port}\n`);
  }
});
