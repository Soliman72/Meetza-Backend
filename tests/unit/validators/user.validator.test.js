const userValidator = require("../../../src/validators/userValidator");

describe("userValidator.validateCreateUserBody", () => {
  test("accepts valid payload", () => {
    expect(() =>
      userValidator.validateCreateUserBody({
        name: "Valid User",
        email: "valid@example.com",
        password: "123456",
        role: "Member",
      })
    ).not.toThrow();
  });

  test("rejects invalid role", () => {
    expect(() =>
      userValidator.validateCreateUserBody({
        name: "Valid User",
        email: "valid@example.com",
        password: "123456",
        role: "Hacker",
      })
    ).toThrow("Invalid role");
  });
});
