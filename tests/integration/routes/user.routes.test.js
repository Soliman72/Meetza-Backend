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
jest.mock("../../../src/middleware/uploadMiddleware", () => (req, res, next) => next());
jest.mock("../../../src/controllers/userController", () => ({
  createUserBySuperAdmin: (req, res) => res.status(201).json({ ok: true }),
  getAllUsers: (req, res) => res.status(200).json({ ok: true, users: [] }),
  getUserById: (req, res) => res.status(200).json({ ok: true, id: req.params.id }),
  getUserByEmail: (req, res) => res.status(200).json({ ok: true, email: req.params.email }),
  updateUser: (req, res) => res.status(200).json({ ok: true }),
  deleteUser: (req, res) => res.status(200).json({ ok: true }),
}));

const userRoute = require("../../../src/routes/userRoute");

describe("user routes", () => {
  const app = express();
  app.use(express.json());
  app.use("/api/user", userRoute);

  test("GET /api/user returns 200", async () => {
    const res = await request(app).get("/api/user");
    expect(res.status).toBe(200);
  });

  test("POST /api/user returns 201", async () => {
    const res = await request(app).post("/api/user").send({
      name: "Ali",
      email: "ali@example.com",
      password: "123456",
      role: "Member",
    });
    expect(res.status).toBe(201);
  });

  test("GET /api/user/:id returns 200", async () => {
    const res = await request(app).get("/api/user/u1");
    expect(res.status).toBe(200);
    expect(res.body.id).toBe("u1");
  });

  test("GET /api/user/email/:email returns 200", async () => {
    const res = await request(app).get("/api/user/email/ali@example.com");
    expect(res.status).toBe(200);
    expect(res.body.email).toBe("ali@example.com");
  });

  test("PATCH /api/user/:id returns 200", async () => {
    const res = await request(app).patch("/api/user/u1").send({ name: "Updated" });
    expect(res.status).toBe(200);
  });

  test("DELETE /api/user/:id returns 200", async () => {
    const res = await request(app).delete("/api/user/u1");
    expect(res.status).toBe(200);
  });
});
