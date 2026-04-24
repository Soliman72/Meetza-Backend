const jwt = require("jsonwebtoken");
require("dotenv").config();

function isRememberMe(remember_me) {
  return (
    remember_me === true ||
    remember_me === "true" ||
    remember_me === 1 ||
    remember_me === "1"
  );
}

exports.generateToken = (user, remember_me) => {
  const remember = isRememberMe(remember_me);
  const expiresIn = remember ? "4d" : "24h";

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      user_photo: user.user_photo,
    },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};