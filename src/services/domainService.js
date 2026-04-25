const { v4: uuidv4 } = require("uuid");
const domainRepository = require("../repositories/domainRepository");

exports.getAllDomains = async () => {
  return await domainRepository.getAllDomains();
};

exports.getDomainById = async (id) => {
  const domain = await domainRepository.findById(id);
  if (!domain) {
    throw new Error("Domain not found");
  }
  return domain;
};

exports.createDomain = async (data) => {
  if (!data.domain_name) {
    throw new Error("Domain name is required");
  }

  const existing = await domainRepository.findByDomainName(data.domain_name);
  if (existing) {
    throw new Error("Domain is already configured");
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
    throw new Error("Domain not found");
  }

  if (data.domain_name) {
    const existing = await domainRepository.findByDomainName(data.domain_name);
    if (existing && existing.id !== id) {
      throw new Error("Domain name already exists");
    }
  }

  const updates = {};
  if (data.domain_name !== undefined) updates.domain_name = data.domain_name.toLowerCase();
  if (data.auth_email_enabled !== undefined) updates.auth_email_enabled = data.auth_email_enabled;
  if (data.auth_google_enabled !== undefined) updates.auth_google_enabled = data.auth_google_enabled;

  await domainRepository.updateDomain(id, updates);
  
  return { ...domain, ...updates };
};

exports.deleteDomain = async (id) => {
  const domain = await domainRepository.findById(id);
  if (!domain) {
    throw new Error("Domain not found");
  }

  await domainRepository.deleteDomain(id);
};
