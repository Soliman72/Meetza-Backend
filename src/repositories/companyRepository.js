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
