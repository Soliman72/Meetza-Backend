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
