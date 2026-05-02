const { checkAdmin } = require("../../../src/middleware/checkAdmin");

describe("checkAdmin middleware", () => {
  test("calls next when user role is Administrator", () => {
    const req = {
      user: { id: 1, role: "Administrator" },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    checkAdmin(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test("returns 403 when user is missing or not an admin", () => {
    const req = { user: { id: 1, role: "User" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    checkAdmin(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Access denied. Admins only.",
    });
  });

  test("returns 401 if middleware throws unexpectedly", () => {
    const req = {};
    Object.defineProperty(req, "user", {
      get() {
        throw new Error("boom");
      },
    });

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    checkAdmin(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid token",
      error: "boom",
    });
  });
});
