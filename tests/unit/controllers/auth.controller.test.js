jest.mock("passport");
jest.mock("../../../src/services/auth/authService");
jest.mock("../../../src/services/authOAuthService");
jest.mock("../../../src/validators/authValidator");

const authController = require("../../../src/controllers/authController");
const authService = require("../../../src/services/auth/authService");
const authOAuthService = require("../../../src/services/authOAuthService");
const authValidator = require("../../../src/validators/authValidator");
const passport = require("passport");

describe("authController", () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { body: {}, query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  describe("register", () => {
    test("returns 201 on success", async () => {
      authService.register.mockResolvedValue({ user: "u1" });
      await authController.register(req, res);
      
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: { user: "u1" } }));
    });

    test("returns 400 and deletes user on failure", async () => {
      req.body.email = "test@test.com";
      authService.register.mockRejectedValue(new Error("Registration failed"));
      
      await authController.register(req, res);

      expect(authService.deleteUserByEmail).toHaveBeenCalledWith("test@test.com");
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: "Registration failed" }));
    });
  });

  describe("login", () => {
    test("returns 200 on success", async () => {
      authService.login.mockResolvedValue({ token: "abc" });
      await authController.login(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { token: "abc" } }));
    });

    test("returns 400 on failure", async () => {
      authService.login.mockRejectedValue(new Error("Login failed"));
      await authController.login(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("verifyEmail", () => {
    test("returns 200 on success", async () => {
      await authController.verifyEmail(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
    test("returns 400 on failure", async () => {
      authService.verifyEmail.mockRejectedValue(new Error("fail"));
      await authController.verifyEmail(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("forgotPassword", () => {
    test("returns 200 on success", async () => {
      await authController.forgotPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
    test("returns 400 on failure", async () => {
      authService.forgotPassword.mockRejectedValue(new Error("fail"));
      await authController.forgotPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("verifyCode", () => {
    test("returns 200 on success", async () => {
      await authController.verifyCode(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
    test("returns 400 on failure", async () => {
      authService.verifyCode.mockRejectedValue(new Error("fail"));
      await authController.verifyCode(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("resetPassword", () => {
    test("returns 200 on success", async () => {
      await authController.resetPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
    test("returns 400 on failure", async () => {
      authService.resetPassword.mockRejectedValue(new Error("fail"));
      await authController.resetPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("socialAuth", () => {
    test("calls passport authenticate", () => {
      authValidator.parseSocialAuthQuery.mockReturnValue({ role: "Member", redirect: "url", type: "login" });
      const mockAuth = jest.fn();
      passport.authenticate.mockReturnValue(mockAuth);

      authController.socialAuth(req, res, next);
      
      expect(passport.authenticate).toHaveBeenCalledWith("google", expect.any(Object));
      expect(mockAuth).toHaveBeenCalledWith(req, res, next);
    });

    test("returns 400 if validation fails", () => {
      authValidator.parseSocialAuthQuery.mockImplementation(() => { throw new Error("Invalid query"); });
      authController.socialAuth(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("socialAuthCallback", () => {
    test("calls passport authenticate callback", () => {
      passport.authenticate.mockImplementation((strategy, options, callback) => {
        return (req, res, next) => {
          callback(null, { id: "p1" }, {});
        };
      });

      authController.socialAuthCallback(req, res, next);
      
      expect(passport.authenticate).toHaveBeenCalled();
      expect(authOAuthService.handleGoogleOAuthCallback).toHaveBeenCalledWith(null, { id: "p1" }, {}, req, res);
    });
  });
});
