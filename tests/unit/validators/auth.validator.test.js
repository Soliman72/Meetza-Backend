const authValidator = require("../../../src/validators/authValidator");

describe("authValidator", () => {
  test("validateLogin throws when missing fields", () => {
    expect(() => authValidator.validateLogin({ email: "" })).toThrow(
      "Email & password are required"
    );
  });

  test("parseSocialAuthQuery returns defaults", () => {
    expect(authValidator.parseSocialAuthQuery({})).toEqual({
      redirect: "http://localhost:3000/home",
      type: "signin",
    });
  });
});
