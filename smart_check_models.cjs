
const { GoogleGenerativeAI } = require('@google/generative-ai');
const https = require('https');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function findWorkingModel() {
    console.log("🔍 Fetching available models...");

    // 1. Get List via HTTP (raw list) to ensure we know exact names
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    https.get(url, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', async () => {
            try {
                const json = JSON.parse(data);
                if (!json.models) {
                    console.error("❌ Could not list models:", json);
                    return;
                }

                // Prioritize Flash models as they are usually cheaper/free-er
                const candidates = json.models
                    .map(m => m.name.replace('models/', '')) // Remove prefix for SDK
                    .filter(n => n.includes('flash') || n.includes('pro')); // Filter relevant text models

                console.log(`📋 Found ${candidates.length} candidates:`, candidates);

                // 2. Test each one
                for (const modelName of candidates) {
                    console.log(`\n🧪 Testing: ${modelName}...`);
                    try {
                        const model = genAI.getGenerativeModel({ model: modelName });
                        const result = await model.generateContent("Test");
                        const response = await result.response;
                        console.log(`✅ SUCCESS! '${modelName}' is working. Response:`, response.text().slice(0, 20));

                        console.log(`\n🎉 RECOMMENDED ACTION: Update code to use '${modelName}'`);
                        return; // Stop after first success
                    } catch (e) {
                        let msg = e.message;
                        if (msg.includes('429')) msg = '429 Quota Exceeded';
                        if (msg.includes('404')) msg = '404 Not Found';
                        console.log(`❌ Failed: ${msg.slice(0, 100)}...`);
                    }
                }
                console.log("\n⚠️ No working models found. You may need to check Google AI Studio billing/plans.");

            } catch (e) {
                console.error("Parse error", e);
            }
        });
    });
}

findWorkingModel();
