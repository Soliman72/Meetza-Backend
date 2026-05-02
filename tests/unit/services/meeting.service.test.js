jest.mock("uuid", () => ({ v4: jest.fn(() => "mocked-uuid") }));
jest.mock("../../../src/repositories/meetingRepository");
jest.mock("../../../src/repositories/groupContentRepository");
jest.mock("../../../src/validators/meetingValidator");
jest.mock("../../../src/utils/meetingQueryFilter");
jest.mock("../../../src/services/groupAdminService");
jest.mock("../../../src/services/meetingAdminService");
jest.mock("../../../src/services/notificatioService");
jest.mock("../../../src/services/meetingRecurrenceScheduler");
jest.mock("../../../src/middleware/uploadFile");
jest.mock("../../../src/validators/validateFiles");
jest.mock("../../../src/utils/groupAccess");

const meetingService = require("../../../src/services/meetingService");
const repo = require("../../../src/repositories/meetingRepository");
const groupContentRepo = require("../../../src/repositories/groupContentRepository");
const meetingValidator = require("../../../src/validators/meetingValidator");
const { getDateFilterForMeetings, parseWeeklyFlag } = require("../../../src/utils/meetingQueryFilter");
const { isGroupAdmin } = require("../../../src/services/groupAdminService");
const { isMeetingAdmin, assignMeetingAdmin } = require("../../../src/services/meetingAdminService");
const { createNotification } = require("../../../src/services/notificatioService");
const { activateWeeklySeries, deactivateSeriesInDb, reactivateSeriesInDb } = require("../../../src/services/meetingRecurrenceScheduler");
const { uploadToCloudinary } = require("../../../src/middleware/uploadFile");
const { ensureGroupAccess } = require("../../../src/utils/groupAccess");

describe("meetingService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createMeeting", () => {
    test("creates standard meeting successfully", async () => {
      const req = {
        body: { title: "Meet", start_time: "2024-01-01T10:00:00Z", end_time: "2024-01-01T11:00:00Z", group_id: "g1", weekly: false },
        user: { id: "u1" },
        isSuperAdmin: true,
      };

      meetingValidator.validateCreateMeeting.mockReturnValue({ isWeekly: false });
      repo.findGroupById.mockResolvedValue({ id: "g1" });
      repo.countScheduledOverlap.mockResolvedValue([]); // no overlap
      repo.getGroupAdminsWithRoles.mockResolvedValue([{ user_id: "u2", role: "ADMIN" }]);
      repo.getMemberIdsByGroupId.mockResolvedValue(["u3"]);

      const result = await meetingService.createMeeting(req);

      expect(repo.insertMeeting).toHaveBeenCalledWith(expect.objectContaining({
        title: "Meet",
        is_weekly: 0,
      }));
      expect(assignMeetingAdmin).toHaveBeenCalled();
      expect(createNotification).toHaveBeenCalled();
      expect(result.id).toBe("mocked-uuid");
    });

    test("creates weekly meeting and activates series", async () => {
      const req = {
        body: { title: "Weekly Meet", start_time: "2024-01-01T10:00:00Z", end_time: "2024-01-01T11:00:00Z", group_id: "g1", weekly: true },
        user: { id: "u1" },
        isSuperAdmin: true,
      };

      meetingValidator.validateCreateMeeting.mockReturnValue({ isWeekly: true });
      repo.findGroupById.mockResolvedValue({ id: "g1" });
      repo.countScheduledOverlap.mockResolvedValue([]); 
      repo.getGroupAdminsWithRoles.mockResolvedValue([]);
      repo.getMemberIdsByGroupId.mockResolvedValue([]);

      const result = await meetingService.createMeeting(req);

      expect(activateWeeklySeries).toHaveBeenCalled();
      expect(result.weekly).toBe(true);
      expect(result.series_id).toBe("mocked-uuid");
    });

    test("throws if overlap exists", async () => {
      const req = {
        body: { title: "Meet", group_id: "g1" },
        user: { id: "u1" },
        isSuperAdmin: true,
      };

      meetingValidator.validateCreateMeeting.mockReturnValue({ isWeekly: false });
      repo.findGroupById.mockResolvedValue({ id: "g1" });
      repo.countScheduledOverlap.mockResolvedValue([{ id: "m1" }]); 

      await expect(meetingService.createMeeting(req)).rejects.toThrow("This group already has a Scheduled meeting at that time.");
    });
  });

  describe("getAllMeetings", () => {
    test("returns meetings for Member", async () => {
      getDateFilterForMeetings.mockReturnValue({});
      ensureGroupAccess.mockResolvedValue(true);
      repo.listMeetingsForMember.mockResolvedValue([{ id: "m1" }]);
      repo.attachAdminsToMeetings.mockReturnValue([{ id: "m1", admins: [] }]);

      const req = { user: { id: "u1", role: "Member" }, query: { group_id: "g1" } };
      const result = await meetingService.getAllMeetings(req);

      expect(repo.listMeetingsForMember).toHaveBeenCalled();
      expect(result).toEqual([{ id: "m1", admins: [] }]);
    });

    test("returns meetings for Super_Admin", async () => {
      getDateFilterForMeetings.mockReturnValue({});
      repo.listMeetingsSuperAdmin.mockResolvedValue([{ id: "m1" }]);
      repo.attachAdminsToMeetings.mockReturnValue([{ id: "m1", admins: [] }]);

      const req = { user: { id: "u1", role: "Super_Admin" }, query: {} };
      const result = await meetingService.getAllMeetings(req);

      expect(repo.listMeetingsSuperAdmin).toHaveBeenCalled();
      expect(result).toEqual([{ id: "m1", admins: [] }]);
    });
  });

  describe("getMeetingById", () => {
    test("returns meeting for meeting admin", async () => {
      repo.findMeetingById.mockResolvedValue({ id: "m1", group_id: "g1" });
      isMeetingAdmin.mockResolvedValue(true);
      repo.attachAdminsToMeetings.mockResolvedValue([{ id: "m1" }]);

      const req = { params: { id: "m1" }, user: { id: "u1" } };
      const result = await meetingService.getMeetingById(req);

      expect(result).toEqual({ id: "m1" });
    });

    test("throws 403 if no access", async () => {
      repo.findMeetingById.mockResolvedValue({ id: "m1", group_id: "g1" });
      isMeetingAdmin.mockResolvedValue(false);
      repo.findGroupMembership.mockResolvedValue(null);

      const req = { params: { id: "m1" }, user: { id: "u1" } };
      await expect(meetingService.getMeetingById(req)).rejects.toThrow("You do not have access to this meeting");
    });
  });

  describe("updateMeetingById", () => {
    test("updates successfully and handles weekly toggle", async () => {
      const req = {
        params: { id: "m1" },
        body: { title: "New Title", weekly: true },
        user: { id: "u1", role: "Super_Admin" },
      };

      repo.findMeetingById.mockResolvedValue({ id: "m1", group_id: "g1", is_weekly: 0, series_id: null });
      meetingValidator.validateDateRange.mockReturnValue({ newStart: new Date(), newEnd: new Date() });
      parseWeeklyFlag.mockReturnValue(true);

      const result = await meetingService.updateMeetingById(req);

      expect(repo.updateMeetingById).toHaveBeenCalled();
      expect(activateWeeklySeries).toHaveBeenCalled(); // Since it toggled to true and had no series_id
      expect(repo.updateMeetingSeriesTemplate).toHaveBeenCalled(); // Should sync template because title changed
      expect(result.ok).toBe(true);
    });

    test("throws if overlap exists on status Scheduled", async () => {
      const req = {
        params: { id: "m1" },
        body: { title: "New Title", status: "Scheduled" },
        user: { id: "u1", role: "Super_Admin" },
      };

      repo.findMeetingById.mockResolvedValue({ id: "m1", status: "Scheduled" });
      meetingValidator.validateDateRange.mockReturnValue({ newStart: new Date(), newEnd: new Date() });
      repo.countScheduledOverlap.mockResolvedValue([{ id: "m2" }]);

      await expect(meetingService.updateMeetingById(req)).rejects.toThrow("This group already has a Scheduled meeting at that time.");
    });
  });

  describe("deactivateMeetingRecurrence", () => {
    test("deactivates successfully", async () => {
      repo.findMeetingById.mockResolvedValue({ id: "m1", series_id: "s1" });
      isMeetingAdmin.mockResolvedValue(true);
      repo.findMeetingSeriesById.mockResolvedValue({ id: "s1" });

      await meetingService.deactivateMeetingRecurrence({ params: { id: "m1" }, user: { id: "u1" } });

      expect(deactivateSeriesInDb).toHaveBeenCalledWith("s1");
    });
  });

  describe("deleteMeetingById", () => {
    test("deletes single meeting", async () => {
      repo.findMeetingById.mockResolvedValue({ id: "m1" });
      isMeetingAdmin.mockResolvedValue(true);

      await meetingService.deleteMeetingById({ params: { id: "m1" }, query: { scope: "single" }, user: { id: "u1" } });

      expect(repo.deleteMeetingById).toHaveBeenCalledWith("m1");
    });

    test("deletes entire series", async () => {
      repo.findMeetingById.mockResolvedValue({ id: "m1", series_id: "s1" });
      isMeetingAdmin.mockResolvedValue(true);

      await meetingService.deleteMeetingById({ params: { id: "m1" }, query: { scope: "series" }, user: { id: "u1" } });

      expect(deactivateSeriesInDb).toHaveBeenCalledWith("s1");
      expect(repo.deleteMeetingsBySeriesId).toHaveBeenCalledWith("s1");
      expect(repo.deleteMeetingSeriesById).toHaveBeenCalledWith("s1");
    });
  });

  describe("joinMeeting & leaveMeeting", () => {
    test("join successfully creates participant", async () => {
      repo.findMeetingById.mockResolvedValue({ id: "m1", group_id: "g1" });
      repo.findGroupMembership.mockResolvedValue({ user_id: "u1" });
      repo.findMeetingParticipant.mockResolvedValue(null);

      const result = await meetingService.joinMeeting({ params: { id: "m1" }, user: { id: "u1", role: "Member" } });

      expect(repo.insertMeetingParticipant).toHaveBeenCalled();
      expect(result.already).toBe(false);
    });

    test("leave successfully deletes participant", async () => {
      repo.deleteMeetingParticipant.mockResolvedValue(1);
      const result = await meetingService.leaveMeeting({ params: { id: "m1" }, user: { id: "u1" } });
      expect(result.ok).toBe(true);
    });
  });
});
