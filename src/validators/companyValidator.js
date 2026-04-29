const httpError = require("../utils/httpError");
const domainValidator = require("./domainValidator");

exports.validateProvisionCompany = (body) => {
  const name = body?.name;
  if (!name || String(name).trim() === "") {
    const e = new Error("Company name is required");
    e.status = 400;
    throw e;
  }
  if (body.domains !== undefined && !Array.isArray(body.domains)) {
    const e = new Error("domains must be an array when provided");
    e.status = 400;
    throw e;
  }
};

exports.validateUpdateCompany = (body) => {
  if (!body || typeof body !== "object") {
    throw httpError(400, "Request body is required");
  }
  if (body.name !== undefined && (typeof body.name !== "string" || !body.name.trim())) {
    throw httpError(400, "name must be a non-empty string when provided");
  }
  if (
    body.is_active !== undefined &&
    typeof body.is_active !== "boolean" &&
    body.is_active !== 0 &&
    body.is_active !== 1
  ) {
    throw httpError(400, "is_active must be a boolean when provided");
  }
  if (body.name === undefined && body.is_active === undefined) {
    throw httpError(400, "Provide at least one of: name, is_active");
  }
};

exports.validatePatchCompanySettings = (body) => {
  if (!body || typeof body !== "object") {
    throw httpError(400, "Request body is required");
  }
  const allowed = new Set([
    "system_name",
    "logo_url",
    "system_name_color",
    "theme",
    "terms_html",
    "privacy_html",
    "guidelines_html",
    "auth_email_enabled",
    "auth_google_enabled",
  ]);
  const keys = Object.keys(body).filter((k) => body[k] !== undefined);
  const unknown = keys.filter((k) => !allowed.has(k));
  if (unknown.length) {
    throw httpError(400, `Unknown fields: ${unknown.join(", ")}`);
  }
  if (keys.length === 0) {
    throw httpError(400, "Provide at least one setting field to update");
  }
  if (body.theme !== undefined) {
    const t = String(body.theme).toLowerCase();
    if (t !== "light" && t !== "dark") {
      throw httpError(400, "theme must be light or dark");
    }
  }
};

exports.validateAddCompanyDomain = (body) => {
  if (!body?.domain_name || String(body.domain_name).trim() === "") {
    throw httpError(400, "domain_name is required");
  }
};

const { validateFileType } = require("./validateFiles");

exports.validateCompanyLogoFile = (file) => {
  if (!file) {
    throw httpError(400, "company_logo file is required");
  }
  validateFileType(file, "image");
};

exports.validateCompanyDomainPatchBody = (body) => {
  if (
    body.domain_name === undefined &&
    body.auth_email_enabled === undefined &&
    body.auth_google_enabled === undefined
  ) {
    throw httpError(
      400,
      "Provide at least one of: domain_name, auth_email_enabled, auth_google_enabled"
    );
  }
  domainValidator.validateUpdateDomain(body);
};
