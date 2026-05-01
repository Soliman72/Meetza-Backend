const express = require("express");
const request = require("supertest");

jest.mock("../../../src/middleware/verifyToken", () => ({
  verifyToken: (req, res, next) => next(),
}));
jest.mock("../../../src/controllers/notificatioController", () => ({
  getMemberNotifications: (req, res) => res.status(200).json({ ok: true }),
  getUnreadCount: (req, res) => res.status(200).json({ ok: true }),
  markAsRead: (req, res) => res.status(200).json({ ok: true }),
  markAllAsRead: (req, res) => res.status(200).json({ ok: true }),
  deleteNotification: (req, res) => res.status(200).json({ ok: true }),
}));

const notificationRoute = require("../../../src/routes/notificationRoute");

describe("notification routes", () => {
  const app = express();
  app.use(express.json());
  app.use("/api/notification", notificationRoute);

  test("GET /api/notification returns 200", async () => {
    const res = await request(app).get("/api/notification");
    expect(res.status).toBe(200);
  });
});
