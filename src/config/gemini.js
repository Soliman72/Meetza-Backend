const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function askGemini(message, context) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `
You are Meetza support chatbot.

Answer ONLY using the following knowledge base:
${context}

User: ${message}

Rules:
- Do not invent details that are not in the knowledge base.
- If the user asks for missing details, say: "This detail is not available in the current knowledge base."
- Keep answers clear and practical.
- If the user writes in Arabic, answer in Arabic. Otherwise answer in English.
`,
  });

  return response.text;
}

module.exports = askGemini;