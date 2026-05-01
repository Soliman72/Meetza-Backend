const express = require("express");
const request = require("supertest");

jest.mock("../../../src/middleware/verifyToken", () => ({
  verifyToken: (req, res, next) => next(),
}));
jest.mock("../../../src/middleware/checkAdminPermission", () => ({
  checkAdminPermission: (req, res, next) => next(),
}));
jest.mock("../../../src/middleware/uploadMiddleware", () => {
  const middleware = (req, res, next) => next();
  middleware.summarizeVideoUpload = (req, res, next) => next();
  return middleware;
});
jest.mock("../../../src/routes/videoWatchProgressRoute", () => {
  const router = require("express").Router();
  return router;
});
jest.mock("../../../src/controllers/videoController", () => ({
  createVideo: (req, res) => res.status(201).json({ ok: true }),
  summarizeVideo: (req, res) => res.status(200).json({ ok: true }),
  getRelatedVideos: (req, res) => res.status(200).json({ ok: true }),
  getVideoById: (req, res) => res.status(200).json({ ok: true }),
  getAllVideos: (req, res) => res.status(200).json({ ok: true }),
  updateVideo: (req, res) => res.status(200).json({ ok: true }),
  deleteVideo: (req, res) => res.status(200).json({ ok: true }),
}));

const videoRoute = require("../../../src/routes/videoRoute");

describe("video routes", () => {
  const app = express();
  app.use(express.json());
  app.use("/api/video", videoRoute);

  test("GET /api/video returns 200", async () => {
    const res = await request(app).get("/api/video");
    expect(res.status).toBe(200);
  });
});
