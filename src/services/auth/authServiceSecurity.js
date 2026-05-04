const { requiresCaptcha, getAttemptsInfo } = require("../../utils/loginAttempts");
const { verifyCaptcha } = require("../../utils/captcha");

exports.checkLoginSecurity = async (email, captchaToken) => {
  if (requiresCaptcha(email) && !captchaToken) {
    const info = getAttemptsInfo(email);

    return {
      blocked: true,
      requiresCaptcha: true,
      failedAttempts: info.count,
      remaining: info.remaining,
    };
  }

  if (captchaToken) {
    try {
      await verifyCaptcha(captchaToken);
    } catch (error) {
      const info = getAttemptsInfo(email);
      error.message = `${error.message}. Failed login attempts: ${info.count}`;
      throw error;
    }
  }

  return { blocked: false };
};