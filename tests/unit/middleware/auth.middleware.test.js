const jwt = require("jsonwebtoken");

jest.mock("../../../src/utils/authJwtUser", () => ({
  getBearerTokenFromRequest: jest.fn(),
  loadUserFromAccessToken: jest.fn(),
}));

const {
  getBearerTokenFromRequest,
  loadUserFromAccessToken,
} = require("../../../src/utils/authJwtUser");
const { verifyToken } = require("../../../src/middleware/verifyToken");

describe("verifyToken middleware", () => {
  test("returns 401 when token is missing", async () => {
    getBearerTokenFromRequest.mockReturnValue(null);

    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("attaches user and calls next for valid token", async () => {
    getBearerTokenFromRequest.mockReturnValue("token");
    loadUserFromAccessToken.mockResolvedValue({ id: "u1" });

    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await verifyToken(req, res, next);

    expect(req.user).toEqual({ id: "u1" });
    expect(next).toHaveBeenCalled();
  });

  test("returns token expired error payload", async () => {
    getBearerTokenFromRequest.mockReturnValue("token");
    loadUserFromAccessToken.mockRejectedValue(new jwt.TokenExpiredError("jwt expired", new Date()));

    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("returns invalid token payload for JsonWebTokenError", async () => {
    getBearerTokenFromRequest.mockReturnValue("token");
    loadUserFromAccessToken.mockRejectedValue(
      new jwt.JsonWebTokenError("jwt malformed")
    );

    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid token",
      code: "INVALID_TOKEN",
      error: "jwt malformed",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("uses custom error status when authentication helper throws normal error", async () => {
    getBearerTokenFromRequest.mockReturnValue("token");
    const err = new Error("User not found");
    err.status = 404;
    loadUserFromAccessToken.mockRejectedValue(err);

    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "User not found",
      code: "AUTH_ERROR",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("uses default auth error response when status/message are missing", async () => {
    getBearerTokenFromRequest.mockReturnValue("token");
    loadUserFromAccessToken.mockRejectedValue({});

    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Authentication failed",
      code: "AUTH_ERROR",
    });
    expect(next).not.toHaveBeenCalled();
  });
});
