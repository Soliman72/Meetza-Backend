const validator = require("validator");

exports.validateContentIdParam = (id) => {
  if (!id || String(id).trim() === "") {
    const err = new Error("Content id is required");
    err.status = 400;
    throw err;
  }
};

exports.validateMeetingIdParam = (meetingId) => {
  if (!meetingId || String(meetingId).trim() === "") {
    const err = new Error("Meeting id is required");
    err.status = 400;
    throw err;
  }
};

exports.validateResourceIdParam = (resourceId) => {
  if (!resourceId || String(resourceId).trim() === "") {
    const err = new Error("Resource id is required");
    err.status = 400;
    throw err;
  }
};

exports.validateUpdateGroupContent = (id, body) => {
  exports.validateContentIdParam(id);
  const { content_name, content_description } = body || {};
  if (!content_name && !content_description) {
    const err = new Error(
      "Content id, name or description is required"
    );
    err.status = 400;
    throw err;
  }
};

exports.validateSafeUrl = (link) => {
  if (
    !validator.isURL(link, {
      require_protocol: true,
      protocols: ["http", "https"],
    })
  ) {
    const err = new Error("Invalid URL");
    err.status = 400;
    throw err;
  }
  if (link.startsWith("javascript:") || link.startsWith("data:")) {
    const err = new Error("Unsafe URL detected");
    err.status = 400;
    throw err;
  }
};

exports.normalizeLinks = (links) => {
  if (links == null || links === "") return [];
  const arr = Array.isArray(links) ? links : [links];
  return arr.filter((l) => l != null && String(l).trim() !== "");
};
