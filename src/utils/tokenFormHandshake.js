const getTokenFromHandshake = (socket) => {
  const authToken =
    socket.handshake.auth?.token ||
    socket.handshake.query?.token ||
    socket.handshake.headers?.authorization;

  if (!authToken) return null;
  if (authToken.startsWith("Bearer ")) {
    return authToken.split(" ")[1];
  }
  return authToken;
};

module.exports = getTokenFromHandshake;