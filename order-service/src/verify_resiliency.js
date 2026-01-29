// Circuit Breaker Demo Script
// Tests the wrapped function directly with 'opossum'

const CBOpossum = require('opossum');

async function callExternalPaymentGateway(amount) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (amount === 123.45) {
                console.log('❌ Service Failed');
                reject(new Error('Payment Gateway Timeout'));
            } else {
                console.log('✅ Service Success');
                resolve('Success');
            }
        }, 100);
    });
}

const breakerOptions = {
    timeout: 3000,
    errorThresholdPercentage: 50,
    resetTimeout: 5000 // 5 seconds for demo
};

const breaker = new CBOpossum(callExternalPaymentGateway, breakerOptions);

breaker.on('open', () => console.log('⚡ CIRCUIT BREAKER OPENED!'));
breaker.on('close', () => console.log('🟢 CIRCUIT BREAKER CLOSED'));
breaker.on('halfOpen', () => console.log('🟡 CIRCUIT BREAKER HALF-OPEN'));

async function runDemo() {
    console.log('--- Starting Circuit Breaker Demo ---');
    console.log('Simulating 5 failures to trip the breaker...');

    for (let i = 0; i < 5; i++) {
        try {
            await breaker.fire(123.45);
        } catch (e) {
            // Ignore error, we expect it
        }
    }

    console.log('Now checking circuit status...');
    try {
        await breaker.fire(100); // Should fail immediately if open
    } catch (e) {
        console.log(`Request rejeced: ${e.message}`);
    }

    console.log('Waiting for reset (5s)...');
    setTimeout(async () => {
        console.log('Retrying with success case...');
        try {
            await breaker.fire(100);
        } catch (e) {
            console.error('Still failed:', e.message);
        }
    }, 6000);
}

runDemo();
