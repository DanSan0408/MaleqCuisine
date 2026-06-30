const pool = require('../config/db');
const bcrypt = require('bcryptjs');

exports.getDashboardStats = async (req, res) => {
    try {
        const [admins] = await pool.query("SELECT id, email, created_at FROM users WHERE role = 'admin'");
        res.status(200).json({ admins });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.addAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Check if user exists
        const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ message: "Email already in use!" });
        }

        const hashedPassword = bcrypt.hashSync(password, 8);
        await pool.query('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [email, hashedPassword, 'admin']);
        
        res.status(201).json({ message: "Admin added successfully!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};