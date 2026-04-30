const chatBotValidator = require("../validators/chatBotValidator");
const geminiModel = require("../config/gemini");
/**
 * Chat-bot turn: validate input and return a structured reply payload.
 * Wire your provider / RAG / tools inside this function later.
 */
exports.chat = async (req) => {
  chatBotValidator.validateChatRequest(req);

  const { conversation_id: conversationId } = req.body || {};
  const result = await geminiModel.generateContent("Hello");
  console.log(result);
  
  return {
    conversation_id: conversationId || null,
    reply: result.text(),
    role: "assistant",
  };
};
