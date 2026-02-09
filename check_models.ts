
import { GoogleGenAI } from "@google/genai";
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
let apiKey = '';
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/VITE_GEMINI_API_KEY=(.*)/);
    if (match) {
        apiKey = match[1].trim();
    }
}

if (!apiKey) {
    console.log("No API Key");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function listModels() {
    try {
        const response = await ai.models.list();
        if (response) {
            // Check standard 'models' array or similar
            const models = (response as any).models || (response as any).data?.models;
            if (models) {
                models.forEach((m: any) => {
                    if (m.name.includes('flash')) {
                        console.log(m.name);
                    }
                });
            } else {
                console.log("No models property in response", Object.keys(response));
            }
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();
