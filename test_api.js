// Native fetch


(async () => {
    try {
        console.log("Fetching from http://localhost:3000/api/dashboard/stats?date=2026-02-16&month=2026-02");
        const res = await fetch("http://localhost:3000/api/dashboard/stats?date=2026-02-16&month=2026-02", {
            headers: { 'x-store-id': 'store_1' }
        });
        const data = await res.json();
        console.log("Response Status:", res.status);
        console.log("Total Groups (Yesterday):", data.totalGroups);
        console.log("Month Stats Max Daily:", data.monthStats?.maxDailyGroups);
        console.log("Monthly Top Count:", data.monthlyTop?.length);
        console.log("Sample Monthly Top:", data.monthlyTop?.[0]);
    } catch (e) {
        console.error("Error:", e.message);
    }
})();
