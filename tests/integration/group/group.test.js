const express = require("express");
const request = require("supertest");

jest.mock("../../../src/middleware/verifyToken", () => ({
  verifyToken: (req, res, next) => {
    req.user = { id: "admin-1", role: "Super_Admin" };
    req.isSuperAdmin = true;
    next();
  },
}));
jest.mock("../../../src/middleware/checkAdminPermission", () => ({
  checkAdminPermission: (req, res, next) => next(),
  requireSuperAdmin: (req, res, next) => next(),
}));
jest.mock("../../../src/middleware/uploadMiddleware", () => (req, res, next) => next());
jest.mock("../../../src/config/db", () => ({
  promise: jest.fn(() => ({
    getConnection: jest.fn(),
  })),
}));
jest.mock("../../../src/repositories/groupRepository", () => ({
  getAllGroups: jest.fn(),
  getAdminsByGroupIds: jest.fn(),
  validateAdminIds: jest.fn(),
  createGroup: jest.fn(),
}));
jest.mock("../../../src/services/groupAdminService", () => ({
  assignGroupAdmin: jest.fn(),
  isGroupAdmin: jest.fn(),
}));
jest.mock("../../../src/services/groupContentService", () => ({
  createGroupContent: jest.fn(),
}));
jest.mock("../../../src/middleware/uploadFile", () => ({
  uploadToCloudinary: jest.fn(),
}));

const groupRoute = require("../../../src/routes/groupRoute");
const groupRepository = require("../../../src/repositories/groupRepository");
const groupAdminService = require("../../../src/services/groupAdminService");
const groupContentService = require("../../../src/services/groupContentService");

describe("group", () => {
  const app = express();
  app.use(express.json());
  app.use("/api/group", groupRoute);

  beforeEach(() => {
    jest.clearAllMocks();

    groupRepository.getAllGroups.mockResolvedValue({
      rows: [
        {
          id: "g1",
          group_name: "Test Group",
          description: "desc",
          year: "3",
          semester: "Fall",
        },
      ],
    });
    groupRepository.getAdminsByGroupIds.mockResolvedValue([
      {
        group_id: "g1",
        user_id: "admin-1",
        role: "OWNER",
        name: "Admin One",
        email: "admin@example.com",
      },
    ]);
    groupRepository.validateAdminIds.mockResolvedValue(["admin-1"]);
    groupRepository.createGroup.mockResolvedValue();
    groupAdminService.assignGroupAdmin.mockResolvedValue();
    groupContentService.createGroupContent.mockResolvedValue({ id: "gc1" });
  });

  test("GET /api/group returns 200", async () => {
    const res = await request(app).get("/api/group");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data[0].id).toBe("g1");
    expect(groupRepository.getAllGroups).toHaveBeenCalledTimes(1);
    expect(groupRepository.getAdminsByGroupIds).toHaveBeenCalledWith(["g1"]);
  });

  test("POST /api/group returns 201", async () => {
    const res = await request(app).post("/api/group").send({
      group_name: "New Group",
      administrator_id: "admin-1",
      year: "3",
      semester: "Fall",
      group_content_name: "General Content",
      description: "desc",
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(groupRepository.validateAdminIds).toHaveBeenCalledWith(["admin-1"]);
    expect(groupRepository.createGroup).toHaveBeenCalledTimes(1);
    expect(groupAdminService.assignGroupAdmin).toHaveBeenCalledTimes(1);
    expect(groupContentService.createGroupContent).toHaveBeenCalledWith({
      content_name: "General Content",
      content_description: "desc",
      group_id: expect.any(String),
    });
  });
});
