# Monitoring & Observability

This directory contains configuration for the CloudRetail observability stack.

## Components
- **Metrics**: Prometheus (scraping `/metrics` endpoints)
- **Visualization**: Grafana
- **Logging**: Centralised logging via structured JSON output
- **Tracing**: Correlation IDs propagated via `x-correlation-id` header

## Dashboards
- `grafana_dashboard.json`: A standard dashboard template for microservices, tracking:
  - P95 Request Latency
  - Error Rates (5xx)
  - Resource Usage (CPU/Memory)

## Alerts
Alerting rules are configured in Prometheus to trigger on:
- High Error Rate (> 1% for 5m)
- High Latency (> 500ms for 5m)
- Service Down (Instance count < 1)
