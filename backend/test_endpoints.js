const axios = require('axios');

async function testEndpoints() {
    try {
        const token = 'MOCK_TOKEN'; // We just want to see if we get a 401 or a 500 or network error
        
        console.log('Testing /api/payment/settings...');
        try {
            const res1 = await axios.get('http://localhost:5000/api/payment/settings');
            console.log('Settings OK:', res1.status);
        } catch (e) {
            console.error('Settings Error:', e.response ? e.response.status + ' ' + JSON.stringify(e.response.data) : e.message);
        }

        console.log('\nTesting /api/payment/orders/pending-verifications...');
        try {
            const res2 = await axios.get('http://localhost:5000/api/payment/orders/pending-verifications', { headers: { Authorization: `Bearer ${token}` } });
            console.log('Pending Verifications OK:', res2.status);
        } catch (e) {
            console.error('Pending Verifications Error:', e.response ? e.response.status + ' ' + JSON.stringify(e.response.data) : e.message);
        }

        console.log('\nTesting /api/payment/orders/logs...');
        try {
            const res3 = await axios.get('http://localhost:5000/api/payment/orders/logs', { headers: { Authorization: `Bearer ${token}` } });
            console.log('Logs OK:', res3.status);
        } catch (e) {
            console.error('Logs Error:', e.response ? e.response.status + ' ' + JSON.stringify(e.response.data) : e.message);
        }
    } catch (err) {
        console.error('Fatal error', err);
    }
}

testEndpoints();
