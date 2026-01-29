# Load Testing with k6

This directory contains load/stress testing scripts for the CloudRetail application.

## Prerequisites
- [k6](https://k6.io/docs/get-started/installation/) installed.

## Running the Test
Run the following commands to execute tests and save results to `reports/performance/`:

```bash
# Run Load Test and save JSON results
k6 run --out json=reports/performance/load_test_results.json tests/k6/load_test.js

# Run Functional Test and save CSV results
k6 run --out csv=reports/performance/functional_test_results.csv tests/k6/functional_api_test.js
```

## Scenarios
- `load_test.js`: Basic load test targeting the Gateway health endpoint.
- `functional_api_test.js`: Functional flow (Auth -> Products -> Orders).
