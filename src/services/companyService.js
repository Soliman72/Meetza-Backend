const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");
const companyRepository = require("../repositories/companyRepository");
const domainRepository = require("../repositories/domainRepository");
const companyValidator = require("../validators/companyValidator");
const httpError = require("../utils/httpError");
const companyUtils = require("../utils/companyUtils");
const { uploadToCloudinary } = require("../middleware/uploadFile");

exports.provisionCompany = async (body) => {
  companyValidator.validateProvisionCompany(body);

  const companyId = uuidv4();
  const domainRows = companyUtils.collectProvisionDomains(body.domains);

  for (const row of domainRows) {
    let taken = false;
    try {
      taken = await domainRepository.domainNameTaken(row.domain_name);
    } catch {
      taken = false;
    }
    if (taken) {
      throw httpError(409, `Domain already in use: ${row.domain_name}`);
    }
  }

  const companyRow = companyUtils.provisionCompanyRow(body);
  const settingsValues = companyUtils.provisionCompanySettingsValues(body);

  const conn = await db.promise().getConnection();
  try {
    await conn.beginTransaction();

    await companyRepository.insertCompany(conn, {
      id: companyId,
      name: companyRow.name,
      is_active: companyRow.is_active,
    });

    await companyRepository.insertCompanySettings(conn, companyId, settingsValues);

    for (const row of domainRows) {
      await companyRepository.insertOrganizationDomainForCompany(conn, {
        id: uuidv4(),
        company_id: companyId,
        domain_name: row.domain_name,
        auth_email_enabled: row.auth_email_enabled,
        auth_google_enabled: row.auth_google_enabled,
      });
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  return companyRepository.findCompanyById(companyId);
};

exports.getCompanyById = async (id) => {
  return companyUtils.assertCompanyExists(id);
};

exports.listCompanies = async () => {
  return companyRepository.listCompanies();
};

exports.updateCompany = async (id, body) => {
  companyValidator.validateUpdateCompany(body);
  await companyUtils.assertCompanyExists(id);

  await companyRepository.updateCompany(id, {
    name: body.name,
    is_active: body.is_active,
  });

  return companyRepository.findCompanyById(id);
};

exports.deleteCompany = async (id) => {
  const ok = await companyRepository.deleteCompany(id);
  if (!ok) throw httpError(404, "Company not found");
};

exports.patchCompanySettings = async (id, body) => {
  companyValidator.validatePatchCompanySettings(body);
  await companyUtils.assertCompanyExists(id);
  await companyUtils.assertCompanySettingsExist(id);

  const patch = companyUtils.settingsPatchFromBody(body);
  await companyRepository.updateCompanySettings(id, patch);
  return companyRepository.findCompanyById(id);
};

exports.updateCompanyLogo = async (companyId, file) => {
  companyValidator.validateCompanyLogoFile(file);
  await companyUtils.assertCompanyExists(companyId);
  await companyUtils.assertCompanySettingsExist(companyId);

  const logo_url = await uploadToCloudinary(file, "company_logos");
  await companyRepository.updateCompanySettings(companyId, { logo_url });
  return companyRepository.findCompanyById(companyId);
};

exports.addCompanyDomain = async (companyId, body) => {
  companyValidator.validateAddCompanyDomain(body);
  await companyUtils.assertCompanyExists(companyId);

  const domainName = companyUtils.normalizeDomainName(body.domain_name);
  if (await domainRepository.domainNameTaken(domainName)) {
    throw httpError(409, "Domain already in use");
  }

  const id = uuidv4();
  await domainRepository.createDomain({
    id,
    company_id: companyId,
    domain_name: domainName,
    auth_email_enabled: body.auth_email_enabled,
    auth_google_enabled: body.auth_google_enabled,
  });

  return domainRepository.findById(id);
};

exports.updateCompanyDomain = async (companyId, domainId, body) => {
  const row = await domainRepository.findByIdAndCompanyId(domainId, companyId);
  if (!row) throw httpError(404, "Domain not found for this company");

  companyValidator.validateCompanyDomainPatchBody(body);

  const updates = companyUtils.domainRepositoryPatchFromBody(body);
  if (updates.domain_name) {
    const clash = await domainRepository.existsOtherDomainWithName(
      updates.domain_name,
      domainId
    );
    if (clash) throw httpError(409, "Domain name already exists");
  }

  if (Object.keys(updates).length === 0) {
    return domainRepository.findById(domainId);
  }

  await domainRepository.updateDomain(domainId, updates);
  return domainRepository.findById(domainId);
};

exports.removeCompanyDomain = async (companyId, domainId) => {
  const row = await domainRepository.findByIdAndCompanyId(domainId, companyId);
  if (!row) throw httpError(404, "Domain not found for this company");
  await domainRepository.deleteDomain(domainId);
};
