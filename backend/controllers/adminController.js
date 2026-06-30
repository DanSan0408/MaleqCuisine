const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const {
    toSqlDate,
    getDailySessionTemplates,
    upsertDailySessionTemplate,
    ensureDailySessionsForDate
} = require('../utils/deliverySessions');

const columnExistsCache = new Map();

async function tableHasColumn(tableName, columnName) {
    const cacheKey = `${tableName}.${columnName}`;
    if (columnExistsCache.has(cacheKey)) {
        return columnExistsCache.get(cacheKey);
    }

    const [rows] = await pool.query(
        `SELECT 1
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?
           AND COLUMN_NAME = ?
         LIMIT 1`,
        [tableName, columnName]
    );

    const exists = rows.length > 0;
    columnExistsCache.set(cacheKey, exists);
    return exists;
}

exports.getDashboard = async (req, res) => {
    try {
        // For now, let's just show a list of fellow admins on the dashboard
        const [admins] = await pool.query("SELECT id, email, created_at FROM users WHERE role = 'admin'");
        res.status(200).json({ admins });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.inviteAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Check if the email is already registered
        const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ message: "Email already in use!" });
        }

        // Hash the password and insert the new admin
        const hashedPassword = bcrypt.hashSync(password, 8);
        await pool.query('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [email, hashedPassword, 'admin']);
        
        res.status(201).json({ message: "Admin invited successfully!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ============ MENU MANAGEMENT ============

exports.getCategories = async (req, res) => {
    try {
        const [categories] = await pool.query(
            'SELECT id, name, description, image_url, display_order, is_active, created_at FROM menu_categories WHERE is_active = 1 ORDER BY display_order, name'
        );
        res.status(200).json({ success: true, categories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const { name, description, image_url, display_order } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Category name is required' });
        }

        const normalizedName = name.trim();
        const [existing] = await pool.query('SELECT id FROM menu_categories WHERE name = ?', [normalizedName]);

        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Category already exists' });
        }

        const parsedDisplayOrder = Number.parseInt(display_order, 10);
        const finalDisplayOrder = Number.isNaN(parsedDisplayOrder) ? 0 : parsedDisplayOrder;

        const [result] = await pool.query(
            'INSERT INTO menu_categories (name, description, image_url, display_order, is_active) VALUES (?, ?, ?, ?, 1)',
            [normalizedName, description || null, image_url || null, finalDisplayOrder]
        );

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            id: result.insertId,
            category: {
                id: result.insertId,
                name: normalizedName,
                description: description || null,
                image_url: image_url || null,
                display_order: finalDisplayOrder,
                is_active: true
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getMenuItems = async (req, res) => {
    try {
        const [items] = await pool.query('SELECT * FROM menu_items ORDER BY category, name');
        res.status(200).json({ success: true, items });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

function normalizeAvailability(value) {
    if (typeof value === 'boolean') {
        return value;
    }

    if (typeof value === 'string') {
        return !['false', '0', 'off', 'no', ''].includes(value.toLowerCase());
    }

    if (typeof value === 'number') {
        return value !== 0;
    }

    return true;
}

function resolveImageUrl(req) {
    if (req.file) {
        return `/uploads/${req.file.filename}`;
    }

    return req.body?.image_url || null;
}

exports.createMenuItem = async (req, res) => {
    try {
        const body = req.body || {};
        const { name, description, price, category } = body;

        if (!name || !price) {
            return res.status(400).json({ success: false, message: 'Name and price are required' });
        }

        const imageUrl = resolveImageUrl(req);
        const isAvailable = normalizeAvailability(body.is_available ?? body.available);
        const hasAvailabilityColumn = await tableHasColumn('menu_items', 'is_available');

        const insertSql = hasAvailabilityColumn
            ? 'INSERT INTO menu_items (name, description, price, category, image_url, is_available) VALUES (?, ?, ?, ?, ?, ?)'
            : 'INSERT INTO menu_items (name, description, price, category, image_url) VALUES (?, ?, ?, ?, ?)';
        const insertValues = hasAvailabilityColumn
            ? [name, description || null, price, category || null, imageUrl, isAvailable]
            : [name, description || null, price, category || null, imageUrl];

        const [result] = await pool.query(insertSql, insertValues);

        res.status(201).json({
            success: true,
            message: 'Menu item created successfully',
            id: result.insertId,
            item: {
                id: result.insertId,
                name,
                description,
                price,
                category,
                image_url: imageUrl,
                is_available: hasAvailabilityColumn ? isAvailable : undefined
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateMenuItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const body = req.body || {};
        const [existingRows] = await pool.query('SELECT * FROM menu_items WHERE id = ?', [itemId]);

        if (existingRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Menu item not found' });
        }

        const existingItem = existingRows[0];
        const name = body.name ?? existingItem.name;
        const description = body.description ?? existingItem.description;
        const price = body.price ?? existingItem.price;
        const category = body.category ?? existingItem.category;
        const imageUrl = resolveImageUrl(req) ?? existingItem.image_url;
        const isAvailable = body.is_available === undefined && body.available === undefined
            ? existingItem.is_available
            : normalizeAvailability(body.is_available ?? body.available);
        const hasAvailabilityColumn = await tableHasColumn('menu_items', 'is_available');

        const updateSql = hasAvailabilityColumn
            ? 'UPDATE menu_items SET name = ?, description = ?, price = ?, category = ?, image_url = ?, is_available = ? WHERE id = ?'
            : 'UPDATE menu_items SET name = ?, description = ?, price = ?, category = ?, image_url = ? WHERE id = ?';
        const updateValues = hasAvailabilityColumn
            ? [name, description || null, price, category || null, imageUrl, isAvailable, itemId]
            : [name, description || null, price, category || null, imageUrl, itemId];

        const [result] = await pool.query(updateSql, updateValues);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Menu item not found' });
        }

        res.status(200).json({ success: true, message: 'Menu item updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteMenuItem = async (req, res) => {
    try {
        const { itemId } = req.params;

        const [result] = await pool.query('DELETE FROM menu_items WHERE id = ?', [itemId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Menu item not found' });
        }

        res.status(200).json({ success: true, message: 'Menu item deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============ BRANCH/RESTAURANT MANAGEMENT ============

exports.getBranches = async (req, res) => {
    try {
        const [branches] = await pool.query('SELECT * FROM branches ORDER BY name');
        res.status(200).json({ success: true, branches });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createBranch = async (req, res) => {
    try {
        const { name, address, latitude, longitude, phone } = req.body;

        if (!name || !address) {
            return res.status(400).json({ success: false, message: 'Name and address are required' });
        }

        const [result] = await pool.query(
            'INSERT INTO branches (name, address, latitude, longitude, phone, is_active) VALUES (?, ?, ?, ?, ?, TRUE)',
            [name, address, latitude || null, longitude || null, phone || null]
        );

        res.status(201).json({
            success: true,
            message: 'Branch created successfully',
            id: result.insertId,
            branch: { id: result.insertId, name, address, latitude, longitude, phone, is_active: true }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateBranch = async (req, res) => {
    try {
        const { branchId } = req.params;
        const { name, address, latitude, longitude, phone, is_active } = req.body;

        const [result] = await pool.query(
            'UPDATE branches SET name = ?, address = ?, latitude = ?, longitude = ?, phone = ?, is_active = ? WHERE id = ?',
            [name, address, latitude, longitude, phone, is_active, branchId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Branch not found' });
        }

        res.status(200).json({ success: true, message: 'Branch updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteBranch = async (req, res) => {
    try {
        const { branchId } = req.params;

        const [result] = await pool.query('DELETE FROM branches WHERE id = ?', [branchId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Branch not found' });
        }

        res.status(200).json({ success: true, message: 'Branch deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============ DELIVERY SESSION MANAGEMENT ============

exports.getDeliverySessions = async (req, res) => {
    try {
        await ensureDailySessionsForDate(pool, toSqlDate());
        const [sessions] = await pool.query(
            'SELECT * FROM delivery_sessions ORDER BY date DESC, session_type'
        );
        res.status(200).json({ success: true, sessions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createDeliverySession = async (req, res) => {
    try {
        const { session_type, start_time, end_time, max_orders, date } = req.body;

        if (!session_type || !start_time || !end_time || !max_orders || !date) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const [result] = await pool.query(
            'INSERT INTO delivery_sessions (session_type, start_time, end_time, max_orders, current_orders, date, is_active) VALUES (?, ?, ?, ?, 0, ?, TRUE)',
            [session_type, start_time, end_time, max_orders, date]
        );

        res.status(201).json({
            success: true,
            message: 'Delivery session created successfully',
            id: result.insertId
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateDeliverySession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { session_type, start_time, end_time, max_orders, current_orders, is_active } = req.body;

        const [result] = await pool.query(
            'UPDATE delivery_sessions SET session_type = ?, start_time = ?, end_time = ?, max_orders = ?, current_orders = ?, is_active = ? WHERE id = ?',
            [session_type, start_time, end_time, max_orders, current_orders, is_active, sessionId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        res.status(200).json({ success: true, message: 'Session updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.toggleSessionStatus = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { is_active } = req.body;

        const [result] = await pool.query(
            'UPDATE delivery_sessions SET is_active = ? WHERE id = ?',
            [is_active, sessionId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        res.status(200).json({
            success: true,
            message: `Session ${is_active ? 'opened' : 'closed'} successfully`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.resetSessionCapacity = async (req, res) => {
    try {
        const { sessionId } = req.params;

        const [result] = await pool.query(
            'UPDATE delivery_sessions SET current_orders = 0 WHERE id = ?',
            [sessionId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        res.status(200).json({ success: true, message: 'Session capacity reset successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getDailySessionTemplates = async (req, res) => {
    try {
        const templates = await getDailySessionTemplates(pool);
        res.status(200).json({ success: true, templates });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateDailySessionTemplate = async (req, res) => {
    try {
        const { sessionType } = req.params;
        const { start_time, end_time, max_orders } = req.body;

        if (!['morning', 'evening'].includes(sessionType)) {
            return res.status(400).json({ success: false, message: 'Invalid session type' });
        }

        if (!start_time || !end_time || !max_orders) {
            return res.status(400).json({ success: false, message: 'start_time, end_time and max_orders are required' });
        }

        await upsertDailySessionTemplate(pool, sessionType, {
            start_time,
            end_time,
            max_orders
        });

        await ensureDailySessionsForDate(pool, toSqlDate());

        res.status(200).json({ success: true, message: 'Daily session template updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.ensureTodaySessions = async (req, res) => {
    try {
        await ensureDailySessionsForDate(pool, toSqlDate());
        res.status(200).json({ success: true, message: 'Daily sessions ensured for today' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};