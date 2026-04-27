const companyService = require("../services/companyService");

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
    const data = await companyService.getCompanyById(req.params.id);
    return res.json({ success: true, data });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.update = async (req, res) => {
  try {
    const data = await companyService.updateCompany(req.params.id, req.body);
    return res.json({ success: true, data });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.remove = async (req, res) => {
  try {
    await companyService.deleteCompany(req.params.id);
    return res.json({ success: true, message: "Company deleted" });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.patchSettings = async (req, res) => {
  try {
    const data = await companyService.patchCompanySettings(req.params.id, req.body);
    return res.json({ success: true, data });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.patchLogo = async (req, res) => {
  try {
    const file = req.files?.company_logo?.[0];
    const data = await companyService.updateCompanyLogo(req.params.id, file);
    return res.json({ success: true, data });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.addDomain = async (req, res) => {
  try {
    const data = await companyService.addCompanyDomain(req.params.id, req.body);
    return res.status(201).json({ success: true, data });
  } catch (err) {
    return sendError(res, err);
  }
};

exports.updateDomain = async (req, res) => {
  try {
    const data = await companyService.updateCompanyDomain(
      req.params.id,
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
    await companyService.removeCompanyDomain(req.params.id, req.params.domainId);
    return res.json({ success: true, message: "Domain removed" });
  } catch (err) {
    return sendError(res, err);
  }
};
