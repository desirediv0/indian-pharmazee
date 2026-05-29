import express from 'express';
import {
    registerPartner,
    partnerLogin,
    getPartnerProfile,
    getPartnerDashboard,
    getPartnerCoupons,
    getPartnerEarnings,
    getPartnerEarningsEnhanced,
    getPartnerPaymentStatus,
    confirmPartnerPayment
} from '../controllers/partner.controller.js';
import { verifyPartnerJWT } from '../middlewares/partner.auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerPartner);
router.post('/login', partnerLogin);

// Protected routes (require partner authentication)
router.use(verifyPartnerJWT); // Apply middleware to all routes below

router.get('/profile', getPartnerProfile);
router.get('/dashboard', getPartnerDashboard);
router.get('/coupons', getPartnerCoupons);
router.get('/earnings', getPartnerEarningsEnhanced); // Updated to use enhanced version
router.get('/earnings/legacy', getPartnerEarnings); // Keep old version as backup

// Payment status & confirmation (partner-specific)
router.get('/payment-status/:year/:month', verifyPartnerJWT, getPartnerPaymentStatus);
router.post('/confirm-payment', verifyPartnerJWT, confirmPartnerPayment);

export default router;
