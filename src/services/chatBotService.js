const chatBotValidator = require("../validators/chatBotValidator");

/**
 * Chat-bot turn: validate input and return a structured reply payload.
 * Wire your provider / RAG / tools inside this function later.
 */
exports.chat = async (req) => {
  chatBotValidator.validateChatRequest(req);

  const { conversation_id: conversationId } = req.body || {};

  return {
    conversation_id: conversationId || null,
    reply: "",
    role: "assistant",
  };
};
