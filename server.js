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

// Use video router

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
chatController.registerChatIo(io);
registerChatSocket(io);

// Register notification socket
initNotificationSocket(io);
registerNotificationSocket(io);

// Serve static files (videos, posters) from the uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const port = process.env.PORT || 4000;
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

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}...`);
});
