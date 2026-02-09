
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
  "gemini-1.5-flash-latest",
  "gemini-1.5-flash-001",
  "gemini-2.0-flash-exp",
  "gemini-2.0-flash"
];

export const extractProductFromImage = async (base64Image: string) => {
  let lastError: any;

  for (const modelName of MODELS) {
    try {
      return await withRetry(async (attempt) => {
        // If this is a retry (attempt > 0), we are still on the same model.
        // We only switch models if we get a 404 or other non-retriable error (handled by outer loop logic effectively, but here we just try one model)

        console.log(`Attempting with model: ${modelName} (Attempt ${attempt + 1})`);
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
      });
    } catch (error: any) {
      lastError = error;
      const errorStr = JSON.stringify(error).toLowerCase();

      // If 404 (Model not found) or 400 (Bad Request - sometimes model related), try next model
      if (errorStr.includes('404') || errorStr.includes('not found') || errorStr.includes('not supported')) {
        console.warn(`Model ${modelName} failed or not found. Trying next...`);
        continue;
      }

      // If it's a rate limit handling that failed after retries, we might want to try another model?
      // Usually rate limit is per-project, avoiding model switch might not help unless models have separate quotas.
      // But 2.0-flash and 1.5-flash DO have separate quotas. So continuing is good!
      if (errorStr.includes('429') || errorStr.includes('quota')) {
        console.warn(`Model ${modelName} quota exhausted. Trying next model...`);
        continue;
      }

      // Other errors (parsing, etc) -> throw immediately
      throw error;
    }
  }

  // If we ran out of models
  throw lastError || new Error("All models failed");
};
