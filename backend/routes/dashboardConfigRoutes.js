const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const dashboardConfigController = require('../controllers/dashboardConfigController');

// ==================== PUBLIC ENDPOINTS ====================

// Get complete dashboard configuration (for customers)
router.get('/config', dashboardConfigController.getDashboardConfig);

// ==================== ADMIN ENDPOINTS (Protected) ====================

// Slideshow Images
router.get('/slideshow', verifyToken(['admin', 'superadmin']), dashboardConfigController.getSlideshowImages);
router.post('/slideshow', verifyToken(['admin', 'superadmin']), dashboardConfigController.addSlideshowImage);
router.put('/slideshow/:id', verifyToken(['admin', 'superadmin']), dashboardConfigController.updateSlideshowImage);
router.delete('/slideshow/:id', verifyToken(['admin', 'superadmin']), dashboardConfigController.deleteSlideshowImage);

// Featured Items
router.get('/featured', verifyToken(['admin', 'superadmin']), dashboardConfigController.getFeaturedItems);
router.post('/featured', verifyToken(['admin', 'superadmin']), dashboardConfigController.addFeaturedItem);
router.put('/featured/:id', verifyToken(['admin', 'superadmin']), dashboardConfigController.updateFeaturedItem);
router.delete('/featured/:id', verifyToken(['admin', 'superadmin']), dashboardConfigController.removeFeaturedItem);

// Company Story
router.get('/story', verifyToken(['admin', 'superadmin']), dashboardConfigController.getCompanyStory);
router.put('/story', verifyToken(['admin', 'superadmin']), dashboardConfigController.updateCompanyStory);

module.exports = router;
