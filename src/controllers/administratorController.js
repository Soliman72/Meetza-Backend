const administratorService = require("../services/administratorService");
const { success: resSuccess, error: resError } = require("../dto");

exports.createAdministrator = async (req) => {
  return administratorService.createAdministrator(req);
};

exports.getAllAdministrators = async (req, res) => {
  try {
    const rows = await administratorService.getAllAdministrators(req);
    res.status(200).json(resSuccess(rows));
  } catch (err) {
    res
      .status(500)
      .json(
        resError(err.message || "Database error", { error: err.message })
      );
  }
};

exports.getAdministratorById = async (req, res) => {
  try {
    const user_id = req.params.id;
    const row = await administratorService.getAdministratorById(user_id);
    res.status(200).json(resSuccess(row));
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json(resError(err.message, { error: err.message }));
  }
};

exports.updateAdministrator = async (req, res) => {
  try {
    const user_id = req.params.id;
    const { new_user_id, role } = req.body;
    await administratorService.updateAdministrator(user_id, new_user_id, role);
    res
      .status(200)
      .json(resSuccess(null, "Administrator updated successfully"));
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json(resError(err.message, { error: err.message }));
  }
};

exports.deleteAdministrator = async (req, res) => {
  try {
    const user_id = req.params.id;
    await administratorService.deleteAdministrator(user_id);
    res
      .status(200)
      .json(resSuccess(null, "Administrator deleted successfully"));
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json(resError(err.message, { error: err.message }));
  }
};
