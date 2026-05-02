const groupService = require("../services/groupService");
const { GroupAccessError } = require("../utils/groupAccess");
const {
  buildPendingGroupEmailActionResultHtml,
  getFrontendBaseUrl,
  buildPendingGroupEmailSuccessRedirectUrl,
  buildPendingGroupEmailErrorRedirectUrl,
  getPendingGroupEmailActionSuccessView,
  getPendingGroupEmailActionErrorView,
} = require("../utils/pendingGroupEmailHelpers");
const {
  requirePendingGroupEmailToken,
} = require("../validators/pendingGroupEmailActionValidator");

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

exports.getPendingGroups = async (req, res) => {
  try {
    const data = await groupService.getPendingGroups(req);
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.updatePendingGroupStatus = async (req, res) => {
  try {
    const data = await groupService.updatePendingGroupStatus(req);
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.pendingGroupEmailAction = async (req, res) => {
  const frontend = getFrontendBaseUrl();

  try {
    const token = requirePendingGroupEmailToken(req);
    const data = await groupService.executePendingGroupFromEmail(token);
    if (frontend) {
      return res.redirect(
        302,
        buildPendingGroupEmailSuccessRedirectUrl(frontend, data.status)
      );
    }
    const view = getPendingGroupEmailActionSuccessView(data);
    return res
      .status(view.httpStatus)
      .type("html")
      .send(
        buildPendingGroupEmailActionResultHtml(
          view.heading,
          view.detail,
          view.success
        )
      );
  } catch (err) {
    const view = getPendingGroupEmailActionErrorView(err);
    if (frontend) {
      return res.redirect(
        302,
        buildPendingGroupEmailErrorRedirectUrl(frontend, view.detail)
      );
    }
    return res
      .status(view.httpStatus)
      .type("html")
      .send(
        buildPendingGroupEmailActionResultHtml(
          view.heading,
          view.detail,
          view.success
        )
      );
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
    res.status(result.status).json(result.body);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.removeGroupAdmin = async (req, res) => {
  try {
    const result = await groupService.removeGroupAdmin(req);
    res.status(result.status).json(result.body);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.leaveGroup = async (req, res) => {
  try {
    const out = await groupService.leaveGroup(req);
    return res.status(out.status).json(out.body);
  } catch (err) {
    if (err instanceof GroupAccessError) {
      return res
        .status(err.statusCode)
        .json({ success: false, message: err.message });
    }
    return res.status(500).json({
      success: false,
      message: "Database error",
      error: err.message,
    });
  }
};