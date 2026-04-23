const groupService = require("../services/groupService");

exports.createGroup = async (req, res) => {
  try {
    const result = await groupService.createGroup(req);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getAllGroups = async (req, res) => {
  try {
    const data = await groupService.getAllGroups(req);
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getGroupById = async (req, res) => {
  try {
    const data = await groupService.getGroupById(req);
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.updateGroup = async (req, res) => {
  try {
    await groupService.updateGroup(req);
    res.status(200).json({ success: true, message: "Updated" });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    await groupService.deleteGroup(req);
    res.status(200).json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.addGroupAdmin = async (req, res) => {
  try {
    const result = await groupService.addGroupAdmin(req); 
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.removeGroupAdmin = async (req, res) => {
  try {
    const result = await groupService.removeGroupAdmin(req);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.leaveGroup = async (req, res) => {
  try {
    const result = await groupService.leaveGroup(req);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};