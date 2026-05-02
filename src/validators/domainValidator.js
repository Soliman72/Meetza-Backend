const httpError = require("../utils/httpError");

exports.validateDomainId = (id) => {
  if (!id) {
    throw httpError(400, "Domain ID is required");
  }
};

exports.validateCreateDomain = (data) => {
  if (!data.domain_name) {
    throw httpError(400, "Domain name is required");
  }
};

exports.validateUpdateDomain = (data) => {
  if (data.domain_name !== undefined && typeof data.domain_name !== 'string') {
    throw httpError(400, "Domain name must be a string");
  }
  if (data.auth_email_enabled !== undefined && typeof data.auth_email_enabled !== 'boolean') {
    throw httpError(400, "Auth email enabled must be a boolean");
  }
  if (data.auth_google_enabled !== undefined && typeof data.auth_google_enabled !== 'boolean') {
    throw httpError(400, "Auth Google enabled must be a boolean");
  }
};