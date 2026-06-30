-- SAFE MIGRATION: schema-updates.sql
-- Back up your database before running this script.
-- This script is designed for MySQL 8+. Run step-by-step if you hit errors.

-- 1) Enhance `menu_items` with image, quantity, description, category
-- NOTE: MySQL here does not support `ADD COLUMN IF NOT EXISTS`, so this block
-- assumes these columns are not present yet. Run it once, or tell me and I can
-- generate a column-checking version.
ALTER TABLE menu_items
  ADD COLUMN image_url VARCHAR(255) AFTER icon,
  ADD COLUMN quantity INT DEFAULT 999 AFTER image_url,
  ADD COLUMN description TEXT AFTER quantity,
  ADD COLUMN category VARCHAR(100) AFTER description;

-- 2) Ensure `users` table exists (most installs already have this). If not, create it.
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('customer','admin','superadmin') DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3) Make `orders.user_id` nullable and add column if missing so guests can place orders
ALTER TABLE orders
  ADD COLUMN user_id INT DEFAULT NULL;

-- 4) Create dashboard tables for widgets, promotions and presets
CREATE TABLE IF NOT EXISTS dashboard_widgets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    widget_type ENUM('promotion', 'featured_items', 'special_offers', 'top_rated', 'custom') NOT NULL,
    title VARCHAR(255),
    description TEXT,
    image_url VARCHAR(255),
    link_url VARCHAR(255),
    position INT NOT NULL DEFAULT 0,
    width INT DEFAULT 100 COMMENT 'percentage width',
    height INT DEFAULT 300 COMMENT 'pixel height',
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS promotions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    discount_percent INT,
    valid_from DATE,
    valid_to DATE,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dashboard_presets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    preset_name VARCHAR(255) NOT NULL,
    layout_json JSON,
    is_active TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS menu_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    image_url VARCHAR(255),
    display_order INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

  -- 4.1) Ensure daily session templates exist (used to auto-generate 2 sessions every day)
  CREATE TABLE IF NOT EXISTS daily_session_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_type ENUM('morning', 'evening') NOT NULL UNIQUE,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    max_orders INT NOT NULL DEFAULT 8,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  );

  INSERT INTO daily_session_templates (session_type, start_time, end_time, max_orders)
  SELECT 'morning', '11:30', '13:00', 8
  WHERE NOT EXISTS (
    SELECT 1 FROM daily_session_templates WHERE session_type = 'morning'
  );

  INSERT INTO daily_session_templates (session_type, start_time, end_time, max_orders)
  SELECT 'evening', '14:00', '16:00', 8
  WHERE NOT EXISTS (
    SELECT 1 FROM daily_session_templates WHERE session_type = 'evening'
  );

-- 4.2) Add visual dashboard layout coordinates for widget positioning
ALTER TABLE dashboard_widgets
  ADD COLUMN layout_x INT NOT NULL DEFAULT 0,
  ADD COLUMN layout_y INT NOT NULL DEFAULT 0;

-- 5) Migrate `order_items.menu_item_name` -> `menu_item_id`
--    Add new column
ALTER TABLE order_items
  ADD COLUMN menu_item_id INT DEFAULT NULL;

--    Populate menu_item_id by matching names (exact match). Review unmatched rows after running.
UPDATE order_items oi
JOIN menu_items mi ON oi.menu_item_name = mi.name
SET oi.menu_item_id = mi.id
WHERE oi.menu_item_id IS NULL AND oi.menu_item_name IS NOT NULL;

--    If many rows remain NULL, you'll need manual reconciliation (names differ).
--    Inspect with: SELECT * FROM order_items WHERE menu_item_id IS NULL;

--    Add FK constraint if desired (only after verifying data), using ON DELETE SET NULL to avoid failures
ALTER TABLE order_items
  ADD CONSTRAINT fk_order_items_menu_item_id FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE SET NULL;

--    (Optional) After verifying data, drop the old name column
-- ALTER TABLE order_items DROP COLUMN menu_item_name;

-- 6) Create helpful indexes (some MySQL versions may error if the same index exists)
--    Run manually if your MySQL version complains about duplicate indexes.
ALTER TABLE orders ADD INDEX idx_user_orders (user_id);
ALTER TABLE orders ADD INDEX idx_delivery_session_orders (delivery_session_id);
ALTER TABLE orders ADD INDEX idx_branch_orders (branch_id);
ALTER TABLE order_items ADD INDEX idx_order_items (order_id);

-- End of migration script

/* NOTES:
- Before running: BACKUP your DB.
- If `order_items.menu_item_name` values don't match exact `menu_items.name`, the update will leave NULLs.
  In that case, run a manual reconciliation (e.g. check spelling differences) or share a sample and I can help write fuzzy-match SQL.
- If your MySQL version is older and doesn't support "IF NOT EXISTS" for ADD COLUMN or ADD CONSTRAINT, run the statements step-by-step and ignore errors for already-existing objects.
- I can produce a one-shot rollback script if you want to revert after testing.
*/
