import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

let ai: any = null;

export function getAI() {
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set. AI features will be disabled.");
    return null;
  }
  if (!ai) {
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

export async function generateLoveLetter(prompt: string) {
  const aiInstance = getAI();
  if (!aiInstance) return "AI is currently offline. But my love for you is always online.";

  try {
    const response = await aiInstance.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Write a deeply romantic, poetic, and high-end love letter based on this context: "${prompt}".
        The tone should be sophisticated, sincere, and "enterprise-level" romantic. 
        Keep it concise but impactful. Max 150 words.
      `,
    });
    return response.text || "I love you.";
  } catch (error: any) {
    if (error?.status === "RESOURCE_EXHAUSTED" || error?.message?.includes("quota")) {
      console.warn("Gemini API quota exceeded. Using fallback.");
      return "My words are currently lost in the stars, but my heart remains yours. I love you more than any AI could ever express.";
    }
    console.error("Error generating love letter:", error);
    return "Something went wrong with the AI, but my heart still knows what to say: I love you.";
  }
}

export async function generateDailyNote() {
  const aiInstance = getAI();
  if (!aiInstance) return "You are the most beautiful part of my day, every single day.";

  try {
    const response = await aiInstance.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Write a very short, sweet, and unique "Why I Love You" note for a partner.
        It should be one sentence long, deeply romantic, and feel like a fresh thought.
        Avoid clichés if possible. Keep it under 20 words.
      `,
    });
    return response.text || "I love you more than words can ever express.";
  } catch (error: any) {
    if (error?.status === "RESOURCE_EXHAUSTED" || error?.message?.includes("quota")) {
      console.warn("Gemini API quota exceeded. Using fallback.");
      return "You are the reason I smile every single day, and I'm so lucky to have you.";
    }
    console.error("Error generating daily note:", error);
    return "I love you more than words can ever express.";
  }
}
