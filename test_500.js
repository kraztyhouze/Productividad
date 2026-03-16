import fetch from 'node-fetch';

async function test() {
    const res = await fetch('http://localhost:3000/api/active-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-store-id': 'store_1' },
        body: JSON.stringify({ employeeId: '99', employeeName: 'Test', startTime: new Date().toISOString() })
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Body:', text);
}

test();
