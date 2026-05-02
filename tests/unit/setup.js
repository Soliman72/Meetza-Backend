jest.mock("../../src/config/db", () => ({
  query: jest.fn(),
  execute: jest.fn(),
  on: jest.fn(),
  getConnection: jest.fn((cb) => cb(null, { release: jest.fn() })),
  promise: jest.fn(() => ({ execute: jest.fn(), query: jest.fn() })),
}));
