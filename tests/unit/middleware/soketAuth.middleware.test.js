jest.mock("../../../src/utils/tokenFormHandshake", () => jest.fn());
jest.mock("../../../src/utils/authJwtUser", () => ({
  loadUserFromAccessToken: jest.fn(),
}));

const getTokenFromHandshake = require("../../../src/utils/tokenFormHandshake");
const { loadUserFromAccessToken } = require("../../../src/utils/authJwtUser");
const authenticateSocket = require("../../../src/middleware/soketAuth");

describe("authenticateSocket middleware", () => {
  test("calls next with error when token is missing", async () => {
    getTokenFromHandshake.mockReturnValue(null);
    const socket = { handshake: {} };
    const next = jest.fn();

    await authenticateSocket(socket, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("Authentication token missing");
    expect(loadUserFromAccessToken).not.toHaveBeenCalled();
  });

  test("attaches user and calls next with no args when token is valid", async () => {
    getTokenFromHandshake.mockReturnValue("valid-token");
    loadUserFromAccessToken.mockResolvedValue({ id: "u1" });
    const socket = { handshake: {} };
    const next = jest.fn();

    await authenticateSocket(socket, next);

    expect(loadUserFromAccessToken).toHaveBeenCalledWith("valid-token");
    expect(socket.user).toEqual({ id: "u1" });
    expect(next).toHaveBeenCalledWith();
  });

  test("calls next with Authentication failed when loader throws", async () => {
    getTokenFromHandshake.mockReturnValue("bad-token");
    loadUserFromAccessToken.mockRejectedValue(new Error("invalid token"));
    const socket = { handshake: {} };
    const next = jest.fn();

    await authenticateSocket(socket, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("Authentication failed");
  });
});
