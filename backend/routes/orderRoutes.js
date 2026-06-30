const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes (no auth needed for menu and branches)
router.get('/menu', orderController.getMenuItems);
router.get('/categories', orderController.getCategories);
router.get('/branches', orderController.getBranches);
router.get('/delivery-sessions', orderController.getDeliverySessions);
router.get('/session/:sessionId/availability', orderController.checkSessionAvailability);
router.get('/track/:trackingToken', orderController.getOrderTracking);
router.post('/track/by-phone', orderController.getOrdersByPhone);
router.post('/track/lookup', orderController.lookupOrderTracking);
router.patch('/track/:trackingToken/confirm', orderController.confirmTrackedOrder);

// Protected routes (require auth)
// Allow public order creation (guests can create orders) - other routes remain protected
router.post('/create', orderController.createOrder);
router.get('/user-orders', authMiddleware.verifyToken(), orderController.getUserOrders);
router.get('/:orderId', authMiddleware.verifyToken(), orderController.getOrderDetails);

module.exports = router;
