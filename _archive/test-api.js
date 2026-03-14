
import 'dotenv/config';

const PORT = process.env.PORT || 3000;
const URL = `http://localhost:${PORT}/api/dashboard/stats`;

async function testApi() {
    console.log(`--- API DIAGNOSTIC (${URL}) ---`);
    console.log(`Testing Yesterday: 2026-02-18`);

    try {
        const res = await fetch(`${URL}?date=2026-02-18&month=2026-02`, {
            headers: { 'x-store-id': 'store_1' }
        });

        if (!res.ok) {
            console.error(`HTTP ERROR: ${res.status} ${res.statusText}`);
            const text = await res.text();
            console.error("Body:", text);
            return;
        }

        const json = await res.json();
        console.log("Response OK.");
        console.log("Total Groups Today (vs Yesterday logic):", json.dailyStats?.totalGroups);
        console.log("Monthly Top Count:", json.monthlyTop?.length);
        console.log("Sample Monthly Top:", JSON.stringify(json.monthlyTop?.[0]));

        console.log("--- CONCLUSION ---");
        if (json.monthlyTop?.length > 0) {
            console.log("✅ API IS WORKING and returning data.");
        } else {
            console.log("⚠️ API works but returns EMPTY data.");
        }

    } catch (e) {
        console.error("CONNECTION ERROR:", e.message);
        console.log("Is the main server running? (npm run dev)");
    }
}

testApi();
