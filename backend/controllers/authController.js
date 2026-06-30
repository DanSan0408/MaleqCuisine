const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const signAccessToken = (user) => jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: 86400 }
);

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [normalizedEmail]);

        if (users.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        const user = users[0];
        const passwordIsValid = bcrypt.compareSync(password, user.password);

        if (!passwordIsValid) {
            return res.status(401).json({ message: "Invalid Password!" });
        }

        const token = signAccessToken(user);

        res.status(200).json({
            id: user.id,
            email: user.email,
            role: user.role,
            accessToken: token
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.register = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ?', [normalizedEmail]);

        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'Email already in use!' });
        }

        const hashedPassword = bcrypt.hashSync(password, 8);
        const [result] = await pool.query(
            'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
            [normalizedEmail, hashedPassword, 'customer']
        );

        const user = {
            id: result.insertId,
            email: normalizedEmail,
            role: 'customer'
        };

        res.status(201).json({
            id: user.id,
            email: user.email,
            role: user.role,
            accessToken: signAccessToken(user)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};