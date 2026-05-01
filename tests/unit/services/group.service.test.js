jest.mock("uuid", () => ({ v4: jest.fn(() => "mocked-uuid") }));
jest.mock("../../../src/services/groupContentService");
jest.mock("../../../src/utils/extractArray");
jest.mock("../../../src/repositories/groupRepository");
jest.mock("../../../src/services/groupAdminService");
jest.mock("../../../src/config/db");
jest.mock("../../../src/utils/groupAccess");
jest.mock("../../../src/validators/groupValidator");
jest.mock("../../../src/validators/validateFiles");
jest.mock("../../../src/middleware/uploadFile");
jest.mock("../../../src/utils/attachAdmin");
jest.mock("../../../src/services/userService");
jest.mock("../../../src/services/meetingAdminService");
jest.mock("../../../src/repositories/group_memberShipRepository");
jest.mock("../../../src/repositories/userRepository");
jest.mock("../../../src/services/notificatioService");
jest.mock("../../../src/utils/pendingGroupEmailToken");
jest.mock("../../../src/utils/pendingGroupEmailHelpers");

const groupService = require("../../../src/services/groupService");
const repo = require("../../../src/repositories/groupRepository");
const groupValidator = require("../../../src/validators/groupValidator");
const extractArray = require("../../../src/utils/extractArray");
const { uploadToCloudinary } = require("../../../src/middleware/uploadFile");
const { createNotification } = require("../../../src/services/notificatioService");
const groupContentService = require("../../../src/services/groupContentService");
const db = require("../../../src/config/db");
const userRepository = require("../../../src/repositories/userRepository");
const { isGroupAdmin } = require("../../../src/services/groupAdminService");
const { ensureGroupAccess } = require("../../../src/utils/groupAccess");
const { attachAdminsToGroups } = require("../../../src/utils/attachAdmin");

describe("groupService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    groupValidator.normalizeGroupYear.mockImplementation((v) => v);
    groupValidator.normalizeGroupSemester.mockImplementation((v) => v);
    groupValidator.normalizePendingGroupStatus.mockImplementation((v) => v);
    extractArray.extractArray.mockReturnValue([]);
    
    const mockConn = {
      promise: () => ({
        getConnection: jest.fn().mockResolvedValue({
          beginTransaction: jest.fn(),
          commit: jest.fn(),
          rollback: jest.fn(),
          release: jest.fn(),
        })
      })
    };
    db.promise = mockConn.promise;
  });

  describe("createGroup", () => {
    test("Administrator creates pending group", async () => {
      const req = {
        body: { group_name: "Test Group", administrator_id: "u1" },
        user: { id: "u1", role: "Administrator" },
        isSuperAdmin: false,
      };
      
      extractArray.extractArray.mockReturnValue(["u1"]);
      repo.validateAdminIds.mockResolvedValue([{ id: "u1" }]);
      userRepository.findByRole.mockResolvedValue([]);

      const result = await groupService.createGroup(req);

      expect(repo.createPendingGroup).toHaveBeenCalled();
      expect(repo.createPendingGroupAdmin).toHaveBeenCalled();
      expect(result.status).toBe("pending");
    });

    test("Super_Admin creates approved group", async () => {
      const req = {
        body: { group_name: "Test Group", administrator_id: "u1" },
        user: { id: "u2", role: "Super_Admin" },
        isSuperAdmin: true,
      };
      
      extractArray.extractArray.mockReturnValue(["u1"]);
      repo.validateAdminIds.mockResolvedValue([{ id: "u1" }]);
      groupContentService.createGroupContent.mockResolvedValue({ id: "content1" });

      const result = await groupService.createGroup(req);

      expect(repo.createGroup).toHaveBeenCalled();
      expect(groupContentService.createGroupContent).toHaveBeenCalled();
      expect(result.group_content_id).toBe("content1");
    });

    test("Throws error if unauthorized role", async () => {
      const req = {
        body: { group_name: "Test Group" },
        user: { id: "u1", role: "Member" },
      };
      await expect(groupService.createGroup(req)).rejects.toThrow("You are not authorized to create a group");
    });
  });

  describe("getPendingGroups", () => {
    test("throws if not super admin", async () => {
      const req = { user: { role: "Member" }, isSuperAdmin: false };
      await expect(groupService.getPendingGroups(req)).rejects.toMatchObject({ status: 403 });
    });

    test("returns pending groups with admins", async () => {
      const req = { user: { role: "Super_Admin" }, isSuperAdmin: true };
      repo.getPendingGroups.mockResolvedValue([{ id: "p1" }]);
      repo.getPendingGroupAdmins.mockResolvedValue([{ user_id: "u1" }]);

      const result = await groupService.getPendingGroups(req);
      expect(result).toEqual([{ id: "p1", admins: [{ user_id: "u1" }] }]);
    });
  });

  describe("updatePendingGroupStatus", () => {
    test("approves pending group and creates it", async () => {
      const req = {
        user: { id: "u1", role: "Super_Admin" },
        isSuperAdmin: true,
        params: { id: "p1" },
        body: { status: "approved" }
      };

      repo.findPendingGroupById.mockResolvedValue({ id: "p1", status: "pending", group_name: "Name" });
      repo.getPendingGroupAdmins.mockResolvedValue([{ user_id: "u2", role: "OWNER" }]);
      groupContentService.createGroupContent.mockResolvedValue({ id: "c1" });

      const result = await groupService.updatePendingGroupStatus(req);

      expect(repo.updatePendingGroupStatus).toHaveBeenCalledWith(expect.objectContaining({ status: "approved" }));
      expect(repo.deletePendingGroup).toHaveBeenCalledWith("p1");
      expect(result.group_content_id).toBe("c1");
    });

    test("rejects pending group", async () => {
      const req = {
        user: { id: "u1", role: "Super_Admin" },
        isSuperAdmin: true,
        params: { id: "p1" },
        body: { status: "rejected", rejection_reason: "bad" }
      };

      repo.findPendingGroupById.mockResolvedValue({ id: "p1", status: "pending" });

      const result = await groupService.updatePendingGroupStatus(req);

      expect(repo.updatePendingGroupStatus).toHaveBeenCalledWith(expect.objectContaining({ status: "rejected", rejectionReason: "bad" }));
      expect(result.status).toBe("rejected");
    });
  });

  describe("getAllGroups", () => {
    test("returns groups with attached admins", async () => {
      repo.getAllGroups.mockResolvedValue({ rows: [{ id: "g1" }] });
      attachAdminsToGroups.mockResolvedValue([{ id: "g1", admins: [] }]);

      const result = await groupService.getAllGroups({});
      expect(result).toEqual([{ id: "g1", admins: [] }]);
    });
  });

  describe("getGroupById", () => {
    test("returns group if allowed", async () => {
      repo.getGroupById.mockResolvedValue({ id: "g1" });
      isGroupAdmin.mockResolvedValue(true);
      attachAdminsToGroups.mockResolvedValue([{ id: "g1", admins: [] }]);

      const result = await groupService.getGroupById({ params: { id: "g1" }, user: { id: "u1" }, isSuperAdmin: false });
      expect(result).toEqual({ id: "g1", admins: [] });
    });

    test("throws 403 if not allowed", async () => {
      repo.getGroupById.mockResolvedValue({ id: "g1" });
      isGroupAdmin.mockResolvedValue(false);

      await expect(groupService.getGroupById({ params: { id: "g1" }, user: { id: "u1" }, isSuperAdmin: false })).rejects.toMatchObject({ status: 403 });
    });
  });

  describe("updateGroup", () => {
    test("updates successfully", async () => {
      repo.findById.mockResolvedValue({ id: "g1" });
      isGroupAdmin.mockResolvedValue(true);
      
      const req = { params: { id: "g1" }, user: { id: "u1" }, body: { year: 2024 } };
      await groupService.updateGroup(req);

      expect(repo.updateGroup).toHaveBeenCalled();
    });
  });

  describe("deleteGroup", () => {
    test("deletes successfully", async () => {
      repo.findById.mockResolvedValue({ id: "g1" });
      isGroupAdmin.mockResolvedValue(true);
      
      await groupService.deleteGroup({ params: { id: "g1" }, user: { id: "u1" } });
      expect(repo.delete).toHaveBeenCalledWith("g1");
    });
  });

  describe("leaveGroup", () => {
    test("throws if no groupId or userId", async () => {
      const result = await groupService.leaveGroup({ params: {}, user: {} });
      expect(result.status).toBe(400);
    });

    test("processes successful leave for regular member", async () => {
      const req = { params: { id: "g1" }, user: { id: "u1" } };
      ensureGroupAccess.mockResolvedValue(true);
      repo.leaveSelectMyAdminRole.mockResolvedValue([]); // not an admin
      
      const result = await groupService.leaveGroup(req);
      expect(result.status).toBe(200);
    });
  });
});
