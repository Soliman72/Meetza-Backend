const companyService = require("../services/companyService");
require("dotenv").config();
const companyId = process.env.COMPANY_ID;
const defaultCompanyData = {
  name: "Meetza",
  settings: {
    system_name: "Meetza",
    system_name_color: "#2c3e50",
    logo_url:
      "https://res.cloudinary.com/dovu1umwg/image/upload/v1714857600/meetza/logo.png",
    theme: "light",
    auth_google_enabled: true,
    domains: [
      {
        domain_name: "meetza.com",
        auth_email_enabled: true,
        auth_google_enabled: true,
      },
    ],
  },
};

const requireCompanyId = () => {
  if (!companyId) {
    const err = new Error("COMPANY_ID is not configured");
    err.status = 500;
    throw err;
  }
  return companyId;
};

const sendError = (res, err) => {
  const status =
    err.status && err.status >= 400 && err.status < 600 ? err.status : 500;
  return res.status(status).json({
    success: false,
    message: err.message || "Error",
    ...(status >= 500 ? { error: err.message } : {}),
  });
};

exports.provision = async (req, res) => {
  try {
    const data = await companyService.provisionCompany(req);
    return res.status(201).json({ success: true, data });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.list = async (req, res) => {
  try {
    const data = await companyService.listCompanies();
    return res.json({ success: true, data });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.getById = async (req, res) => {
  try {
    if (!companyId) {
      return res.json({ success: true, data: defaultCompanyData });
    }
    const data = await companyService.getCompanyById(companyId);
    if (!data) {
      return res.json({ success: true, data: defaultCompanyData });
    }
    return res.json({ success: true, data });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.update = async (req, res) => {
  try {
    const data = await companyService.updateCompany(requireCompanyId(), req.body);
    return res.json({ success: true, data });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.remove = async (req, res) => {
  try {
    await companyService.deleteCompany(requireCompanyId());
    return res.json({ success: true, message: "Company deleted" });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.patchSettings = async (req, res) => {
  try {
    const data = await companyService.patchCompanySettings(requireCompanyId(), req.body);
    return res.json({ success: true, data });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.patchLogo = async (req, res) => {
  try {
    const file = req.files?.company_logo?.[0];
    const data = await companyService.updateCompanyLogo(requireCompanyId(), file);
    return res.json({ success: true, data });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.addDomain = async (req, res) => {
  try {
    const data = await companyService.addCompanyDomain(requireCompanyId(), req.body);
    return res.status(201).json({ success: true, data });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.updateDomain = async (req, res) => {
  try {
    const data = await companyService.updateCompanyDomain(
      requireCompanyId(),
      req.params.domainId,
      req.body
    );
    return res.json({ success: true, data });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.removeDomain = async (req, res) => {
  try {
    await companyService.removeCompanyDomain(requireCompanyId(), req.params.domainId);
    return res.json({ success: true, message: "Domain removed" });
  } catch (err) {
    return sendError(res, err);
  }
};
