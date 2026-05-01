const express = require("express");
const request = require("supertest");

jest.mock("../../../src/middleware/verifyToken", () => ({
  verifyToken: (req, res, next) => next(),
}));
jest.mock("../../../src/middleware/checkAdminPermission", () => ({
  checkAdminPermission: (req, res, next) => next(),
  requireSuperAdmin: (req, res, next) => next(),
}));
jest.mock("../../../src/middleware/uploadMiddleware", () => (req, res, next) => next());
jest.mock("../../../src/controllers/groupController", () => ({
  getAllGroups: (req, res) => res.status(200).json({ ok: true }),
  createGroup: (req, res) => res.status(201).json({ ok: true }),
  getPendingGroups: (req, res) => res.status(200).json({ ok: true }),
  updatePendingGroupStatus: (req, res) => res.status(200).json({ ok: true }),
  pendingGroupEmailAction: (req, res) => res.status(200).json({ ok: true }),
  getGroupById: (req, res) => res.status(200).json({ ok: true, id: req.params.id }),
  updateGroup: (req, res) => res.status(200).json({ ok: true }),
  deleteGroup: (req, res) => res.status(200).json({ ok: true }),
  leaveGroup: (req, res) => res.status(200).json({ ok: true }),
  addGroupAdmin: (req, res) => res.status(200).json({ ok: true }),
  removeGroupAdmin: (req, res) => res.status(200).json({ ok: true }),
}));

const groupRoute = require("../../../src/routes/groupRoute");

describe("group routes", () => {
  const app = express();
  app.use(express.json());
  app.use("/api/group", groupRoute);

  test("GET /api/group returns 200", async () => {
    const res = await request(app).get("/api/group");
    expect(res.status).toBe(200);
  });

  test("POST /api/group returns 201", async () => {
    const res = await request(app).post("/api/group").send({ group_name: "Test" });
    expect(res.status).toBe(201);
  });

  test("GET /api/group/:id returns 200", async () => {
    const res = await request(app).get("/api/group/g1");
    expect(res.status).toBe(200);
    expect(res.body.id).toBe("g1");
  });

  test("PUT /api/group/:id returns 200", async () => {
    const res = await request(app).put("/api/group/g1").send({ group_name: "Updated" });
    expect(res.status).toBe(200);
  });

  test("DELETE /api/group/:id returns 200", async () => {
    const res = await request(app).delete("/api/group/g1");
    expect(res.status).toBe(200);
  });

  test("POST /api/group/:id/leave returns 200", async () => {
    const res = await request(app).post("/api/group/g1/leave");
    expect(res.status).toBe(200);
  });

  test("POST /api/group/:id/admins returns 200", async () => {
    const res = await request(app).post("/api/group/g1/admins").send({ email: "a@b.com" });
    expect(res.status).toBe(200);
  });

  test("GET /api/group/pending returns 200", async () => {
    const res = await request(app).get("/api/group/pending");
    expect(res.status).toBe(200);
  });
});
