const db = require('../config/db');
const path = require('path');
const fs = require('fs');

// Settings

exports.getPaymentSettings = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT qr_code_url FROM payment_settings WHERE id = 1 LIMIT 1');
        res.json({ settings: rows[0] || { qr_code_url: null } });
    } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.json({ settings: { qr_code_url: null } });
        }
        console.error('Error fetching payment settings:', error);
        res.status(500).json({ message: 'Failed to fetch payment settings' });
    }
};

exports.updatePaymentSettings = async (req, res) => {
    try {
        let qr_code_url;
        
        // Handle file upload
        if (req.file) {
            qr_code_url = `/uploads/${req.file.filename}`;
        } else if (req.body.qr_code_url) {
            qr_code_url = req.body.qr_code_url;
        } else {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        await db.query(
            `INSERT INTO payment_settings (id, qr_code_url) VALUES (1, ?)
             ON DUPLICATE KEY UPDATE qr_code_url = VALUES(qr_code_url)`,
            [qr_code_url]
        );

        res.json({ message: 'Payment settings updated successfully', qr_code_url });
    } catch (error) {
        console.error('Error updating payment settings:', error);
        res.status(500).json({ message: 'Failed to update payment settings' });
    }
};

// Receipt

exports.uploadReceipt = async (req, res) => {
    try {
        const { orderId } = req.params;
        if (!req.file) {
            return res.status(400).json({ message: 'No receipt file uploaded' });
        }

        const receiptUrl = `/uploads/${req.file.filename}`;

        await db.query(
            'UPDATE orders SET payment_receipt_url = ?, payment_status = ? WHERE id = ?',
            [receiptUrl, 'pending_verification', orderId]
        );

        res.json({ message: 'Receipt uploaded successfully', receipt_url: receiptUrl });
    } catch (error) {
        console.error('Error uploading receipt:', error);
        res.status(500).json({ message: 'Failed to upload receipt' });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const { orderId } = req.params;
        
        await db.query(
            'UPDATE orders SET payment_status = ? WHERE id = ?',
            ['paid', orderId]
        );

        res.json({ message: 'Payment verified successfully' });
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ message: 'Failed to verify payment' });
    }
};

// Delete Old Receipts Cleanup
exports.getPendingVerifications = async (req, res) => {
    try {
        const [orders] = await db.query(`
            SELECT id, order_number, customer_name, customer_phone, total, payment_method, payment_status, payment_receipt_url, created_at 
            FROM orders 
            WHERE payment_status = 'pending_verification'
            ORDER BY created_at DESC
        `);
        res.json({ orders });
    } catch (error) {
        console.error('Error fetching pending verifications:', error);
        res.status(500).json({ message: 'Failed to fetch pending verifications' });
    }
};

exports.getPaymentLogs = async (req, res) => {
    try {
        const [orders] = await db.query(`
            SELECT id, order_number, customer_name, customer_phone, total, payment_method, payment_status, payment_receipt_url, created_at, updated_at
            FROM orders 
            WHERE payment_status IN ('paid', 'failed')
            ORDER BY updated_at DESC
            LIMIT 50
        `);
        res.json({ logs: orders });
    } catch (error) {
        console.error('Error fetching payment logs:', error);
        res.status(500).json({ message: 'Failed to fetch payment logs' });
    }
};

exports.cleanupOldReceipts = async () => {
    try {
        // Find orders with receipts older than 3 days
        const [orders] = await db.query(`
            SELECT id, payment_receipt_url FROM orders 
            WHERE payment_receipt_url IS NOT NULL 
            AND updated_at < NOW() - INTERVAL 3 DAY
        `);

        for (const order of orders) {
            if (order.payment_receipt_url) {
                const filePath = path.join(__dirname, '..', 'public', order.payment_receipt_url);
                fs.unlink(filePath, async (err) => {
                    if (err && err.code !== 'ENOENT') {
                        console.error('Error deleting file:', err);
                    } else {
                        // Remove URL from DB to prevent re-attempting
                        await db.query('UPDATE orders SET payment_receipt_url = NULL WHERE id = ?', [order.id]);
                    }
                });
            }
        }
        console.log('Cleanup of old receipts completed');
    } catch (error) {
        console.error('Error in cleanupOldReceipts:', error);
    }
};
