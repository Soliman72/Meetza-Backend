const jwt = require("jsonwebtoken");
const getTokenFromHandshake = require("../utils/tokenFormHandshake");
const userRepository = require("../repositories/userRepository");

const authenticateSocket = async (socket, next) => {
  try {
    const token = getTokenFromHandshake(socket);

    if (!token) return next(new Error("No token"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [user] = await userRepository.getById(decoded.id);
    if (!user) return next(new Error("User not found"));

    socket.user = user;
    next();
  } catch (error) {
    next(new Error("Authentication failed"));
  }
};

module.exports = authenticateSocket;