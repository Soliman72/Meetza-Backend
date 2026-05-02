jest.mock("../../../src/services/groupService");
jest.mock("../../../src/utils/pendingGroupEmailHelpers");
jest.mock("../../../src/validators/pendingGroupEmailActionValidator");

const groupController = require("../../../src/controllers/groupController");
const groupService = require("../../../src/services/groupService");
const pendingHelpers = require("../../../src/utils/pendingGroupEmailHelpers");
const pendingValidator = require("../../../src/validators/pendingGroupEmailActionValidator");
const { GroupAccessError } = require("../../../src/utils/groupAccess");

describe("groupController", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { body: {}, params: {}, query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      redirect: jest.fn(),
      type: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
  });

  describe("createGroup", () => {
    test("returns 201 on success", async () => {
      groupService.createGroup.mockResolvedValue({ id: "g1" });
      await groupController.createGroup(req, res);
      
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: { id: "g1" } }));
    });

    test("returns 400 on error", async () => {
      groupService.createGroup.mockRejectedValue(new Error("err"));
      await groupController.createGroup(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("getAllGroups", () => {
    test("returns 200 on success", async () => {
      groupService.getAllGroups.mockResolvedValue([{ id: "g1" }]);
      await groupController.getAllGroups(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("getPendingGroups", () => {
    test("returns 200 on success", async () => {
      groupService.getPendingGroups.mockResolvedValue([{ id: "p1" }]);
      await groupController.getPendingGroups(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("updatePendingGroupStatus", () => {
    test("returns 200 on success", async () => {
      groupService.updatePendingGroupStatus.mockResolvedValue({ status: "approved" });
      await groupController.updatePendingGroupStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("pendingGroupEmailAction", () => {
    test("redirects if frontend url exists on success", async () => {
      pendingHelpers.getFrontendBaseUrl.mockReturnValue("http://front.com");
      pendingValidator.requirePendingGroupEmailToken.mockReturnValue("token1");
      groupService.executePendingGroupFromEmail.mockResolvedValue({ status: "approved" });
      pendingHelpers.buildPendingGroupEmailSuccessRedirectUrl.mockReturnValue("http://front.com/success");

      await groupController.pendingGroupEmailAction(req, res);
      expect(res.redirect).toHaveBeenCalledWith(302, "http://front.com/success");
    });

    test("returns html if no frontend url exists", async () => {
      pendingHelpers.getFrontendBaseUrl.mockReturnValue(null);
      pendingValidator.requirePendingGroupEmailToken.mockReturnValue("token1");
      groupService.executePendingGroupFromEmail.mockResolvedValue({ status: "approved" });
      pendingHelpers.getPendingGroupEmailActionSuccessView.mockReturnValue({ httpStatus: 200, heading: "H", detail: "D", success: true });
      pendingHelpers.buildPendingGroupEmailActionResultHtml.mockReturnValue("<html></html>");

      await groupController.pendingGroupEmailAction(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.type).toHaveBeenCalledWith("html");
      expect(res.send).toHaveBeenCalledWith("<html></html>");
    });

    test("redirects if frontend url exists on error", async () => {
      pendingHelpers.getFrontendBaseUrl.mockReturnValue("http://front.com");
      pendingValidator.requirePendingGroupEmailToken.mockImplementation(() => { throw new Error("err"); });
      pendingHelpers.getPendingGroupEmailActionErrorView.mockReturnValue({ detail: "err" });
      pendingHelpers.buildPendingGroupEmailErrorRedirectUrl.mockReturnValue("http://front.com/error");

      await groupController.pendingGroupEmailAction(req, res);
      expect(res.redirect).toHaveBeenCalledWith(302, "http://front.com/error");
    });
  });

  describe("getGroupById", () => {
    test("returns 200 on success", async () => {
      groupService.getGroupById.mockResolvedValue({ id: "g1" });
      await groupController.getGroupById(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
    test("returns error status", async () => {
      groupService.getGroupById.mockRejectedValue({ status: 404, message: "not found" });
      await groupController.getGroupById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("updateGroup", () => {
    test("returns 200 on success", async () => {
      groupService.updateGroup.mockResolvedValue(true);
      await groupController.updateGroup(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("deleteGroup", () => {
    test("returns 200 on success", async () => {
      groupService.deleteGroup.mockResolvedValue(true);
      await groupController.deleteGroup(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("addGroupAdmin & removeGroupAdmin & leaveGroup", () => {
    test("addGroupAdmin returns dynamic status", async () => {
      groupService.addGroupAdmin.mockResolvedValue({ status: 207, body: {} });
      await groupController.addGroupAdmin(req, res);
      expect(res.status).toHaveBeenCalledWith(207);
    });

    test("removeGroupAdmin returns dynamic status", async () => {
      groupService.removeGroupAdmin.mockResolvedValue({ status: 200, body: {} });
      await groupController.removeGroupAdmin(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("leaveGroup returns dynamic status", async () => {
      groupService.leaveGroup.mockResolvedValue({ status: 200, body: {} });
      await groupController.leaveGroup(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("leaveGroup handles GroupAccessError", async () => {
      groupService.leaveGroup.mockRejectedValue(new GroupAccessError("denied", 403));
      await groupController.leaveGroup(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
