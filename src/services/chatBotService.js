const buildContext = require("./contextBuilder");
const askGemini = require("../config/gemini");
const chatBotCacheRepo = require("../repositories/chatBotCacheRepository");

const CACHE_TTL_MINUTES = Number(process.env.CHATBOT_CACHE_TTL_MINUTES) || 30;

function normalizeMessage(message) {
  return message.trim().toLowerCase().replace(/\s+/g, " ");
}

exports.chat = async (req) => {
  const { message, conversation_id } = req.body || {};
  if (!message || typeof message !== "string") {
    const error = new Error("Message is required");
    error.status = 400;
    throw error;
  }

  const cacheKey = normalizeMessage(message);
  const cachedReply = await chatBotCacheRepo.getValidReplyByKey(cacheKey);
  if (cachedReply) {
    return {
      conversation_id: conversation_id || null,
      reply: cachedReply,
      role: "assistant",
      cached: true,
    };
  }

  const context = await buildContext(message);
  const reply = await askGemini(message, context);
  await chatBotCacheRepo.upsertReply({
    questionKey: cacheKey,
    normalizedQuestion: cacheKey,
    reply,
    ttlMinutes: CACHE_TTL_MINUTES,
  });

  return {
    conversation_id: conversation_id || null,
    reply: reply,
    role: "assistant",
    cached: false,
  };
};
