const express = require("express");
const request = require("supertest");
const { v4: uuidv4 } = require("uuid");

jest.mock("../../../src/config/db", () => ({
  promise: jest.fn(() => ({ execute: jest.fn(), getConnection: jest.fn() })),
  getConnection: jest.fn(),
  on: jest.fn(),
}));

jest.mock("../../../src/repositories/authRepository", () => ({
  findByEmail: jest.fn(),
  findByCode: jest.fn(),
  setResetCode: jest.fn(),
  verifyEmail: jest.fn(),
  updatePassword: jest.fn(),
}));
jest.mock("../../../src/repositories/domainRepository", () => ({
  findByDomainName: jest.fn(),
}));
jest.mock("bcrypt", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));
jest.mock("../../../src/utils/emailService", () => ({
  sendVerificationEmail: jest.fn(),
}));
jest.mock("../../../src/utils/loginAttempts", () => ({
  recordFailedAttempt: jest.fn(),
  clearAttempts: jest.fn(),
}));
jest.mock("../../../src/utils/jwtHelper", () => ({
  generateToken: jest.fn(() => "jwt-token"),
}));
jest.mock("../../../src/services/auth/authServiceSecurity", () => ({
  checkLoginSecurity: jest.fn(),
}));

const authRoute = require("../../../src/routes/authRoute");
const authRepo = require("../../../src/repositories/authRepository");
const domainRepo = require("../../../src/repositories/domainRepository");
const bcrypt = require("bcrypt");
const { sendVerificationEmail } = require("../../../src/utils/emailService");
const authSecurity = require("../../../src/services/auth/authServiceSecurity");

describe("Login Integration Tests", () => {
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRoute);

  const testUser = {
    id: uuidv4(),
    name: "Login Test User",
    email: `login-${uuidv4()}@example.com`,
    password: "Password123!",
  };

  it("should login successfully with correct credentials", async () => {
    domainRepo.findByDomainName.mockResolvedValueOnce(null);
    authRepo.findByEmail.mockResolvedValueOnce({
      id: "u1",
      email: testUser.email,
      password: "hashed",
      email_verification: true,
      role: "Member",
    });
    authSecurity.checkLoginSecurity.mockResolvedValueOnce({ blocked: false });
    bcrypt.compare.mockResolvedValueOnce(true);
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: testUser.email,
        password: testUser.password,
        role: "Member"
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("token");
    expect(authRepo.findByEmail).toHaveBeenCalledTimes(1);
  });

  it("should fail with wrong password", async () => {
    domainRepo.findByDomainName.mockResolvedValueOnce(null);
    authRepo.findByEmail.mockResolvedValueOnce({
      id: "u1",
      email: testUser.email,
      password: "hashed",
      email_verification: true,
      role: "Member",
    });
    authSecurity.checkLoginSecurity.mockResolvedValueOnce({ blocked: false });
    bcrypt.compare.mockResolvedValueOnce(false);
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: testUser.email,
        password: "WrongPassword",
        role: "Member"
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid email or password");
  });

  describe("Password Reset Flow", () => {
    it("should request reset successfully", async () => {
      authRepo.findByEmail.mockResolvedValueOnce({ id: "u1", email: testUser.email });
      authRepo.setResetCode.mockResolvedValueOnce();
      sendVerificationEmail.mockResolvedValueOnce();
      const res = await request(app)
        .post("/api/auth/forgot_password")
        .send({ email: testUser.email });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Check your email");
    });

    it("should verify reset code", async () => {
      authRepo.findByCode.mockResolvedValueOnce({ id: "u1" });
      authRepo.verifyEmail.mockResolvedValueOnce();
      const res = await request(app)
        .post("/api/auth/verify_code")
        .send({
          email: testUser.email,
          code: "123456",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Code verified");
    });

    it("should reset password", async () => {
      const newPassword = "NewPassword123!";
      bcrypt.hash.mockResolvedValueOnce("new-hashed");
      authRepo.updatePassword.mockResolvedValueOnce();
      const res = await request(app)
        .post("/api/auth/reset_password")
        .send({
          email: testUser.email,
          new_password: newPassword,
          is_verified: true
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Password updated");
    });
  });
});
