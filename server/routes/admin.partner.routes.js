import express from 'express';
import {
    listPartnerRequests,
    getNonApprovedPartnerCount,
    approvePartnerRequest,
    rejectPartnerRequest,
    getPartnerDetails,
    removePartnerCoupon,
    createManualCommission,
    createCommissionsForExistingOrders,
    deactivatePartner,
    getPartnerById,
    markPaymentAsPaid,
    getPartnerEarnings,
    getTopPartnersByCouponSales,
    getPartnersEarningsSummary,
    getMonthlyPaymentStatus,
    confirmMonthlyPayment
} from '../controllers/admin.partner.controller.js';
import { verifyAdminJWT } from '../middlewares/admin.middleware.js';


const router = express.Router();


// List all partner requests
router.get('/requests', verifyAdminJWT, listPartnerRequests);
// Get count of non-approved (pending) partner requests
router.get('/requests/count/non-approved', verifyAdminJWT, getNonApprovedPartnerCount);
// Approve a partner request (set password)
router.post('/requests/:requestId/approve', verifyAdminJWT, approvePartnerRequest);
// Reject a partner request
router.post('/requests/:requestId/reject', verifyAdminJWT, rejectPartnerRequest);

// Get top 5 partners by coupon sales (last month)
router.get('/analytics/top-partners', verifyAdminJWT, getTopPartnersByCouponSales);
// Get all partners earnings summary for admin dashboard
router.get('/analytics/earnings-summary', verifyAdminJWT, getPartnersEarningsSummary);

// Get partner by ID with detailed earnings (admin only)
router.get('/:partnerId', verifyAdminJWT, getPartnerById);
// Get full partner details (admin only)
router.get('/:partnerId/details', verifyAdminJWT, getPartnerDetails);
// Get partner earnings with filters (admin only)
router.get('/:partnerId/earnings', verifyAdminJWT, getPartnerEarnings);
// Get monthly payment confirmation status
router.get('/:partnerId/payment-status/:year/:month', verifyAdminJWT, getMonthlyPaymentStatus);
// Confirm monthly payment
router.post('/:partnerId/confirm-payment', verifyAdminJWT, confirmMonthlyPayment);
// Mark payment as paid (admin only)
router.patch('/earnings/:earningId/mark-paid', verifyAdminJWT, markPaymentAsPaid);
// Remove a coupon from a partner (admin only)
router.delete('/:partnerId/coupons/:couponId', verifyAdminJWT, removePartnerCoupon);
// Deactivate a partner (admin only)
router.post('/:partnerId/deactivate', verifyAdminJWT, deactivatePartner);
// Create manual commission for testing (admin only)
router.post('/commission/create', verifyAdminJWT, createManualCommission);
// Create commissions for existing orders (one-time fix)
router.post('/commission/fix-existing', verifyAdminJWT, createCommissionsForExistingOrders);

export default router;
