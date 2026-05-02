const axios = require("axios");

exports.verifyCaptcha = async (captchaToken) => {
  const verifyUrl = "https://www.google.com/recaptcha/api/siteverify";

  const response = await axios.post(verifyUrl, null, {
    params: {
      secret: process.env.RECAPTCHA_SECRET_KEY,
      response: captchaToken,
    },
  });

  const { success, score } = response.data;

  if (!success) {
    throw new Error("CAPTCHA verification failed");
  }

  if (score !== undefined && score < 0.5) {
    throw new Error("Low CAPTCHA score");
  }

  return true;
};