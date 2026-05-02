const express = require("express");
const request = require("supertest");

jest.mock("../../../src/config/db", () => ({
  promise: jest.fn(() => ({ execute: jest.fn(), getConnection: jest.fn() })),
  getConnection: jest.fn(),
  on: jest.fn(),
}));

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
jest.mock("../../../src/middleware/uploadMiddleware", () => (req, res, next) =>
  next()
);

jest.mock("../../../src/repositories/meetingRepository", () => ({
  findGroupById: jest.fn(),
  countScheduledOverlap: jest.fn(),
  insertMeeting: jest.fn(),
  getGroupAdminsWithRoles: jest.fn(),
  getMemberIdsByGroupId: jest.fn(),
  getGroupOwnerUserId: jest.fn(),
  listMeetingsForMember: jest.fn(),
  listMeetingsSuperAdmin: jest.fn(),
  listMeetingsForAdministrator: jest.fn(),
  attachAdminsToMeetings: jest.fn(),
  findMeetingById: jest.fn(),
  findGroupMembership: jest.fn(),
  updateMeetingById: jest.fn(),
  findMeetingSeriesById: jest.fn(),
  setMeetingWeeklyAndSeries: jest.fn(),
  setMeetingWeeklyOnly: jest.fn(),
  deleteMeetingsBySeriesId: jest.fn(),
  deleteMeetingSeriesById: jest.fn(),
  deleteMeetingById: jest.fn(),
  getFirstGroupAdminUserId: jest.fn(),
  findMeetingParticipant: jest.fn(),
  insertMeetingParticipant: jest.fn(),
  deleteMeetingParticipant: jest.fn(),
  listMeetingParticipants: jest.fn(),
}));
jest.mock("../../../src/repositories/groupContentRepository", () => ({
  findFirstContentByGroupId: jest.fn(),
  insertResource: jest.fn(),
}));
jest.mock("../../../src/validators/meetingValidator", () => ({
  validateCreateMeeting: jest.fn(),
  assertAuthenticatedUserId: jest.fn(),
  validateMeetingIdParam: jest.fn(),
  validateRecordingIfPresent: jest.fn(),
  validateDateRange: jest.fn(),
  validateStatusValue: jest.fn(),
}));
jest.mock("../../../src/utils/meetingQueryFilter", () => ({
  parseWeeklyFlag: jest.fn(() => false),
  getDateFilterForMeetings: jest.fn(() => null),
}));
jest.mock("../../../src/services/groupAdminService", () => ({
  isGroupAdmin: jest.fn(),
}));
jest.mock("../../../src/services/meetingAdminService", () => ({
  isMeetingAdmin: jest.fn(),
  assignMeetingAdmin: jest.fn(),
}));
jest.mock("../../../src/services/notificatioService", () => ({
  createNotification: jest.fn(),
}));
jest.mock("../../../src/services/meetingRecurrenceScheduler", () => ({
  activateWeeklySeries: jest.fn(),
  deactivateSeriesInDb: jest.fn(),
  reactivateSeriesInDb: jest.fn(),
}));
jest.mock("../../../src/middleware/uploadFile", () => ({
  uploadToCloudinary: jest.fn(),
  uploadToCloudinaryResources: jest.fn(),
}));
jest.mock("../../../src/validators/validateFiles", () => ({
  validateFileType: jest.fn(),
}));

const meetingRoute = require("../../../src/routes/meetingRoute");
const repo = require("../../../src/repositories/meetingRepository");
const meetingValidator = require("../../../src/validators/meetingValidator");
const { isGroupAdmin } = require("../../../src/services/groupAdminService");
const { isMeetingAdmin } = require("../../../src/services/meetingAdminService");

describe("meeting", () => {
  const app = express();
  app.use(express.json());
  app.use("/api/meeting", meetingRoute);

  beforeEach(() => {
    jest.clearAllMocks();
    meetingValidator.validateCreateMeeting.mockReturnValue({ isWeekly: false });
    repo.findGroupById.mockResolvedValue({ id: "g1" });
    isGroupAdmin.mockResolvedValue(true);
    repo.countScheduledOverlap.mockResolvedValue([]);
    repo.insertMeeting.mockResolvedValue();
    repo.getGroupAdminsWithRoles.mockResolvedValue([]);
    repo.getMemberIdsByGroupId.mockResolvedValue([]);
    repo.listMeetingsForMember.mockResolvedValue([{ id: "m1" }]);
    repo.listMeetingsSuperAdmin.mockResolvedValue([{ id: "m1" }]);
    repo.listMeetingsForAdministrator.mockResolvedValue([{ id: "m1" }]);
    repo.attachAdminsToMeetings.mockImplementation(async (rows) => rows);
    repo.findMeetingById.mockResolvedValue({
      id: "m1",
      title: "T",
      group_id: "g1",
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 3600000).toISOString(),
      status: "Scheduled",
      is_weekly: 0,
      series_id: "s1",
    });
    isMeetingAdmin.mockResolvedValue(true);
    meetingValidator.validateDateRange.mockReturnValue({
      newStart: new Date(),
      newEnd: new Date(Date.now() + 3600000),
    });
    repo.updateMeetingById.mockResolvedValue();
    repo.findMeetingSeriesById.mockResolvedValue({ id: "s1" });
    repo.deleteMeetingById.mockResolvedValue();
    repo.findMeetingParticipant.mockResolvedValue(null);
    repo.insertMeetingParticipant.mockResolvedValue();
    repo.deleteMeetingParticipant.mockResolvedValue(1);
    repo.listMeetingParticipants.mockResolvedValue([{ user_id: "u1" }]);
  });

  test("GET /api/meeting returns 200", async () => {
    const res = await request(app).get("/api/meeting");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(repo.listMeetingsSuperAdmin).toHaveBeenCalledTimes(1);
  });

  test("POST /api/meeting returns 201", async () => {
    const res = await request(app).post("/api/meeting").send({
      title: "Weekly Sync",
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      group_id: "g1",
      status: "Scheduled",
      description: "desc",
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Meeting created successfully");
    expect(repo.insertMeeting).toHaveBeenCalledTimes(1);
  });

  test("GET /api/meeting/:id returns 200", async () => {
    const res = await request(app).get("/api/meeting/m1");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(repo.findMeetingById).toHaveBeenCalledTimes(1);
  });

  test("PUT /api/meeting/:id returns 200", async () => {
    const res = await request(app).put("/api/meeting/m1").send({ title: "Updated" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Meeting updated successfully");
    expect(repo.updateMeetingById).toHaveBeenCalledTimes(1);
  });

  test("PATCH /api/meeting/:id/deactivate-recurrence returns 200", async () => {
    const res = await request(app).patch("/api/meeting/m1/deactivate-recurrence");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(repo.findMeetingSeriesById).toHaveBeenCalledTimes(1);
  });

  test("POST /api/meeting/:id/activate-recurrence returns 200 + series_id", async () => {
    repo.findMeetingSeriesById.mockResolvedValueOnce(null);
    const res = await request(app).post("/api/meeting/m1/activate-recurrence");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.series_id).toBe("s1");
    expect(repo.findMeetingById).toHaveBeenCalledTimes(1);
  });

  test("DELETE /api/meeting/:id?scope=series returns 200 (series message)", async () => {
    const res = await request(app).delete("/api/meeting/m1?scope=series");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Meeting series deleted successfully");
    expect(repo.deleteMeetingsBySeriesId).toHaveBeenCalledTimes(1);
  });

  test("POST /api/meeting/:id/join returns 201", async () => {
    const res = await request(app).post("/api/meeting/m1/join");
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Joined the meeting successfully");
    expect(repo.insertMeetingParticipant).toHaveBeenCalledTimes(1);
  });

  test("POST /api/meeting/:id/join returns 200 when already joined", async () => {
    repo.findMeetingParticipant.mockResolvedValueOnce({ id: "p1" });
    const res = await request(app).post("/api/meeting/m1/join");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("You are already in this meeting");
  });

  test("POST /api/meeting/:id/leave returns 200", async () => {
    const res = await request(app).post("/api/meeting/m1/leave");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Left the meeting successfully");
    expect(repo.deleteMeetingParticipant).toHaveBeenCalledTimes(1);
  });

  test("GET /api/meeting/:id/participants returns 200", async () => {
    const res = await request(app).get("/api/meeting/m1/participants");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(repo.listMeetingParticipants).toHaveBeenCalledTimes(1);
  });
});
