require("dotenv").config();
require("./src/config/db");

const http = require("http");
const fs = require("fs");
const os = require("os");
const { Server } = require("socket.io");

const { createApp } = require("./app");
const chatController = require("./src/controllers/chatController");
const registerChatSocket = require("./src/sockets/chatSocket");
const authenticateSocket = require("./src/middleware/soketAuth");
const notificationSocket = require("./src/sockets/notificationSocket");
const registerMeetingSocket = require("./src/sockets/meetingSocket");
const {
  bootstrapMeetingRecurrenceJobs,
} = require("./src/services/meetingRecurrenceScheduler");

const app = createApp();
const server = http.createServer(app);
server.timeout = 0; // Disable default Node.js timeout for long-running AI requests
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
registerMeetingSocket(io);

notificationSocket.setSocket(io);
notificationSocket.registerNotificationSocket(io);

const port = process.env.PORT || process.env.port;

const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  const preferredNames = ["Wi-Fi", "Ethernet", "eth0", "wlan0"];
  const virtualNames = ["vEthernet", "WSL", "Hyper-V", "VMware", "VirtualBox"];

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
