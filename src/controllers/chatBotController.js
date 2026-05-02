const chatBotService = require("../services/chatBotService");

exports.chat = async (req, res) => {
  try {
    const data = await chatBotService.chat(req);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      success: false,
      message: err.message || "Chat bot error",
      ...(status >= 500 ? { error: err.message } : {}),
    });
  }
};