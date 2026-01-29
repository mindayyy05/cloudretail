// Native fetch fallback
// const _fetch = global.fetch; // Node 18+ has fetch built-in
const _fetch = fetch;
const AUTH_SERVICE_URL = 'http://localhost:4001/api/v1/auth';

async function verifyMFAFlow() {
    console.log('--- Verifying MFA/OTP Flow ---');

    // 1. Setup Test User
    const email = `mfa_test_${Date.now()}@example.com`;

    // Register user first (to ensure they exist)
    try {
        await _fetch(`${AUTH_SERVICE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                first_name: 'MFA',
                last_name: 'Tester',
                email: email,
                password: 'password123',
                role: 'USER'
            })
        });
    } catch (e) { /* Ignore if already exists */ }

    try {
        // 2. Request OTP
        console.log(`Step 1: Requesting OTP for ${email}...`);
        const genRes = await _fetch(`${AUTH_SERVICE_URL}/mfa/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        if (genRes.status !== 200) {
            throw new Error(`Failed to generate OTP: ${genRes.status}`);
        }
        console.log('✅ OTP Generated. (Check server logs for code)');

        // NOTE: In an automated test without parsing logs, we cannot get the exact code.
        // However, we can verify the INVALID case to prove the endpoint works.

        // 3. Verify Invalid OTP
        console.log('Step 2: Testing Invalid OTP...');
        const verifyRes = await _fetch(`${AUTH_SERVICE_URL}/mfa/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp: '000000' })
        });

        const verifyData = await verifyRes.json();
        if (verifyRes.status === 400 && verifyData.message === 'Invalid OTP') {
            console.log('✅ System correctly rejected invalid OTP.');
        } else {
            console.log('❌ Unexpected response for invalid OTP:', verifyData);
        }

        console.log('--- MFA Flow Verified (Partially) ---');
        console.log('To fully verify success, one must manually input the server log code.');

    } catch (err) {
        console.error('❌ MFA Verification Failed:', err.message);
    }
}

verifyMFAFlow();
