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
  createUser: jest.fn(),
  insertMemberForUser: jest.fn(),
  findByCode: jest.fn(),
  verifyEmail: jest.fn(),
  deleteByEmail: jest.fn(),
}));
jest.mock("../../../src/repositories/domainRepository", () => ({
  findByDomainName: jest.fn(),
}));
jest.mock("bcrypt", () => ({
  hash: jest.fn(),
}));
jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: "test-mail" }),
  })),
}));

const authRoute = require("../../../src/routes/authRoute");
const authRepo = require("../../../src/repositories/authRepository");
const domainRepo = require("../../../src/repositories/domainRepository");
const bcrypt = require("bcrypt");

describe("Registration Integration Tests", () => {
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRoute);

  const testUser = {
    name: "Register Test User",
    email: `reg-${uuidv4()}@example.com`,
    password: "Password123!",
  };

  it("should register a new user successfully", async () => {
    domainRepo.findByDomainName.mockResolvedValueOnce(null);
    authRepo.findByEmail.mockResolvedValueOnce(null);
    bcrypt.hash.mockResolvedValueOnce("hashed");
    authRepo.createUser.mockResolvedValueOnce();
    authRepo.insertMemberForUser.mockResolvedValueOnce();
    const res = await request(app)
      .post("/api/auth/register")
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testUser.email);
    expect(authRepo.createUser).toHaveBeenCalledTimes(1);
  });

  it("should fail to register with an existing email", async () => {
    const tempUser = { name: "Temp User", email: `temp-${uuidv4()}@example.com`, password: "Password123!" };
    domainRepo.findByDomainName.mockResolvedValueOnce(null);
    authRepo.findByEmail.mockResolvedValueOnce({ id: "existing" });
    const res = await request(app)
      .post("/api/auth/register")
      .send(tempUser);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Email already exists");
    expect(authRepo.deleteByEmail).toHaveBeenCalledWith(tempUser.email);
  });

  it("should verify email successfully", async () => {
    authRepo.findByCode.mockResolvedValueOnce({ id: "u1" });
    authRepo.verifyEmail.mockResolvedValueOnce();
    const res = await request(app)
      .post("/api/auth/verify")
      .send({
        email: testUser.email,
        code: "123456",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Email verified");
    expect(authRepo.verifyEmail).toHaveBeenCalledWith(testUser.email);
  });
});
