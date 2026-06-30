const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { verifyToken } = require('../middleware/authMiddleware');
const dashboardConfigController = require('../controllers/dashboardConfigController');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../public/uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'dashboard-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.test(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

// ==================== PUBLIC ENDPOINTS ====================

// Get complete dashboard configuration (for customers)
router.get('/config', dashboardConfigController.getDashboardConfig);

// ==================== ADMIN ENDPOINTS (Protected) ====================

// Slideshow Images
router.get('/slideshow', verifyToken(['admin', 'superadmin']), dashboardConfigController.getSlideshowImages);
router.get('/slideshow-mode', verifyToken(['admin', 'superadmin']), dashboardConfigController.getSlideshowMode);
router.put('/slideshow-mode', verifyToken(['admin', 'superadmin']), dashboardConfigController.updateSlideshowMode);
router.post('/slideshow', verifyToken(['admin', 'superadmin']), upload.single('image'), dashboardConfigController.addSlideshowImage);
router.put('/slideshow/:id', verifyToken(['admin', 'superadmin']), dashboardConfigController.updateSlideshowImage);
router.delete('/slideshow/:id', verifyToken(['admin', 'superadmin']), dashboardConfigController.deleteSlideshowImage);

// Featured Items
router.get('/featured', verifyToken(['admin', 'superadmin']), dashboardConfigController.getFeaturedItems);
router.post('/featured', verifyToken(['admin', 'superadmin']), dashboardConfigController.addFeaturedItem);
router.put('/featured/:id', verifyToken(['admin', 'superadmin']), dashboardConfigController.updateFeaturedItem);
router.delete('/featured/:id', verifyToken(['admin', 'superadmin']), dashboardConfigController.removeFeaturedItem);

// Company Story
router.get('/story', verifyToken(['admin', 'superadmin']), dashboardConfigController.getCompanyStory);
router.put('/story', verifyToken(['admin', 'superadmin']), upload.single('image'), dashboardConfigController.updateCompanyStory);

module.exports = router;
