jest.mock("../../../src/config/db", () => {
  const execute = jest.fn();
  return {
    promise: jest.fn(() => ({ execute })),
    __execute: execute,
  };
});

const db = require("../../../src/config/db");
const userRepository = require("../../../src/repositories/userRepository");

describe("userRepository", () => {
  beforeEach(() => {
    db.__execute.mockReset();
  });

  test("findByEmail queries user by email", async () => {
    db.__execute.mockResolvedValueOnce([[{ id: "u1", email: "a@b.com" }]]);

    const row = await userRepository.findByEmail("a@b.com");

    expect(db.__execute).toHaveBeenCalledWith("SELECT * FROM user WHERE email = ?", ["a@b.com"]);
    expect(row).toEqual({ id: "u1", email: "a@b.com" });
  });
});
