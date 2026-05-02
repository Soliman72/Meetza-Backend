const express = require("express");
const request = require("supertest");

jest.mock("../../../src/config/db", () => ({
  promise: jest.fn(() => ({ execute: jest.fn(), getConnection: jest.fn() })),
  getConnection: jest.fn(),
  on: jest.fn(),
}));

jest.mock("../../../src/middleware/verifyToken", () => ({
  verifyToken: (req, res, next) => {
    req.user = { id: "u1" };
    next();
  },
}));

jest.mock("../../../src/repositories/notificationRepository", () => ({
  getByMemberId: jest.fn(),
  countUnread: jest.fn(),
  markAsRead: jest.fn(),
  markAllAsRead: jest.fn(),
  remove: jest.fn(),
}));
jest.mock("../../../src/repositories/notificationPendingGroupActionRepository", () => ({
  create: jest.fn(),
  updateStatus: jest.fn(),
  findRecipientsByPendingGroupId: jest.fn(),
}));
jest.mock("../../../src/repositories/userRepository", () => ({
  findById: jest.fn(),
  getEmailById: jest.fn(),
}));
jest.mock("../../../src/sockets/notificationSocket", () => ({
  emitNotification: jest.fn(),
  emitUnreadCount: jest.fn(),
  emitPendingGroupNotificationStatus: jest.fn(),
}));

jest.mock("../../../src/validators/notificationValidator", () => ({
  createNotificationValidator: jest.fn(),
  validateNotificationIdParam: jest.fn(),
}));

const notificationRoute = require("../../../src/routes/notificationRoute");
const notificationRepo = require("../../../src/repositories/notificationRepository");

describe("notification", () => {
  const app = express();
  app.use(express.json());
  app.use("/api/notification", notificationRoute);

  beforeEach(() => {
    jest.clearAllMocks();
    notificationRepo.getByMemberId.mockResolvedValue([{ id: "n1" }]);
    notificationRepo.countUnread.mockResolvedValue(2);
    notificationRepo.markAsRead.mockResolvedValue(true);
    notificationRepo.markAllAsRead.mockResolvedValue();
    notificationRepo.remove.mockResolvedValue(true);
  });

  test("GET /api/notification returns 200", async () => {
    const res = await request(app).get("/api/notification");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.notifications[0].id).toBe("n1");
    expect(notificationRepo.getByMemberId).toHaveBeenCalledWith("u1");
  });

  test("GET /api/notification/unread-count returns 200", async () => {
    const res = await request(app).get("/api/notification/unread-count");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.unreadCount).toBe(2);
    expect(notificationRepo.countUnread).toHaveBeenCalledWith("u1");
  });

  test("PUT /api/notification/:id/mark-as-read returns 200", async () => {
    const res = await request(app).put("/api/notification/n1/mark-as-read");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(notificationRepo.markAsRead).toHaveBeenCalledWith("n1", "u1");
  });

  test("PUT /api/notification/:id/mark-as-read returns 404 when not found", async () => {
    notificationRepo.markAsRead.mockResolvedValueOnce(false);
    const res = await request(app).put("/api/notification/n404/mark-as-read");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test("PUT /api/notification/mark-all-as-read returns 200", async () => {
    const res = await request(app).put("/api/notification/mark-all-as-read");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(notificationRepo.markAllAsRead).toHaveBeenCalledWith("u1");
  });

  test("DELETE /api/notification/:id returns 200", async () => {
    const res = await request(app).delete("/api/notification/n1");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(notificationRepo.remove).toHaveBeenCalledWith("n1", "u1");
  });

  test("DELETE /api/notification/:id returns 404 when not found", async () => {
    notificationRepo.remove.mockResolvedValueOnce(false);
    const res = await request(app).delete("/api/notification/n404");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
