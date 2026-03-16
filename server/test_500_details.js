import fetch from 'node-fetch';

async function test() {
    try {
        console.log("Testing POST /api/tasks...");
        const res = await fetch('http://127.0.0.1:3000/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-store-id': 'store_1' },
            body: JSON.stringify({ title: 'Debug Task', date: '2026-03-20', priority: 'Media' })
        });
        const data = await res.json();
        console.log("Status:", res.status);
        console.log("Body:", data);
    } catch (e) {
        console.error("Fetch Error:", e);
    }
}
test();
