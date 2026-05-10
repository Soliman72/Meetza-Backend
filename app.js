const express = require("express");
const path = require("path");
const cors = require("cors");
const setupSwagger = require("./src/config/setupSwagger");

const passport = require("./src/config/passport");

const authRouter = require("./src/routes/authRoute");
const groupContentRouter = require("./src/routes/groupContentRoute");
const meetingRouter = require("./src/routes/meetingRoute");
const chatRouter = require("./src/routes/chatRoute");
const socialAuthRouter = require("./src/routes/social_authRoute");
const memberRouter = require("./src/routes/memberRoute");
const administratorRouter = require("./src/routes/administratorRoute");
const userRouter = require("./src/routes/userRoute");
const videoRouter = require("./src/routes/videoRoute");
const groupRouter = require("./src/routes/groupRoute");
const groupMembershipRouter = require("./src/routes/group_memberShipRoute");
const positionRouter = require("./src/routes/positionRoute");
const likeRouter = require("./src/routes/likeRoute");
const commentRouter = require("./src/routes/commentRoute");
const saved_videoRouter = require("./src/routes/saved_videoRoute");
const notificationRouter = require("./src/routes/notificationRoute");
const contactRouter = require("./src/routes/contactRoute");
const homeRouter = require("./src/routes/homeRoute");
const profileRouter = require("./src/routes/profileRoute");
const reportRouter = require("./src/routes/reportRoute");
const domainRouter = require("./src/routes/domainRoute");
const companyRouter = require("./src/routes/companyRoute");
const chatBotRouter = require("./src/routes/chatBotRoute");
const watchProgressRouter = require("./src/routes/watchProgressRoute");

/**
 * Express application (HTTP routes, middleware, static files).
 * Socket.IO is attached in `server.js` after `http.createServer(app)`.
 */
function createApp() {
  const app = express();

  app.use("/uploads", express.static(path.join(__dirname, "uploads")));
  app.use(express.static(path.join(__dirname, "public")));

  app.use(cors());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
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
  app.use("/api/like", likeRouter);
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
  app.use("/api/video-watch-progress", watchProgressRouter);

  setupSwagger(app);

  // Global Error Handler for parsing errors (like 413 Request Entity Too Large)
  app.use((err, req, res, next) => {
    if (err.type === "entity.too.large" || err.status === 413) {
      return res.status(413).json({
        success: false,
        message: "Request entity too large. Please upload a smaller file or reduce data size.",
        error: err.message
      });
    }
    next(err);
  });

  return app;
}

module.exports = { createApp };
