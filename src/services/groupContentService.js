const { v4: uuidv4 } = require("uuid");
const repo = require("../repositories/groupContentRepository");
const { uploadToCloudinaryResources } = require("../middleware/uploadFile");
const { createNotification } = require("./notificatioService");
const groupContentValidator = require("../validators/groupContentValidator");
const { internalSummarizePdf } = require("../utils/pdfSummarize");
const { getRequestedLocalization } = require("../utils/localization");
const { mapResourceRow } = require("../utils/mapper");

const badRequest = (message) => {
  const e = new Error(message);
  e.status = 400;
  return e;
};

const forbidden = (message) => {
  const e = new Error(message);
  e.status = 403;
  return e;
};

const notFound = (message) => {
  const e = new Error(message);
  e.status = 404;
  return e;
};

exports.createGroupContent = async (req) => {
  const body = req && req.body !== undefined ? req.body : req;
  if (!body?.content_name) {
    throw badRequest("Content name is required");
  }
  if (!body?.group_id) {
    throw badRequest("Group id is required");
  }

  const group = await repo.findGroupById(body.group_id);
  if (!group) {
    throw notFound("Group not found");
  }

  const id = uuidv4();

  await repo.createContent({
    id,
    content_name: body.content_name,
    content_description: body.content_description,
    group_id: body.group_id,
  });

  return {
    id,
    content_name: body.content_name,
    content_description: body.content_description,
    group_id: body.group_id,
  };
};

exports.getAll = async ({ query, params }) => {
  return repo.getAllContents(query, params);
};

exports.buildListQuery = (userId, userRole, name) => {
  let query = `
      SELECT gc.*, u.id AS owner_id, u.name AS owner_name, u.email AS owner_email 
      FROM group_content gc 
      JOIN \`group\` g ON gc.group_id = g.id 
      JOIN group_admin ga ON ga.group_id = g.id AND ga.role = 'OWNER'
      JOIN user u ON ga.user_id = u.id
    `;
  const params = [];
  const whereClauses = [];

  if (userRole === "Administrator") {
    query +=
      " JOIN group_admin perm ON perm.group_id = g.id AND perm.user_id = ?";
    params.push(userId);
  } else if (userRole === "Member") {
    query +=
      " JOIN group_membership gm ON gm.group_id = g.id AND gm.member_id = ?";
    params.push(userId);
  }

  if (name) {
    whereClauses.push("gc.content_name LIKE ?");
    params.push(`%${name}%`);
  }

  if (whereClauses.length > 0) {
    query += " WHERE " + whereClauses.join(" AND ");
  }

  return { query, params };
};

exports.getAllGroupContentsWithResources = async (req) => {
  const { name } = req.query;
  const userId = req.user.id;
  const userRole = req.user.role;
  const results = await repo.getAllContents(req);
  if (!results.length) return [];

  const contentIds = results.map((c) => c.id);
  const allResources = await repo.getResourcesByContentIds(contentIds);
  const resourcesByContentId = allResources.reduce((acc, res) => {
    if (!acc[res.group_content_id]) acc[res.group_content_id] = [];
    acc[res.group_content_id].push(mapResourceRow(res));
    return acc;
  }, {});

  return results.map((groupContent) => ({
    ...groupContent,
    resources: resourcesByContentId[groupContent.id] || [],
  }));
};

exports.getGroupContentById = async (req) => {
  const { id } = req.params;
  groupContentValidator.validateContentIdParam(id);
  const row = await repo.findContentById(id);
  if (!row) {
    throw notFound("Group content not found");
  }
  if (req.user.role !== "Super_Admin") {
    const ok = await repo.hasUserAccessToGroupContent(
      row.group_id,
      req.user.id,
    );
    if (!ok) {
      throw forbidden("You do not have access to this group's content");
    }
  }
  const resources = await repo.getResourcesByContentId(id);
  return { ...row, resources: resources.map(mapResourceRow) };
};

exports.updateGroupContentById = async (req) => {
  const { id } = req.params;
  const { content_name, content_description } = req.body;
  groupContentValidator.validateUpdateGroupContent(id, req.body);
  const row = await repo.findContentById(id);
  if (!row) {
    throw notFound("Group content not found");
  }
  if (req.user.role !== "Super_Admin") {
    const admin = await repo.isUserGroupAdmin(row.group_id, req.user.id);
    if (!admin) {
      throw forbidden("Only group Leaders can update content");
    }
  }
  const affected = await repo.updateContentFields(
    id,
    content_name ?? null,
    content_description ?? null,
  );
  if (!affected) {
    throw notFound("Group content not found");
  }
};

exports.addFilesToGroupContent = async (req) => {
  const { id } = req.params;
  const { meeting_id } = req.body;
  groupContentValidator.validateContentIdParam(id);

  if (meeting_id) {
    const m = await repo.findMeetingById(meeting_id);
    if (!m) {
      throw notFound("Meeting not found");
    }
  }

  const groupContent = await repo.findContentById(id);
  if (!groupContent) {
    throw notFound("Group content not found");
  }

  if (req.user.role !== "Super_Admin") {
    const admin = await repo.isUserGroupAdmin(
      groupContent.group_id,
      req.user.id,
    );
    if (!admin) {
      throw forbidden("Only group Leaders can add files to this content");
    }
  }

  let links = groupContentValidator.normalizeLinks(req.body.links);
  if (
    typeof req.body.links === "string" &&
    req.body.links.trim().startsWith("[")
  ) {
    try {
      const parsed = JSON.parse(req.body.links);
      links = groupContentValidator.normalizeLinks(parsed);
    } catch {
      // keep normalized single string / array path
    }
  }

  const hasFiles = req.files?.length > 0;
  if (!hasFiles && links.length === 0) {
    throw badRequest("No files provided");
  }

  const uploadedResources = [];
  const localization = getRequestedLocalization(req);

  if (hasFiles) {
    for (const file of req.files) {
      try {
        const isPdf = file.mimetype && file.mimetype.includes("pdf");
        const isDocument =
          file.mimetype &&
          (isPdf ||
            file.mimetype.includes("document") ||
            file.mimetype.includes("msword") ||
            file.mimetype.includes("spreadsheet") ||
            file.mimetype.includes("presentation") ||
            file.mimetype.includes("text"));
        const resourceType = isDocument ? "raw" : "auto";

        const fileUrl = await uploadToCloudinaryResources(
          file,
          "group_content_resources",
          resourceType,
        );

        const resourceId = uuidv4();
        await repo.insertResource({
          id: resourceId,
          group_content_id: id,
          file_url: fileUrl,
          file_name: file.originalname,
          file_type: file.mimetype,
          file_size: file.size,
          meeting_id,
        });

        if (isPdf) {
          try {
            await internalSummarizePdf(resourceId, fileUrl, localization, file);
          } catch (summarizeError) {
            // Rollback: Delete the resource if summarization fails (as per user request pattern for videos)
            await repo.deleteResource(resourceId, id);
            throw summarizeError;
          }
        }

        uploadedResources.push({
          id: resourceId,
          file_url: fileUrl,
          file_name: file.originalname,
          file_type: file.mimetype,
          file_size: file.size,
        });
      } catch (fileError) {
        if (fileError.status) throw fileError;
        console.error(`Error uploading file ${file.originalname}:`, fileError);
      }
    }

    if (!links.length && uploadedResources.length === 0) {
      const e = new Error("Failed to upload any files");
      e.status = 500;
      throw e;
    }
  }

  for (const link of links) {
    try {
      groupContentValidator.validateSafeUrl(link);
      const resourceId = uuidv4();
      await repo.insertResource({
        id: resourceId,
        group_content_id: id,
        file_url: link,
        file_name: link,
        file_type: "link",
        file_size: 0,
        meeting_id,
      });

      // Summarize PDF links if they end with .pdf
      if (link.toLowerCase().endsWith(".pdf")) {
        try {
          await internalSummarizePdf(resourceId, link, localization);
        } catch (summarizeError) {
          await repo.deleteResource(resourceId, id);
          throw summarizeError;
        }
      }

      uploadedResources.push({
        id: resourceId,
        file_url: link,
        file_name: link,
        file_type: "link",
        file_size: 0,
      });
    } catch (linkError) {
      if (linkError.status) throw linkError;
      console.error(`Error adding link ${link}:`, linkError);
    }
  }

  const group_id = groupContent.group_id;
  const memberIds = await repo.getMemberIdsByGroupId(group_id);
  const groupMeta = await repo.getGroupNameAndOwnerAdmin(group_id);
  const groupName = groupMeta?.group_name || "the group";
  const senderId = groupMeta?.administrator_id ?? null;
  for (const memberId of memberIds) {
    await createNotification({
      memberId,
      senderId,
      title: `${groupContent.content_name} has been updated in ${groupName}`,
      message: `The content "${groupContent.content_name}" has been updated in your group "${groupName}".`,
    });
  }

  // Fetch all resources for this content to get fully mapped data (including AI metadata)
  const finalResources = await repo.getResourcesByContentId(id);
  const mappedResources = finalResources.map(mapResourceRow);
  const uploadedIds = uploadedResources.map((ur) => ur.id);

  return {
    group_content_id: id,
    added_resources: mappedResources.filter((r) => uploadedIds.includes(r.id)),
    total_added: uploadedResources.length,
  };
};

exports.deleteFileFromGroupContent = async (req) => {
  const { id, resourceId } = req.params;
  groupContentValidator.validateContentIdParam(id);
  groupContentValidator.validateResourceIdParam(resourceId);

  const groupContent = await repo.findContentById(id);
  if (!groupContent) {
    throw notFound("Group content not found");
  }

  if (req.user.role !== "Super_Admin") {
    const admin = await repo.isUserGroupAdmin(
      groupContent.group_id,
      req.user.id,
    );
    if (!admin) {
      throw forbidden("Only group Leaders can delete files from this content");
    }
  }

  const affected = await repo.deleteResource(resourceId, id);
  if (!affected) {
    throw notFound("Resource not found");
  }
};

exports.getGroupContentResourcesByMeetingId = async (req) => {
  const { meeting_id } = req.params;
  groupContentValidator.validateMeetingIdParam(meeting_id);
  const rows = await repo.getResourcesByMeetingId(meeting_id);
  return rows.map(mapResourceRow);
};
