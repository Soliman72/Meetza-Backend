const axios = require("axios");

exports.verifyCaptcha = async (captchaToken) => {
  const verifyUrl = "https://www.google.com/recaptcha/api/siteverify";

  const response = await axios.post(verifyUrl, null, {
    params: {
      secret: process.env.RECAPTCHA_SECRET_KEY,
      response: captchaToken,
    },
  });

  const { success, score, "error-codes": errorCodesRaw } = response.data || {};
  const errorCodes = Array.isArray(errorCodesRaw)
    ? errorCodesRaw.filter(Boolean)
    : [];

  if (!success) {
    const details = errorCodes.length > 0 ? ` (${errorCodes.join(", ")})` : "";
    throw new Error(
      `CAPTCHA verification failed: ${errorCodes.length} error(s)${details}`,
    );
  }

  if (score !== undefined && score < 0.5) {
    throw new Error("Low CAPTCHA score");
  }

  return true;
};