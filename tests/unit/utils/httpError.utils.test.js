const httpError = require("../../../src/utils/httpError");

describe("httpError", () => {
  test("creates an Error with correct message", () => {
    const err = httpError(400, "Bad request");
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("Bad request");
  });

  test("attaches status to the error", () => {
    const err = httpError(404, "Not found");
    expect(err.status).toBe(404);
  });

  test("works with 500 status", () => {
    const err = httpError(500, "Internal server error");
    expect(err.status).toBe(500);
    expect(err.message).toBe("Internal server error");
  });

  test("works with 401 status", () => {
    const err = httpError(401, "Unauthorized");
    expect(err.status).toBe(401);
  });
});
