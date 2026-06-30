const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const orderController = require('../controllers/orderController');
const { verifyToken } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Admin management routes
router.get('/dashboard', verifyToken(['admin', 'superadmin']), adminController.getDashboard);
router.post('/invite', verifyToken(['admin', 'superadmin']), adminController.inviteAdmin);
router.get('/orders', verifyToken(['admin', 'superadmin']), orderController.getAdminOrders);
router.patch('/orders/:orderId/status', verifyToken(['admin', 'superadmin']), orderController.updateOrderStatus);
router.delete('/orders/:orderId', verifyToken(['admin', 'superadmin']), orderController.deleteOrder);

// ============ MENU MANAGEMENT ============
router.get('/categories', verifyToken(['admin', 'superadmin']), adminController.getCategories);
router.post('/categories', verifyToken(['admin', 'superadmin']), adminController.createCategory);
router.get('/menu', verifyToken(['admin', 'superadmin']), adminController.getMenuItems);
router.post('/menu', verifyToken(['admin', 'superadmin']), upload.single('image'), adminController.createMenuItem);
router.put('/menu/:itemId', verifyToken(['admin', 'superadmin']), upload.single('image'), adminController.updateMenuItem);
router.delete('/menu/:itemId', verifyToken(['admin', 'superadmin']), adminController.deleteMenuItem);

// ============ BRANCH/RESTAURANT MANAGEMENT ============
router.get('/branches', verifyToken(['admin', 'superadmin']), adminController.getBranches);
router.post('/branches', verifyToken(['admin', 'superadmin']), adminController.createBranch);
router.put('/branches/:branchId', verifyToken(['admin', 'superadmin']), adminController.updateBranch);
router.delete('/branches/:branchId', verifyToken(['admin', 'superadmin']), adminController.deleteBranch);

// ============ DELIVERY SESSION MANAGEMENT ============
router.get('/sessions', verifyToken(['admin', 'superadmin']), adminController.getDeliverySessions);
router.post('/sessions', verifyToken(['admin', 'superadmin']), adminController.createDeliverySession);
router.put('/sessions/:sessionId', verifyToken(['admin', 'superadmin']), adminController.updateDeliverySession);
router.patch('/sessions/:sessionId/toggle', verifyToken(['admin', 'superadmin']), adminController.toggleSessionStatus);
router.patch('/sessions/:sessionId/reset-capacity', verifyToken(['admin', 'superadmin']), adminController.resetSessionCapacity);
router.get('/sessions/templates', verifyToken(['admin', 'superadmin']), adminController.getDailySessionTemplates);
router.put('/sessions/templates/:sessionType', verifyToken(['admin', 'superadmin']), adminController.updateDailySessionTemplate);
router.post('/sessions/ensure-daily', verifyToken(['admin', 'superadmin']), adminController.ensureTodaySessions);

module.exports = router;