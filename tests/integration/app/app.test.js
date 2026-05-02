const request = require("supertest");

jest.mock("../../../src/config/db", () => ({
  promise: jest.fn(() => ({
    execute: jest.fn(),
    getConnection: jest.fn(),
  })),
  getConnection: jest.fn(),
  on: jest.fn(),
}));

const { createApp } = require("../../../app");

describe("app", () => {
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
