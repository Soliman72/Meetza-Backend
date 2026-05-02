const { redirectWithError } = require("../../../src/utils/redirectHelper");

describe("redirectWithError", () => {
  test("redirects with encoded error message", () => {
    const res = { redirect: jest.fn() };
    redirectWithError(res, "http://localhost:3000/home", "Something failed");

    expect(res.redirect).toHaveBeenCalledWith(
      "http://localhost:3000/home?error=Something%20failed"
    );
  });

  test("encodes special characters in error message", () => {
    const res = { redirect: jest.fn() };
    redirectWithError(res, "http://example.com", "Error & details=bad");

    expect(res.redirect).toHaveBeenCalledWith(
      "http://example.com?error=Error%20%26%20details%3Dbad"
    );
  });
});
