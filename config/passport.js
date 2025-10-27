const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const LinkedInStrategy = require("passport-linkedin-oauth2").Strategy;
require("dotenv").config();


passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.MEMBER_CALLBACK_URL,
  passReqToCallback: true,
}, (req, accessToken, refreshToken, profile, done) => {
  // profile contains emails in profile.emails
  console.log('Google profile:', profile.emails);
  done(null, profile);
}));


passport.use(new LinkedInStrategy({
  clientID: process.env.LINKEDIN_CLIENT_ID,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
  callbackURL:process.env.MEMBER_CALLBACK_URL,
  scope: ['r_liteprofile', 'r_emailaddress'],
  passReqToCallback: true,
}, (req, accessToken, refreshToken, profile, done) => {
  done(null, profile);
}));
module.exports = passport;