const request = require("supertest");

jest.mock("../../../src/config/db", () => ({
  query: jest.fn(),
  execute: jest.fn(),
  on: jest.fn(),
  getConnection: jest.fn((cb) => cb(null, { release: jest.fn() })),
}));

const { createApp } = require("../../../app");

describe("app routes", () => {
  const app = createApp();

  test("GET /api-docs.json returns swagger payload", async () => {
    const response = await request(app)
      .get("/api-docs.json")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(response.body).toBeDefined();
  });

  test("unknown route returns 404", async () => {
    await request(app).get("/__unknown_route__").expect(404);
  });
});
