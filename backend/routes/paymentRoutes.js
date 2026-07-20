const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Payment Settings
router.get('/settings', paymentController.getPaymentSettings);
router.put('/settings', verifyToken(['superadmin', 'admin']), upload.single('image'), paymentController.updatePaymentSettings);

// Orders Payment Verification
router.get('/orders/pending-verifications', verifyToken(['superadmin', 'admin']), paymentController.getPendingVerifications);
router.get('/orders/logs', verifyToken(['superadmin', 'admin']), paymentController.getPaymentLogs);
router.post('/orders/:orderId/receipt', upload.single('receipt'), paymentController.uploadReceipt);
router.put('/orders/:orderId/verify-payment', verifyToken(['superadmin', 'admin']), paymentController.verifyPayment);

module.exports = router;
