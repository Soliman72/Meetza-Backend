jest.mock("../../../src/services/contactService", () => ({
  createContact: jest.fn(),
}));
jest.mock("../../../src/services/domainService", () => ({
  getAllDomains: jest.fn(),
  getDomainById: jest.fn(),
  createDomain: jest.fn(),
  updateDomain: jest.fn(),
  deleteDomain: jest.fn(),
}));
jest.mock("../../../src/services/profileService", () => ({
  getMyProfile: jest.fn(),
  getMyChatMedia: jest.fn(),
}));
jest.mock("../../../src/services/userService", () => ({
  createUser: jest.fn(),
  createUserBySuperAdmin: jest.fn(),
  getAllUsers: jest.fn(),
  getUserById: jest.fn(),
  getUserByEmail: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
}));
jest.mock("../../../src/services/positionService", () => ({
  createPosition: jest.fn(),
  getAllPositions: jest.fn(),
  getPositionById: jest.fn(),
  updatePosition: jest.fn(),
  deletePosition: jest.fn(),
}));
jest.mock("../../../src/utils/sendError", () => jest.fn());

const contactService = require("../../../src/services/contactService");
const domainService = require("../../../src/services/domainService");
const profileService = require("../../../src/services/profileService");
const userService = require("../../../src/services/userService");
const positionService = require("../../../src/services/positionService");
const sendError = require("../../../src/utils/sendError");

const contactController = require("../../../src/controllers/contactController");
const domainController = require("../../../src/controllers/domainController");
const profileController = require("../../../src/controllers/profileController");
const userController = require("../../../src/controllers/userController");
const positionController = require("../../../src/controllers/positionController");

const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

describe("misc controllers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("contactController", () => {
    test("createContact returns 201 on success", async () => {
      contactService.createContact.mockResolvedValue({ id: "c1" });
      const req = { body: { message: "hello" } };
      const res = makeRes();

      await contactController.createContact(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    test("createContact returns custom status for business errors", async () => {
      contactService.createContact.mockRejectedValue({
        status: 400,
        message: "message is required",
      });
      const req = { body: {} };
      const res = makeRes();

      await contactController.createContact(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: "message is required" })
      );
    });

    test("createContact returns 500 fallback payload", async () => {
      contactService.createContact.mockRejectedValue(new Error("smtp down"));
      const req = { body: { message: "x" } };
      const res = makeRes();

      await contactController.createContact(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Failed to send contact message",
          error: "smtp down",
        })
      );
    });
  });

  describe("domainController", () => {
    test("getAllDomains returns 200", async () => {
      domainService.getAllDomains.mockResolvedValue([{ id: 1 }]);
      const res = makeRes();

      await domainController.getAllDomains({}, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("getAllDomains returns 400 on error", async () => {
      domainService.getAllDomains.mockRejectedValue(new Error("bad"));
      const res = makeRes();

      await domainController.getAllDomains({}, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("getDomainById success/error branches", async () => {
      const req = { params: { id: "1" } };
      let res = makeRes();
      domainService.getDomainById.mockResolvedValue({ id: 1 });
      await domainController.getDomainById(req, res);
      expect(res.status).toHaveBeenCalledWith(200);

      res = makeRes();
      domainService.getDomainById.mockRejectedValue(new Error("not found"));
      await domainController.getDomainById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("createDomain success/error branches", async () => {
      const req = { body: { domain_name: "a.com" } };
      let res = makeRes();
      domainService.createDomain.mockResolvedValue({ id: 2 });
      await domainController.createDomain(req, res);
      expect(res.status).toHaveBeenCalledWith(201);

      res = makeRes();
      domainService.createDomain.mockRejectedValue(new Error("invalid"));
      await domainController.createDomain(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("updateDomain success/error branches", async () => {
      const req = { params: { id: "2" }, body: { domain_name: "b.com" } };
      let res = makeRes();
      domainService.updateDomain.mockResolvedValue({ id: 2 });
      await domainController.updateDomain(req, res);
      expect(res.status).toHaveBeenCalledWith(200);

      res = makeRes();
      domainService.updateDomain.mockRejectedValue(new Error("invalid"));
      await domainController.updateDomain(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("deleteDomain success/error branches", async () => {
      const req = { params: { id: "2" } };
      let res = makeRes();
      domainService.deleteDomain.mockResolvedValue();
      await domainController.deleteDomain(req, res);
      expect(res.status).toHaveBeenCalledWith(200);

      res = makeRes();
      domainService.deleteDomain.mockRejectedValue(new Error("cannot delete"));
      await domainController.deleteDomain(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("profileController", () => {
    test("getMyProfile success/error branches", async () => {
      const req = { user: { id: 1 } };
      const res = makeRes();
      profileService.getMyProfile.mockResolvedValue({ id: 1 });
      await profileController.getMyProfile(req, res);
      expect(res.status).toHaveBeenCalledWith(200);

      const err = new Error("boom");
      profileService.getMyProfile.mockRejectedValue(err);
      await profileController.getMyProfile(req, res);
      expect(sendError).toHaveBeenCalledWith(res, err);
    });

    test("getMyChatMedia success/error branches", async () => {
      const req = { user: { id: 1 } };
      const res = makeRes();
      profileService.getMyChatMedia.mockResolvedValue([]);
      await profileController.getMyChatMedia(req, res);
      expect(res.status).toHaveBeenCalledWith(200);

      const err = new Error("boom");
      profileService.getMyChatMedia.mockRejectedValue(err);
      await profileController.getMyChatMedia(req, res);
      expect(sendError).toHaveBeenCalledWith(res, err);
    });
  });

  describe("userController", () => {
    test("create methods use 201 and 400", async () => {
      const req = {};
      let res = makeRes();
      userService.createUser.mockResolvedValue({ id: 1 });
      await userController.createUser(req, res);
      expect(res.status).toHaveBeenCalledWith(201);

      res = makeRes();
      userService.createUser.mockRejectedValue(new Error("bad"));
      await userController.createUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);

      res = makeRes();
      userService.createUserBySuperAdmin.mockResolvedValue({ id: 2 });
      await userController.createUserBySuperAdmin(req, res);
      expect(res.status).toHaveBeenCalledWith(201);

      res = makeRes();
      userService.createUserBySuperAdmin.mockRejectedValue(new Error("bad"));
      await userController.createUserBySuperAdmin(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("read methods use expected statuses", async () => {
      let res = makeRes();
      userService.getAllUsers.mockResolvedValue([{ id: 1 }]);
      await userController.getAllUsers({}, res);
      expect(res.status).toHaveBeenCalledWith(200);

      res = makeRes();
      userService.getAllUsers.mockRejectedValue(new Error("db"));
      await userController.getAllUsers({}, res);
      expect(res.status).toHaveBeenCalledWith(500);

      res = makeRes();
      userService.getUserById.mockResolvedValue({ id: 1 });
      await userController.getUserById({ params: { id: "1" } }, res);
      expect(res.status).toHaveBeenCalledWith(200);

      res = makeRes();
      userService.getUserById.mockRejectedValue(new Error("missing"));
      await userController.getUserById({ params: { id: "1" } }, res);
      expect(res.status).toHaveBeenCalledWith(404);

      res = makeRes();
      userService.getUserByEmail.mockResolvedValue({ id: 1 });
      await userController.getUserByEmail({ params: { email: "a@b.com" } }, res);
      expect(res.status).toHaveBeenCalledWith(200);

      res = makeRes();
      userService.getUserByEmail.mockRejectedValue(new Error("missing"));
      await userController.getUserByEmail({ params: { email: "a@b.com" } }, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test("update/delete methods use expected statuses", async () => {
      let res = makeRes();
      userService.updateUser.mockResolvedValue();
      await userController.updateUser({}, res);
      expect(res.status).toHaveBeenCalledWith(200);

      res = makeRes();
      userService.updateUser.mockRejectedValue(new Error("bad"));
      await userController.updateUser({}, res);
      expect(res.status).toHaveBeenCalledWith(400);

      res = makeRes();
      userService.deleteUser.mockResolvedValue();
      await userController.deleteUser({ params: { id: "2" } }, res);
      expect(res.status).toHaveBeenCalledWith(200);

      res = makeRes();
      userService.deleteUser.mockRejectedValue(new Error("missing"));
      await userController.deleteUser({ params: { id: "2" } }, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("positionController", () => {
    test("createPosition success and error statuses", async () => {
      const req = {};
      let res = makeRes();
      positionService.createPosition.mockResolvedValue({ id: 1 });
      await positionController.createPosition(req, res);
      expect(res.status).toHaveBeenCalledWith(201);

      res = makeRes();
      positionService.createPosition.mockRejectedValue({ status: 400, message: "bad" });
      await positionController.createPosition(req, res);
      expect(res.status).toHaveBeenCalledWith(400);

      res = makeRes();
      positionService.createPosition.mockRejectedValue({});
      await positionController.createPosition(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    test("get/update/delete methods hit success and error paths", async () => {
      let res = makeRes();
      positionService.getAllPositions.mockResolvedValue([]);
      await positionController.getAllPositions({}, res);
      expect(res.json).toHaveBeenCalled();

      res = makeRes();
      positionService.getAllPositions.mockRejectedValue(new Error("db"));
      await positionController.getAllPositions({}, res);
      expect(res.status).toHaveBeenCalledWith(500);

      res = makeRes();
      positionService.getPositionById.mockResolvedValue({ id: 2 });
      await positionController.getPositionById({}, res);
      expect(res.json).toHaveBeenCalledWith({ id: 2 });

      res = makeRes();
      positionService.getPositionById.mockRejectedValue({ status: 404, message: "nf" });
      await positionController.getPositionById({}, res);
      expect(res.status).toHaveBeenCalledWith(404);

      res = makeRes();
      positionService.updatePosition.mockResolvedValue({ ok: true });
      await positionController.updatePosition({}, res);
      expect(res.json).toHaveBeenCalledWith({ ok: true });

      res = makeRes();
      positionService.updatePosition.mockRejectedValue({ status: 400, message: "bad" });
      await positionController.updatePosition({}, res);
      expect(res.status).toHaveBeenCalledWith(400);

      res = makeRes();
      positionService.deletePosition.mockResolvedValue();
      await positionController.deletePosition({ params: { id: "2" } }, res);
      expect(res.json).toHaveBeenCalledWith({ message: "Record deleted successfully" });

      res = makeRes();
      positionService.deletePosition.mockRejectedValue({ status: 400, message: "bad" });
      await positionController.deletePosition({ params: { id: "2" } }, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
