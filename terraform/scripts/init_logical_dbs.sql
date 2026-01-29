-- Initialize Logical Databases
CREATE DATABASE IF NOT EXISTS auth_db;
CREATE DATABASE IF NOT EXISTS order_db;
CREATE DATABASE IF NOT EXISTS product_db;
CREATE DATABASE IF NOT EXISTS inventory_db;

-- (Optional) You can add initial table creation here if needed
-- But usually, your services might have their own migrations
