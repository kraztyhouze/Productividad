
import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
    try {
        // This method might not be directly exposed easily in the helper, 
        // but usually there is a way or we can just try a few.
        // Actually, the error message suggested: "Call ListModels to see the list".
        // I'll try to guess the most standard ones or use the model listing if the SDK supports it.
        // The SDK specific method is typically accessing the `model` through a weird path or just testing them.

        const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro', 'gemini-1.0-pro', 'gemini-1.5-flash-latest'];

        console.log("Testing models...");
        for (const m of models) {
            try {
                const model = genAI.getGenerativeModel({ model: m });
                const result = await model.generateContent("Hello");
                console.log(`✅ Model ${m} is WORKING.`);
                return; // We found one!
            } catch (e) {
                console.log(`❌ Model ${m} failed: ${e.message.split(':')[0]}`);
            }
        }
    } catch (e) {
        console.error(e);
    }
}

listModels();
