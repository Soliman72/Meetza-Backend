jest.mock("../../../src/repositories/administratorRepository", () => ({
  getAdministratorByUserId: jest.fn(),
  findByUserId: jest.fn(),
}));

const administratorRepository = require("../../../src/repositories/administratorRepository");
const {
  checkAdminPermission,
  getOwnershipFilter,
  requireSuperAdmin,
} = require("../../../src/middleware/checkAdminPermission");

describe("checkAdminPermission middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns 401 when req.user is missing", async () => {
    const req = {};
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await checkAdminPermission(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("returns 403 for non admin roles", async () => {
    const req = { user: { id: 1, role: "User" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await checkAdminPermission(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test("sets admin context from admin record and calls next", async () => {
    administratorRepository.getAdministratorByUserId.mockResolvedValue([
      { role: "Administrator" },
    ]);

    const req = { user: { id: 9, role: "Administrator" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await checkAdminPermission(req, res, next);

    expect(req.isSuperAdmin).toBe(false);
    expect(req.adminRole).toBe("Administrator");
    expect(req.administratorId).toBe(9);
    expect(next).toHaveBeenCalled();
  });

  test("returns 403 when leader record is missing for non super admin", async () => {
    administratorRepository.getAdministratorByUserId.mockResolvedValue([]);

    const req = { user: { id: 9, role: "Administrator" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await checkAdminPermission(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Leader record not found",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("allows super admin from user role when no admin row exists", async () => {
    administratorRepository.getAdministratorByUserId.mockResolvedValue([]);

    const req = { user: { id: 7, role: "Super_Admin" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await checkAdminPermission(req, res, next);

    expect(req.isSuperAdmin).toBe(true);
    expect(req.adminRole).toBe("Super_Admin");
    expect(next).toHaveBeenCalled();
  });

  test("returns 500 when repository call throws", async () => {
    administratorRepository.getAdministratorByUserId.mockRejectedValue(
      new Error("db down")
    );

    const req = { user: { id: 1, role: "Administrator" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await checkAdminPermission(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(next).not.toHaveBeenCalled();
  });
});

describe("getOwnershipFilter", () => {
  test("returns empty filter for super admin", () => {
    const req = { isSuperAdmin: true, user: { id: 3, role: "Administrator" } };
    expect(getOwnershipFilter(req)).toEqual({ whereClause: "", params: [] });
  });

  test("returns owner filter for administrator", () => {
    const req = { user: { id: 5, role: "Administrator" } };
    expect(getOwnershipFilter(req, "owner_id")).toEqual({
      whereClause: "WHERE owner_id = ?",
      params: [5],
    });
  });

  test("returns empty filter when no ownership context exists", () => {
    const req = { user: { id: 2, role: "User" } };
    expect(getOwnershipFilter(req)).toEqual({ whereClause: "", params: [] });
  });
});

describe("requireSuperAdmin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns 401 when user is missing", async () => {
    const req = {};
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await requireSuperAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("passes immediately when JWT role is Super_Admin", async () => {
    const req = { user: { id: 1, role: "Super_Admin" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await requireSuperAdmin(req, res, next);

    expect(req.isSuperAdmin).toBe(true);
    expect(next).toHaveBeenCalled();
  });

  test("passes when admin record role is Super_Admin", async () => {
    administratorRepository.findByUserId.mockResolvedValue({ role: "Super_Admin" });
    const req = { user: { id: 1, role: "Administrator" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await requireSuperAdmin(req, res, next);

    expect(req.isSuperAdmin).toBe(true);
    expect(next).toHaveBeenCalled();
  });

  test("returns 403 for non super admins", async () => {
    administratorRepository.findByUserId.mockResolvedValue({ role: "Administrator" });
    const req = { user: { id: 1, role: "Administrator" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await requireSuperAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test("returns 500 when repository fails", async () => {
    administratorRepository.findByUserId.mockRejectedValue(new Error("db fail"));
    const req = { user: { id: 1, role: "Administrator" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await requireSuperAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(next).not.toHaveBeenCalled();
  });
});
