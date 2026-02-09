
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

// List of models to try in order of preference (Stable -> Experimental)
const MODELS = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash-8b",
];

/**
 * Handles retries with exponential backoff.
 */
async function withRetry<T>(fn: (attempt: number) => Promise<T>, maxRetries = 2, initialDelay = 1000): Promise<T> {
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

            const delay = initialDelay * Math.pow(2, i);
            console.warn(`Retry ${i + 1}/${maxRetries} in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw lastError;
}

export const extractProductFromImage = async (base64Image: string) => {
    let primaryError: any = null; // Store the most meaningful error (e.g. 429)
    let lastError: any;

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
            }, 2, 2000);
        } catch (error: any) {
            lastError = error;
            const errorStr = JSON.stringify(error).toLowerCase();

            console.warn(`Model ${modelName} failed: ${error.message || errorStr}`);

            // Capture the first rate limit error as the primary error to report if all else fails
            if (!primaryError && (errorStr.includes('429') || errorStr.includes('quota') || errorStr.includes('resource_exhausted'))) {
                primaryError = error;
            }

            // If Quota limit, wait a bit before trying the *next* model
            if (errorStr.includes('429') || errorStr.includes('quota') || errorStr.includes('resource_exhausted')) {
                console.warn(`Quota hit on ${modelName}. Waiting 2s before trying next model...`);
                await new Promise(r => setTimeout(r, 2000));
                continue;
            }

            // Try next model for other errors too, effectively falling back
            continue;
        }
    }

    // Throw the primary error (likely 429) if it exists, otherwise the last error encountered
    throw primaryError || lastError || new Error("All available AI models are busy or failed. Please try again later.");
};
