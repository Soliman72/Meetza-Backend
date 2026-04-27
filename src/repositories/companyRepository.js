const db = require("../config/db");

const query = (sql, params = []) => db.promise().execute(sql, params);

exports.findCompanyById = async (id) => {
  const [companyRows] = await query("SELECT * FROM companies WHERE id = ?", [id]);
  const company = companyRows[0];
  if (!company) return null;
  const [settingsRows] = await query(
    "SELECT * FROM company_settings WHERE company_id = ?",
    [id]
  );
  const [domainRows] = await query(
    "SELECT * FROM organization_domain WHERE company_id = ? ORDER BY domain_name ASC",
    [id]
  );
  return {
    ...company,
    settings: settingsRows[0] || null,
    domains: domainRows || [],
  };
};

exports.listCompanies = async () => {
  const [rows] = await query(
    `SELECT c.*, cs.system_name, cs.theme
     FROM companies c
     LEFT JOIN company_settings cs ON cs.company_id = c.id
     ORDER BY c.created_at DESC`
  );
  return rows;
};

exports.domainExistsInOrganizationDomain = async (domainName) => {
  const norm = String(domainName).toLowerCase().trim();
  const [rows] = await query(
    "SELECT id FROM organization_domain WHERE domain_name = ? LIMIT 1",
    [norm]
  );
  return !!rows[0];
};

exports.updateCompany = async (id, { name, is_active }) => {
  const sets = [];
  const vals = [];
  if (name !== undefined) {
    sets.push("`name` = ?");
    vals.push(String(name).trim());
  }
  if (is_active !== undefined) {
    sets.push("`is_active` = ?");
    vals.push(is_active === false || is_active === 0 || is_active === "0" ? 0 : 1);
  }
  if (!sets.length) return false;
  vals.push(id);
  const [r] = await query(
    `UPDATE companies SET ${sets.join(", ")} WHERE id = ?`,
    vals
  );
  return r.affectedRows > 0;
};

exports.deleteCompany = async (id) => {
  const [r] = await query("DELETE FROM companies WHERE id = ?", [id]);
  return r.affectedRows > 0;
};

const SETTINGS_PATCHABLE = new Set([
  "system_name",
  "logo_url",
  "theme",
  "terms_html",
  "privacy_html",
  "guidelines_html",
  "auth_email_enabled",
  "auth_google_enabled",
]);

exports.updateCompanySettings = async (companyId, patch) => {
  const sets = [];
  const vals = [];
  for (const [k, v] of Object.entries(patch || {})) {
    if (!SETTINGS_PATCHABLE.has(k)) continue;
    sets.push(`\`${k}\` = ?`);
    if (k === "auth_email_enabled" || k === "auth_google_enabled") {
      vals.push(v ? 1 : 0);
    } else {
      vals.push(v === undefined ? null : v);
    }
  }
  if (!sets.length) return false;
  vals.push(companyId);
  const [r] = await query(
    `UPDATE company_settings SET ${sets.join(", ")} WHERE company_id = ?`,
    vals
  );
  return r.affectedRows > 0;
};

exports.companySettingsExists = async (companyId) => {
  const [rows] = await query(
    "SELECT company_id FROM company_settings WHERE company_id = ?",
    [companyId]
  );
  return !!rows[0];
};

/** @param {import('mysql2/promise').PoolConnection} conn */
exports.insertCompany = async (conn, { id, name, is_active }) => {
  await conn.execute(
    "INSERT INTO companies (id, name, is_active) VALUES (?, ?, ?)",
    [id, name, is_active]
  );
};

/** @param {import('mysql2/promise').PoolConnection} conn */
exports.insertCompanySettings = async (conn, companyId, s) => {
  await conn.execute(
    `INSERT INTO company_settings
     (company_id, system_name, logo_url, theme, terms_html, privacy_html, guidelines_html,
      auth_email_enabled, auth_google_enabled)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      companyId,
      s.system_name,
      s.logo_url,
      s.theme,
      s.terms_html,
      s.privacy_html,
      s.guidelines_html,
      s.auth_email_enabled,
      s.auth_google_enabled,
    ]
  );
};

/** @param {import('mysql2/promise').PoolConnection} conn */
exports.insertOrganizationDomainForCompany = async (
  conn,
  { id, company_id, domain_name, auth_email_enabled, auth_google_enabled }
) => {
  await conn.execute(
    `INSERT INTO organization_domain
     (id, company_id, domain_name, auth_email_enabled, auth_google_enabled)
     VALUES (?, ?, ?, ?, ?)`,
    [id, company_id, domain_name, auth_email_enabled, auth_google_enabled]
  );
};
