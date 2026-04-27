const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");
const companyRepository = require("../repositories/companyRepository");
const domainRepository = require("../repositories/domainRepository");
const companyValidator = require("../validators/companyValidator");
const httpError = require("../utils/httpError");

const normalizeTheme = (t) => {
  const s = String(t || "light").toLowerCase();
  return s === "dark" ? "dark" : "light";
};

/**
 * New company → `companies`, default `company_settings`, optional domains in `organization_domain`.
 */
exports.provisionCompany = async (body) => {
  companyValidator.validateProvisionCompany(body);

  const companyId = uuidv4();
  const domains = Array.isArray(body.domains) ? body.domains : [];

  for (const d of domains) {
    const dn = d?.domain_name;
    if (!dn || String(dn).trim() === "") continue;
    const lower = String(dn).toLowerCase().trim();
    let taken = false;
    try {
      taken = await domainRepository.domainNameTaken(lower);
    } catch {
      taken = false;
    }
    if (taken) {
      throw httpError(409, `Domain already in use: ${lower}`);
    }
  }

  const conn = await db.promise().getConnection();
  try {
    await conn.beginTransaction();

    await conn.execute(
      `INSERT INTO companies (id, name, is_active) VALUES (?, ?, ?)`,
      [companyId, String(body.name).trim(), body.is_active === false ? 0 : 1]
    );

    await conn.execute(
      `INSERT INTO company_settings
       (company_id, system_name, logo_url, theme, terms_html, privacy_html, guidelines_html,
        auth_email_enabled, auth_google_enabled)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        companyId,
        String(body.system_name || body.name).trim(),
        body.logo_url || null,
        normalizeTheme(body.theme),
        body.terms_html ?? null,
        body.privacy_html ?? null,
        body.guidelines_html ?? null,
        body.auth_email_enabled !== false ? 1 : 0,
        body.auth_google_enabled !== false ? 1 : 0,
      ]
    );

    for (const d of domains) {
      const dn = d?.domain_name;
      if (!dn || String(dn).trim() === "") continue;
      await conn.execute(
        `INSERT INTO organization_domain
         (id, company_id, domain_name, auth_email_enabled, auth_google_enabled)
         VALUES (?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          companyId,
          String(dn).toLowerCase().trim(),
          d.auth_email_enabled === undefined
            ? null
            : d.auth_email_enabled
              ? 1
              : 0,
          d.auth_google_enabled === undefined
            ? null
            : d.auth_google_enabled
              ? 1
              : 0,
        ]
      );
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
  const row = await companyRepository.findCompanyById(id);
  if (!row) throw httpError(404, "Company not found");
  return row;
};

exports.listCompanies = async () => {
  return companyRepository.listCompanies();
};
