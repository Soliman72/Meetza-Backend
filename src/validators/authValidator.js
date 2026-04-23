const ALLOWED_ROLES = ["Member", "Administrator", "Super_Admin"];
const ALLOWED_SOCIAL_TYPES = ["signin", "signup"];

exports.validateRegister = (data) => {
  const { name, email, password, role } = data || {};
  if (!name || !email || !password || !role) {
    throw new Error("Missing fields");
  }
  if (!ALLOWED_ROLES.includes(role)) {
    throw new Error("Invalid role");
  }
};

exports.validateLogin = (data) => {
  const { email, password } = data || {};
  if (!email || !password) throw new Error("Email & password are required");
};

exports.validateVerifyEmail = (data) => {
  const { email, code } = data || {};
  if (!email || !code) throw new Error("Email & verification code are required");
};

exports.validateForgotPassword = (data) => {
  if (!data?.email) throw new Error("Email is required");
};

exports.validateVerifyCode = (data) => {
  const { email, code } = data || {};
  if (!email || !code) throw new Error("Email & verification code are required");
};

exports.validateResetPassword = (data) => {
  const { email, new_password, is_verified } = data || {};
  if (!email || !new_password || is_verified === undefined) {
    throw new Error("Email, new password & is_verified are required");
  }
  if (!is_verified) throw new Error("Not verified");
};

/** @returns {{ role, redirect, type }} or throws Error */
exports.parseSocialAuthQuery = (query) => {
  const role = query.role || "Member";
  const redirect = query.redirect || "http://localhost:3000/home";
  const type = query.type || "signin";

  if (!ALLOWED_ROLES.includes(role)) {
    throw new Error("Invalid role specified");
  }
  if (!ALLOWED_SOCIAL_TYPES.includes(type)) {
    throw new Error("Invalid type specified");
  }
  try {
    new URL(redirect);
  } catch {
    throw new Error("Invalid redirect URL format");
  }
  return { role, redirect, type };
};
