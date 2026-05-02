const express = require("express");
const request = require("supertest");

jest.mock("../../../src/middleware/verifyToken", () => ({
  verifyToken: (req, res, next) => {
    req.user = { id: "u1" };
    next();
  },
}));

jest.mock("../../../src/repositories/chatRepository", () => ({
  getUserRole: jest.fn(),
  getMyGroupsSuperAdmin: jest.fn(),
  getMyGroupsForUser: jest.fn(),
  getUnreadGroups: jest.fn(),
  deleteGroupMessageAsAdmin: jest.fn(),
  deleteGroupMessageAsSender: jest.fn(),
  updateGroupMessageText: jest.fn(),
  getMessageById: jest.fn(),
  getGroupMembersForInfo: jest.fn(),
  getGroupMedia: jest.fn(),
  getFirstGroupContentRow: jest.fn(),
  getGroupContentResources: jest.fn(),
  getMeetingsForGroup: jest.fn(),
  getUserName: jest.fn(),
  getUserForReaction: jest.fn(),
}));
jest.mock("../../../src/repositories/groupRepository", () => ({
  getUserRole: jest.fn(),
  getGroupAsSuperAdmin: jest.fn(),
  getGroupWithAccess: jest.fn(),
  getGroupMedia: jest.fn(),
  getGroupAdmins: jest.fn(),
}));

jest.mock("../../../src/services/chatMessageService", () => ({
  saveMessage: jest.fn(),
  getMessages: jest.fn(),
  searchMessages: jest.fn(),
  markMessageAsRead: jest.fn(),
  markMessageAsUnread: jest.fn(),
  markMessagesAsRead: jest.fn(),
  getReadMessages: jest.fn(),
  getUnreadMessages: jest.fn(),
  getUnreadCount: jest.fn(),
  toggleReaction: jest.fn(),
  determineResourceCategory: jest.fn(() => "document"),
}));

jest.mock("../../../src/validators/chatValidator", () => ({
  requireUserId: jest.fn(),
  requireGroupId: jest.fn(),
  requireGroupAndMessageIds: jest.fn(),
  validateSearchMessage: jest.fn((v) => v),
  validateMeetingDate: jest.fn(() => null),
  validateEmoji: jest.fn((v) => v || "👍"),
}));

jest.mock("../../../src/middleware/uploadFile", () => ({
  upload: {
    fields: jest.fn(() => (req, res, cb) => cb()),
  },
  uploadToCloudinaryResources: jest.fn(),
}));

jest.mock("../../../src/services/chatSocketService", () => ({
  broadcastMessage: jest.fn(),
  getChatIo: jest.fn(() => null),
}));

jest.mock("../../../src/services/groupAccessHttpService", () => ({
  respondGroupAccessOrServerError: (res, error) =>
    res.status(error.status || 500).json({ success: false, message: error.message }),
}));

const chatRoute = require("../../../src/routes/chatRoute");
const chatRepository = require("../../../src/repositories/chatRepository");
const groupRepository = require("../../../src/repositories/groupRepository");
const chatMessageService = require("../../../src/services/chatMessageService");

describe("chat", () => {
  const app = express();
  app.use(express.json());
  app.use("/api/chat", chatRoute);

  beforeEach(() => {
    jest.clearAllMocks();
    groupRepository.getUserRole.mockResolvedValue("Administrator");
    groupRepository.getGroupWithAccess.mockResolvedValue({
      membership_role: "Administrator",
      administrator_id: "admin-1",
      group_id: "g1",
    });
    groupRepository.getGroupMedia.mockResolvedValue([]);
    groupRepository.getGroupAdmins.mockResolvedValue([]);
    chatRepository.getUserRole.mockResolvedValue("Member");
    chatRepository.getMyGroupsForUser.mockResolvedValue([{ id: "g1" }]);
    chatRepository.getUnreadGroups.mockResolvedValue([{ id: "g1" }]);
    chatMessageService.getMessages.mockResolvedValue([{ id: "m1", text: "hi" }]);
    chatMessageService.saveMessage.mockResolvedValue({ id: "msg1", group_id: "g1" });
    chatRepository.getGroupMembersForInfo.mockResolvedValue([{ user_id: "u1" }]);
    chatRepository.getGroupMedia.mockResolvedValue([]);
    chatRepository.getFirstGroupContentRow.mockResolvedValue(null);
    chatRepository.updateGroupMessageText.mockResolvedValue(1);
    chatRepository.getMessageById.mockResolvedValue({ id: "msg1", text: "edited" });
    chatRepository.deleteGroupMessageAsAdmin.mockResolvedValue(1);
    chatMessageService.getUnreadMessages.mockResolvedValue([{ id: "msg2" }]);
    chatMessageService.markMessagesAsRead.mockResolvedValue();
    chatMessageService.getReadMessages.mockResolvedValue([{ id: "msg1" }]);
    chatMessageService.getUnreadCount.mockResolvedValue(2);
    chatMessageService.toggleReaction.mockResolvedValue({
      reactions: [{ emoji: "👍", count: 1 }],
      action: "added",
    });
    chatRepository.getUserForReaction.mockResolvedValue({ id: "u1", name: "User" });
    chatRepository.getMeetingsForGroup.mockResolvedValue([{ id: "meet1" }]);
  });

  test("GET /api/chat/groups returns 200", async () => {
    const res = await request(app).get("/api/chat/groups");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(chatRepository.getMyGroupsForUser).toHaveBeenCalledTimes(1);
  });

  test("GET /api/chat/groups/unread returns 200", async () => {
    const res = await request(app).get("/api/chat/groups/unread");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(chatRepository.getUnreadGroups).toHaveBeenCalledTimes(1);
  });

  test("GET /api/chat/groups/:groupId/messages returns 200", async () => {
    const res = await request(app).get("/api/chat/groups/g1/messages");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(chatMessageService.getMessages).toHaveBeenCalledTimes(1);
  });

  test("POST /api/chat/groups/:groupId/messages returns 201", async () => {
    const res = await request(app).post("/api/chat/groups/g1/messages").send({ message: "hello" });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe("msg1");
    expect(chatMessageService.saveMessage).toHaveBeenCalledTimes(1);
  });

  test("POST /api/chat/groups/:groupId/messages returns 400 when upload middleware errors", async () => {
    const { upload } = require("../../../src/middleware/uploadFile");
    upload.fields.mockReturnValueOnce((req, res, cb) => cb(new Error("bad file")));
    const res = await request(app).post("/api/chat/groups/g1/messages").send({ message: "hello" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("bad file");
  });

  test("GET /api/chat/groups/:groupId/info returns 200", async () => {
    const res = await request(app).get("/api/chat/groups/g1/info");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(chatRepository.getGroupMedia).toHaveBeenCalledTimes(1);
  });

  test("PUT /api/chat/groups/:groupId/messages/:messageId/update returns 200", async () => {
    const res = await request(app)
      .put("/api/chat/groups/g1/messages/msg1/update")
      .send({ text: "edited" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Message updated successfully");
    expect(chatRepository.updateGroupMessageText).toHaveBeenCalledTimes(1);
  });

  test("DELETE /api/chat/groups/:groupId/messages/:messageId returns 200", async () => {
    const res = await request(app).delete("/api/chat/groups/g1/messages/msg1");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Message deleted successfully");
    expect(chatRepository.deleteGroupMessageAsAdmin).toHaveBeenCalledTimes(1);
  });

  test("PUT /api/chat/groups/:groupId/messages/:messageId/read returns 200", async () => {
    const res = await request(app).put("/api/chat/groups/g1/messages/msg1/read");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Message marked as read");
    expect(chatMessageService.markMessageAsRead).toHaveBeenCalledTimes(1);
  });

  test("PUT /api/chat/groups/:groupId/messages/:messageId/unread returns 200", async () => {
    const res = await request(app).put("/api/chat/groups/g1/messages/msg1/unread");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Message marked as unread");
    expect(chatMessageService.markMessageAsUnread).toHaveBeenCalledTimes(1);
  });

  test("PUT /api/chat/groups/:groupId/messages/read-all returns 200", async () => {
    const res = await request(app).put("/api/chat/groups/g1/messages/read-all");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("1 messages marked as read");
    expect(chatMessageService.markMessagesAsRead).toHaveBeenCalledTimes(1);
  });

  test("GET /api/chat/groups/:groupId/messages/read returns 200", async () => {
    const res = await request(app).get("/api/chat/groups/g1/messages/read");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(chatMessageService.getReadMessages).toHaveBeenCalledTimes(1);
  });

  test("GET /api/chat/groups/:groupId/messages/unread returns 200", async () => {
    const res = await request(app).get("/api/chat/groups/g1/messages/unread");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(chatMessageService.getUnreadMessages).toHaveBeenCalledTimes(1);
  });

  test("GET /api/chat/groups/:groupId/unread-count returns 200", async () => {
    const res = await request(app).get("/api/chat/groups/g1/unread-count");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.unread_count).toBe(2);
    expect(chatMessageService.getUnreadCount).toHaveBeenCalledTimes(1);
  });

  test("POST /api/chat/groups/:groupId/messages/:messageId/react returns 200", async () => {
    const res = await request(app).post("/api/chat/groups/g1/messages/msg1/react");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.action).toBe("added");
    expect(chatMessageService.toggleReaction).toHaveBeenCalledTimes(1);
  });

  test("GET /api/chat/groups/:groupId/meetings returns 200", async () => {
    const res = await request(app).get("/api/chat/groups/g1/meetings");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(chatRepository.getMeetingsForGroup).toHaveBeenCalledTimes(1);
  });

  test("GET /api/chat/groups returns 403 when service throws access error", async () => {
    chatRepository.getUserRole.mockRejectedValueOnce(
      Object.assign(new Error("Forbidden"), { status: 403 })
    );
    const res = await request(app).get("/api/chat/groups");
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Forbidden");
  });
});
