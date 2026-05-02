const nodemailer = require("nodemailer");

exports.sendVerificationEmail = async (email, code, msg) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return transporter.sendMail({
    from: `"Meetza" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verification",
    html: `<h2>${msg}</h2><h1>${code}</h1>`,
  });
};