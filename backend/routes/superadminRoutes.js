// routes/superadminRoutes.js
const express = require('express');
const router = express.Router();
const superadminController = require('../controllers/superadminController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/dashboard', verifyToken(['superadmin']), superadminController.getDashboardStats);
router.post('/add-admin', verifyToken(['superadmin']), superadminController.addAdmin);

module.exports = router;