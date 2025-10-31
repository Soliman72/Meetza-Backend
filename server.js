require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRouter = require("./router/authRouter");
const meetingContentRouter = require("./router/meetingContentRouter");
const passport = require("./config/passport");

require("./config/db");
const socialAuthRouter = require("./router/social_authRouter");
const memberRouter = require("./router/memberRouter");
const administratorRouter = require("./router/administratorRouter");
const userRouter = require("./router/userRouter");

const app = express();
const port = process.env.PORT || 4000;
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

app.use("/api/auth", authRouter);

app.use("/api/meeting-contents", meetingContentRouter);
app.use("/api/social_auth", socialAuthRouter);
app.use("/api/member", memberRouter);
app.use("/api/administrator", administratorRouter);
app.use("/api/user", userRouter);
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}...`);
});
