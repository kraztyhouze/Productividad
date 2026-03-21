async function check() {
    try {
        const res = await fetch('http://localhost:3000/api/employees', {
            headers: { 'x-store-id': 'store_1' }
        });
        if (res.ok) {
            const data = await res.json();
            console.log('✅ Server is UP and responding.');
            console.log('First employee name:', data[0]?.firstName);
        } else {
            console.log('❌ Server responded with status:', res.status);
        }
    } catch (e) {
        console.log('❌ Server is DOWN or not reachable:', e.message);
    }
}
check();
