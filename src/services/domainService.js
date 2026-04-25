const { v4: uuidv4 } = require("uuid");
const domainRepository = require("../repositories/domainRepository");
const domainValidator = require("../validators/domainValidator");
const httpError = require("../utils/httpError");

exports.getAllDomains = async () => {
  return await domainRepository.getAllDomains();
};

exports.getDomainById = async (id) => {
  const domain = await domainRepository.findById(id);
  if (!domain) {
    throw httpError(404, "Domain not found");
  }
  return domain;
};

exports.createDomain = async (data) => {
  domainValidator.validateCreateDomain(data);

  const existing = await domainRepository.findByDomainName(data.domain_name);
  if (existing) {
    throw httpError(409, "Domain is already configured");
  }

  const newDomain = {
    id: uuidv4(),
    domain_name: data.domain_name.toLowerCase(),
    auth_email_enabled: data.auth_email_enabled !== undefined ? data.auth_email_enabled : true,
    auth_google_enabled: data.auth_google_enabled !== undefined ? data.auth_google_enabled : true,
  };

  await domainRepository.createDomain(newDomain);
  return newDomain;
};

exports.updateDomain = async (id, data) => {
  const domain = await domainRepository.findById(id);
  if (!domain) {
    throw httpError(404, "Domain not found");
  }

  if (data.domain_name) {
    const existing = await domainRepository.findByDomainName(data.domain_name);
    if (existing && existing.id !== id) {
      throw httpError(409, "Domain name already exists");
    }
  }

  const updates = {};
  domainValidator.validateUpdateDomain(data);
  if (data.domain_name !== undefined) updates.domain_name = data.domain_name.toLowerCase();
  if (data.auth_email_enabled !== undefined) updates.auth_email_enabled = data.auth_email_enabled;
  if (data.auth_google_enabled !== undefined) updates.auth_google_enabled = data.auth_google_enabled;

  await domainRepository.updateDomain(id, updates);
  
  return { ...domain, ...updates };
};

exports.deleteDomain = async (id) => {
  const domain = await domainRepository.findById(id);
  if (!domain) {
    throw httpError(404, "Domain not found");
  }

  await domainRepository.deleteDomain(id);
};
