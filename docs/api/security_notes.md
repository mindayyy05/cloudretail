# Security Notes

This document outlines the security measures implemented in the CloudRetail platform.

## 1. Authentication & Authorization
- **JWT (JSON Web Tokens)**: Stateless authentication used across all services.
- **RBAC (Role-Based Access Control)**:
  - `USER`: Can access standard shopping features.
  - `ADMIN`: Can access `/admin/*` endpoints and manage resources.
- **Microservice Auth**: Internal services verify JWT signatures to ensure requests originated from the Gateway.

## 2. Network Security
- **API Gateway**: Acts as the single entry point, hiding internal microservice topology.
- **CORS**: Configured to allow requests only from the implementation frontend (localhost:3000).
- **Rate Limiting**: Implemented at the Gateway to prevent abuse (e.g., 100 req/15min).

## 3. Data Protection
- **Encryption at Rest**:
  - Passwords: Hashes using `bcrypt` (salt rounds: 10).
  - Database: AWS RDS encryption enabled (if deployed in prod).
- **Encryption in Transit**:
  - All external traffic should be over HTTPS (TLS 1.2+).
  - Internal traffic within the VPC is isolated.

## 4. API Security
- **Input Validation**: All inputs sanitized to prevent SQL Injection.
- **Parameter Tampering**: Order totals re-calculated on server side; client prices ignored/verified.
