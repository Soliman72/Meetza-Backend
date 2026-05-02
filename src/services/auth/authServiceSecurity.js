const { requiresCaptcha, getAttemptsInfo } = require("../../utils/loginAttempts");
const { verifyCaptcha } = require("../../utils/captcha");

exports.checkLoginSecurity = async (email, captchaToken) => {
    if (requiresCaptcha(email) && !captchaToken) {
      const info = getAttemptsInfo(email);
  
      return {
        blocked: true,
        requiresCaptcha: true,
        remaining: info.remaining,
      };
    }
  
    if (captchaToken) {
      await verifyCaptcha(captchaToken);
    }
  
    return { blocked: false };
  };