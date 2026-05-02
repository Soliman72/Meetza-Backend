jest.mock("../../../src/repositories/notificationRepository");
jest.mock("../../../src/repositories/notificationPendingGroupActionRepository");
jest.mock("../../../src/services/notificationBuilder");
jest.mock("../../../src/sockets/notificationSocket");
jest.mock("../../../src/validators/notificationValidator");
jest.mock("../../../src/repositories/userRepository");
jest.mock("../../../src/utils/sendEmail");

const notificatioService = require("../../../src/services/notificatioService");
const repo = require("../../../src/repositories/notificationRepository");
const notificationPendingGroupActionRepo = require("../../../src/repositories/notificationPendingGroupActionRepository");
const { buildNotification } = require("../../../src/services/notificationBuilder");
const emitter = require("../../../src/sockets/notificationSocket");
const notificationValidator = require("../../../src/validators/notificationValidator");
const userRepository = require("../../../src/repositories/userRepository");
const sendEmail = require("../../../src/utils/sendEmail");

describe("notificatioService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getMemberNotifications", () => {
    test("returns notifications for a member", async () => {
      repo.getByMemberId.mockResolvedValue([{ id: "n1" }]);
      const result = await notificatioService.getMemberNotifications("u1");
      expect(result).toEqual([{ id: "n1" }]);
      expect(repo.getByMemberId).toHaveBeenCalledWith("u1");
    });
  });

  describe("getUnreadCount", () => {
    test("returns unread count", async () => {
      repo.countUnread.mockResolvedValue(5);
      const result = await notificatioService.getUnreadCount("u1");
      expect(result).toBe(5);
      expect(repo.countUnread).toHaveBeenCalledWith("u1");
    });
  });

  describe("markAsRead", () => {
    test("marks read and emits updated count", async () => {
      repo.markAsRead.mockResolvedValue(true);
      repo.countUnread.mockResolvedValue(4);

      const result = await notificatioService.markAsRead("n1", "u1");

      expect(repo.markAsRead).toHaveBeenCalledWith("n1", "u1");
      expect(emitter.emitUnreadCount).toHaveBeenCalledWith("u1", 4);
      expect(result).toBe(true);
    });

    test("does not emit if update fails", async () => {
      repo.markAsRead.mockResolvedValue(false);
      const result = await notificatioService.markAsRead("n1", "u1");
      expect(emitter.emitUnreadCount).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe("markAllAsRead", () => {
    test("marks all as read and emits 0", async () => {
      await notificatioService.markAllAsRead("u1");
      expect(repo.markAllAsRead).toHaveBeenCalledWith("u1");
      expect(emitter.emitUnreadCount).toHaveBeenCalledWith("u1", 0);
    });
  });

  describe("deleteNotification", () => {
    test("deletes and emits updated count", async () => {
      repo.remove.mockResolvedValue(true);
      repo.countUnread.mockResolvedValue(3);

      const result = await notificatioService.deleteNotification("n1", "u1");

      expect(repo.remove).toHaveBeenCalledWith("n1", "u1");
      expect(emitter.emitUnreadCount).toHaveBeenCalledWith("u1", 3);
      expect(result).toBe(true);
    });
  });

  describe("createNotification", () => {
    test("creates notification, emits, and sends email", async () => {
      buildNotification.mockReturnValue({ id: "n1", title: "Test" });
      repo.create.mockResolvedValue(true);
      repo.countUnread.mockResolvedValue(2);
      userRepository.findById.mockResolvedValue({ name: "Sender Name" });
      userRepository.getEmailById.mockResolvedValue({ email: "test@test.com" });
      sendEmail.mockResolvedValue(true);

      const result = await notificatioService.createNotification({
        senderId: "s1",
        memberId: "u1",
        title: "Test",
        message: "Message",
        emailActions: { approveUrl: "url", rejectUrl: "url" }
      });

      expect(notificationValidator.createNotificationValidator).toHaveBeenCalled();
      expect(repo.create).toHaveBeenCalled();
      expect(emitter.emitNotification).toHaveBeenCalled();
      expect(emitter.emitUnreadCount).toHaveBeenCalledWith("u1", 2);
      expect(sendEmail).toHaveBeenCalled();
      expect(result.id).toBe("n1");
    });

    test("skips email if skipEmail is true", async () => {
      buildNotification.mockReturnValue({ id: "n1" });
      repo.create.mockResolvedValue(true);

      await notificatioService.createNotification({
        senderId: "s1",
        memberId: "u1",
        skipEmail: true
      });

      expect(emitter.emitNotification).toHaveBeenCalled();
      expect(sendEmail).not.toHaveBeenCalled();
    });

    test("handles pending group actions", async () => {
      buildNotification.mockReturnValue({ id: "n1" });
      repo.create.mockResolvedValue(true);
      userRepository.getEmailById.mockResolvedValue({ email: "test@test.com" });

      await notificatioService.createNotification({
        senderId: "s1",
        memberId: "u1",
        pendingGroupApproval: { pendingGroupId: "g1", approveUrl: "url1", rejectUrl: "url2" }
      });

      expect(notificationPendingGroupActionRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        pendingGroupId: "g1",
        approveUrl: "url1"
      }));
    });
  });

  describe("handleCommentNotifications", () => {
    test("notifies video owner", async () => {
      buildNotification.mockReturnValue({ id: "n1" });
      userRepository.getEmailById.mockResolvedValue({ email: "a@b.com" });

      await notificatioService.handleCommentNotifications({
        user_id: "u1",
        video: { title: "Vid" },
        commenter: { name: "Ali" },
        video_owner: { user_id: "owner1" }
      });

      expect(repo.create).toHaveBeenCalled(); // via createNotification
    });

    test("notifies parent owner and video owner if parent exists", async () => {
      buildNotification.mockReturnValue({ id: "n1" });
      userRepository.getEmailById.mockResolvedValue({ email: "a@b.com" });

      await notificatioService.handleCommentNotifications({
        user_id: "u1",
        video: { title: "Vid" },
        parent: { id: "c1", user_id: "parentOwner" },
        commenter: { name: "Ali" },
        video_owner: { user_id: "owner1" }
      });

      // Should call createNotification twice
      expect(repo.create).toHaveBeenCalledTimes(2);
    });
  });

  describe("syncPendingGroupNotificationStatus", () => {
    test("updates status and emits for all recipients", async () => {
      notificationPendingGroupActionRepo.updateStatus.mockResolvedValue();
      notificationPendingGroupActionRepo.findRecipientsByPendingGroupId.mockResolvedValue([
        { member_id: "u1", notification_id: "n1", pending_group_id: "p1" },
        { member_id: "u2", notification_id: "n2", pending_group_id: "p1" }
      ]);

      await notificatioService.syncPendingGroupNotificationStatus("p1", "approved");

      expect(notificationPendingGroupActionRepo.updateStatus).toHaveBeenCalledWith({ pendingGroupId: "p1", status: "approved" });
      expect(emitter.emitPendingGroupNotificationStatus).toHaveBeenCalledTimes(2);
    });
  });
});
