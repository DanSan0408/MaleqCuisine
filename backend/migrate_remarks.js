const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'keyes.env' });

async function migrate() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    try {
        console.log('Checking if remarks column exists in order_items...');
        const [rows] = await pool.query(`
            SELECT 1 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
              AND TABLE_NAME = 'order_items' 
              AND COLUMN_NAME = 'remarks'
        `);

        if (rows.length === 0) {
            console.log('Adding remarks column to order_items...');
            await pool.query('ALTER TABLE order_items ADD COLUMN remarks VARCHAR(255) DEFAULT NULL AFTER price');
            console.log('Successfully added remarks column.');
        } else {
            console.log('remarks column already exists.');
        }
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
