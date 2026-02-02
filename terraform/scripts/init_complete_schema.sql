-- CloudRetail Production Database Initialization
-- This script creates all databases and tables for the microservices architecture

-- Create Logical Databases
CREATE DATABASE IF NOT EXISTS auth_db;
CREATE DATABASE IF NOT EXISTS order_db;
CREATE DATABASE IF NOT EXISTS product_db;
CREATE DATABASE IF NOT EXISTS inventory_db;

-- ============================================
-- AUTH_DB: User Authentication & Authorization
-- ============================================
USE auth_db;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('USER','ADMIN') NOT NULL DEFAULT 'USER',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- PRODUCT_DB: Product Catalog
-- ============================================
USE product_db;

CREATE TABLE IF NOT EXISTS products (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(100),
  image_url VARCHAR(500),
  rating DECIMAL(2,1) DEFAULT 0.0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_price (price)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INVENTORY_DB: Stock Management
-- ============================================
USE inventory_db;

CREATE TABLE IF NOT EXISTS inventory (
  product_id BIGINT PRIMARY KEY,
  available_qty INT NOT NULL DEFAULT 0,
  reserved_qty INT NOT NULL DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_available (available_qty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ORDER_DB: Order Management
-- ============================================
USE order_db;

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status TINYINT NOT NULL DEFAULT 1 COMMENT '1=Placed, 2=Processing, 3=Shipped, 4=Delivered, 5=Cancelled',
  tracking_status VARCHAR(50) DEFAULT 'placed',
  
  -- Shipping Information
  shipping_name VARCHAR(255),
  shipping_address VARCHAR(500),
  shipping_city VARCHAR(100),
  shipping_zip VARCHAR(20),
  shipping_country VARCHAR(100),
  
  -- Payment Information
  delivery_date DATE,
  payment_method VARCHAR(50),
  payment_status VARCHAR(50) DEFAULT 'PENDING',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  rating TINYINT DEFAULT NULL COMMENT '1-5 stars',
  feedback TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_order_id (order_id),
  INDEX idx_product_id (product_id),
  CONSTRAINT fk_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Sample Data for Testing (Optional)
-- ============================================

-- Insert a test admin user (password: admin123)
USE auth_db;
INSERT IGNORE INTO users (id, first_name, last_name, email, password_hash, role) VALUES
(1, 'Admin', 'User', 'admin@cloudretail.com', '$2b$10$rZ8qH8vKZGxJ9YxN5XxN5.xN5XxN5XxN5XxN5XxN5XxN5XxN5XxN5', 'ADMIN');

-- Insert sample products
USE product_db;
INSERT IGNORE INTO products (id, name, description, price, category, image_url, rating) VALUES
(1, 'Wireless Headphones', 'Premium noise-cancelling headphones', 199.99, 'Electronics', 'https://picsum.photos/seed/headphones/400/400', 4.5),
(2, 'Smart Watch', 'Fitness tracking smartwatch', 299.99, 'Electronics', 'https://picsum.photos/seed/watch/400/400', 4.7),
(3, 'Laptop Stand', 'Ergonomic aluminum laptop stand', 49.99, 'Accessories', 'https://picsum.photos/seed/stand/400/400', 4.3),
(4, 'USB-C Hub', '7-in-1 USB-C multiport adapter', 79.99, 'Accessories', 'https://picsum.photos/seed/hub/400/400', 4.6),
(5, 'Mechanical Keyboard', 'RGB backlit mechanical keyboard', 149.99, 'Electronics', 'https://picsum.photos/seed/keyboard/400/400', 4.8);

-- Initialize inventory for products
USE inventory_db;
INSERT IGNORE INTO inventory (product_id, available_qty, reserved_qty) VALUES
(1, 100, 0),
(2, 75, 0),
(3, 150, 0),
(4, 200, 0),
(5, 50, 0);

-- Success Message
SELECT 'Database initialization completed successfully!' AS Status;
