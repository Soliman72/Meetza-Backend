const getTokenFromHandshake = require("../../../src/utils/tokenFormHandshake");

describe("getTokenFromHandshake", () => {
  test("returns token from handshake.auth.token", () => {
    const socket = {
      handshake: {
        auth: { token: "from-auth" },
        query: { token: "from-query" },
        headers: { authorization: "Bearer from-header" },
      },
    };

    expect(getTokenFromHandshake(socket)).toBe("from-auth");
  });

  test("returns token from query when auth token is absent", () => {
    const socket = {
      handshake: {
        auth: {},
        query: { token: "from-query" },
        headers: {},
      },
    };

    expect(getTokenFromHandshake(socket)).toBe("from-query");
  });

  test("extracts token from Bearer authorization header", () => {
    const socket = {
      handshake: {
        auth: {},
        query: {},
        headers: { authorization: "Bearer abc.def.ghi" },
      },
    };

    expect(getTokenFromHandshake(socket)).toBe("abc.def.ghi");
  });

  test("returns raw authorization header when it is not Bearer", () => {
    const socket = {
      handshake: {
        auth: {},
        query: {},
        headers: { authorization: "raw-token" },
      },
    };

    expect(getTokenFromHandshake(socket)).toBe("raw-token");
  });

  test("returns null when no token is present", () => {
    const socket = { handshake: { auth: {}, query: {}, headers: {} } };

    expect(getTokenFromHandshake(socket)).toBeNull();
  });
});
