jest.mock("uuid", () => ({
  v4: jest.fn(() => "uuid-fixed"),
}));
jest.mock("../../../src/middleware/checkAdminPermission", () => ({
  getOwnershipFilter: jest.fn(),
}));
jest.mock("../../../src/repositories/memberRepository", () => ({
  findByUserId: jest.fn(),
  insert: jest.fn(),
  findAll: jest.fn(),
  updateUserId: jest.fn(),
  deleteByUserId: jest.fn(),
}));
jest.mock("../../../src/validators/memberValidator", () => ({
  validateCreateMember: jest.fn(),
  validateMemberIdParam: jest.fn(),
  validateUpdateMember: jest.fn(),
}));
jest.mock("../../../src/repositories/positionRepository", () => ({
  administratorExists: jest.fn(),
  insert: jest.fn(),
  findAll: jest.fn(),
  findByIdScoped: jest.fn(),
  updateTitle: jest.fn(),
  deleteById: jest.fn(),
}));
jest.mock("../../../src/validators/positionValidator", () => ({
  validateCreatePosition: jest.fn(),
  validateSuperAdminAdministratorId: jest.fn(),
  validatePositionIdParam: jest.fn(),
  validateUpdatePosition: jest.fn(),
}));
jest.mock("../../../src/repositories/group_memberShipRepository", () => ({
  findGroupById: jest.fn(),
  findMemberByUserId: jest.fn(),
  exists: jest.fn(),
  insert: jest.fn(),
  getAllGroupedRows: jest.fn(),
  findById: jest.fn(),
  updateGroupId: jest.fn(),
  deleteById: jest.fn(),
}));
jest.mock("../../../src/validators/groupMembershipValidator", () => ({
  validateGroupIdBody: jest.fn(),
  validateMemberIdForAdmin: jest.fn(),
  validateMembershipIdParam: jest.fn(),
  validateUpdateMembership: jest.fn(),
}));

const memberRepository = require("../../../src/repositories/memberRepository");
const memberValidator = require("../../../src/validators/memberValidator");
const memberService = require("../../../src/services/memberService");

const { getOwnershipFilter } = require("../../../src/middleware/checkAdminPermission");
const positionRepository = require("../../../src/repositories/positionRepository");
const positionValidator = require("../../../src/validators/positionValidator");
const positionService = require("../../../src/services/positionService");

const groupMembershipRepo = require("../../../src/repositories/group_memberShipRepository");
const groupMembershipValidator = require("../../../src/validators/groupMembershipValidator");
const groupMembershipService = require("../../../src/services/group_memberShipService");

describe("core membership-related services", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("memberService create/get/update/delete branches", async () => {
    const req = { body: { user_id: "u1" } };
    memberRepository.findByUserId.mockResolvedValueOnce(null);
    memberRepository.insert.mockResolvedValue({ id: "m1" });
    await expect(memberService.createMember(req)).resolves.toEqual({ id: "m1" });
    expect(memberValidator.validateCreateMember).toHaveBeenCalledWith(req.body);

    memberRepository.findByUserId.mockResolvedValueOnce({ id: "m1" });
    await expect(memberService.createMember(req)).rejects.toThrow("Member already exists");

    memberRepository.findAll.mockResolvedValue([{ id: "m1" }]);
    await expect(memberService.getAllMembers()).resolves.toEqual([{ id: "m1" }]);

    memberRepository.findByUserId.mockResolvedValueOnce({ id: "m1" });
    await expect(memberService.getMemberById("u1")).resolves.toEqual({ id: "m1" });

    memberRepository.findByUserId.mockResolvedValueOnce(null);
    await expect(memberService.getMemberById("u1")).rejects.toMatchObject({ status: 404 });

    await expect(memberService.updateMember("", "")).rejects.toMatchObject({ status: 400 });
    memberRepository.updateUserId.mockResolvedValueOnce(0);
    await expect(memberService.updateMember("u1", "u2")).rejects.toMatchObject({ status: 404 });
    memberRepository.updateUserId.mockResolvedValueOnce(1);
    await expect(memberService.updateMember("u1", "u2")).resolves.toBeUndefined();

    memberRepository.findByUserId.mockResolvedValueOnce(null);
    await expect(memberService.deleteMember("u1")).rejects.toMatchObject({ status: 404 });
    memberRepository.findByUserId.mockResolvedValueOnce({ id: "m1" });
    memberRepository.deleteByUserId.mockResolvedValueOnce(1);
    await expect(memberService.deleteMember("u1")).resolves.toBeUndefined();
  });

  test("positionService create/get/update/delete branches", async () => {
    const adminReq = {
      user: { id: "a1", role: "Administrator" },
      body: { title: "Lead" },
      query: { title: "Le" },
      params: { id: "p1" },
    };

    positionRepository.administratorExists.mockResolvedValue(true);
    positionRepository.insert.mockResolvedValue(true);
    await expect(positionService.createPosition(adminReq)).resolves.toEqual({
      id: "uuid-fixed",
      title: "Lead",
      administrator_id: "a1",
    });
    expect(positionValidator.validateCreatePosition).toHaveBeenCalledWith(adminReq);
    expect(positionValidator.validateSuperAdminAdministratorId).toHaveBeenCalledWith(adminReq);

    const badRoleReq = { user: { id: "x", role: "User" }, body: { title: "t" } };
    await expect(positionService.createPosition(badRoleReq)).rejects.toMatchObject({
      status: 400,
      message: "Invalid role",
    });

    const superReq = {
      user: { id: "s1", role: "Super_Admin" },
      body: { title: "Lead", administrator_id: "a2" },
    };
    positionRepository.administratorExists.mockResolvedValue(false);
    await expect(positionService.createPosition(superReq)).rejects.toMatchObject({
      status: 400,
      message: "Invalid administrator_id: not found",
    });

    getOwnershipFilter.mockReturnValue({ whereClause: "WHERE administrator_id = ?", params: ["a1"] });
    positionRepository.findAll.mockResolvedValue([{ id: "p1" }]);
    await expect(positionService.getAllPositions(adminReq)).resolves.toEqual([{ id: "p1" }]);

    positionRepository.findByIdScoped.mockResolvedValueOnce({ id: "p1" });
    await expect(positionService.getPositionById(adminReq)).resolves.toEqual({ id: "p1" });
    positionRepository.findByIdScoped.mockResolvedValueOnce(null);
    await expect(positionService.getPositionById(adminReq)).rejects.toMatchObject({ status: 404 });

    positionRepository.updateTitle.mockResolvedValueOnce(1);
    await expect(
      positionService.updatePosition({ params: { id: "p1" }, body: { title: "New" } })
    ).resolves.toEqual({ id: "p1", title: "New" });
    positionRepository.updateTitle.mockResolvedValueOnce(0);
    await expect(
      positionService.updatePosition({ params: { id: "p1" }, body: { title: "New" } })
    ).rejects.toMatchObject({ status: 404 });

    positionRepository.deleteById.mockResolvedValueOnce(1);
    await expect(positionService.deletePosition("p1")).resolves.toBeUndefined();
    positionRepository.deleteById.mockResolvedValueOnce(0);
    await expect(positionService.deletePosition("p1")).rejects.toMatchObject({ status: 404 });
  });

  test("group_memberShipService create/get/update/delete branches", async () => {
    const req = { body: { group_id: "g1" }, user: { id: "u-admin", role: "Administrator" } };
    groupMembershipValidator.validateMemberIdForAdmin.mockReturnValue("u1");

    groupMembershipRepo.findGroupById.mockResolvedValueOnce(null);
    await expect(groupMembershipService.createGroupMembership(req)).rejects.toMatchObject({
      status: 400,
      message: "Invalid group_id: not found",
    });

    groupMembershipRepo.findGroupById.mockResolvedValueOnce({ id: "g1" });
    groupMembershipRepo.findMemberByUserId.mockResolvedValueOnce(null);
    await expect(groupMembershipService.createGroupMembership(req)).rejects.toMatchObject({
      status: 400,
      message: "Invalid member_id: not found",
    });

    groupMembershipRepo.findGroupById.mockResolvedValueOnce({ id: "g1" });
    groupMembershipRepo.findMemberByUserId.mockResolvedValueOnce({ user_id: "u1" });
    groupMembershipRepo.exists.mockResolvedValueOnce(true);
    await expect(groupMembershipService.createGroupMembership(req)).rejects.toMatchObject({
      status: 409,
      message: "Membership already exists",
    });

    groupMembershipRepo.findGroupById.mockResolvedValueOnce({ id: "g1" });
    groupMembershipRepo.findMemberByUserId.mockResolvedValueOnce({ user_id: "u1" });
    groupMembershipRepo.exists.mockResolvedValueOnce(false);
    groupMembershipRepo.insert.mockResolvedValueOnce(true);
    await expect(groupMembershipService.createGroupMembership(req)).resolves.toEqual({
      id: "uuid-fixed",
      group_id: "g1",
      memberId: "u1",
    });

    groupMembershipRepo.getAllGroupedRows.mockResolvedValue([
      {
        group_id: "g1",
        group_name: "Group",
        membership_id: "m1",
        member_id: "u1",
        member_name: "User One",
        member_email: "u1@mail.com",
        member_photo: null,
      },
    ]);
    await expect(
      groupMembershipService.getAllGroupMemberships({ user: { id: "u1", role: "Administrator" } })
    ).resolves.toEqual([
      {
        group_id: "g1",
        group_name: "Group",
        members: [
          {
            membership_id: "m1",
            member_id: "u1",
            member_name: "User One",
            member_email: "u1@mail.com",
            member_photo: null,
          },
        ],
      },
    ]);

    groupMembershipRepo.findById.mockResolvedValueOnce({ id: "m1" });
    await expect(groupMembershipService.getGroupMembershipById("m1")).resolves.toEqual({ id: "m1" });
    groupMembershipRepo.findById.mockResolvedValueOnce(null);
    await expect(groupMembershipService.getGroupMembershipById("m1")).rejects.toMatchObject({ status: 404 });

    groupMembershipRepo.updateGroupId.mockResolvedValueOnce(1);
    await expect(
      groupMembershipService.updateGroupMembership("m1", { group_id: "g2" })
    ).resolves.toBeUndefined();
    groupMembershipRepo.updateGroupId.mockResolvedValueOnce(0);
    await expect(
      groupMembershipService.updateGroupMembership("m1", { group_id: "g2" })
    ).rejects.toMatchObject({ status: 404 });

    groupMembershipRepo.deleteById.mockResolvedValueOnce(1);
    await expect(groupMembershipService.deleteGroupMembership("m1")).resolves.toBeUndefined();
    groupMembershipRepo.deleteById.mockResolvedValueOnce(0);
    await expect(groupMembershipService.deleteGroupMembership("m1")).rejects.toMatchObject({ status: 404 });
  });
});
