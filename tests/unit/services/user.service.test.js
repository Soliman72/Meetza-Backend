jest.mock("../../../src/repositories/userRepository", () => ({
  findByEmail: jest.fn(),
  create: jest.fn(),
}));
jest.mock("bcrypt", () => ({
  hash: jest.fn().mockResolvedValue("hashed-password"),
}));
jest.mock("uuid", () => ({
  v4: jest.fn(() => "fixed-user-id"),
}));

const userService = require("../../../src/services/userService");
const userRepo = require("../../../src/repositories/userRepository");

describe("userService.createUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("creates a user with hashed password", async () => {
    userRepo.findByEmail.mockResolvedValue(null);

    const result = await userService.createUser({
      body: {
        name: "Ali",
        email: "ali@example.com",
        password: "123456",
        role: "Member",
        verification_code: 1234,
        email_verification: false,
      },
    });

    expect(userRepo.create).toHaveBeenCalled();
    expect(result).toEqual({
      id: "fixed-user-id",
      name: "Ali",
      email: "ali@example.com",
      role: "Member",
    });
  });

  test("throws when email already exists", async () => {
    userRepo.findByEmail.mockResolvedValue({ id: "existing" });

    await expect(
      userService.createUser({
        body: {
          name: "Ali",
          email: "ali@example.com",
          password: "123456",
          role: "Member",
        },
      })
    ).rejects.toThrow("User already exists");
  });
});
