const express = require("express");
const request = require("supertest");

jest.mock("../../../src/middleware/verifyToken", () => ({
  verifyToken: (req, res, next) => next(),
}));
jest.mock("../../../src/middleware/checkAdminPermission", () => ({
  checkAdminPermission: (req, res, next) => next(),
}));
jest.mock("../../../src/middleware/uploadMiddleware", () => (req, res, next) => next());
jest.mock("../../../src/controllers/meetingController", () => ({
  getAllMeetings: (req, res) => res.status(200).json({ ok: true }),
  createMeeting: (req, res) => res.status(201).json({ ok: true }),
  deactivateMeetingRecurrence: (req, res) => res.status(200).json({ ok: true }),
  activateMeetingRecurrence: (req, res) => res.status(200).json({ ok: true }),
  getMeetingById: (req, res) => res.status(200).json({ ok: true }),
  updateMeetingById: (req, res) => res.status(200).json({ ok: true }),
  deleteMeetingById: (req, res) => res.status(200).json({ ok: true }),
  joinMeeting: (req, res) => res.status(200).json({ ok: true }),
  leaveMeeting: (req, res) => res.status(200).json({ ok: true }),
  getMeetingParticipants: (req, res) => res.status(200).json({ ok: true }),
}));

const meetingRoute = require("../../../src/routes/meetingRoute");

describe("meeting routes", () => {
  const app = express();
  app.use(express.json());
  app.use("/api/meeting", meetingRoute);

  test("GET /api/meeting returns 200", async () => {
    const res = await request(app).get("/api/meeting");
    expect(res.status).toBe(200);
  });

  test("POST /api/meeting returns 201", async () => {
    const res = await request(app).post("/api/meeting").send({});
    expect(res.status).toBe(201);
  });

  test("GET /api/meeting/:id returns 200", async () => {
    const res = await request(app).get("/api/meeting/123");
    expect(res.status).toBe(200);
  });

  test("PUT /api/meeting/:id returns 200", async () => {
    const res = await request(app).put("/api/meeting/123").send({});
    expect(res.status).toBe(200);
  });

  test("DELETE /api/meeting/:id returns 200", async () => {
    const res = await request(app).delete("/api/meeting/123");
    expect(res.status).toBe(200);
  });

  test("POST /api/meeting/:id/join returns 200", async () => {
    const res = await request(app).post("/api/meeting/123/join");
    expect(res.status).toBe(200);
  });

  test("POST /api/meeting/:id/leave returns 200", async () => {
    const res = await request(app).post("/api/meeting/123/leave");
    expect(res.status).toBe(200);
  });

  test("GET /api/meeting/:id/participants returns 200", async () => {
    const res = await request(app).get("/api/meeting/123/participants");
    expect(res.status).toBe(200);
  });
});
