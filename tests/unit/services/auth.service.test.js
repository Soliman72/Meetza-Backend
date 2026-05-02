jest.mock("../../../src/repositories/authRepository", () => ({
  findByEmail: jest.fn(),
  createUser: jest.fn(),
  insertMemberForUser: jest.fn(),
  findByCode: jest.fn(),
  verifyEmail: jest.fn(),
  setResetCode: jest.fn(),
  updatePassword: jest.fn(),
  deleteByEmail: jest.fn(),
}));
jest.mock("../../../src/repositories/domainRepository", () => ({
  findByDomainName: jest.fn().mockResolvedValue(null),
}));
jest.mock("bcrypt", () => ({
  hash: jest.fn().mockResolvedValue("hashed-password"),
  compare: jest.fn(),
}));
jest.mock("uuid", () => ({
  v4: jest.fn(() => "fixed-auth-id"),
}));
jest.mock("../../../src/utils/emailService", () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("../../../src/utils/loginAttempts", () => ({
  recordFailedAttempt: jest.fn(),
  clearAttempts: jest.fn(),
  requiresCaptcha: jest.fn().mockReturnValue(false),
  getAttemptsInfo: jest.fn(),
}));
jest.mock("../../../src/utils/jwtHelper", () => ({
  generateToken: jest.fn().mockReturnValue("mock-jwt-token"),
}));
jest.mock("../../../src/services/auth/authServiceSecurity", () => ({
  checkLoginSecurity: jest.fn().mockResolvedValue({ blocked: false }),
}));
jest.mock("../../../src/utils/authorization", () => ({
  isAdminAccess: jest.fn().mockReturnValue(false),
}));

const authService = require("../../../src/services/auth/authService");
const authRepo = require("../../../src/repositories/authRepository");
const bcrypt = require("bcrypt");
const { generateToken } = require("../../../src/utils/jwtHelper");
const { recordFailedAttempt, clearAttempts } = require("../../../src/utils/loginAttempts");
const { isAdminAccess } = require("../../../src/utils/authorization");
const authSecurity = require("../../../src/services/auth/authServiceSecurity");

describe("authService.register", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("creates member account for new email", async () => {
    authRepo.findByEmail.mockResolvedValue(null);
    authRepo.insertMemberForUser.mockResolvedValue({ id: "1" });

    const result = await authService.register({
      name: "Sara",
      email: "sara@example.com",
      password: "123456",
    });

    expect(authRepo.createUser).toHaveBeenCalled();
    expect(authRepo.insertMemberForUser).toHaveBeenCalledWith("fixed-auth-id");
    expect(result).toMatchObject({
      id: "fixed-auth-id",
      name: "Sara",
      email: "sara@example.com",
      role: "Member",
    });
  });

  test("throws when email already exists", async () => {
    authRepo.findByEmail.mockResolvedValue({ id: "existing" });

    await expect(
      authService.register({
        name: "Sara",
        email: "sara@example.com",
        password: "123456",
      })
    ).rejects.toThrow("Email already exists");
  });

  test("throws when missing required fields", async () => {
    await expect(
      authService.register({ email: "a@b.com", password: "123" })
    ).rejects.toThrow("Missing fields");
  });
});

describe("authService.login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authSecurity.checkLoginSecurity.mockResolvedValue({ blocked: false });
    isAdminAccess.mockReturnValue(false);
  });

  test("returns token for valid credentials", async () => {
    authRepo.findByEmail.mockResolvedValue({
      id: "u1",
      email: "sara@example.com",
      password: "hashed",
      email_verification: true,
      role: "Member",
    });
    bcrypt.compare.mockResolvedValue(true);

    const result = await authService.login({
      email: "sara@example.com",
      password: "123456",
    });

    expect(clearAttempts).toHaveBeenCalledWith("sara@example.com");
    expect(generateToken).toHaveBeenCalled();
    expect(result).toEqual({ token: "mock-jwt-token" });
  });

  test("throws for non-existent email", async () => {
    authRepo.findByEmail.mockResolvedValue(null);

    await expect(
      authService.login({ email: "no@user.com", password: "123456" })
    ).rejects.toThrow("Invalid email or password");
    expect(recordFailedAttempt).toHaveBeenCalledWith("no@user.com");
  });

  test("throws for wrong password", async () => {
    authRepo.findByEmail.mockResolvedValue({
      id: "u1",
      email: "sara@example.com",
      password: "hashed",
      email_verification: true,
      role: "Member",
    });
    bcrypt.compare.mockResolvedValue(false);

    await expect(
      authService.login({ email: "sara@example.com", password: "wrong" })
    ).rejects.toThrow("Invalid email or password");
    expect(recordFailedAttempt).toHaveBeenCalledWith("sara@example.com");
  });

  test("throws for unverified email", async () => {
    authRepo.findByEmail.mockResolvedValue({
      id: "u1",
      email: "sara@example.com",
      password: "hashed",
      email_verification: false,
      role: "Member",
    });

    await expect(
      authService.login({ email: "sara@example.com", password: "123456" })
    ).rejects.toThrow("Please verify your email");
  });

  test("throws for non-admin accessing dashboard", async () => {
    isAdminAccess.mockReturnValue(true);
    authRepo.findByEmail.mockResolvedValue({
      id: "u1",
      email: "member@example.com",
      password: "hashed",
      email_verification: true,
      role: "Member",
    });

    await expect(
      authService.login({
        email: "member@example.com",
        password: "123456",
        from: "dashboard",
      })
    ).rejects.toThrow("Access denied. Administrators only.");
  });

  test("returns blocked response when security check blocks", async () => {
    authSecurity.checkLoginSecurity.mockResolvedValue({
      blocked: true,
      requiresCaptcha: true,
      remaining: 0,
    });
    authRepo.findByEmail.mockResolvedValue({
      id: "u1",
      email: "sara@example.com",
      password: "hashed",
      email_verification: true,
      role: "Member",
    });

    const result = await authService.login({
      email: "sara@example.com",
      password: "123456",
    });

    expect(result.success).toBe(false);
    expect(result.blocked).toBe(true);
    expect(result.requiresCaptcha).toBe(true);
  });
});

describe("authService.verifyEmail", () => {
  beforeEach(() => jest.clearAllMocks());

  test("verifies email with valid code", async () => {
    authRepo.findByCode.mockResolvedValue({ id: "u1" });

    await authService.verifyEmail({ email: "a@b.com", code: 1234 });

    expect(authRepo.verifyEmail).toHaveBeenCalledWith("a@b.com");
  });

  test("throws for invalid code", async () => {
    authRepo.findByCode.mockResolvedValue(null);

    await expect(
      authService.verifyEmail({ email: "a@b.com", code: 9999 })
    ).rejects.toThrow("Invalid code");
  });

  test("throws when missing email or code", async () => {
    await expect(
      authService.verifyEmail({ email: "" })
    ).rejects.toThrow();
  });
});

describe("authService.forgotPassword", () => {
  beforeEach(() => jest.clearAllMocks());

  test("sends reset code for existing email", async () => {
    authRepo.findByEmail.mockResolvedValue({ id: "u1" });

    await authService.forgotPassword({ email: "a@b.com" });

    expect(authRepo.setResetCode).toHaveBeenCalled();
  });

  test("throws for non-existent email", async () => {
    authRepo.findByEmail.mockResolvedValue(null);

    await expect(
      authService.forgotPassword({ email: "noone@b.com" })
    ).rejects.toThrow("Email not found");
  });

  test("throws when email is missing", async () => {
    await expect(
      authService.forgotPassword({})
    ).rejects.toThrow();
  });
});

describe("authService.verifyCode", () => {
  beforeEach(() => jest.clearAllMocks());

  test("verifies a valid code", async () => {
    authRepo.findByCode.mockResolvedValue({ id: "u1" });

    await authService.verifyCode({ email: "a@b.com", code: 1234 });

    expect(authRepo.verifyEmail).toHaveBeenCalledWith("a@b.com");
  });

  test("throws for invalid code", async () => {
    authRepo.findByCode.mockResolvedValue(null);

    await expect(
      authService.verifyCode({ email: "a@b.com", code: 9999 })
    ).rejects.toThrow("Invalid code");
  });
});

describe("authService.resetPassword", () => {
  beforeEach(() => jest.clearAllMocks());

  test("resets password when verified", async () => {
    await authService.resetPassword({
      email: "a@b.com",
      new_password: "newPass123",
      is_verified: true,
    });

    expect(bcrypt.hash).toHaveBeenCalledWith("newPass123", 10);
    expect(authRepo.updatePassword).toHaveBeenCalledWith("a@b.com", "hashed-password");
  });

  test("throws when not verified", async () => {
    await expect(
      authService.resetPassword({
        email: "a@b.com",
        new_password: "newPass123",
        is_verified: false,
      })
    ).rejects.toThrow("Not verified");
  });

  test("throws when missing fields", async () => {
    await expect(
      authService.resetPassword({ email: "a@b.com" })
    ).rejects.toThrow();
  });
});

describe("authService.deleteUserByEmail", () => {
  beforeEach(() => jest.clearAllMocks());

  test("calls repo deleteByEmail", async () => {
    await authService.deleteUserByEmail("a@b.com");
    expect(authRepo.deleteByEmail).toHaveBeenCalledWith("a@b.com");
  });

  test("does nothing for null email", async () => {
    await authService.deleteUserByEmail(null);
    expect(authRepo.deleteByEmail).not.toHaveBeenCalled();
  });
});
