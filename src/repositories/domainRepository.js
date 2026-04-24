const db = require("../config/db");

exports.findByDomainName = async (domainName) => {
  const [rows] = await db.promise().execute(
    "SELECT * FROM organization_domain WHERE domain_name = ?",
    [domainName]
  );
  return rows[0];
};

exports.findById = async (id) => {
  const [rows] = await db.promise().execute(
    "SELECT * FROM organization_domain WHERE id = ?",
    [id]
  );
  return rows[0];
};

exports.getAllDomains = async () => {
  const [rows] = await db.promise().execute(
    "SELECT * FROM organization_domain ORDER BY created_at DESC"
  );
  return rows;
};

exports.createDomain = async ({ id, domain_name, auth_email_enabled, auth_google_enabled }) => {
  await db.promise().execute(
    `INSERT INTO organization_domain (id, domain_name, auth_email_enabled, auth_google_enabled) 
     VALUES (?, ?, ?, ?)`,
    [id, domain_name, auth_email_enabled, auth_google_enabled]
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
