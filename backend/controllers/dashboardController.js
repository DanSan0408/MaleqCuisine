const pool = require('../config/db');
const path = require('path');
const fs = require('fs');

// Get all active dashboard widgets
exports.getDashboardWidgets = async (req, res) => {
    try {
        const [widgets] = await pool.query(
            'SELECT * FROM dashboard_widgets WHERE is_active = 1 ORDER BY position ASC, layout_y ASC, layout_x ASC'
        );
        res.status(200).json({ success: true, widgets });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create new dashboard widget
exports.createDashboardWidget = async (req, res) => {
    try {
        const { widget_type, title, description, link_url, width, height, layout_x, layout_y } = req.body;
        const image_url = req.file ? `/uploads/${req.file.filename}` : req.body.image_url || null;

        // Get the next position
        const [result] = await pool.query(
            'SELECT MAX(position) as max_position FROM dashboard_widgets'
        );
        const nextPosition = (result[0]?.max_position || 0) + 1;

        const [response] = await pool.query(
            'INSERT INTO dashboard_widgets (widget_type, title, description, image_url, link_url, position, layout_x, layout_y, width, height) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [widget_type, title, description, image_url, link_url, nextPosition, layout_x || 0, layout_y || 0, width || 100, height || 300]
        );

        res.status(201).json({
            success: true,
            message: 'Widget created successfully',
            widgetId: response.insertId
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update dashboard widget
exports.updateDashboardWidget = async (req, res) => {
    try {
        const { widgetId } = req.params;
        const { widget_type, title, description, link_url, width, height, layout_x, layout_y } = req.body;
        let image_url = req.body.image_url;

        // If new file is uploaded, use it
        if (req.file) {
            image_url = `/uploads/${req.file.filename}`;
            
            // Delete old image if it exists
            if (req.body.image_url) {
                const oldImagePath = path.join(__dirname, '../public', req.body.image_url);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
        }

        await pool.query(
            'UPDATE dashboard_widgets SET widget_type = ?, title = ?, description = ?, image_url = ?, link_url = ?, layout_x = ?, layout_y = ?, width = ?, height = ? WHERE id = ?',
            [widget_type, title, description, image_url, link_url, layout_x || 0, layout_y || 0, width || 100, height || 300, widgetId]
        );

        res.status(200).json({
            success: true,
            message: 'Widget updated successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Reorder dashboard widgets
exports.reorderDashboardWidgets = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { widgetOrder } = req.body; // Array of [{ id, position, layout_x, layout_y, width, height }, ...]

        for (const item of widgetOrder) {
            await connection.query(
                'UPDATE dashboard_widgets SET position = ?, layout_x = ?, layout_y = ?, width = COALESCE(?, width), height = COALESCE(?, height) WHERE id = ?',
                [item.position, item.layout_x ?? 0, item.layout_y ?? 0, item.width, item.height, item.id]
            );
        }

        await connection.commit();
        res.status(200).json({
            success: true,
            message: 'Widgets reordered successfully'
        });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
};

// Delete dashboard widget
exports.deleteDashboardWidget = async (req, res) => {
    try {
        const { widgetId } = req.params;

        // Get widget to delete image
        const [widgets] = await pool.query('SELECT image_url FROM dashboard_widgets WHERE id = ?', [widgetId]);
        
        if (widgets.length > 0 && widgets[0].image_url) {
            const imagePath = path.join(__dirname, '../public', widgets[0].image_url);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await pool.query('DELETE FROM dashboard_widgets WHERE id = ?', [widgetId]);

        res.status(200).json({
            success: true,
            message: 'Widget deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all promotions
exports.getPromotions = async (req, res) => {
    try {
        const [promotions] = await pool.query(
            'SELECT * FROM promotions WHERE is_active = 1 ORDER BY created_at DESC'
        );
        res.status(200).json({ success: true, promotions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create promotion
exports.createPromotion = async (req, res) => {
    try {
        const { title, description, discount_percent, valid_from, valid_to } = req.body;
        const image_url = req.file ? `/uploads/${req.file.filename}` : null;

        const [response] = await pool.query(
            'INSERT INTO promotions (title, description, image_url, discount_percent, valid_from, valid_to) VALUES (?, ?, ?, ?, ?, ?)',
            [title, description, image_url, discount_percent, valid_from, valid_to]
        );

        res.status(201).json({
            success: true,
            message: 'Promotion created successfully',
            promotionId: response.insertId
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update promotion
exports.updatePromotion = async (req, res) => {
    try {
        const { promotionId } = req.params;
        const { title, description, discount_percent, valid_from, valid_to, is_active } = req.body;
        let image_url = req.body.image_url;

        if (req.file) {
            image_url = `/uploads/${req.file.filename}`;
            if (req.body.image_url) {
                const oldImagePath = path.join(__dirname, '../public', req.body.image_url);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
        }

        await pool.query(
            'UPDATE promotions SET title = ?, description = ?, image_url = ?, discount_percent = ?, valid_from = ?, valid_to = ?, is_active = ? WHERE id = ?',
            [title, description, image_url, discount_percent, valid_from, valid_to, is_active, promotionId]
        );

        res.status(200).json({
            success: true,
            message: 'Promotion updated successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete promotion
exports.deletePromotion = async (req, res) => {
    try {
        const { promotionId } = req.params;

        const [promotions] = await pool.query('SELECT image_url FROM promotions WHERE id = ?', [promotionId]);
        
        if (promotions.length > 0 && promotions[0].image_url) {
            const imagePath = path.join(__dirname, '../public', promotions[0].image_url);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await pool.query('DELETE FROM promotions WHERE id = ?', [promotionId]);

        res.status(200).json({
            success: true,
            message: 'Promotion deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Save dashboard preset
exports.saveDashboardPreset = async (req, res) => {
    try {
        const { preset_name, layout_json } = req.body;

        const [response] = await pool.query(
            'INSERT INTO dashboard_presets (preset_name, layout_json, is_active) VALUES (?, ?, 0)',
            [preset_name, JSON.stringify(layout_json)]
        );

        res.status(201).json({
            success: true,
            message: 'Preset saved successfully',
            presetId: response.insertId
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get dashboard presets
exports.getDashboardPresets = async (req, res) => {
    try {
        const [presets] = await pool.query(
            'SELECT * FROM dashboard_presets ORDER BY created_at DESC'
        );
        res.status(200).json({ success: true, presets });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Load dashboard preset
exports.loadDashboardPreset = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { presetId } = req.params;

        // Get preset layout
        const [presets] = await connection.query(
            'SELECT layout_json FROM dashboard_presets WHERE id = ?',
            [presetId]
        );

        if (presets.length === 0) {
            return res.status(404).json({ success: false, message: 'Preset not found' });
        }

        const layoutJson = presets[0].layout_json;

        // Delete existing widgets
        await connection.query('DELETE FROM dashboard_widgets');

        // Import widgets from preset
        const widgets = typeof layoutJson === 'string' ? JSON.parse(layoutJson) : layoutJson;
        for (const widget of widgets) {
            await connection.query(
                'INSERT INTO dashboard_widgets (widget_type, title, description, image_url, link_url, position, layout_x, layout_y, width, height) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [widget.widget_type, widget.title, widget.description, widget.image_url, widget.link_url, widget.position, widget.layout_x || 0, widget.layout_y || 0, widget.width, widget.height]
            );
        }

        await connection.commit();
        res.status(200).json({
            success: true,
            message: 'Preset loaded successfully'
        });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
};
