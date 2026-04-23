const reportService = require("../services/reportService");

const sendError = (res, err) => {
  const status =
    err.status && err.status >= 400 && err.status < 600 ? err.status : 500;
  const body = { success: false, message: err.message };
  if (status >= 500) body.error = err.message;
  return res.status(status).json(body);
};

exports.getAnalyticsReport = async (req, res) => {
  try {
    const result = await reportService.getAnalyticsReport(req);
    if (result.empty) {
      return res.status(200).json({
        success: true,
        data: result.data,
        message: result.message,
      });
    }
    return res.status(200).json({ success: true, data: result.data });
  } catch (err) {
    console.error("[analytics] Error:", err);
    return sendError(res, err);
  }
};
