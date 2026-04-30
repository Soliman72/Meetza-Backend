const companyService = require("../services/companyService");
require("dotenv").config();
const companyId = process.env.COMPANY_ID;
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
    const data = await companyService.getCompanyById(companyId);
    return res.json({ success: true, data });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.update = async (req, res) => {
  try {
    const data = await companyService.updateCompany(companyId, req.body);
    return res.json({ success: true, data });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.remove = async (req, res) => {
  try {
    await companyService.deleteCompany(companyId);
    return res.json({ success: true, message: "Company deleted" });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.patchSettings = async (req, res) => {
  try {
    const data = await companyService.patchCompanySettings(companyId, req.body);
    return res.json({ success: true, data });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.patchLogo = async (req, res) => {
  try {
    const file = req.files?.company_logo?.[0];
    const data = await companyService.updateCompanyLogo(companyId, file);
    return res.json({ success: true, data });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.addDomain = async (req, res) => {
  try {
    const data = await companyService.addCompanyDomain(companyId, req.body);
    return res.status(201).json({ success: true, data });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.updateDomain = async (req, res) => {
  try {
    const data = await companyService.updateCompanyDomain(
      companyId,
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
    await companyService.removeCompanyDomain(companyId, req.params.domainId);
    return res.json({ success: true, message: "Domain removed" });
  } catch (err) {
    return sendError(res, err);
  }
};
