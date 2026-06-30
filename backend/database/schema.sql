-- Delivery Sessions Table
CREATE TABLE IF NOT EXISTS delivery_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_type ENUM('morning', 'evening') NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    max_orders INT DEFAULT 8,
    current_orders INT DEFAULT 0,
    date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Daily Delivery Session Templates (auto-applied every day)
CREATE TABLE IF NOT EXISTS daily_session_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_type ENUM('morning', 'evening') NOT NULL UNIQUE,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    max_orders INT NOT NULL DEFAULT 8,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO daily_session_templates (session_type, start_time, end_time, max_orders) 
VALUES ('morning', '11:30', '13:00', 8);

INSERT IGNORE INTO daily_session_templates (session_type, start_time, end_time, max_orders) 
VALUES ('evening', '14:00', '16:00', 8);

-- Branches/Restaurants Table
CREATE TABLE IF NOT EXISTS branches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Menu Items Table
CREATE TABLE IF NOT EXISTS menu_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50),
    image_url VARCHAR(255),
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Users Table (create before orders so foreign keys resolve)
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('customer','admin','superadmin') DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_number VARCHAR(20) DEFAULT NULL,
    user_id INT DEFAULT NULL,
    order_type ENUM('delivery', 'pickup', 'dine_in') NOT NULL,
    status ENUM('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled') DEFAULT 'pending',
    tracking_token VARCHAR(64) DEFAULT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    -- Customer Info
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(100),
    -- Delivery Info
    delivery_address VARCHAR(255),
    delivery_session_id INT,
    -- Pickup Info
    branch_id INT,
    -- Dine In Info
        table_number VARCHAR(50),
        dine_in_time VARCHAR(50),
        dine_in_pax INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (delivery_session_id) REFERENCES delivery_sessions(id),
    FOREIGN KEY (branch_id) REFERENCES branches(id)
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    menu_item_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);

-- Indexes
CREATE INDEX idx_user_orders ON orders(user_id);
CREATE INDEX idx_delivery_session_orders ON orders(delivery_session_id);
CREATE INDEX idx_branch_orders ON orders(branch_id);
CREATE INDEX idx_order_items ON order_items(order_id);
CREATE UNIQUE INDEX idx_order_tracking_token ON orders(tracking_token);

-- ------------------------------------------------------------
-- Migration block for your CURRENT database layout
-- Existing tables:
--   users(id, email, password, role, created_at)
--   orders(id, customer_name, phone, order_type, location_details,
--          payment_method, total_amount, status, created_at)
--   order_items(id, order_id, menu_item_name, price, quantity)
-- This block adds the new columns used by the updated app and copies
-- existing data into them without deleting legacy columns.
-- ------------------------------------------------------------

-- orders: add the new columns used by the updated schema/app
ALTER TABLE orders
    ADD COLUMN order_number VARCHAR(20) DEFAULT NULL AFTER id,
    ADD COLUMN user_id INT DEFAULT NULL,
    ADD COLUMN customer_phone VARCHAR(20) AFTER customer_name,
    ADD COLUMN customer_email VARCHAR(100) AFTER customer_phone,
    ADD COLUMN tracking_token VARCHAR(64) DEFAULT NULL AFTER status,
    ADD COLUMN subtotal DECIMAL(10, 2) DEFAULT 0 AFTER status,
    ADD COLUMN total DECIMAL(10, 2) DEFAULT 0 AFTER subtotal,
    ADD COLUMN delivery_address VARCHAR(255) AFTER customer_email,
    ADD COLUMN delivery_session_id INT AFTER delivery_address,
    ADD COLUMN branch_id INT AFTER delivery_session_id,
    ADD COLUMN table_number VARCHAR(50) AFTER branch_id,
    ADD COLUMN dine_in_time VARCHAR(50) DEFAULT NULL AFTER table_number,
    ADD COLUMN dine_in_pax INT DEFAULT NULL AFTER dine_in_time,
    ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Backfill orders data from the existing columns
UPDATE orders
SET customer_phone = COALESCE(customer_phone, phone),
    subtotal = COALESCE(subtotal, total_amount),
    total = COALESCE(total, total_amount),
    delivery_address = COALESCE(delivery_address, location_details)
WHERE customer_phone IS NULL
   OR subtotal = 0
   OR total = 0
   OR delivery_address IS NULL;

-- If the existing column already exists as INT in a live database, convert it to text.
ALTER TABLE orders
    MODIFY COLUMN table_number VARCHAR(50) NULL;

-- If you want the old `phone` column renamed eventually, do it only after you confirm the app works.
-- Example (optional, destructive to the old column name only):
-- ALTER TABLE orders CHANGE COLUMN phone customer_phone VARCHAR(20) NOT NULL;

-- order_items: add the new menu_item_id column and backfill it from menu_items.name
ALTER TABLE order_items
    ADD COLUMN menu_item_id INT DEFAULT NULL AFTER order_id;

UPDATE order_items oi
JOIN menu_items mi ON mi.name = oi.menu_item_name
SET oi.menu_item_id = mi.id
WHERE oi.menu_item_id IS NULL;

-- If every row was matched successfully, you can later add a foreign key and optionally drop menu_item_name.
-- Keep menu_item_name for now so old data remains readable.

-- Optional future cleanup once verified:
-- ALTER TABLE orders DROP COLUMN phone;
-- ALTER TABLE orders DROP COLUMN location_details;
-- ALTER TABLE orders DROP COLUMN total_amount;
-- ALTER TABLE order_items DROP COLUMN menu_item_name;
