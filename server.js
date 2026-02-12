require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

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
const registerMeetingSocket = require("./sockets/meetingSocket");

registerMeetingSocket(io);

// Register notification socket
initNotificationSocket(io);
registerNotificationSocket(io);

// Serve static files (videos, posters) from the uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// Simple static test front-end (e.g. /meeting-test.html)
app.use(express.static(path.join(__dirname, "public")));

const port = process.env.PORT;
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// Swagger API documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "Meetza API Docs",
    customCss: `
      /* Hide default Swagger logo image */
      .swagger-ui .topbar-wrapper .link img {
        display: none !important;
      }
      
      #logo_small_svg__SW_TM-logo-on-dark {
        display: none !important;
      }

      /* Insert custom Meetza icon logo before the link */
      .swagger-ui .topbar-wrapper .link:before {
        content: "";
        display: inline-block;
        width: 40px;
        height: 40px;
        margin-right: 10px;
        background-image: url("https://res.cloudinary.com/dax2irx1f/image/upload/v1763555482/logo_kd3j3a.png");
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        vertical-align: middle;
      }

      /* Insert Meetza wordmark beside the logo */
      .swagger-ui .topbar-wrapper .link:after {
        content: "";
        display: inline-block;
        width: 120px;
        height: 40px;
        background-image: url("https://res.cloudinary.com/dax2irx1f/image/upload/v1763555482/logo_name_dqrdvl.png");
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        vertical-align: middle;
      }

      /* Replace "Swagger UI" text with "Meetza" */
      .swagger-ui .topbar-wrapper .link .logo__title {
        position: relative;
        font-size: 20px !important;
        font-weight: 700 !important;
        color: transparent !important; /* hide original text */
      }
      .swagger-ui .topbar-wrapper .link .logo__title:before {
        content: "Meetza";
        position: absolute;
        left: 0;
        top: 0;
        color: #ffffff;
      }
    `,
  }),
);
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

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

app.get("/shahd", (req, res) => {
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
  const localIP = getLocalIP();
  const isDocker =
    process.env.DOCKER_ENV === "true" ||
    process.env.IN_DOCKER === "true" ||
    fs.existsSync("/.dockerenv");

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
    console.log(
      `   1. Same network: Use your host IP address (run 'npm run get-ip' on host)`,
    );
    console.log(
      `   2. Different network: Use ngrok service (if enabled in docker-compose)`,
    );
    console.log(`   3. Check docker-compose.yml for ngrok public URL\n`);
  } else {
    console.log(`🌐 Network access:  http://${localIP}:${port}`);
    console.log(`🔌 Socket.IO URL:   http://${localIP}:${port}`);
    console.log("=".repeat(60));
    console.log(`\n💡 To access from another device on the same network:`);
    console.log(`   Use: http://${localIP}:${port}\n`);
  }
});
