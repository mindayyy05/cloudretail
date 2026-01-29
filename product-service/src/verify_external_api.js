
const PRODUCT_SERVICE_URL = 'http://localhost:4002/api/v1/products/rates';

async function verifyExternalApi() {
    console.log('--- Verifying External API Integration ---');
    console.log(`Target URL: ${PRODUCT_SERVICE_URL}`);

    try {
        const start = Date.now();
        const res = await fetch(PRODUCT_SERVICE_URL);
        const duration = Date.now() - start;

        console.log(`Status: ${res.status}`);
        console.log(`Time: ${duration}ms`);

        if (res.status === 200) {
            const data = await res.json();
            console.log('Response Body:', JSON.stringify(data, null, 2));

            if (data.rates && data.rates.USD) {
                console.log('✅ PASS: Exchange rates received');
                if (data.source === 'external') {
                    console.log('✅ PASS: Data source confirmed as external API');
                } else {
                    console.log('⚠️ NOTE: Data source is fallback (External API might be blocked/down)');
                }
            } else {
                console.log('❌ FAIL: Response missing rates data');
            }
        } else {
            console.log('❌ FAIL: Non-200 status code');
        }

    } catch (err) {
        console.error('❌ FATAL: Request failed', err.message);
        if (err.cause) {
            console.error('Cause:', err.cause);
        }
    }
}

verifyExternalApi();
