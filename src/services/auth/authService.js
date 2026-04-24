const authRepo = require("../../repositories/authRepository");
const domainRepository = require("../../repositories/domainRepository");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const { sendVerificationEmail } = require("../../utils/emailService");
const { recordFailedAttempt, clearAttempts } = require("../../utils/loginAttempts");
const { generateToken } = require("../../utils/jwtHelper");
const authSecurity = require("./authServiceSecurity");
const { isAdminAccess } = require("../../utils/authorization");
const authValidator = require("../../validators/authValidator");

exports.deleteUserByEmail = async (email) => {
  if (!email) return;
  await authRepo.deleteByEmail(email);
};

exports.register = async (data) => {
  authValidator.validateRegister(data);
  const { name, email, password, role } = data;

  const domainName = email.split('@')[1];
  if (domainName) {
    const domainObj = await domainRepository.findByDomainName(domainName.toLowerCase());
    if (domainObj && !domainObj.auth_email_enabled) {
      throw new Error("Email authentication is disabled for your organization. Please use Google Sign-In.");
    }
  }

  const exists = await authRepo.findByEmail(email);
  if (exists) throw new Error("Email already exists");

  const id = uuidv4();
  const hashed = await bcrypt.hash(password, 10);
  const code = Math.floor(1000 + Math.random() * 9000);

  await authRepo.createUser({
    id,
    name,
    email,
    password: hashed,
    role,
    verification_code: code,
  });

  await sendVerificationEmail(email, code, "Verify your email");

  return { id, name, email, role };
};

exports.login = async (data) => {
    authValidator.validateLogin(data);
    const { email, password, remember_me, from, captchaToken } = data;

    const domainName = email.split('@')[1];
    if (domainName) {
      const domainObj = await domainRepository.findByDomainName(domainName.toLowerCase());
      if (domainObj && !domainObj.auth_email_enabled) {
        throw new Error("Email authentication is disabled for your organization. Please use Google Sign-In.");
      }
    }

    const user = await authRepo.findByEmail(email);
    if (!user) {
      recordFailedAttempt(email);
      throw new Error("Invalid credentials");
    }
  
    const securityCheck = await authSecurity.checkLoginSecurity(email, captchaToken);
  
    if (securityCheck.blocked) {
      return {
        success: false,
        ...securityCheck,
      };
    }
  
    if (!user.email_verification) {
      throw new Error("Please verify your email");
    }
  
    if (from && isAdminAccess(user, from)) {
      throw new Error("Access denied. Administrators only.");
    }
    
  
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      recordFailedAttempt(email);
      throw new Error("Invalid credentials");
    }
  
    clearAttempts(email);
  
    const token = generateToken(user, remember_me);
  
    return { token };
  };

exports.verifyEmail = async ({ email, code }) => {
  authValidator.validateVerifyEmail({ email, code });
  const user = await authRepo.findByCode(email, code);
  if (!user) throw new Error("Invalid code");

  await authRepo.verifyEmail(email);
};

exports.forgotPassword = async ({ email }) => {
  authValidator.validateForgotPassword({ email });
  const exists = await authRepo.findByEmail(email);
  if (!exists) throw new Error("Email not found");
  const code = Math.floor(1000 + Math.random() * 9000);
  await authRepo.setResetCode(email, code);
  await sendVerificationEmail(email, code, "Reset password");
};

exports.verifyCode = async ({ email, code }) => {
  authValidator.validateVerifyCode({ email, code });
  const user = await authRepo.findByCode(email, code);
  if (!user) throw new Error("Invalid code");
  await authRepo.verifyEmail(email);
};

exports.resetPassword = async ({ email, new_password, is_verified }) => {
  authValidator.validateResetPassword({ email, new_password, is_verified });

  const hashed = await bcrypt.hash(new_password, 10);
  await authRepo.updatePassword(email, hashed);
};