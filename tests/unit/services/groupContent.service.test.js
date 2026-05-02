jest.mock("uuid", () => ({ v4: jest.fn(() => "mocked-uuid") }));
jest.mock("../../../src/repositories/groupContentRepository");
jest.mock("../../../src/middleware/uploadFile");
jest.mock("../../../src/services/notificatioService");
jest.mock("../../../src/validators/groupContentValidator");
jest.mock("../../../src/utils/pdfSummarize");
jest.mock("../../../src/utils/localization");
jest.mock("../../../src/utils/mapper");

const groupContentService = require("../../../src/services/groupContentService");
const repo = require("../../../src/repositories/groupContentRepository");
const { uploadToCloudinaryResources } = require("../../../src/middleware/uploadFile");
const { createNotification } = require("../../../src/services/notificatioService");
const groupContentValidator = require("../../../src/validators/groupContentValidator");
const { internalSummarizePdf } = require("../../../src/utils/pdfSummarize");
const { getRequestedLocalization } = require("../../../src/utils/localization");
const { mapResourceRow } = require("../../../src/utils/mapper");

describe("groupContentService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    groupContentValidator.normalizeLinks.mockImplementation((v) => v || []);
    getRequestedLocalization.mockReturnValue("en");
    mapResourceRow.mockImplementation((r) => ({ ...r, mapped: true }));
  });

  describe("createGroupContent", () => {
    test("throws if missing content name", async () => {
      await expect(groupContentService.createGroupContent({ body: { group_id: "g1" } })).rejects.toThrow("Content name is required");
    });

    test("throws if missing group id", async () => {
      await expect(groupContentService.createGroupContent({ body: { content_name: "Name" } })).rejects.toThrow("Group id is required");
    });

    test("throws if group not found", async () => {
      repo.findGroupById.mockResolvedValue(null);
      await expect(groupContentService.createGroupContent({ body: { content_name: "Name", group_id: "g1" } })).rejects.toThrow("Group not found");
    });

    test("creates successfully", async () => {
      repo.findGroupById.mockResolvedValue({ id: "g1" });
      repo.createContent.mockResolvedValue(true);

      const result = await groupContentService.createGroupContent({
        body: { content_name: "Name", group_id: "g1", content_description: "Desc" }
      });

      expect(repo.createContent).toHaveBeenCalledWith(expect.objectContaining({
        content_name: "Name",
        group_id: "g1"
      }));
      expect(result.id).toBe("mocked-uuid");
    });
  });

  describe("getAllGroupContentsWithResources", () => {
    test("builds query and maps resources", async () => {
      repo.getAllContents.mockResolvedValue([{ id: "c1" }]);
      repo.getResourcesByContentIds.mockResolvedValue([{ id: "r1", group_content_id: "c1" }]);

      const req = { user: { id: "u1", role: "Member" }, query: { name: "test" } };
      const result = await groupContentService.getAllGroupContentsWithResources(req);

      expect(repo.getAllContents).toHaveBeenCalled();
      expect(result[0].resources[0].mapped).toBe(true);
    });

    test("returns empty array if no contents", async () => {
      repo.getAllContents.mockResolvedValue([]);
      const req = { user: { id: "u1", role: "Super_Admin" }, query: {} };
      const result = await groupContentService.getAllGroupContentsWithResources(req);
      expect(result).toEqual([]);
    });
  });

  describe("getGroupContentById", () => {
    test("throws 404 if not found", async () => {
      repo.findContentById.mockResolvedValue(null);
      await expect(groupContentService.getGroupContentById({ params: { id: "c1" } })).rejects.toThrow("Group content not found");
    });

    test("throws 403 if no access", async () => {
      repo.findContentById.mockResolvedValue({ id: "c1", group_id: "g1" });
      repo.hasUserAccessToGroupContent.mockResolvedValue(false);
      await expect(groupContentService.getGroupContentById({ params: { id: "c1" }, user: { id: "u1", role: "Member" } })).rejects.toThrow("You do not have access to this group's content");
    });

    test("returns content with resources", async () => {
      repo.findContentById.mockResolvedValue({ id: "c1", group_id: "g1" });
      repo.hasUserAccessToGroupContent.mockResolvedValue(true);
      repo.getResourcesByContentId.mockResolvedValue([{ id: "r1" }]);

      const result = await groupContentService.getGroupContentById({ params: { id: "c1" }, user: { id: "u1", role: "Member" } });
      expect(result.resources[0].mapped).toBe(true);
    });
  });

  describe("updateGroupContentById", () => {
    test("updates successfully", async () => {
      repo.findContentById.mockResolvedValue({ id: "c1", group_id: "g1" });
      repo.isUserGroupAdmin.mockResolvedValue(true);
      repo.updateContentFields.mockResolvedValue(1);

      await groupContentService.updateGroupContentById({
        params: { id: "c1" },
        body: { content_name: "New" },
        user: { id: "u1", role: "Administrator" }
      });

      expect(repo.updateContentFields).toHaveBeenCalledWith("c1", "New", null);
    });
  });

  describe("addFilesToGroupContent", () => {
    test("throws if missing content", async () => {
      repo.findContentById.mockResolvedValue(null);
      await expect(groupContentService.addFilesToGroupContent({ params: { id: "c1" }, body: {} })).rejects.toThrow("Group content not found");
    });

    test("handles file upload and pdf summarization", async () => {
      repo.findContentById.mockResolvedValue({ id: "c1", group_id: "g1" });
      repo.isUserGroupAdmin.mockResolvedValue(true);
      
      const file = { originalname: "test.pdf", mimetype: "application/pdf" };
      uploadToCloudinaryResources.mockResolvedValue("url");
      internalSummarizePdf.mockResolvedValue(true);
      repo.getMemberIdsByGroupId.mockResolvedValue(["u2"]);
      repo.getResourcesByContentId.mockResolvedValue([{ id: "mocked-uuid" }]);

      const req = {
        params: { id: "c1" },
        body: { links: [] },
        files: [file],
        user: { id: "u1", role: "Administrator" }
      };

      const result = await groupContentService.addFilesToGroupContent(req);

      expect(uploadToCloudinaryResources).toHaveBeenCalled();
      expect(internalSummarizePdf).toHaveBeenCalledWith("mocked-uuid", "url", "en", file);
      expect(createNotification).toHaveBeenCalled();
      expect(result.total_added).toBe(1);
    });

    test("handles external links", async () => {
      repo.findContentById.mockResolvedValue({ id: "c1", group_id: "g1" });
      repo.isUserGroupAdmin.mockResolvedValue(true);
      
      groupContentValidator.normalizeLinks.mockReturnValue(["http://example.com/file.pdf"]);
      internalSummarizePdf.mockResolvedValue(true);
      repo.getMemberIdsByGroupId.mockResolvedValue([]);
      repo.getResourcesByContentId.mockResolvedValue([{ id: "mocked-uuid" }]);

      const req = {
        params: { id: "c1" },
        body: { links: ["http://example.com/file.pdf"] },
        user: { id: "u1", role: "Super_Admin" }
      };

      await groupContentService.addFilesToGroupContent(req);

      expect(internalSummarizePdf).toHaveBeenCalledWith("mocked-uuid", "http://example.com/file.pdf", "en");
      expect(repo.insertResource).toHaveBeenCalledWith(expect.objectContaining({ file_type: "link" }));
    });
  });

  describe("deleteFileFromGroupContent", () => {
    test("deletes successfully", async () => {
      repo.findContentById.mockResolvedValue({ id: "c1", group_id: "g1" });
      repo.isUserGroupAdmin.mockResolvedValue(true);
      repo.deleteResource.mockResolvedValue(1);

      await groupContentService.deleteFileFromGroupContent({
        params: { id: "c1", resourceId: "r1" },
        user: { id: "u1", role: "Administrator" }
      });

      expect(repo.deleteResource).toHaveBeenCalledWith("r1", "c1");
    });
  });
});
