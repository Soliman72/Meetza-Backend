jest.mock("uuid", () => ({ v4: jest.fn(() => "mocked-uuid") }));
jest.mock("validator", () => ({
  isURL: jest.fn().mockReturnValue(false),
}));
jest.mock("../../../src/repositories/chatRepository");
jest.mock("../../../src/validators/chatValidator");
jest.mock("../../../src/services/chatMessageService");
jest.mock("../../../src/utils/groupAccess");
jest.mock("../../../src/middleware/uploadFile");
jest.mock("../../../src/services/chatSocketService");

const chatService = require("../../../src/services/chatService");
const chatRepo = require("../../../src/repositories/chatRepository");
const chatValidator = require("../../../src/validators/chatValidator");
const chatMessageService = require("../../../src/services/chatMessageService");
const { ensureGroupAccess } = require("../../../src/utils/groupAccess");
const { uploadToCloudinaryResources } = require("../../../src/middleware/uploadFile");
const { broadcastMessage, getChatIo } = require("../../../src/services/chatSocketService");
const validator = require("validator");

describe("chatService", () => {
  let mockIo;

  beforeEach(() => {
    jest.clearAllMocks();

    mockIo = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };
    getChatIo.mockReturnValue(mockIo);
  });

  describe("getMyGroups", () => {
    test("returns groups for Super_Admin", async () => {
      chatRepo.getUserRole.mockResolvedValue("Super_Admin");
      chatRepo.getMyGroupsSuperAdmin.mockResolvedValue([{ id: "g1" }]);

      const result = await chatService.getMyGroups({ user: { id: "u1" } });
      expect(chatRepo.getMyGroupsSuperAdmin).toHaveBeenCalled();
      expect(result).toEqual([{ id: "g1" }]);
    });

    test("returns groups for Member", async () => {
      chatRepo.getUserRole.mockResolvedValue("Member");
      chatRepo.getMyGroupsForUser.mockResolvedValue([{ id: "g2" }]);

      const result = await chatService.getMyGroups({ user: { id: "u1" } });
      expect(chatRepo.getMyGroupsForUser).toHaveBeenCalledWith("u1");
      expect(result).toEqual([{ id: "g2" }]);
    });
  });

  describe("getUnreadGroups", () => {
    test("returns unread groups", async () => {
      chatRepo.getUnreadGroups.mockResolvedValue([{ id: "g1", unread: 2 }]);
      const result = await chatService.getUnreadGroups({ user: { id: "u1" } });
      expect(result).toEqual([{ id: "g1", unread: 2 }]);
    });
  });

  describe("getGroupMessages", () => {
    test("returns standard messages", async () => {
      chatMessageService.getMessages.mockResolvedValue([{ id: "m1" }]);
      const result = await chatService.getGroupMessages({
        user: { id: "u1" },
        params: { groupId: "g1" },
        query: { limit: 10 },
      });
      expect(chatMessageService.getMessages).toHaveBeenCalledWith("g1", { limit: 10, before: undefined, userId: "u1" });
      expect(result).toEqual([{ id: "m1" }]);
    });

    test("calls searchMessages if searchMessage is provided", async () => {
      chatValidator.validateSearchMessage.mockReturnValue("hello");
      chatMessageService.searchMessages.mockResolvedValue([{ id: "m2" }]);
      
      const result = await chatService.getGroupMessages({
        user: { id: "u1" },
        params: { groupId: "g1" },
        query: { limit: 10, searchMessage: "hello " },
      });

      expect(chatMessageService.searchMessages).toHaveBeenCalledWith("g1", "hello", { limit: 10, userId: "u1" });
      expect(result).toEqual([{ id: "m2" }]);
    });
  });

  describe("processSendMessageAfterUpload", () => {
    test("throws if no message and no media", async () => {
      const req = { user: { id: "u1" }, params: { groupId: "g1" }, body: {}, files: {} };
      await expect(chatService.processSendMessageAfterUpload(req)).rejects.toThrow("Either message text or media file is required");
    });

    test("saves message and broadcasts it", async () => {
      const req = {
        user: { id: "u1" },
        params: { groupId: "g1" },
        body: { message: "Hello" },
      };
      
      chatMessageService.saveMessage.mockResolvedValue({ id: "m1", text: "Hello" });

      const result = await chatService.processSendMessageAfterUpload(req);

      expect(chatMessageService.saveMessage).toHaveBeenCalledWith("g1", "u1", "Hello", [], null);
      expect(broadcastMessage).toHaveBeenCalledWith({ id: "m1", text: "Hello" });
      expect(result).toEqual({ id: "m1", text: "Hello" });
    });

    test("handles URL messages as links", async () => {
      validator.isURL.mockReturnValueOnce(true);
      const req = {
        user: { id: "u1" },
        params: { groupId: "g1" },
        body: { message: "http://example.com" },
      };
      
      chatMessageService.saveMessage.mockResolvedValue({ id: "m1" });

      await chatService.processSendMessageAfterUpload(req);

      const mediaArg = chatMessageService.saveMessage.mock.calls[0][3];
      expect(mediaArg[0].mediaType).toBe("link");
      expect(mediaArg[0].mediaUrl).toBe("http://example.com");
    });

    test("uploads files and saves message", async () => {
      const file = { originalname: "test.jpg", mimetype: "image/jpeg" };
      const req = {
        user: { id: "u1" },
        params: { groupId: "g1" },
        body: { message: "Look at this" },
        files: { media: [file] }
      };

      uploadToCloudinaryResources.mockResolvedValue("http://cloudinary.com/img.jpg");
      chatMessageService.saveMessage.mockResolvedValue({ id: "m1" });

      await chatService.processSendMessageAfterUpload(req);

      const mediaArg = chatMessageService.saveMessage.mock.calls[0][3];
      expect(mediaArg[0].mediaType).toBe("image");
      expect(mediaArg[0].mediaUrl).toBe("http://cloudinary.com/img.jpg");
    });
  });

  describe("deleteMessage", () => {
    test("deletes as Administrator", async () => {
      ensureGroupAccess.mockResolvedValue({ membership_role: "Administrator" });
      chatRepo.deleteGroupMessageAsAdmin.mockResolvedValue(1);

      await expect(chatService.deleteMessage({ user: { id: "u1" }, params: { groupId: "g1", messageId: "m1" } })).resolves.toBeUndefined();
      expect(chatRepo.deleteGroupMessageAsAdmin).toHaveBeenCalledWith("m1", "g1");
    });

    test("deletes as Member (sender)", async () => {
      ensureGroupAccess.mockResolvedValue({ membership_role: "Member" });
      chatRepo.deleteGroupMessageAsSender.mockResolvedValue(1);

      await expect(chatService.deleteMessage({ user: { id: "u1" }, params: { groupId: "g1", messageId: "m1" } })).resolves.toBeUndefined();
      expect(chatRepo.deleteGroupMessageAsSender).toHaveBeenCalledWith("m1", "g1", "u1");
    });

    test("throws 403 for other roles", async () => {
      ensureGroupAccess.mockResolvedValue({ membership_role: "Guest" });
      await expect(chatService.deleteMessage({ user: { id: "u1" }, params: { groupId: "g1", messageId: "m1" } })).rejects.toThrow("You do not have permission to delete messages in this group");
    });

    test("throws 404 if no rows affected", async () => {
      ensureGroupAccess.mockResolvedValue({ membership_role: "Administrator" });
      chatRepo.deleteGroupMessageAsAdmin.mockResolvedValue(0);
      await expect(chatService.deleteMessage({ user: { id: "u1" }, params: { groupId: "g1", messageId: "m1" } })).rejects.toThrow("Message not found or you are not authorized to delete it");
    });
  });

  describe("updateMessage", () => {
    test("updates successfully", async () => {
      chatRepo.updateGroupMessageText.mockResolvedValue(1);
      chatRepo.getMessageById.mockResolvedValue({ id: "m1", text: "New" });

      const result = await chatService.updateMessage({
        user: { id: "u1" },
        params: { groupId: "g1", messageId: "m1" },
        body: { message: "New" }
      });
      expect(result.text).toBe("New");
    });

    test("throws 404 if no rows affected", async () => {
      chatRepo.updateGroupMessageText.mockResolvedValue(0);
      await expect(chatService.updateMessage({
        user: { id: "u1" },
        params: { groupId: "g1", messageId: "m1" },
        body: { message: "New" }
      })).rejects.toThrow("Message not found or you are not the sender");
    });
  });

  describe("getGroupInfo", () => {
    test("returns combined group info", async () => {
      ensureGroupAccess.mockResolvedValue({ id: "g1", administrator_id: "a1" });
      chatRepo.getGroupMembersForInfo.mockResolvedValue([{ id: "m1" }]);
      chatRepo.getGroupMedia.mockResolvedValue([{ id: "media1" }]);
      chatRepo.getFirstGroupContentRow.mockResolvedValue({ id: "c1" });
      chatRepo.getGroupContentResources.mockResolvedValue([{ id: "r1", file_type: "pdf" }]);
      chatMessageService.determineResourceCategory.mockReturnValue("document");

      const result = await chatService.getGroupInfo({ user: { id: "u1" }, params: { groupId: "g1" } });

      expect(result.group.id).toBe("g1");
      expect(result.members.length).toBe(1);
      expect(result.media.length).toBe(1);
      expect(result.content.resources[0].category).toBe("document");
    });
  });

  describe("markMessageAsRead", () => {
    test("marks message and emits event", async () => {
      chatMessageService.markMessageAsRead.mockResolvedValue(true);
      chatRepo.getUserName.mockResolvedValue("Ali");

      await chatService.markMessageAsRead({ user: { id: "u1" }, params: { groupId: "g1", messageId: "m1" } });

      expect(chatMessageService.markMessageAsRead).toHaveBeenCalledWith("m1", "u1");
      expect(mockIo.to).toHaveBeenCalledWith("group:g1");
      expect(mockIo.emit).toHaveBeenCalledWith("messageRead", expect.objectContaining({ userId: "u1", userName: "Ali" }));
    });
  });
});
