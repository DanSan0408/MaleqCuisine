const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: './keyes.env' });
const db = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json()); // parses application/json

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Routes
const authRoutes = require('./routes/authRoutes');
const superadminRoutes = require('./routes/superadminRoutes');
const adminRoutes = require('./routes/adminRoutes');
const orderRoutes = require('./routes/orderRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        if (typeof db.ensureDashboardTables === 'function') {
            await db.ensureDashboardTables();
        }

        if (typeof db.ensureOrderTables === 'function') {
            await db.ensureOrderTables();
        }

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}.`);
        });
    } catch (error) {
        console.error('Failed to initialize dashboard tables:', error);
        process.exit(1);
    }
}

startServer();