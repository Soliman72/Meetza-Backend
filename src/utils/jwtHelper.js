const jwt = require("jsonwebtoken");

exports.generateToken = (user, remember_me) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      user_photo: user.user_photo,
    },
    process.env.JWT_SECRET,
    { expiresIn: remember_me === "true" ? "4d" : "24h" }
  );
};