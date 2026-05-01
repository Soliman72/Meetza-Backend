const express = require("express");
const request = require("supertest");

jest.mock("../../../src/controllers/authController", () => ({
  register: (req, res) => res.status(201).json({ ok: true, route: "register" }),
  verifyEmail: (req, res) => res.status(200).json({ ok: true, route: "verify" }),
  forgotPassword: (req, res) => res.status(200).json({ ok: true, route: "forgot" }),
  verifyCode: (req, res) => res.status(200).json({ ok: true, route: "verify_code" }),
  resetPassword: (req, res) => res.status(200).json({ ok: true, route: "reset" }),
  login: (req, res) => res.status(200).json({ ok: true, route: "login" }),
  socialAuth: (req, res) => res.status(200).json({ ok: true, route: "social" }),
  socialAuthCallback: (req, res) => res.status(200).json({ ok: true, route: "social_callback" }),
}));

const authRoute = require("../../../src/routes/authRoute");

describe("auth routes", () => {
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRoute);

  test("POST /api/auth/login", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "123456",
    });

    expect(res.status).toBe(200);
    expect(res.body.route).toBe("login");
  });

  test("POST /api/auth/register returns 201", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Sara",
      email: "sara@example.com",
      password: "123456",
    });

    expect(res.status).toBe(201);
    expect(res.body.route).toBe("register");
  });

  test("POST /api/auth/verify returns 200", async () => {
    const res = await request(app).post("/api/auth/verify").send({
      email: "test@example.com",
      code: 1234,
    });

    expect(res.status).toBe(200);
    expect(res.body.route).toBe("verify");
  });

  test("POST /api/auth/forgot_password returns 200", async () => {
    const res = await request(app).post("/api/auth/forgot_password").send({
      email: "test@example.com",
    });

    expect(res.status).toBe(200);
    expect(res.body.route).toBe("forgot");
  });

  test("POST /api/auth/verify_code returns 200", async () => {
    const res = await request(app).post("/api/auth/verify_code").send({
      email: "test@example.com",
      code: 1234,
    });

    expect(res.status).toBe(200);
    expect(res.body.route).toBe("verify_code");
  });

  test("POST /api/auth/reset_password returns 200", async () => {
    const res = await request(app).post("/api/auth/reset_password").send({
      email: "test@example.com",
      new_password: "newpass",
      is_verified: true,
    });

    expect(res.status).toBe(200);
    expect(res.body.route).toBe("reset");
  });
});
