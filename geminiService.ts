
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

/**
 * Handles retries with exponential backoff.
 * Especially useful for 429 (Rate Limit) errors.
 */
async function withRetry<T>(fn: (attempt: number) => Promise<T>, maxRetries = 3, initialDelay = 1000): Promise<T> {
  let lastError: any;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn(i);
    } catch (error: any) {
      lastError = error;
      const errorString = JSON.stringify(error).toLowerCase();
      const isRateLimit =
        error?.status === 429 ||
        errorString.includes('429') ||
        errorString.includes('resource_exhausted') ||
        errorString.includes('quota');

      if (!isRateLimit || i === maxRetries) {
        throw error;
      }

      // 1s, 2s, 4s... much faster retry loop
      const delay = initialDelay * Math.pow(2, i);
      console.warn(`Quota reached. Retry ${i + 1}/${maxRetries} in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

// List of models to try in order of preference (Stable -> Experimental)
const MODELS = [
  "gemini-1.5-flash",
  "gemini-1.5-flash-001",
  "gemini-1.5-flash-002",
  "gemini-1.5-pro",
  "gemini-1.5-pro-001",
  "gemini-2.0-flash-exp"
];

export const extractProductFromImage = async (base64Image: string) => {
  let lastError: any;

  // We loop through models. If one works, great.
  // If one fails with 404 (not found), we try the next immediately.
  // If one fails with 429 (quota), we wait a bit then try the next (hoping for a different quota bucket).
  for (const modelName of MODELS) {
    try {
      return await withRetry(async (attempt) => {
        if (attempt === 0) {
          console.log(`Starting extraction with model: ${modelName}`);
        } else {
          console.log(`Retry attempt ${attempt} for model: ${modelName}`);
        }

        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: base64Image.split(',')[1] || base64Image
                  }
                },
                {
                  text: `Extract performance metrics from this TikTok Shop Analytics row.
            Return ONLY JSON:
            {
              "name": "content title",
              "tiktokId": "19-digit id",
              "du": "duration",
              "avgW": "avg watch",
              "re": "retention %",
              "vw": "views",
              "lk": "likes",
              "bm": "bookmarks",
              "cm": "comments",
              "sh": "shares",
              "pfm": "score",
              "products": "count",
              "cpm": "est value",
              "cpe": "est value"
            }`
                }
              ]
            }
          ],
          config: {
            responseMimeType: "application/json",
          }
        });

        const result = response.text;
        if (!result) throw new Error("Empty response");
        return JSON.parse(result);
      }, 2, 2000); // 2 retries per model, 2s initial delay
    } catch (error: any) {
      lastError = error;
      const errorStr = JSON.stringify(error).toLowerCase();

      console.warn(`Model ${modelName} failed: ${error.message || errorStr}`);

      // If 404 (Not Found) or 400 (Bad Request), try next immediately
      if (errorStr.includes('404') || errorStr.includes('not found') || errorStr.includes('not supported') || errorStr.includes('400')) {
        continue;
      }

      // If Quota limit, wait a bit before trying the *next* model to allow system to cool down
      if (errorStr.includes('429') || errorStr.includes('quota') || errorStr.includes('resource_exhausted')) {
        console.warn(`Quota hit on ${modelName}. Waiting 2s before trying next model...`);
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }

      // Other errors might be transient or fatal on all models (like net error), but we try next anyway just in case
      continue;
    }
  }

  // If we ran out of models
  throw lastError || new Error("All available AI models are busy or failed. Please try again in 1 minute.");
};
