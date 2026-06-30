const crypto = require('crypto');
const pool = require('../config/db');
const { toSqlDate, ensureDailySessionsForDate } = require('../utils/deliverySessions');

const columnExistsCache = new Map();

const ORDER_STATUS_ORDER = ['pending', 'preparing', 'ready', 'completed'];

function normalizeOrderType(orderType) {
    if (!orderType) {
        return orderType;
    }

    const normalized = String(orderType).trim().toLowerCase().replace(/[-\s]+/g, '_');

    if (normalized === 'dine_in' || normalized === 'pickup' || normalized === 'delivery') {
        return normalized;
    }

    return normalized;
}

function getReadyStatusLabel(orderType) {
    if (orderType === 'delivery') {
        return 'On the way';
    }

    if (orderType === 'pickup') {
        return 'Ready to be picked up';
    }

    return 'Ready for dine in';
}

function getCompletionLabel(orderType) {
    if (orderType === 'delivery') {
        return 'Delivered';
    }
    if (orderType === 'pickup') {
        return 'Order picked up';
    }

    return 'Order served';
}

function normalizeOrderStatus(status) {
    if (!status) {
        return 'pending';
    }

    const normalized = String(status).trim().toLowerCase().replace(/[-\s]+/g, '_');

    if (['new', 'ordered', 'received', 'pending'].includes(normalized)) {
        return 'pending';
    }

    if (['confirmed', 'preparing'].includes(normalized)) {
        return 'preparing';
    }

    if (['ready', 'on_the_way'].includes(normalized)) {
        return 'ready';
    }

    if (['finished', 'served', 'delivered', 'picked_up', 'completed'].includes(normalized)) {
        return 'completed';
    }

    return normalized;
}

function getStatusLabel(orderType, status) {
    if (status === 'pending') {
        return 'Ordered';
    }

    if (status === 'preparing') {
        return 'Preparing';
    }

    if (status === 'ready') {
        return getReadyStatusLabel(orderType);
    }

    if (status === 'completed') {
        return getCompletionLabel(orderType);
    }

    return status;
}

function getAdminActionLabel(orderType, status) {
    if (status === 'pending') {
        return 'Ordered';
    }

    if (status === 'preparing') {
        if (orderType === 'delivery') {
            return 'Preparing';
        }

        if (orderType === 'pickup') {
            return 'Preparing';
        }

        return 'Preparing';
    }

    if (status === 'ready' && orderType === 'dine_in') {
        return 'Ready for dine in';
    }

    return null;
}

function getCustomerActionLabel(orderType, status) {
    if (status !== 'ready') {
        return null;
    }

    if (orderType === 'pickup') {
        return 'Order picked up';
    }

    if (orderType === 'delivery') {
        return 'Order received';
    }

    return null;
}

function decorateOrder(order, items = []) {
    const normalizedStatus = normalizeOrderStatus(order.status);
    const normalizedOrderType = normalizeOrderType(order.order_type);
    const statusIndex = ORDER_STATUS_ORDER.indexOf(normalizedStatus);
    const currentStep = statusIndex === -1 ? 0 : statusIndex;
    const pendingLabel = getStatusLabel(normalizedOrderType, 'pending');
    const preparingLabel = getStatusLabel(normalizedOrderType, 'preparing');
    const readyLabel = getStatusLabel(normalizedOrderType, 'ready');
    const completedLabel = getStatusLabel(normalizedOrderType, 'completed');

    let fallbackOrderNumber = order.order_number;
    if (!fallbackOrderNumber) {
        let prefix = 'O';
        if (normalizedOrderType === 'delivery') prefix = 'D';
        else if (normalizedOrderType === 'pickup') prefix = 'P';
        else if (normalizedOrderType === 'dine_in') prefix = 'A';
        const num = ((order.id - 1) % 999) + 1;
        fallbackOrderNumber = `${prefix}${String(num).padStart(3, '0')}`;
    }

    return {
        ...order,
        order_number: fallbackOrderNumber,
        displayOrderNumber: fallbackOrderNumber,
        order_type: normalizedOrderType,
        status: normalizedStatus,
        items,
        statusLabel: getStatusLabel(normalizedOrderType, normalizedStatus),
        readyLabel: getReadyStatusLabel(normalizedOrderType),
        completionLabel: getCompletionLabel(normalizedOrderType),
        adminActionLabel: getAdminActionLabel(normalizedOrderType, normalizedStatus),
        customerActionLabel: getCustomerActionLabel(normalizedOrderType, normalizedStatus),
        canCustomerConfirm: ['pickup', 'delivery'].includes(normalizedOrderType) && normalizedStatus === 'ready',
        canAdminComplete: normalizedOrderType === 'dine_in' && normalizedStatus === 'ready',
        currentStep,
        statusTimeline: ORDER_STATUS_ORDER.map((step, index) => ({
            key: step,
            label:
                step === 'pending'
                    ? pendingLabel
                    : step === 'preparing'
                        ? preparingLabel
                        : step === 'ready'
                            ? readyLabel
                            : completedLabel,
            active: index <= currentStep,
            completed: index < currentStep,
            current: index === currentStep
        }))
    };
}

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

async function loadOrdersWithItems(rows) {
    return Promise.all(
        rows.map(async (order) => {
            const [items] = await pool.query(
                `SELECT oi.id, oi.quantity, oi.price, mi.name, mi.description, mi.image_url
                 FROM order_items oi
                 JOIN menu_items mi ON oi.menu_item_id = mi.id
                 WHERE oi.order_id = ?`,
                [order.id]
            );

            return decorateOrder(order, items);
        })
    );
}

function normalizePhoneValue(value) {
    return String(value || '').replace(/[^0-9]/g, '');
}

// Get all menu items
exports.getMenuItems = async (req, res) => {
    try {
        const hasIsAvailable = await tableHasColumn('menu_items', 'is_available');
        const query = hasIsAvailable
            ? `SELECT mi.*
               FROM menu_items mi
               LEFT JOIN menu_categories mc ON mc.name = mi.category
               WHERE mi.is_available = TRUE
               ORDER BY COALESCE(mc.display_order, 9999), COALESCE(mi.category, ''), mi.name`
            : `SELECT mi.*
               FROM menu_items mi
               LEFT JOIN menu_categories mc ON mc.name = mi.category
               ORDER BY COALESCE(mc.display_order, 9999), COALESCE(mi.category, ''), mi.name`;

        const [items] = await pool.query(query);
        res.status(200).json({ success: true, items });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getCategories = async (req, res) => {
    try {
        const [categories] = await pool.query(
            'SELECT id, name, description, image_url, display_order FROM menu_categories WHERE is_active = 1 ORDER BY display_order, name'
        );
        res.status(200).json({ success: true, categories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get delivery sessions
exports.getDeliverySessions = async (req, res) => {
    try {
        const today = toSqlDate();
        await ensureDailySessionsForDate(pool, today);
        const [sessions] = await pool.query(
            'SELECT * FROM delivery_sessions WHERE date >= ? AND is_active = TRUE ORDER BY date, session_type',
            [today]
        );
        res.status(200).json({ success: true, sessions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get branches
exports.getBranches = async (req, res) => {
    try {
        const [branches] = await pool.query('SELECT * FROM branches WHERE is_active = TRUE');
        res.status(200).json({ success: true, branches });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Check delivery session availability
exports.checkSessionAvailability = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const [sessions] = await pool.query(
            'SELECT id, session_type, max_orders, current_orders FROM delivery_sessions WHERE id = ?',
            [sessionId]
        );

        if (sessions.length === 0) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        const session = sessions[0];
        const isAvailable = session.current_orders < session.max_orders;
        
        res.status(200).json({
            success: true,
            isAvailable,
            spotsRemaining: session.max_orders - session.current_orders,
            session
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create order
exports.createOrder = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const {
            orderType,
            customerName,
            customerPhone,
            customerEmail,
            items, // array of { menu_item_id, quantity }
            deliverySessionId,
            deliveryAddress,
            branchId,
            tableNumber,
            dineInTime,
            dineInPax
        } = req.body;

        const userId = req.userId || null;

        // Validation
        if (!orderType || !customerName || !customerPhone || !items || items.length === 0) {
            throw new Error('Missing required fields');
        }

        if (!['delivery', 'pickup', 'dine_in'].includes(orderType)) {
            throw new Error('Invalid order type');
        }

        if (orderType === 'delivery' && (!deliverySessionId || !deliveryAddress)) {
            throw new Error('Delivery session and address required for delivery orders');
        }

        if (orderType === 'pickup' && !branchId) {
            throw new Error('Branch ID required for pickup orders');
        }

        if (orderType === 'dine_in' && (!dineInTime || !dineInPax)) {
            throw new Error('Booking time and number of guests (pax) are required for dine-in orders');
        }

        // Check delivery session availability if delivery
        if (orderType === 'delivery') {
            const [sessions] = await connection.query(
                'SELECT current_orders, max_orders FROM delivery_sessions WHERE id = ?',
                [deliverySessionId]
            );

            if (sessions.length === 0) {
                throw new Error('Delivery session not found');
            }

            if (sessions[0].current_orders >= sessions[0].max_orders) {
                throw new Error('Delivery session is full');
            }

            // Increment session orders
            await connection.query(
                'UPDATE delivery_sessions SET current_orders = current_orders + 1 WHERE id = ?',
                [deliverySessionId]
            );
        }

        // Calculate totals
        let subtotal = 0;
        const orderItemsData = [];
        const hasIsAvailable = await tableHasColumn('menu_items', 'is_available');
        const hasTrackingTokenColumn = await tableHasColumn('orders', 'tracking_token');
        const trackingToken = hasTrackingTokenColumn ? crypto.randomUUID().replace(/-/g, '') : null;

        const hasOrderNumberColumn = await tableHasColumn('orders', 'order_number');
        const hasDineInTimeColumn = await tableHasColumn('orders', 'dine_in_time');
        const hasDineInPaxColumn = await tableHasColumn('orders', 'dine_in_pax');
        let orderNumber = null;
        if (hasOrderNumberColumn) {
            const [maxResult] = await connection.query(
                "SELECT order_number FROM orders WHERE order_type = ? AND order_number IS NOT NULL ORDER BY id DESC LIMIT 1",
                [orderType]
            );

            let nextNum = 1;
            if (maxResult.length > 0 && maxResult[0].order_number) {
                const match = maxResult[0].order_number.match(/\d+$/);
                if (match) {
                    nextNum = parseInt(match[0], 10) + 1;
                if (nextNum > 999) nextNum = 1;
                }
            }

            let orderPrefix = orderType === 'delivery' ? 'D' : orderType === 'pickup' ? 'P' : orderType === 'dine_in' ? 'A' : 'O';
            orderNumber = `${orderPrefix}${String(nextNum).padStart(3, '0')}`;
        }

        for (const item of items) {
            const [menuItems] = hasIsAvailable
                ? await connection.query(
                    'SELECT id, price FROM menu_items WHERE id = ? AND is_available = TRUE',
                    [item.menu_item_id]
                )
                : await connection.query(
                    'SELECT id, price FROM menu_items WHERE id = ?',
                    [item.menu_item_id]
                );

            if (menuItems.length === 0) {
                throw new Error(`Menu item ${item.menu_item_id} not found or unavailable`);
            }

            const price = menuItems[0].price;
            const itemTotal = price * item.quantity;
            subtotal += itemTotal;

            orderItemsData.push({
                menu_item_id: item.menu_item_id,
                quantity: item.quantity,
                price
            });
        }

        // Calculate total (no tax/fees for now, as per requirements)
        const total = subtotal;

        // Create order
        const orderColumns = [
            'user_id',
            'order_type',
            'customer_name',
            'customer_phone',
            'customer_email',
            'delivery_address',
            'delivery_session_id',
            'branch_id',
            'table_number',
            'subtotal',
            'total'
        ];
        const orderValues = [
            userId,
            orderType,
            customerName,
            customerPhone,
            customerEmail || null,
            deliveryAddress || null,
            deliverySessionId || null,
            branchId || null,
            tableNumber || null,
            subtotal,
            total
        ];

        if (hasDineInTimeColumn) {
            orderColumns.push('dine_in_time');
            orderValues.push(orderType === 'dine_in' ? dineInTime || null : null);
        }

        if (hasDineInPaxColumn) {
            orderColumns.push('dine_in_pax');
            orderValues.push(orderType === 'dine_in' ? parseInt(dineInPax, 10) || null : null);
        }

        if (hasTrackingTokenColumn) {
            orderColumns.splice(2, 0, 'tracking_token');
            orderValues.splice(2, 0, trackingToken);
        }

        if (hasOrderNumberColumn) {
            orderColumns.unshift('order_number');
            orderValues.unshift(orderNumber);
        }

        const [orderResult] = await connection.query(
            `INSERT INTO orders (${orderColumns.join(', ')}) VALUES (${orderColumns.map(() => '?').join(', ')})`,
            orderValues
        );

        const orderId = orderResult.insertId;

        // Insert order items
        for (const item of orderItemsData) {
            await connection.query(
                'INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES (?, ?, ?, ?)',
                [orderId, item.menu_item_id, item.quantity, item.price]
            );
        }

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            orderId,
            orderNumber,
            trackingToken,
            order: {
                id: orderId,
                order_number: orderNumber,
                orderType,
                customerName,
                customerPhone,
                customerEmail,
                subtotal,
                total,
                status: 'pending',
                statusLabel: getStatusLabel(orderType, 'pending')
            }
        });
    } catch (error) {
        await connection.rollback();
        res.status(400).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
};

// Get user orders
exports.getUserOrders = async (req, res) => {
    try {
        const userId = req.userId;
        const [orders] = await pool.query(
            'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );

        // Get items for each order
        const ordersWithItems = await loadOrdersWithItems(orders);

        res.status(200).json({ success: true, orders: ordersWithItems });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get order details
exports.getOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.userId;

        const [orders] = await pool.query(
            'SELECT * FROM orders WHERE id = ? AND user_id = ?',
            [orderId, userId]
        );

        if (orders.length === 0) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const order = orders[0];
        res.status(200).json({
            success: true,
            order: decorateOrder(order, await (async () => {
                const [items] = await pool.query(
                    `SELECT oi.id, oi.quantity, oi.price, mi.name, mi.description, mi.image_url
                     FROM order_items oi
                     JOIN menu_items mi ON oi.menu_item_id = mi.id
                     WHERE oi.order_id = ?`,
                    [orderId]
                );
                return items;
            })())
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get live tracking data for public customer tracking
exports.getOrderTracking = async (req, res) => {
    try {
        const { trackingToken } = req.params;
        const hasTrackingTokenColumn = await tableHasColumn('orders', 'tracking_token');

        if (!hasTrackingTokenColumn) {
            return res.status(503).json({ success: false, message: 'Order tracking is not available yet' });
        }

        const [orders] = await pool.query(
            'SELECT * FROM orders WHERE tracking_token = ?',
            [trackingToken]
        );

        if (orders.length === 0) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const order = orders[0];
        res.status(200).json({
            success: true,
            order: decorateOrder(order, await (async () => {
                const [items] = await pool.query(
                    `SELECT oi.id, oi.quantity, oi.price, mi.name, mi.description, mi.image_url
                     FROM order_items oi
                     JOIN menu_items mi ON oi.menu_item_id = mi.id
                     WHERE oi.order_id = ?`,
                    [order.id]
                );
                return items;
            })())
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.lookupOrderTracking = async (req, res) => {
    try {
        const { orderId, customerPhone, customerEmail } = req.body || {};

        if (!orderId || (!customerPhone && !customerEmail)) {
            return res.status(400).json({ success: false, message: 'Order number and phone or email are required' });
        }

        const normalizedPhone = customerPhone ? String(customerPhone).trim() : null;
        const normalizedEmail = customerEmail ? String(customerEmail).trim().toLowerCase() : null;

        const [orders] = await pool.query(
            `SELECT * FROM orders
             WHERE id = ?
               AND (
                   (? IS NOT NULL AND customer_phone = ?)
                   OR (? IS NOT NULL AND LOWER(customer_email) = ?)
               )
             LIMIT 1`,
            [
                orderId,
                normalizedPhone,
                normalizedPhone,
                normalizedEmail,
                normalizedEmail
            ]
        );

        if (orders.length === 0) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const order = orders[0];
        const [items] = await pool.query(
            `SELECT oi.id, oi.quantity, oi.price, mi.name, mi.description, mi.image_url
             FROM order_items oi
             JOIN menu_items mi ON oi.menu_item_id = mi.id
             WHERE oi.order_id = ?`,
            [order.id]
        );

        res.status(200).json({
            success: true,
            order: decorateOrder(order, items)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.confirmTrackedOrder = async (req, res) => {
    try {
        const { trackingToken } = req.params;
        const { action } = req.body || {};

        const [orders] = await pool.query(
            'SELECT * FROM orders WHERE tracking_token = ?',
            [trackingToken]
        );

        if (orders.length === 0) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const order = orders[0];
        const expectedAction = order.order_type === 'pickup' ? 'picked_up' : 'received';

        if (!['pickup', 'delivery'].includes(order.order_type)) {
            return res.status(400).json({ success: false, message: 'This order must be confirmed by the admin' });
        }

        if (order.status !== 'ready') {
            return res.status(400).json({ success: false, message: 'This order is not ready yet' });
        }

        if (action && action !== expectedAction) {
            return res.status(400).json({ success: false, message: 'Invalid confirmation action' });
        }

        await pool.query(
            'UPDATE orders SET status = ? WHERE id = ?',
            ['completed', order.id]
        );

        const [updatedOrders] = await pool.query('SELECT * FROM orders WHERE id = ?', [order.id]);
        res.status(200).json({
            success: true,
            message: 'Order confirmed successfully',
            order: decorateOrder(updatedOrders[0], await (async () => {
                const [items] = await pool.query(
                    `SELECT oi.id, oi.quantity, oi.price, mi.name, mi.description, mi.image_url
                     FROM order_items oi
                     JOIN menu_items mi ON oi.menu_item_id = mi.id
                     WHERE oi.order_id = ?`,
                    [order.id]
                );
                return items;
            })())
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAdminOrders = async (req, res) => {
    try {
        const [orders] = await pool.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 100');

        const ordersWithItems = await loadOrdersWithItems(orders);

        res.status(200).json({ success: true, orders: ordersWithItems });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getOrdersByPhone = async (req, res) => {
    try {
        const { phone } = req.body || {};

        if (!phone) {
            return res.status(400).json({ success: false, message: 'Phone number is required' });
        }

        const normalizedPhone = normalizePhoneValue(phone);

        const [orders] = await pool.query(
            `SELECT * FROM orders
             WHERE REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(customer_phone, ' ', ''), '-', ''), '+', ''), '(', ''), ')', '') = ?
             ORDER BY created_at DESC`,
            [normalizedPhone]
        );

        const ordersWithItems = await loadOrdersWithItems(orders);

        res.status(200).json({ success: true, orders: ordersWithItems });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body || {};

        if (!ORDER_STATUS_ORDER.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid order status' });
        }

        const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);

        if (orders.length === 0) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const order = orders[0];
        const normalizedOrderType = normalizeOrderType(order.order_type);
        const currentIndex = ORDER_STATUS_ORDER.indexOf(normalizeOrderStatus(order.status));
        const nextIndex = ORDER_STATUS_ORDER.indexOf(status);

        if (nextIndex < currentIndex) {
            return res.status(400).json({ success: false, message: 'Order status cannot move backwards' });
        }

        if (status === 'completed' && normalizedOrderType !== 'dine_in') {
            return res.status(400).json({ success: false, message: 'Only dine-in orders can be completed by the admin' });
        }

        if (status === 'completed' && normalizedOrderType === 'dine_in' && order.status !== 'ready') {
            return res.status(400).json({ success: false, message: 'Dine-in orders can only be marked served after they are ready' });
        }

        if (status === 'ready' && order.status === 'pending') {
            return res.status(400).json({ success: false, message: 'Move the order to preparing before marking it ready' });
        }

        await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);

        const [updatedOrders] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
        const [items] = await pool.query(
            `SELECT oi.id, oi.quantity, oi.price, mi.name, mi.description, mi.image_url
             FROM order_items oi
             JOIN menu_items mi ON oi.menu_item_id = mi.id
             WHERE oi.order_id = ?`,
            [orderId]
        );

        res.status(200).json({
            success: true,
            message: 'Order status updated successfully',
            order: decorateOrder(updatedOrders[0], items)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteOrder = async (req, res) => {
    try {
        const { orderId } = req.params;

        const [result] = await pool.query('DELETE FROM orders WHERE id = ?', [orderId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.status(200).json({ success: true, message: 'Order deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
