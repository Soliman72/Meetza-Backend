const db = require("../config/db");

exports.findLegacyOrganizationDomainByName = async (domainName) => {
  const [rows] = await db.promise().execute(
    "SELECT * FROM organization_domain WHERE domain_name = ?",
    [domainName]
  );
  return rows[0] || null;
};

exports.domainNameTaken = async (domainName) => {
  const norm = String(domainName).toLowerCase().trim();
  const [rows] = await db.promise().execute(
    "SELECT id FROM organization_domain WHERE domain_name = ? LIMIT 1",
    [norm]
  );
  return !!rows[0];
};

exports.existsOtherDomainWithName = async (domainName, excludeDomainId) => {
  const norm = String(domainName).toLowerCase().trim();
  const [rows] = await db.promise().execute(
    "SELECT id FROM organization_domain WHERE domain_name = ? AND id <> ? LIMIT 1",
    [norm, excludeDomainId]
  );
  return !!rows[0];
};


exports.findByDomainName = async (domainName) => {
  const normalized = String(domainName).toLowerCase().trim();
  try {
    const [rows] = await db.promise().execute(
      `SELECT od.id,
              od.domain_name,
              COALESCE(od.auth_email_enabled, cs.auth_email_enabled, 1) AS auth_email_enabled,
              COALESCE(od.auth_google_enabled, cs.auth_google_enabled, 1) AS auth_google_enabled
       FROM organization_domain od
       LEFT JOIN company_settings cs ON cs.company_id = od.company_id
       LEFT JOIN companies c ON c.id = od.company_id
       WHERE od.domain_name = ?
         AND (od.company_id IS NULL OR c.is_active = 1)
       LIMIT 1`,
      [normalized]
    );
    if (rows[0]) {
      const r = rows[0];
      return {
        id: r.id,
        domain_name: r.domain_name,
        auth_email_enabled: !!Number(r.auth_email_enabled),
        auth_google_enabled: !!Number(r.auth_google_enabled),
      };
    }
  } catch {
    /* schema not migrated yet */
  }
  return exports.findLegacyOrganizationDomainByName(normalized);
};

exports.findById = async (id) => {
  const [rows] = await db.promise().execute(
    "SELECT * FROM organization_domain WHERE id = ?",
    [id]
  );
  return rows[0];
};

exports.findByIdAndCompanyId = async (domainId, companyId) => {
  const [rows] = await db.promise().execute(
    "SELECT * FROM organization_domain WHERE id = ? AND company_id = ?",
    [domainId, companyId]
  );
  return rows[0] || null;
};

exports.getAllDomains = async () => {
  const [rows] = await db.promise().execute(
    "SELECT * FROM organization_domain ORDER BY created_at DESC"
  );
  return rows;
};

exports.createDomain = async ({
  id,
  company_id = null,
  domain_name,
  auth_email_enabled,
  auth_google_enabled,
}) => {
  const email =
    company_id == null
      ? auth_email_enabled !== false
        ? 1
        : 0
      : auth_email_enabled === undefined || auth_email_enabled === null
        ? null
        : auth_email_enabled
          ? 1
          : 0;
  const google =
    company_id == null
      ? auth_google_enabled !== false
        ? 1
        : 0
      : auth_google_enabled === undefined || auth_google_enabled === null
        ? null
        : auth_google_enabled
          ? 1
          : 0;

  await db.promise().execute(
    `INSERT INTO organization_domain (id, company_id, domain_name, auth_email_enabled, auth_google_enabled)
     VALUES (?, ?, ?, ?, ?)`,
    [id, company_id, domain_name, email, google]
  );
};

exports.updateDomain = async (id, updates) => {
  const fields = [];
  const values = [];

  if (updates.domain_name !== undefined) {
    fields.push("domain_name = ?");
    values.push(updates.domain_name);
  }
  if (updates.auth_email_enabled !== undefined) {
    fields.push("auth_email_enabled = ?");
    values.push(updates.auth_email_enabled);
  }
  if (updates.auth_google_enabled !== undefined) {
    fields.push("auth_google_enabled = ?");
    values.push(updates.auth_google_enabled);
  }

  if (fields.length === 0) return;

  values.push(id);

  const sql = `UPDATE organization_domain SET ${fields.join(", ")} WHERE id = ?`;
  await db.promise().execute(sql, values);
};

exports.deleteDomain = async (id) => {
  await db.promise().execute("DELETE FROM organization_domain WHERE id = ?", [id]);
};
