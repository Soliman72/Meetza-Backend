const companyRepository = require("../repositories/companyRepository");
const httpError = require("./httpError");

exports.normalizeTheme = (t) => {
  const s = String(t || "light").toLowerCase();
  return s === "dark" ? "dark" : "light";
};

exports.normalizeDomainName = (name) => String(name).toLowerCase().trim();

exports.provisionCompanyRow = (body) => ({
  name: String(body.name).trim(),
  is_active: body.is_active === false ? 0 : 1,
});

exports.provisionCompanySettingsValues = (body) => ({
  system_name: String(body.system_name || body.name).trim(),
  logo_url: body.logo_url || null,
  system_name_color: body.system_name_color || null,
  theme: exports.normalizeTheme(body.theme),
  terms_html: body.terms_html ?? null,
  privacy_html: body.privacy_html ?? null,
  guidelines_html: body.guidelines_html ?? null,
  auth_email_enabled: body.auth_email_enabled !== false ? 1 : 0,
  auth_google_enabled: body.auth_google_enabled !== false ? 1 : 0,
});


exports.collectProvisionDomains = (domains) => {
  const list = Array.isArray(domains) ? domains : [];
  const out = [];
  for (const d of list) {
    const dn = d?.domain_name;
    if (!dn || String(dn).trim() === "") continue;
    out.push({
      domain_name: exports.normalizeDomainName(dn),
      auth_email_enabled:
        d.auth_email_enabled === undefined ? null : d.auth_email_enabled ? 1 : 0,
      auth_google_enabled:
        d.auth_google_enabled === undefined ? null : d.auth_google_enabled ? 1 : 0,
    });
  }
  return out;
};

exports.settingsPatchFromBody = (body) => {
  const patch = {};
  if (body.system_name !== undefined) patch.system_name = String(body.system_name).trim();
  if (body.logo_url !== undefined) patch.logo_url = body.logo_url || null;
  if (body.system_name_color !== undefined) patch.system_name_color = body.system_name_color || null;
  if (body.theme !== undefined) patch.theme = exports.normalizeTheme(body.theme);
  if (body.terms_html !== undefined) patch.terms_html = body.terms_html;
  if (body.privacy_html !== undefined) patch.privacy_html = body.privacy_html;
  if (body.guidelines_html !== undefined) patch.guidelines_html = body.guidelines_html;
  if (body.auth_email_enabled !== undefined) {
    patch.auth_email_enabled = !!body.auth_email_enabled;
  }
  if (body.auth_google_enabled !== undefined) {
    patch.auth_google_enabled = !!body.auth_google_enabled;
  }
  return patch;
};

exports.domainRepositoryPatchFromBody = (body) => {
  const updates = {};
  if (body.domain_name !== undefined) {
    updates.domain_name = exports.normalizeDomainName(body.domain_name);
  }
  if (body.auth_email_enabled !== undefined) {
    updates.auth_email_enabled = body.auth_email_enabled ? 1 : 0;
  }
  if (body.auth_google_enabled !== undefined) {
    updates.auth_google_enabled = body.auth_google_enabled ? 1 : 0;
  }
  return updates;
};

exports.assertCompanyExists = async (companyId) => {
  const row = await companyRepository.findCompanyById(companyId);
  return row;
};

exports.assertCompanySettingsExist = async (companyId) => {
  const ok = await companyRepository.companySettingsExists(companyId);
  if (!ok) throw httpError(404, "Company settings not found");
};
