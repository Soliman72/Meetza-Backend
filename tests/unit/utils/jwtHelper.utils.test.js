const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "test-secret-key";

const { generateToken } = require("../../../src/utils/jwtHelper");

describe("jwtHelper.generateToken", () => {
  const mockUser = {
    id: "u1",
    email: "test@example.com",
    role: "Member",
    name: "Test User",
    user_photo: null,
    theme: "light",
  };

  test("generates a valid JWT token", () => {
    const token = generateToken(mockUser, false);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    expect(decoded.id).toBe("u1");
    expect(decoded.email).toBe("test@example.com");
    expect(decoded.role).toBe("Member");
    expect(decoded.name).toBe("Test User");
  });

  test("uses 24h expiry when remember_me is false", () => {
    const token = generateToken(mockUser, false);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 24h = 86400 seconds
    const ttl = decoded.exp - decoded.iat;
    expect(ttl).toBe(86400);
  });

  test("uses 4d expiry when remember_me is true", () => {
    const token = generateToken(mockUser, true);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4d = 345600 seconds
    const ttl = decoded.exp - decoded.iat;
    expect(ttl).toBe(345600);
  });

  test("handles remember_me string 'true'", () => {
    const token = generateToken(mockUser, "true");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const ttl = decoded.exp - decoded.iat;
    expect(ttl).toBe(345600);
  });

  test("handles remember_me string '1'", () => {
    const token = generateToken(mockUser, "1");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const ttl = decoded.exp - decoded.iat;
    expect(ttl).toBe(345600);
  });

  test("includes theme in token payload", () => {
    const token = generateToken({ ...mockUser, theme: "dark" }, false);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    expect(decoded.theme).toBe("dark");
  });
});
