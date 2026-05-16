const request = require("supertest");
jest.mock("../db", () => ({
  query: jest.fn()
}));

const app = require("../app");

describe("GET /api/health", () => {
  it("returns ok true", async () => {
    const response = await request(app).get("/api/health");
    expect(response.statusCode).toBe(200);
    expect(response.body.ok).toBe(true);
  });
});
