const passport = require("passport");
const authService = require("../services/auth/authService");
const authOAuthService = require("../services/authOAuthService");
const authValidator = require("../validators/authValidator");
const { success: resSuccess, error: resError } = require("../dto");

exports.register = async (req, res) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(resSuccess(result));
  } catch (e) {
    await authService.deleteUserByEmail(req.body?.email);
    res.status(400).json(resError(e.message));
  }
};

exports.login = async (req, res) => {
  try {
    const result = await authService.login(req.body);
    res.status(200).json(resSuccess(result));
  } catch (e) {
    res.status(400).json(resError(e.message));
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    await authService.verifyEmail(req.body);
    res.status(200).json(resSuccess(null, "Email verified"));
  } catch (e) {
    res.status(400).json(resError(e.message));
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    await authService.forgotPassword(req.body);
    res.status(200).json(resSuccess(null, "Check your email"));
  } catch (e) {
    res.status(400).json(resError(e.message));
  }
};

exports.verifyCode = async (req, res) => {
  try {
    await authService.verifyCode(req.body);
    res.status(200).json(resSuccess(null, "Code verified"));
  } catch (e) {
    res.status(400).json(resError(e.message));
  }
};

exports.resetPassword = async (req, res) => {
  try {
    await authService.resetPassword(req.body);
    res.status(200).json(resSuccess(null, "Password updated"));
  } catch (e) {
    res.status(400).json(resError(e.message));
  }
};

exports.socialAuth = (req, res, next) => {
  try {
    const { role, redirect, type } = authValidator.parseSocialAuthQuery(req.query);
    const state = JSON.stringify({ role, redirect, type });
    passport.authenticate("google", {
      scope: ["email", "profile"],
      session: false,
      state,
    })(req, res, next);
  } catch (e) {
    return res.status(400).json(resError(e.message));
  }
};

exports.socialAuthCallback = (req, res, next) => {
  passport.authenticate("google", { session: false }, (err, profile) => {
    authOAuthService.handleGoogleOAuthCallback(err, profile, req, res);
  })(req, res, next);
};
