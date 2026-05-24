const request = require("supertest");
const db = require("../db");

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

describe("PUT /api/transactions/:id", () => {
  beforeEach(() => {
    db.query.mockReset();
  });

  it("updates and returns transaction", async () => {
    db.query
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([[{
        id: 1,
        type: "EXPENSE",
        amount: "150000",
        category: "FOOD",
        description: "Com trua",
        created_at: "2026-05-24T00:00:00.000Z"
      }]]);

    const response = await request(app)
      .put("/api/transactions/1")
      .send({
        type: "EXPENSE",
        amount: 150000,
        category: "food",
        description: "Com trua"
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.id).toBe(1);
    expect(response.body.category).toBe("FOOD");
  });

  it("returns 400 for invalid id", async () => {
    const response = await request(app)
      .put("/api/transactions/abc")
      .send({
        type: "EXPENSE",
        amount: 150000,
        category: "FOOD",
        description: "Com trua"
      });

    expect(response.statusCode).toBe(400);
  });
});
