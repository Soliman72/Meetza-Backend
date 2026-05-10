const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Ensures we have both Arabic and English versions of the AI metadata.
 * It takes whatever language was provided and uses Gemini to generate/translate both.
 * 
 * @param {string} originalSummary 
 * @param {string[]} originalTopics 
 * @returns {Promise<{ar: {summary: string, topics: string[]}, en: {summary: string, topics: string[]}}>}
 */
async function ensureBilingualAiMetadata(originalSummary, originalTopics) {
  const prompt = `
    You are a professional bilingual translator (Arabic and English).
    Below is a summary and a list of topics.
    
    Original Summary:
    ${originalSummary}
    
    Original Topics:
    ${JSON.stringify(originalTopics)}
    
    Task:
    1. Identify the language of the original text.
    2. Provide a high-quality Arabic version of the summary and topics (in Arabic script).
    3. Provide a high-quality English version of the summary and topics.
    
    Return the result in JSON format ONLY with the following structure:
    {
      "ar": {
        "summary": "Arabic summary here",
        "topics": ["Arabic", "Topics", "Here"]
      },
      "en": {
        "summary": "English summary here",
        "topics": ["English", "Topics", "Here"]
      }
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    const text = response.text;
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Gemini bilingual generation error:", error);
    // Fallback: assume the original is what it is, and return it for both (worst case)
    return {
      ar: { summary: originalSummary, topics: originalTopics },
      en: { summary: originalSummary, topics: originalTopics }
    };
  }
}

module.exports = { ensureBilingualAiMetadata };
