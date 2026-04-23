let ioInstance = null;

function registerChatIo(io) {
  ioInstance = io;
}

function broadcastMessage(message) {
  if (!ioInstance || !message) return;
  ioInstance.to(`group:${message.group_id}`).emit("message", message);
}

function getChatIo() {
  return ioInstance;
}

module.exports = {
  registerChatIo,
  broadcastMessage,
  getChatIo,
};
