const memberService = require("../services/memberService");
const { success: resSuccess, error: resError } = require("../dto");

exports.createMember = async (req) => {
  return memberService.createMember(req);
};

exports.getAllMembers = async (req, res) => {
  try {
    const rows = await memberService.getAllMembers();
    res.status(200).json(resSuccess(rows));
  } catch (err) {
    res.status(500).json(resError(err.message, { error: err.message }));
  }
};

exports.getMemberById = async (req, res) => {
  try {
    const user_id = req.params.id;
    const row = await memberService.getMemberById(user_id);
    res.status(200).json(resSuccess(row));
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json(resError(err.message, { error: err.message }));
  }
};

exports.updateMember = async (req, res) => {
  try {
    const user_id = req.params.id;
    const { user_id: new_user_id } = req.body;
    await memberService.updateMember(user_id, new_user_id);
    res.status(200).json(resSuccess(null, "Member updated successfully"));
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json(resError(err.message, { error: err.message }));
  }
};

exports.deleteMember = async (req, res) => {
  try {
    const user_id = req.params.id;
    await memberService.deleteMember(user_id);
    res.status(200).json(resSuccess(null, "Member deleted successfully"));
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json(resError(err.message, { error: err.message }));
  }
};
