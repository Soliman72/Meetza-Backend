const express = require("express");
const path = require("path");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./src/config/swagger");
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

/**
 * Express application (HTTP routes, middleware, static files).
 * Socket.IO is attached in `server.js` after `http.createServer(app)`.
 */
function createApp() {
  const app = express();

  app.use("/uploads", express.static(path.join(__dirname, "uploads")));
  app.use(express.static(path.join(__dirname, "public")));

  app.use(cors());
  app.use(express.json());
  app.use(passport.initialize());

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
    })
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

  return app;
}

module.exports = { createApp };
