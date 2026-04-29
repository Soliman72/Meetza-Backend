const companyService = require("../services/companyService");
require("dotenv").config();
const companyId = process.env.COMPANY_ID;
const resolveCompanyId = (req) => {
  const id = req.params?.id == "id" ? companyId : req.params?.id;
  if (!id) {
    const err = new Error("Company id is required");
    err.status = 400;
    throw err;
  }
  return id;
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
    const data = await companyService.provisionCompany(req.body);
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
    const data = await companyService.getCompanyById(resolveCompanyId(req));
    return res.json({ success: true, data });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.update = async (req, res) => {
  try {
    const data = await companyService.updateCompany(resolveCompanyId(req), req.body);
    return res.json({ success: true, data });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.remove = async (req, res) => {
  try {
    await companyService.deleteCompany(resolveCompanyId(req));
    return res.json({ success: true, message: "Company deleted" });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.patchSettings = async (req, res) => {
  try {
    const data = await companyService.patchCompanySettings(resolveCompanyId(req), req.body);
    return res.json({ success: true, data });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.patchLogo = async (req, res) => {
  try {
    const file = req.files?.company_logo?.[0];
    const data = await companyService.updateCompanyLogo(resolveCompanyId(req), file);
    return res.json({ success: true, data });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.addDomain = async (req, res) => {
  try {
    const data = await companyService.addCompanyDomain(resolveCompanyId(req), req.body);
    return res.status(201).json({ success: true, data });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.updateDomain = async (req, res) => {
  try {
    const data = await companyService.updateCompanyDomain(
      resolveCompanyId(req),
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
    await companyService.removeCompanyDomain(resolveCompanyId(req), req.params.domainId);
    return res.json({ success: true, message: "Domain removed" });
  } catch (err) {
    return sendError(res, err);
  }
};
