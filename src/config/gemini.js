const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function askGemini(message, context) {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `
You are a chatbot for a website.

Answer ONLY using this data:
${context}

User: ${message}

If not found say "I don't know"
`,
  });

  return response.text;
}

module.exports = askGemini;