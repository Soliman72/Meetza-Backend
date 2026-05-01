const sendError = require("../../../src/utils/sendError");

describe("sendError", () => {
  test("uses provided 4xx status and omits error details", () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const err = { status: 400, message: "Bad request", details: "x" };

    sendError(res, err);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Bad request",
    });
  });

  test("falls back to 500 for invalid status and includes details", () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const err = { status: 700, message: "Oops", details: "stack-like" };

    sendError(res, err);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Oops",
      error: "stack-like",
    });
  });

  test("uses default message when error message is missing", () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const err = { status: 503 };

    sendError(res, err);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Server error",
      error: undefined,
    });
  });
});
