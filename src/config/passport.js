const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
require("dotenv").config();

const cleanEnv = (value) => String(value || "").trim();
const clientID = cleanEnv(process.env.GOOGLE_CLIENT_ID);
const clientSecret = cleanEnv(process.env.GOOGLE_CLIENT_SECRET);
const callbackURL =
  cleanEnv(process.env.CALLBACK_URL) ||
  `${cleanEnv(process.env.BACKEND_URL).replace(/\/+$/, "")}/auth/social/google/callback`;

if (!clientID || !clientSecret || !callbackURL) {
  throw new Error("Missing Google OAuth env vars: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, CALLBACK_URL/BACKEND_URL");
}

passport.use(
  new GoogleStrategy(
    {
      clientID,
      clientSecret,
      callbackURL,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      return done(null, profile);
    }
  )
);



module.exports = passport;
