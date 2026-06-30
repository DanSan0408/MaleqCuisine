const mysql = require('mysql2/promise');
require('dotenv').config({ path: './keyes.env' }); // Ensure the path is correct from the root

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

async function ensureDashboardTables() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS dashboard_slideshow_images (
            id INT PRIMARY KEY AUTO_INCREMENT,
            image_url VARCHAR(255) NOT NULL,
            alt_text VARCHAR(255),
            position INT DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_slideshow_position (position),
            INDEX idx_slideshow_active (is_active)
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS dashboard_featured_items (
            id INT PRIMARY KEY AUTO_INCREMENT,
            menu_item_id INT NOT NULL,
            position INT DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_featured_item (menu_item_id),
            INDEX idx_featured_position (position),
            INDEX idx_featured_active (is_active),
            CONSTRAINT fk_dashboard_featured_menu_item
                FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
                ON DELETE CASCADE
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS dashboard_company_story (
            id INT PRIMARY KEY AUTO_INCREMENT,
            title VARCHAR(255) NOT NULL DEFAULT 'Our Story',
            description TEXT,
            image_url VARCHAR(255),
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_story_active (is_active)
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS dashboard_settings (
            id INT PRIMARY KEY,
            slideshow_image_mode ENUM('fit', 'fill') NOT NULL DEFAULT 'fill',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);

    await pool.query(`
        INSERT INTO dashboard_settings (id, slideshow_image_mode)
        VALUES (1, 'fill')
        ON DUPLICATE KEY UPDATE id = id
    `);
}

async function tableHasColumn(tableName, columnName) {
    const [rows] = await pool.query(
        `SELECT 1
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?
           AND COLUMN_NAME = ?
         LIMIT 1`,
        [tableName, columnName]
    );

    return rows.length > 0;
}

async function ensureOrderTables() {
    if (!(await tableHasColumn('orders', 'order_number'))) {
        await pool.query('ALTER TABLE orders ADD COLUMN order_number VARCHAR(20) DEFAULT NULL AFTER id');

        // Backfill existing orders with specialized numbers based on their order type
        const [orders] = await pool.query('SELECT id, order_type FROM orders ORDER BY id ASC');
        const counters = { delivery: 1, pickup: 1, dine_in: 1 };
        for (const order of orders) {
            const type = order.order_type;
            let prefix = type === 'delivery' ? 'D' : type === 'pickup' ? 'P' : type === 'dine_in' ? 'A' : 'O';
            if (!counters[type]) counters[type] = 1;
            const num = counters[type];
            counters[type] = num >= 999 ? 1 : num + 1;
            const orderNumber = `${prefix}${String(num).padStart(3, '0')}`;
            await pool.query('UPDATE orders SET order_number = ? WHERE id = ?', [orderNumber, order.id]);
        }
    }

    if (!(await tableHasColumn('orders', 'tracking_token'))) {
        await pool.query('ALTER TABLE orders ADD COLUMN tracking_token VARCHAR(64) DEFAULT NULL AFTER status');
    }

    if (!(await tableHasColumn('orders', 'table_number'))) {
        await pool.query('ALTER TABLE orders ADD COLUMN table_number VARCHAR(50) NULL AFTER branch_id');
    } else {
        await pool.query('ALTER TABLE orders MODIFY COLUMN table_number VARCHAR(50) NULL');
    }

    if (!(await tableHasColumn('orders', 'dine_in_time'))) {
        await pool.query('ALTER TABLE orders ADD COLUMN dine_in_time VARCHAR(50) NULL AFTER table_number');
    }

    if (!(await tableHasColumn('orders', 'dine_in_pax'))) {
        await pool.query('ALTER TABLE orders ADD COLUMN dine_in_pax INT NULL AFTER dine_in_time');
    }

    const [trackingIndex] = await pool.query(
        `SELECT 1
         FROM INFORMATION_SCHEMA.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'orders'
           AND INDEX_NAME = 'idx_order_tracking_token'
         LIMIT 1`
    );

    if (trackingIndex.length === 0) {
        await pool.query('CREATE UNIQUE INDEX idx_order_tracking_token ON orders(tracking_token)');
    }
}

module.exports = pool;
module.exports.ensureDashboardTables = ensureDashboardTables;
module.exports.ensureOrderTables = ensureOrderTables;