const express = require("express");
const request = require("supertest");

jest.mock("../../../src/middleware/verifyToken", () => ({
  verifyToken: (req, res, next) => next(),
}));
jest.mock("../../../src/controllers/chatController", () => ({
  getMyGroups: (req, res) => res.status(200).json({ ok: true }),
  getUnreadGroups: (req, res) => res.status(200).json({ ok: true }),
  getGroupMessages: (req, res) => res.status(200).json({ ok: true }),
  sendMessage: (req, res) => res.status(201).json({ ok: true }),
  getGroupInfo: (req, res) => res.status(200).json({ ok: true }),
  deleteMessage: (req, res) => res.status(200).json({ ok: true }),
  updateMessage: (req, res) => res.status(200).json({ ok: true }),
  markMessageAsRead: (req, res) => res.status(200).json({ ok: true }),
  markMessageAsUnread: (req, res) => res.status(200).json({ ok: true }),
  markAllMessagesAsRead: (req, res) => res.status(200).json({ ok: true }),
  getReadMessages: (req, res) => res.status(200).json({ ok: true }),
  getUnreadMessages: (req, res) => res.status(200).json({ ok: true }),
  getUnreadCount: (req, res) => res.status(200).json({ ok: true }),
  toggleReaction: (req, res) => res.status(200).json({ ok: true }),
  getGroupMeetings: (req, res) => res.status(200).json({ ok: true }),
}));

const chatRoute = require("../../../src/routes/chatRoute");

describe("chat routes", () => {
  const app = express();
  app.use(express.json());
  app.use("/api/chat", chatRoute);

  test("GET /api/chat/groups returns 200", async () => {
    const res = await request(app).get("/api/chat/groups");
    expect(res.status).toBe(200);
  });

  test("GET /api/chat/groups/unread returns 200", async () => {
    const res = await request(app).get("/api/chat/groups/unread");
    expect(res.status).toBe(200);
  });

  test("GET /api/chat/groups/:groupId/messages returns 200", async () => {
    const res = await request(app).get("/api/chat/groups/g1/messages");
    expect(res.status).toBe(200);
  });

  test("POST /api/chat/groups/:groupId/messages returns 201", async () => {
    const res = await request(app).post("/api/chat/groups/g1/messages").send({ text: "hi" });
    expect(res.status).toBe(201);
  });

  test("GET /api/chat/groups/:groupId/info returns 200", async () => {
    const res = await request(app).get("/api/chat/groups/g1/info");
    expect(res.status).toBe(200);
  });

  test("DELETE /api/chat/groups/:groupId/messages/:messageId returns 200", async () => {
    const res = await request(app).delete("/api/chat/groups/g1/messages/m1");
    expect(res.status).toBe(200);
  });

  test("GET /api/chat/groups/:groupId/unread-count returns 200", async () => {
    const res = await request(app).get("/api/chat/groups/g1/unread-count");
    expect(res.status).toBe(200);
  });

  test("GET /api/chat/groups/:groupId/meetings returns 200", async () => {
    const res = await request(app).get("/api/chat/groups/g1/meetings");
    expect(res.status).toBe(200);
  });
});
