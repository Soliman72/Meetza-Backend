jest.mock("../../../src/repositories/authRepository", () => ({
  findByEmail: jest.fn(),
  createUser: jest.fn(),
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

const authService = require("../../../src/services/auth/authService");
const authRepo = require("../../../src/repositories/authRepository");

describe("authService.register", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("creates member account for new email", async () => {
    authRepo.findByEmail.mockResolvedValue(null);

    const result = await authService.register({
      name: "Sara",
      email: "sara@example.com",
      password: "123456",
    });

    expect(authRepo.createUser).toHaveBeenCalled();
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
});
