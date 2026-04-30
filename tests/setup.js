const dbHelper = require("./helpers/db.helper");

jest.mock("../src/config/db", () => ({
  query: jest.fn(),
  execute: jest.fn(),
  on: jest.fn(),
  getConnection: jest.fn((cb) => cb(null, { release: jest.fn() })),
  promise: jest.fn(() => ({ execute: jest.fn() })),
}));

if (typeof beforeAll === "function") {
  beforeAll(async () => {
    await dbHelper.connectTestDb();
  });

  afterEach(async () => {
    await dbHelper.cleanTestDb();
  });

  afterAll(async () => {
    await dbHelper.disconnectTestDb();
  });
}
