const buildContext = require("./contextBuilder");
const askGemini = require("../config/gemini");

exports.chat = async (req) => {
  const { message, conversation_id } = req.body || {};
  if (!message || typeof message !== "string") {
    const error = new Error("Message is required");
    error.status = 400;
    throw error;
  }

  const context = await buildContext(message);
  const reply = await askGemini(message, context);

  return {
    conversation_id: conversation_id || null,
    reply: reply,
    role: "assistant",
  };
};
