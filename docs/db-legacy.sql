CREATE DATABASE IF NOT EXISTS cloudretail_legacy;
USE cloudretail_legacy;

CREATE TABLE legacy_orders (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  legacy_customer_name VARCHAR(100),
  legacy_total DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
