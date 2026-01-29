const _fetch = fetch;

const URL = 'http://localhost:4002/api/v1/products';
const DURATION_MS = 10000; // 10 seconds
const CONCURRENCY = 10;

async function worker(id, stopTime, stats) {
    while (Date.now() < stopTime) {
        const start = Date.now();
        try {
            const res = await _fetch(URL);
            const duration = Date.now() - start;
            if (res.status === 200) {
                stats.requests++;
                stats.totalLatency += duration;
                if (duration > stats.maxLatency) stats.maxLatency = duration;
            } else {
                stats.errors++;
            }
        } catch (e) {
            stats.errors++;
        }
    }
}

async function runLoadTest() {
    console.log(`--- Starting Load Test ---`);
    console.log(`Target: ${URL}`);
    console.log(`Duration: ${DURATION_MS / 1000}s`);
    console.log(`Concurrency: ${CONCURRENCY}`);

    const stats = { requests: 0, errors: 0, totalLatency: 0, maxLatency: 0 };
    const stopTime = Date.now() + DURATION_MS;

    const workers = [];
    for (let i = 0; i < CONCURRENCY; i++) {
        workers.push(worker(i, stopTime, stats));
    }

    await Promise.all(workers);

    console.log(`\n--- Test Results ---`);
    console.log(`Total Requests: ${stats.requests}`);
    console.log(`Total Errors:   ${stats.errors}`);

    if (stats.requests > 0) {
        const rps = (stats.requests / (DURATION_MS / 1000)).toFixed(2);
        const avgLatency = (stats.totalLatency / stats.requests).toFixed(2);
        console.log(`Throughput:     ${rps} req/sec`);
        console.log(`Avg Latency:    ${avgLatency} ms`);
        console.log(`Max Latency:    ${stats.maxLatency} ms`);
    } else {
        console.log('No successful requests.');
    }
}

runLoadTest();
