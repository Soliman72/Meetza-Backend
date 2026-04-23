const authenticateSocket = require("../middleware/soketAuth");

let io;

const setSocket = (socketInstance) => {
  io = socketInstance;
};

const emitNotification = (notification) => {
  if (!io) return;
  io.to("member_" + notification.memberId).emit("new_notification", notification);
};

const emitUnreadCount = (memberId, count) => {
  if (!io) return;
  io.to("member_" + memberId).emit("notification_count_update", {
    unreadCount: count,
    memberId,
  });
};

const registerNotificationSocket = (io) => {
    io.use(authenticateSocket);
    io.on("connection", (socket) => {

        if (socket.user?.id) {
            const memberId = socket.user.id;
            socket.join("member_" + memberId);
        }

        socket.on("join_notifications", () => {
            if (socket.user?.id) {
                const memberId = socket.user.id;
                socket.join("member_" + memberId);
            } else {
                console.error("Unauthorized: User not authenticated");
            }
        });

        socket.on("disconnect", () => {
            console.log("Notification socket disconnected:", socket.id);
        });
    });
};

module.exports = {
  setSocket,
  emitNotification,
  emitUnreadCount,
  registerNotificationSocket,
};