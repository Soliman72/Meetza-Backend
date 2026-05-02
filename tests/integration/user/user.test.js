const express = require("express");
const request = require("supertest");

jest.mock("../../../src/middleware/verifyToken", () => ({
  verifyToken: (req, res, next) => {
    req.user = { id: "u1", role: "Super_Admin" };
    next();
  },
}));
jest.mock("../../../src/middleware/checkAdminPermission", () => ({
  checkAdminPermission: (req, res, next) => next(),
  requireSuperAdmin: (req, res, next) => next(),
}));
jest.mock("../../../src/controllers/userController", () => ({
  createUserBySuperAdmin: (req, res) => res.status(201).json({ ok: true }),
  getAllUsers: (req, res) => res.status(200).json({ ok: true, users: [] }),
  getUserById: (req, res) => res.status(200).json({ ok: true }),
  getUserByEmail: (req, res) => res.status(200).json({ ok: true }),
  updateUser: (req, res) => res.status(200).json({ ok: true }),
  deleteUser: (req, res) => res.status(200).json({ ok: true }),
}));

const userRoute = require("../../../src/routes/userRoute");

describe("user", () => {
  const app = express();
  app.use(express.json());
  app.use("/api/user", userRoute);

  test("GET /api/user returns 200", async () => {
    const res = await request(app).get("/api/user");
    expect(res.status).toBe(200);
  });
});
