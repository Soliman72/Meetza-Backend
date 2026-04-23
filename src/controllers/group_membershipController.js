const groupMemberShipService = require("../services/group_memberShipService");

exports.createGroupMembership = async (req, res) => {
  try {
    const data = await groupMemberShipService.createGroupMembership(req);
    res.status(201).json({ success: true, data });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({
      success: false,
      message: err.message || "Database error",
      ...(status === 500 ? { error: err.message } : {}),
    });
  }
};

exports.getAllGroupMemberships = async (req, res) => {
  try {
    const data = await groupMemberShipService.getAllGroupMemberships(req);
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Database error",
      error: err.message,
    });
  }
};

exports.getGroupMembershipById = async (req, res) => {
  try {
    const row = await groupMemberShipService.getGroupMembershipById(
      req.params.id
    );
    res.status(200).json({ success: true, data: row });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({
      success: false,
      message: err.message || "Database error",
      ...(status === 500 ? { error: err.message } : {}),
    });
  }
};

exports.updateGroupMembership = async (req, res) => {
  try {
    await groupMemberShipService.updateGroupMembership(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: "Group membership updated successfully",
    });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({
      success: false,
      message: err.message || "Database error",
      ...(status === 500 ? { error: err.message } : {}),
    });
  }
};

exports.deleteGroupMembership = async (req, res) => {
  try {
    await groupMemberShipService.deleteGroupMembership(req.params.id);
    res.status(200).json({
      success: true,
      message: "Group membership deleted successfully",
    });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({
      success: false,
      message: err.message || "Database error",
      ...(status === 500 ? { error: err.message } : {}),
    });
  }
};
