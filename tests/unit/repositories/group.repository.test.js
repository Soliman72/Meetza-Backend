jest.mock("../../../src/config/db");
const db = require("../../../src/config/db");
const repo = require("../../../src/repositories/groupRepository");

describe("groupRepository", () => {
  let mockExecute, mockQuery;

  beforeEach(() => {
    jest.clearAllMocks();
    mockExecute = jest.fn();
    mockQuery = jest.fn();
    db.promise.mockReturnValue({
      execute: mockExecute,
      query: mockQuery
    });
  });

  describe("createGroup", () => {
    test("executes correct query", async () => {
      mockExecute.mockResolvedValue([{}]);
      await repo.createGroup({ id: "g1", group_name: "name", year: 2024, semester: "Fall" });
      expect(mockExecute).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO `group`"), expect.any(Array));
    });
  });

  describe("createPendingGroup", () => {
    test("executes correct query", async () => {
      mockExecute.mockResolvedValue([{}]);
      await repo.createPendingGroup({ id: "p1", group_name: "name", year: 2024, semester: "Fall", created_by: "u1" });
      expect(mockExecute).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO pending_groups"), expect.any(Array));
    });
  });

  describe("createPendingGroupAdmin", () => {
    test("executes correct query", async () => {
      mockExecute.mockResolvedValue([{}]);
      await repo.createPendingGroupAdmin({ id: "pa1", pending_group_id: "p1", user_id: "u1" });
      expect(mockExecute).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO pending_group_admins"), expect.any(Array));
    });
  });

  describe("findPendingGroupById", () => {
    test("returns pending group", async () => {
      mockExecute.mockResolvedValue([[{ id: "p1" }]]);
      const result = await repo.findPendingGroupById("p1");
      expect(result).toEqual({ id: "p1" });
    });
  });

  describe("getPendingGroups", () => {
    test("returns array of pending groups", async () => {
      mockExecute.mockResolvedValue([[{ id: "p1" }]]);
      const result = await repo.getPendingGroups();
      expect(result).toEqual([{ id: "p1" }]);
    });
  });

  describe("getPendingGroupAdmins", () => {
    test("returns admins", async () => {
      mockExecute.mockResolvedValue([[{ id: "pa1" }]]);
      const result = await repo.getPendingGroupAdmins("p1");
      expect(result).toEqual([{ id: "pa1" }]);
    });
  });

  describe("updatePendingGroupStatus", () => {
    test("executes correct query", async () => {
      mockExecute.mockResolvedValue([{}]);
      await repo.updatePendingGroupStatus({ id: "p1", status: "approved" });
      expect(mockExecute).toHaveBeenCalled();
    });
  });

  describe("deletePendingGroup", () => {
    test("executes delete query", async () => {
      mockExecute.mockResolvedValue([{}]);
      await repo.deletePendingGroup("p1");
      expect(mockExecute).toHaveBeenCalledWith(expect.stringContaining("DELETE FROM pending_groups"), ["p1"]);
    });
  });

  describe("findById", () => {
    test("returns group", async () => {
      mockExecute.mockResolvedValue([[{ id: "g1" }]]);
      const result = await repo.findById("g1");
      expect(result).toEqual({ id: "g1" });
    });
  });

  describe("validateAdminIds", () => {
    test("returns empty array for empty input", async () => {
      expect(await repo.validateAdminIds([])).toEqual([]);
    });

    test("executes query and returns validated ids", async () => {
      mockExecute.mockResolvedValue([[{ user_id: "u1" }]]);
      const result = await repo.validateAdminIds(["u1"]);
      expect(result).toEqual(["u1"]);
      expect(mockExecute).toHaveBeenCalled();
    });
  });

  describe("getAllGroups", () => {
    test("executes dynamically built query", async () => {
      mockExecute.mockResolvedValue([[{ id: "g1" }]]);
      const req = { user: { id: "u1", role: "Administrator" }, query: { name: "test", year: "4", semester: "Fall" } };
      const result = await repo.getAllGroups(req);
      expect(result.rows).toEqual([{ id: "g1" }]);
      expect(mockExecute).toHaveBeenCalledWith(expect.stringContaining("WHERE ga.user_id IS NOT NULL AND g.group_name LIKE ? AND  g.year IN (?) AND  g.semester IN (?)"), expect.any(Array));
    });
  });

  describe("getGroupById", () => {
    test("returns group", async () => {
      mockExecute.mockResolvedValue([[{ id: "g1" }]]);
      const result = await repo.getGroupById("g1");
      expect(result).toEqual({ id: "g1" });
    });
  });

  describe("getAdminsByGroupIds", () => {
    test("returns empty if no ids provided", async () => {
      expect(await repo.getAdminsByGroupIds([])).toEqual([]);
    });

    test("returns admins", async () => {
      mockExecute.mockResolvedValue([[{ user_id: "u1" }]]);
      const result = await repo.getAdminsByGroupIds(["g1"]);
      expect(result).toEqual([{ user_id: "u1" }]);
    });
  });

  describe("updateGroup", () => {
    test("executes update query", async () => {
      mockExecute.mockResolvedValue([{}]);
      await repo.updateGroup("g1", { group_name: "new" });
      expect(mockExecute).toHaveBeenCalledWith(expect.stringContaining("UPDATE `group`"), expect.any(Array));
    });
  });

  describe("delete", () => {
    test("executes delete query", async () => {
      mockExecute.mockResolvedValue([{}]);
      await repo.delete("g1");
      expect(mockExecute).toHaveBeenCalled();
    });
  });

  describe("getGroupMeetingIds", () => {
    test("returns meeting ids", async () => {
      mockQuery.mockResolvedValue([[{ id: "m1" }]]);
      const result = await repo.getGroupMeetingIds("g1");
      expect(result).toEqual([{ id: "m1" }]);
    });
  });

  describe("getUserByEmail", () => {
    test("returns user", async () => {
      mockExecute.mockResolvedValue([[{ id: "u1" }]]);
      const result = await repo.getUserByEmail("a@b.com", "g1");
      expect(result).toEqual({ id: "u1" });
    });
  });

  describe("getOwner & countOwners", () => {
    test("getOwner", async () => {
      mockExecute.mockResolvedValue([[{ user_id: "u1" }]]);
      const result = await repo.getOwner("g1");
      expect(result).toEqual([{ user_id: "u1" }]);
    });
    test("countOwners", async () => {
      mockExecute.mockResolvedValue([[{ count: 2 }]]);
      const result = await repo.countOwners("g1");
      expect(result).toBe(2);
    });
  });

  describe("leaveSelectMyAdminRole", () => {
    test("executes query with connection", async () => {
      const conn = { query: jest.fn().mockResolvedValue([[{ role: "ADMIN" }]]) };
      const result = await repo.leaveSelectMyAdminRole(conn, "g1", "u1");
      expect(result).toEqual([{ role: "ADMIN" }]);
      expect(conn.query).toHaveBeenCalled();
    });
  });
});
