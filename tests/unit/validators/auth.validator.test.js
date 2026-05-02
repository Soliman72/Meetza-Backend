const authValidator = require("../../../src/validators/authValidator");

describe("authValidator", () => {
  describe("validateRegister", () => {
    test("passes for valid data", () => {
      expect(() =>
        authValidator.validateRegister({ name: "Ali", email: "a@b.com", password: "123456" })
      ).not.toThrow();
    });

    test("throws when name is missing", () => {
      expect(() =>
        authValidator.validateRegister({ email: "a@b.com", password: "123" })
      ).toThrow("Missing fields");
    });

    test("throws when email is missing", () => {
      expect(() =>
        authValidator.validateRegister({ name: "Ali", password: "123" })
      ).toThrow("Missing fields");
    });

    test("throws when password is missing", () => {
      expect(() =>
        authValidator.validateRegister({ name: "Ali", email: "a@b.com" })
      ).toThrow("Missing fields");
    });
  });

  describe("validateLogin", () => {
    test("throws when missing fields", () => {
      expect(() => authValidator.validateLogin({ email: "" })).toThrow(
        "Email & password are required"
      );
    });

    test("passes for valid data", () => {
      expect(() =>
        authValidator.validateLogin({ email: "a@b.com", password: "123" })
      ).not.toThrow();
    });
  });

  describe("validateVerifyEmail", () => {
    test("throws when missing email", () => {
      expect(() => authValidator.validateVerifyEmail({ code: 1234 })).toThrow();
    });

    test("throws when missing code", () => {
      expect(() => authValidator.validateVerifyEmail({ email: "a@b.com" })).toThrow();
    });

    test("passes for valid data", () => {
      expect(() =>
        authValidator.validateVerifyEmail({ email: "a@b.com", code: 1234 })
      ).not.toThrow();
    });
  });

  describe("validateForgotPassword", () => {
    test("throws when email is missing", () => {
      expect(() => authValidator.validateForgotPassword({})).toThrow("Email is required");
    });

    test("passes for valid email", () => {
      expect(() =>
        authValidator.validateForgotPassword({ email: "a@b.com" })
      ).not.toThrow();
    });
  });

  describe("validateResetPassword", () => {
    test("throws when fields missing", () => {
      expect(() =>
        authValidator.validateResetPassword({ email: "a@b.com" })
      ).toThrow();
    });

    test("throws when not verified", () => {
      expect(() =>
        authValidator.validateResetPassword({
          email: "a@b.com",
          new_password: "abc",
          is_verified: false,
        })
      ).toThrow("Not verified");
    });

    test("passes for valid data", () => {
      expect(() =>
        authValidator.validateResetPassword({
          email: "a@b.com",
          new_password: "abc",
          is_verified: true,
        })
      ).not.toThrow();
    });
  });

  describe("parseSocialAuthQuery", () => {
    test("returns defaults", () => {
      expect(authValidator.parseSocialAuthQuery({})).toEqual({
        redirect: "http://localhost:3000/home",
        type: "signin",
      });
    });

    test("accepts signup type", () => {
      const result = authValidator.parseSocialAuthQuery({ type: "signup" });
      expect(result.type).toBe("signup");
    });

    test("throws for invalid type", () => {
      expect(() =>
        authValidator.parseSocialAuthQuery({ type: "hack" })
      ).toThrow("Invalid type specified");
    });

    test("throws for invalid redirect URL", () => {
      expect(() =>
        authValidator.parseSocialAuthQuery({ redirect: "not-a-url" })
      ).toThrow("Invalid redirect URL format");
    });

    test("accepts valid redirect URL", () => {
      const result = authValidator.parseSocialAuthQuery({
        redirect: "https://example.com/callback",
      });
      expect(result.redirect).toBe("https://example.com/callback");
    });
  });
});
