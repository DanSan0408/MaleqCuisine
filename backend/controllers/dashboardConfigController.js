const db = require('../config/db');

// ==================== SLIDESHOW MANAGEMENT ====================

exports.getSlideshowImages = async (req, res) => {
    try {
        const [images] = await db.query(
            'SELECT * FROM dashboard_slideshow_images WHERE is_active = TRUE ORDER BY position ASC'
        );
        res.json({ images });
    } catch (error) {
        // Table doesn't exist yet - return empty array gracefully
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.json({ images: [] });
        }
        console.error('Error fetching slideshow images:', error);
        res.status(500).json({ message: 'Failed to fetch slideshow images' });
    }
};

exports.addSlideshowImage = async (req, res) => {
    try {
        const { alt_text, position } = req.body;
        let image_url;

        // Handle file upload
        if (req.file) {
            image_url = `/uploads/${req.file.filename}`;
        } else if (req.body.image_url) {
            image_url = req.body.image_url;
        } else {
            return res.status(400).json({ message: 'image or image_url is required' });
        }

        const [result] = await db.query(
            'INSERT INTO dashboard_slideshow_images (image_url, alt_text, position) VALUES (?, ?, ?)',
            [image_url, alt_text || '', position || 0]
        );

        res.status(201).json({
            message: 'Slideshow image added successfully',
            image: { id: result.insertId, image_url, alt_text, position }
        });
    } catch (error) {
        console.error('Error adding slideshow image:', error);
        res.status(500).json({ message: 'Failed to add slideshow image' });
    }
};

exports.updateSlideshowImage = async (req, res) => {
    try {
        const { id } = req.params;
        const { image_url, alt_text, position, is_active } = req.body;

        const updates = [];
        const values = [];

        if (image_url !== undefined) {
            updates.push('image_url = ?');
            values.push(image_url);
        }
        if (alt_text !== undefined) {
            updates.push('alt_text = ?');
            values.push(alt_text);
        }
        if (position !== undefined) {
            updates.push('position = ?');
            values.push(position);
        }
        if (is_active !== undefined) {
            updates.push('is_active = ?');
            values.push(is_active);
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        values.push(id);
        const query = `UPDATE dashboard_slideshow_images SET ${updates.join(', ')} WHERE id = ?`;
        await db.query(query, values);

        res.json({ message: 'Slideshow image updated successfully' });
    } catch (error) {
        console.error('Error updating slideshow image:', error);
        res.status(500).json({ message: 'Failed to update slideshow image' });
    }
};

exports.deleteSlideshowImage = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM dashboard_slideshow_images WHERE id = ?', [id]);
        res.json({ message: 'Slideshow image deleted successfully' });
    } catch (error) {
        console.error('Error deleting slideshow image:', error);
        res.status(500).json({ message: 'Failed to delete slideshow image' });
    }
};

exports.getSlideshowMode = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT slideshow_image_mode FROM dashboard_settings WHERE id = 1 LIMIT 1');
        res.json({ mode: rows[0]?.slideshow_image_mode || 'fill' });
    } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.json({ mode: 'fill' });
        }
        console.error('Error fetching slideshow mode:', error);
        res.status(500).json({ message: 'Failed to fetch slideshow mode' });
    }
};

exports.updateSlideshowMode = async (req, res) => {
    try {
        const { mode } = req.body;
        if (!mode || !['fit', 'fill'].includes(mode)) {
            return res.status(400).json({ message: "mode must be either 'fit' or 'fill'" });
        }

        await db.query(
            `INSERT INTO dashboard_settings (id, slideshow_image_mode)
             VALUES (1, ?)
             ON DUPLICATE KEY UPDATE slideshow_image_mode = VALUES(slideshow_image_mode)`,
            [mode]
        );

        res.json({ message: 'Slideshow mode updated successfully', mode });
    } catch (error) {
        console.error('Error updating slideshow mode:', error);
        res.status(500).json({ message: 'Failed to update slideshow mode' });
    }
};

// ==================== FEATURED ITEMS MANAGEMENT ====================

exports.getFeaturedItems = async (req, res) => {
    try {
        const [items] = await db.query(`
            SELECT 
                dfi.id,
                dfi.menu_item_id,
                dfi.position,
                dfi.is_active,
                mi.name,
                mi.description,
                mi.price,
                mi.category,
                mi.image_url
            FROM dashboard_featured_items dfi
            JOIN menu_items mi ON dfi.menu_item_id = mi.id
            WHERE dfi.is_active = TRUE
            ORDER BY dfi.position ASC
        `);
        res.json({ items });
    } catch (error) {
        // Table doesn't exist yet - return empty array gracefully
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.json({ items: [] });
        }
        console.error('Error fetching featured items:', error);
        res.status(500).json({ message: 'Failed to fetch featured items' });
    }
};

exports.addFeaturedItem = async (req, res) => {
    try {
        const { menu_item_id, position } = req.body;

        if (!menu_item_id) {
            return res.status(400).json({ message: 'menu_item_id is required' });
        }

        // Check if item already exists in featured items
        const [existing] = await db.query(
            'SELECT id FROM dashboard_featured_items WHERE menu_item_id = ?',
            [menu_item_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'This menu item is already featured' });
        }

        // Check if we already have 5 featured items
        const [count] = await db.query('SELECT COUNT(*) as count FROM dashboard_featured_items WHERE is_active = TRUE');
        if (count[0].count >= 5) {
            return res.status(400).json({ message: 'Maximum 5 featured items allowed' });
        }

        const [result] = await db.query(
            'INSERT INTO dashboard_featured_items (menu_item_id, position) VALUES (?, ?)',
            [menu_item_id, position || count[0].count]
        );

        res.status(201).json({
            message: 'Featured item added successfully',
            id: result.insertId
        });
    } catch (error) {
        console.error('Error adding featured item:', error);
        res.status(500).json({ message: 'Failed to add featured item' });
    }
};

exports.updateFeaturedItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { position, is_active } = req.body;

        const updates = [];
        const values = [];

        if (position !== undefined) {
            updates.push('position = ?');
            values.push(position);
        }
        if (is_active !== undefined) {
            updates.push('is_active = ?');
            values.push(is_active);
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        values.push(id);
        const query = `UPDATE dashboard_featured_items SET ${updates.join(', ')} WHERE id = ?`;
        await db.query(query, values);

        res.json({ message: 'Featured item updated successfully' });
    } catch (error) {
        console.error('Error updating featured item:', error);
        res.status(500).json({ message: 'Failed to update featured item' });
    }
};

exports.removeFeaturedItem = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM dashboard_featured_items WHERE id = ?', [id]);
        res.json({ message: 'Featured item removed successfully' });
    } catch (error) {
        console.error('Error removing featured item:', error);
        res.status(500).json({ message: 'Failed to remove featured item' });
    }
};

// ==================== COMPANY STORY MANAGEMENT ====================

exports.getCompanyStory = async (req, res) => {
    try {
        const isFull = req.query.type === 'full';
        if (isFull) {
            const [stories] = await db.query('SELECT * FROM dashboard_company_story WHERE id > 1 AND is_active = TRUE ORDER BY id ASC');
            res.json({ story: stories });
        } else {
            const [story] = await db.query('SELECT * FROM dashboard_company_story WHERE id = 1 AND is_active = TRUE LIMIT 1');
            res.json({ story: story[0] || null });
        }
    } catch (error) {
        // Table doesn't exist yet - return null gracefully
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.json({ story: null });
        }
        console.error('Error fetching company story:', error);
        res.status(500).json({ message: 'Failed to fetch company story' });
    }
};

exports.updateCompanyStory = async (req, res) => {
    try {
        const { id, title, description, type, action, layout } = req.body;
        let image_url;

        // Handle delete action (injected via PUT to avoid needing new routes)
        if (action === 'delete' && id) {
            if (id == 1) return res.status(400).json({ message: 'Cannot delete home story' });
            await db.query('DELETE FROM dashboard_company_story WHERE id = ?', [id]);
            return res.json({ message: 'Story section deleted successfully' });
        }

        // Handle file upload
        if (req.file) {
            image_url = `/uploads/${req.file.filename}`;
        } else if (req.body.image_url) {
            image_url = req.body.image_url;
        }

        const isFull = type === 'full' || req.query.type === 'full';

        if (isFull) {
            if (id) {
                // Update existing full story section
            const updates = [];
            const values = [];

            if (title !== undefined && title) {
                updates.push('title = ?');
                values.push(title);
            }
            if (description !== undefined && description) {
                updates.push('description = ?');
                values.push(description);
            }
            if (image_url !== undefined) {
                updates.push('image_url = ?');
                values.push(image_url);
            }
            if (layout !== undefined && layout) {
                updates.push('layout = ?');
                values.push(layout);
            }

            if (updates.length === 0) {
                return res.status(400).json({ message: 'No fields to update' });
            }

                values.push(id);
            const query = `UPDATE dashboard_company_story SET ${updates.join(', ')} WHERE id = ?`;
            await db.query(query, values);

            res.json({ message: 'Company story updated successfully' });
        } else {
                // Create new full story section (Auto-increment generates id > 1)
            const [result] = await db.query(
                    'INSERT INTO dashboard_company_story (title, description, image_url, layout, is_active) VALUES (?, ?, ?, ?, TRUE)',
                    [title || 'Our Story', description || '', image_url || '', layout || 'background']
            );

            res.status(201).json({
                message: 'Company story created successfully',
                id: result.insertId
            });
        }
        } else {
            // Update Home story (id = 1)
            const [existing] = await db.query('SELECT id FROM dashboard_company_story WHERE id = 1');
            if (existing.length > 0) {
                const updates = [];
                const values = [];
                if (title !== undefined) { updates.push('title = ?'); values.push(title); }
                if (description !== undefined) { updates.push('description = ?'); values.push(description); }
                if (image_url !== undefined) { updates.push('image_url = ?'); values.push(image_url); }
                if (layout !== undefined) { updates.push('layout = ?'); values.push(layout); }
                if (updates.length > 0) {
                    values.push(1);
                    await db.query(`UPDATE dashboard_company_story SET ${updates.join(', ')} WHERE id = ?`, values);
                }
                res.json({ message: 'Home story updated successfully' });
            } else {
                await db.query(
                    'INSERT INTO dashboard_company_story (id, title, description, image_url, layout, is_active) VALUES (1, ?, ?, ?, ?, TRUE)',
                    [title || 'Our Story', description || '', image_url || '', layout || 'background']
                );
                res.status(201).json({ message: 'Home story created successfully' });
            }
        }
    } catch (error) {
        console.error('Error updating company story:', error);
        res.status(500).json({ message: 'Failed to update company story' });
    }
};

// ==================== GET ALL DASHBOARD CONFIG (for customers) ====================

exports.getDashboardConfig = async (req, res) => {
    try {
        // Get slideshow images
        const [slideshow] = await db.query(
            'SELECT * FROM dashboard_slideshow_images WHERE is_active = TRUE ORDER BY position ASC'
        );

        // Get featured items with full menu item details
        const [featured] = await db.query(`
            SELECT 
                dfi.id,
                dfi.menu_item_id,
                dfi.position,
                mi.name,
                mi.description,
                mi.price,
                mi.category,
                mi.image_url
            FROM dashboard_featured_items dfi
            JOIN menu_items mi ON dfi.menu_item_id = mi.id
            WHERE dfi.is_active = TRUE
            ORDER BY dfi.position ASC
            LIMIT 5
        `);

        // Get company story
        const [story] = await db.query(
            'SELECT * FROM dashboard_company_story WHERE id = 1 AND is_active = TRUE LIMIT 1'
        );

        // Get full company story
        const [fullStories] = await db.query(
            'SELECT * FROM dashboard_company_story WHERE id > 1 AND is_active = TRUE ORDER BY id ASC'
        );

        const [settings] = await db.query(
            'SELECT slideshow_image_mode FROM dashboard_settings WHERE id = 1 LIMIT 1'
        );

        res.json({
            slideshow,
            featured,
            story: story[0] || null,
            fullStory: fullStories || [],
            slideshowMode: settings[0]?.slideshow_image_mode || 'fill'
        });
    } catch (error) {
        console.error('Error fetching dashboard config:', error);
        res.status(500).json({ message: 'Failed to fetch dashboard configuration' });
    }
};
