const buildContext = require("./contextBuilder");
const askGemini = require("../config/gemini");

exports.chat = async (req) => {
  const { message } = req.body;
  const context = await buildContext(message);
  const reply = await askGemini(message, context);
  
  return {
    conversation_id: conversationId || null,
    reply: reply,
    role: "assistant",
  };
}
