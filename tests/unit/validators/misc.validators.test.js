const contactValidator = require("../../../src/validators/contactValidator");
const domainValidator = require("../../../src/validators/domainValidator");
const positionValidator = require("../../../src/validators/positionValidator");
const savedVideoValidator = require("../../../src/validators/saved_videoValidator");

const getThrown = (fn) => {
  try {
    fn();
    return null;
  } catch (err) {
    return err;
  }
};

describe("misc validators", () => {
  describe("contactValidator", () => {
    test("throws when message is missing", () => {
      const err = getThrown(() => contactValidator.validateCreateContact({}));
      expect(err).toMatchObject({ status: 400, message: "message is required" });
    });

    test("passes when message is valid", () => {
      expect(() =>
        contactValidator.validateCreateContact({ message: "hello" })
      ).not.toThrow();
    });
  });

  describe("domainValidator", () => {
    test("validates id and create payload", () => {
      expect(() => domainValidator.validateDomainId("1")).not.toThrow();
      expect(() =>
        domainValidator.validateCreateDomain({ domain_name: "example.com" })
      ).not.toThrow();
    });

    test("throws for invalid update payload types", () => {
      expect(() =>
        domainValidator.validateUpdateDomain({ domain_name: 22 })
      ).toThrow("Domain name must be a string");
      expect(() =>
        domainValidator.validateUpdateDomain({ auth_email_enabled: "yes" })
      ).toThrow("Auth email enabled must be a boolean");
      expect(() =>
        domainValidator.validateUpdateDomain({ auth_google_enabled: "yes" })
      ).toThrow("Auth Google enabled must be a boolean");
    });

    test("passes for valid update payload", () => {
      expect(() =>
        domainValidator.validateUpdateDomain({
          domain_name: "example.com",
          auth_email_enabled: true,
          auth_google_enabled: false,
        })
      ).not.toThrow();
    });
  });

  describe("positionValidator", () => {
    test("throws when unauthenticated", () => {
      const err = getThrown(() => positionValidator.validateAuthenticatedUser({}));
      expect(err).toMatchObject({
        status: 401,
        message: "Unauthorized: user is not authenticated",
      });
    });

    test("validates create/update and super admin rules", () => {
      const req = { user: { id: 1, role: "Administrator" }, body: { title: "Dev" } };
      expect(() => positionValidator.validateCreatePosition(req)).not.toThrow();
      expect(() => positionValidator.validatePositionIdParam("12")).not.toThrow();
      expect(() =>
        positionValidator.validateUpdatePosition("12", { title: "Lead Dev" })
      ).not.toThrow();
      expect(() =>
        positionValidator.validateSuperAdminAdministratorId({
          user: { role: "Super_Admin" },
          body: { administrator_id: 99 },
        })
      ).not.toThrow();
    });

    test("throws when required fields are missing", () => {
      expect(() =>
        positionValidator.validateCreatePosition({
          user: { id: 1, role: "Administrator" },
          body: {},
        })
      ).toThrow();

      expect(() =>
        positionValidator.validateSuperAdminAdministratorId({
          user: { role: "Super_Admin" },
          body: {},
        })
      ).toThrow();

      expect(() => positionValidator.validatePositionIdParam("")).toThrow();
      expect(() => positionValidator.validateUpdatePosition("", {})).toThrow();
    });
  });

  describe("saved_videoValidator", () => {
    test("validates success scenarios", () => {
      expect(() =>
        savedVideoValidator.validateAuthenticatedUser({ user: { id: 10 } })
      ).not.toThrow();
      expect(() =>
        savedVideoValidator.validateVideoIdBody({ video_id: 22 })
      ).not.toThrow();
      expect(() => savedVideoValidator.validateVideoIdParam("55")).not.toThrow();
      expect(() => savedVideoValidator.validateDeleteParams(1, 2)).not.toThrow();
    });

    test("throws for missing fields", () => {
      expect(() => savedVideoValidator.validateAuthenticatedUser({})).toThrow();
      expect(() => savedVideoValidator.validateVideoIdBody({})).toThrow();
      expect(() => savedVideoValidator.validateVideoIdParam("   ")).toThrow();
      expect(() => savedVideoValidator.validateDeleteParams(null, 1)).toThrow();
      expect(() => savedVideoValidator.validateDeleteParams(1, "  ")).toThrow();
    });
  });
});
