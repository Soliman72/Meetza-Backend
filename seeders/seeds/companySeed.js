const db = require("../../src/config/db");
const { v4: uuidv4 } = require("uuid");
const seed = require("../data/companyData");

async function upsertCompanyDomains(companyId) {
  const list = Array.isArray(seed.domains) ? seed.domains : [];

  for (const d of list) {
    if (!d?.domain_name) continue;

    const domainRowId = d.id ?? uuidv4();

    await db.promise().query(
      `
      INSERT INTO organization_domain (
        id,
        company_id,
        domain_name,
        auth_email_enabled,
        auth_google_enabled
      )
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        company_id = VALUES(company_id),
        auth_email_enabled = VALUES(auth_email_enabled),
        auth_google_enabled = VALUES(auth_google_enabled)
      `,
      [
        domainRowId,
        companyId,
        d.domain_name,
        d.auth?.email ?? null,
        d.auth?.google ?? null,
      ]
    );
  }
}

async function upsertCompanySettings(companyId) {
  await db.promise().query(
    `
    INSERT INTO company_settings (
      company_id,
      system_name,
      logo_url,
      system_name_color,
      theme,
      terms_html,
      privacy_html,
      guidelines_html,
      auth_email_enabled,
      auth_google_enabled
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      system_name = VALUES(system_name),
      logo_url = VALUES(logo_url),
      system_name_color = VALUES(system_name_color),
      theme = VALUES(theme),
      terms_html = VALUES(terms_html),
      privacy_html = VALUES(privacy_html),
      guidelines_html = VALUES(guidelines_html),
      auth_email_enabled = VALUES(auth_email_enabled),
      auth_google_enabled = VALUES(auth_google_enabled)
    `,
    [
      companyId,
      seed.system_name,
      seed.logo_url,
      seed.system_name_color,
      seed.theme ?? "light",
      seed.terms_html,
      seed.privacy_html,
      seed.guidelines_html,
      seed.auth_email_enabled ? 1 : 0,
      seed.auth_google_enabled ? 1 : 0,
    ]
  );
}

async function seedCompany() {
  const companyId = seed.id;

  if (!companyId) {
    throw new Error("companyData.js must define `id`");
  }

  await db.promise().query(
    `
    INSERT INTO companies (id, name, is_active)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      is_active = VALUES(is_active)
    `,
    [
      companyId,
      seed.name,
      seed.is_active ? 1 : 0,
    ]
  );

  console.log("Company upserted");

  await upsertCompanySettings(companyId);
  console.log("Company settings synced");

  await upsertCompanyDomains(companyId);
  console.log("Company domains synced");
}

module.exports = seedCompany;