const express = require("express");
const request = require("supertest");

jest.mock("../../../src/middleware/verifyToken", () => ({
  verifyToken: (req, res, next) => next(),
}));
jest.mock("../../../src/controllers/notificatioController", () => ({
  getMemberNotifications: (req, res) => res.status(200).json({ ok: true }),
  getUnreadCount: (req, res) => res.status(200).json({ ok: true, count: 5 }),
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

  test("GET /api/notification/unread-count returns 200", async () => {
    const res = await request(app).get("/api/notification/unread-count");
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(5);
  });

  test("PUT /api/notification/:id/mark-as-read returns 200", async () => {
    const res = await request(app).put("/api/notification/n1/mark-as-read");
    expect(res.status).toBe(200);
  });

  test("PUT /api/notification/mark-all-as-read returns 200", async () => {
    const res = await request(app).put("/api/notification/mark-all-as-read");
    expect(res.status).toBe(200);
  });

  test("DELETE /api/notification/:id returns 200", async () => {
    const res = await request(app).delete("/api/notification/n1");
    expect(res.status).toBe(200);
  });
});
