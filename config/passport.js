const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
require("dotenv").config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL,
      scope: ["email", "profile"],
      passReqToCallback: true,
    },
    (req, accessToken, refreshToken, profile, done) => {
      // profile contains emails in profile.emails
      done(null, profile);
    }
  )
);

module.exports = passport;
