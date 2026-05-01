jest.mock("uuid", () => ({
  v4: jest.fn(() => "uuid-123"),
}));
jest.mock("../../../src/repositories/groupAdminRepository", () => ({
  findGroupAdmin: jest.fn(),
  upsertGroupAdmin: jest.fn(),
  updateGroupAdmin: jest.fn(),
}));
jest.mock("../../../src/repositories/meetingAdminRepository", () => ({
  findMeetingAdmin: jest.fn(),
  upsertMeetingAdmin: jest.fn(),
}));

const groupRepo = require("../../../src/repositories/groupAdminRepository");
const meetingRepo = require("../../../src/repositories/meetingAdminRepository");
const groupAdminService = require("../../../src/services/groupAdminService");
const meetingAdminService = require("../../../src/services/meetingAdminService");

describe("admin role services", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("groupAdminService checks and assigns admins", async () => {
    groupRepo.findGroupAdmin.mockResolvedValue({ id: "a1" });
    await expect(groupAdminService.isGroupAdmin("u1", "g1")).resolves.toBe(true);

    groupRepo.findGroupAdmin.mockResolvedValue(null);
    await expect(groupAdminService.isGroupAdmin("u1", "g1")).resolves.toBe(false);

    await groupAdminService.assignGroupAdmin({
      groupId: "g1",
      userId: "u1",
      assignedBy: "owner",
    });
    expect(groupRepo.upsertGroupAdmin).toHaveBeenCalledWith({
      id: "uuid-123",
      groupId: "g1",
      userId: "u1",
      role: "ADMIN",
      assignedBy: "owner",
    });
  });

  test("groupAdminService transferGroupAdmin handles owner and non-owner", async () => {
    await groupAdminService.transferGroupAdmin({
      groupId: "g1",
      fromUserId: "u1",
      toUserId: "u2",
      fromRole: "ADMIN",
      toRole: "ADMIN",
    });
    expect(groupRepo.updateGroupAdmin).toHaveBeenCalledTimes(1);
    expect(groupRepo.updateGroupAdmin).toHaveBeenCalledWith("g1", "u2", "ADMIN");

    jest.clearAllMocks();
    await groupAdminService.transferGroupAdmin({
      groupId: "g1",
      fromUserId: "u1",
      toUserId: "u2",
      fromRole: "OWNER",
      toRole: "ADMIN",
    });
    expect(groupRepo.updateGroupAdmin).toHaveBeenCalledTimes(2);
    expect(groupRepo.updateGroupAdmin).toHaveBeenNthCalledWith(1, "g1", "u2", "ADMIN");
    expect(groupRepo.updateGroupAdmin).toHaveBeenNthCalledWith(2, "g1", "u2", "OWNER");
  });

  test("meetingAdminService checks and assigns admins", async () => {
    meetingRepo.findMeetingAdmin.mockResolvedValue({ id: "m1" });
    await expect(meetingAdminService.isMeetingAdmin("u1", "m1")).resolves.toBe(true);

    meetingRepo.findMeetingAdmin.mockResolvedValue(undefined);
    await expect(meetingAdminService.isMeetingAdmin("u1", "m1")).resolves.toBe(false);

    await meetingAdminService.assignMeetingAdmin({
      meetingId: "m1",
      userId: "u1",
      role: "ADMIN",
      assignedBy: "owner",
    });
    expect(meetingRepo.upsertMeetingAdmin).toHaveBeenCalledWith({
      id: "uuid-123",
      meetingId: "m1",
      userId: "u1",
      role: "ADMIN",
      assignedBy: "owner",
    });
  });
});
