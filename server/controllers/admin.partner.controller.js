
import bcrypt from 'bcryptjs';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponsive } from '../utils/ApiResponsive.js';
import { prisma } from '../config/db.js';


// List all partner requests
export const listPartnerRequests = asyncHandler(async (req, res) => {
    const { status } = req.query;

    const where = {};
    if (status) {
        where.status = status.toUpperCase();
    }

    const requests = await prisma.partnerRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { partner: true },
    });
    // Remove password from partner in each request
    const safeRequests = requests.map(r => ({
        ...r,
        partner: r.partner ? (({ password, ...rest }) => rest)(r.partner) : undefined
    }));
    res.status(200).json(new ApiResponsive(200, { requests: safeRequests }, 'Partner requests fetched'));
});

// Get count of non-approved partner requests
export const getNonApprovedPartnerCount = asyncHandler(async (req, res) => {
    const count = await prisma.partnerRequest.count({
        where: { status: 'PENDING' }
    });
    res.status(200).json(new ApiResponsive(200, { count }, 'Non-approved partner count fetched'));
});

// Approve partner request and set password
export const approvePartnerRequest = asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const bodyPassword = req.body?.password;

    const request = await prisma.partnerRequest.findUnique({ where: { id: requestId } });
    if (!request || request.status !== 'PENDING') {
        return res.status(404).json(new ApiResponsive(404, null, 'Request not found or already processed'));
    }

    // Admin UI may send a password (min 6 chars); otherwise use default demo password
    const demoPassword =
        bodyPassword && String(bodyPassword).length >= 6 && String(bodyPassword).length <= 128
            ? String(bodyPassword)
            : 'PartnerPortal@123';
    const hashed = await bcrypt.hash(demoPassword, 10);

    const partner = await prisma.partner.create({
        data: {
            name: request.name,
            email: String(request.email).trim().toLowerCase(),
            password: hashed,
            number: request.number,
            city: request.city,
            state: request.state,
            isActive: true,
            isPasswordChanged: false,
            request: { connect: { id: request.id } },
        },
    });

    // Update request
    await prisma.partnerRequest.update({
        where: { id: request.id },
        data: { status: 'APPROVED', partnerId: partner.id },
    });

    const { password: _pw, ...partnerSafe } = partner;

    res.status(200).json(new ApiResponsive(200, {
        partner: partnerSafe,
        demoPassword: demoPassword
    }, 'Partner approved with demo password'));
});


// Reject partner request
export const rejectPartnerRequest = asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const request = await prisma.partnerRequest.findUnique({ where: { id: requestId } });
    if (!request || request.status !== 'PENDING') {
        return res.status(404).json(new ApiResponsive(404, null, 'Request not found or already processed'));
    }
    await prisma.partnerRequest.update({
        where: { id: requestId },
        data: { status: 'REJECTED' },
    });
    res.status(200).json(new ApiResponsive(200, null, 'Partner request rejected'));
});

// Get full partner details (admin only)
export const getPartnerDetails = asyncHandler(async (req, res) => {
    const { partnerId } = req.params;

    const partner = await prisma.partner.findUnique({
        where: { id: partnerId },
        include: {
            couponPartners: {
                include: {
                    coupon: true
                }
            },
            earnings: true,
        },
    });
    if (!partner) return res.status(404).json(new ApiResponsive(404, null, 'Partner not found'));

    // Earnings summary (only from DELIVERED orders)
    const earnings = await prisma.partnerEarning.findMany({
        where: {
            partnerId,
            order: {
                status: 'DELIVERED' // Only include earnings from delivered orders
            }
        },
        select: { amount: true, createdAt: true },
    });
    let totalEarnings = 0;
    const monthlyEarnings = {};
    earnings.forEach(e => {
        totalEarnings += parseFloat(e.amount);
        const month = e.createdAt.getFullYear() + '-' + String(e.createdAt.getMonth() + 1).padStart(2, '0');
        if (!monthlyEarnings[month]) monthlyEarnings[month] = 0;
        monthlyEarnings[month] += parseFloat(e.amount);
    });

    // Return password for admin only (this endpoint is admin-protected)
    // Remove password from partner object and transform couponPartners to coupons
    const { password, couponPartners, ...partnerSafe } = partner;

    // Transform couponPartners to simpler coupons array for frontend compatibility
    const coupons = couponPartners?.map(cp => ({
        ...cp.coupon,
        commission: cp.commission
    })) || [];

    res.status(200).json(new ApiResponsive(200, {
        partner: partnerSafe,
        coupons: coupons,
        earnings: {
            total: totalEarnings,
            monthly: monthlyEarnings,
        },
    }, 'Partner details fetched'));
});

// Manual commission creation for testing (admin only)
export const createManualCommission = asyncHandler(async (req, res) => {
    const { partnerId, orderId, couponId, amount, percentage } = req.body;

    if (!partnerId || !orderId || !couponId || !amount || !percentage) {
        return res.status(400).json(new ApiResponsive(400, null, 'All fields required'));
    }

    // Verify partner exists
    const partner = await prisma.partner.findUnique({ where: { id: partnerId } });
    if (!partner) {
        return res.status(404).json(new ApiResponsive(404, null, 'Partner not found'));
    }

    // Verify order exists
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
        return res.status(404).json(new ApiResponsive(404, null, 'Order not found'));
    }

    // Create commission
    const commission = await prisma.partnerEarning.create({
        data: {
            partnerId,
            orderId,
            couponId,
            amount: parseFloat(amount).toFixed(2),
            percentage: parseFloat(percentage),
        },
    });

    res.status(201).json(new ApiResponsive(201, { commission }, 'Manual commission created'));
});

// Create commissions for existing orders with coupons (one-time fix)
export const createCommissionsForExistingOrders = asyncHandler(async (req, res) => {
    try {
        // Find all orders with coupons that don't have commissions yet
        const ordersWithCoupons = await prisma.order.findMany({
            where: {
                couponId: { not: null },
                partnerEarnings: { none: {} } // Orders without any commissions
            },
            include: {
                coupon: {
                    include: {
                        couponPartners: {
                            include: { partner: true }
                        }
                    }
                }
            }
        });


        let commissionsCreated = 0;

        for (const order of ordersWithCoupons) {
            if (order.coupon && order.coupon.couponPartners.length > 0) {
                // Calculate final order amount (subtotal - discount)
                const finalOrderAmount = parseFloat(order.subTotal) - parseFloat(order.discount);

                if (finalOrderAmount > 0) {
                    for (const couponPartner of order.coupon.couponPartners) {
                        if (couponPartner.commission && couponPartner.commission > 0) {
                            // Calculate commission based on FINAL ORDER AMOUNT (not discount)
                            const commissionAmount = (finalOrderAmount * couponPartner.commission) / 100;

                            await prisma.partnerEarning.create({
                                data: {
                                    partnerId: couponPartner.partnerId,
                                    orderId: order.id,
                                    couponId: order.couponId,
                                    amount: commissionAmount.toFixed(2),
                                    percentage: couponPartner.commission,
                                },
                            });

                            commissionsCreated++;
                            console.log(`Created commission for partner ${couponPartner.partner.name} on order ${order.orderNumber}: ₹${commissionAmount.toFixed(2)} (${couponPartner.commission}% of final order ₹${finalOrderAmount.toFixed(2)})`);
                        }
                    }
                }
            }
        }

        res.status(200).json(new ApiResponsive(200,
            {
                ordersProcessed: ordersWithCoupons.length,
                commissionsCreated
            },
            `Created ${commissionsCreated} commissions for ${ordersWithCoupons.length} existing orders`
        ));
    } catch (error) {
        console.error('Error creating commissions for existing orders:', error);
        res.status(500).json(new ApiResponsive(500, null, 'Error creating commissions'));
    }
});

// Remove a coupon from a partner (admin only)
export const removePartnerCoupon = asyncHandler(async (req, res) => {
    const { partnerId, couponId } = req.params;
    // Set coupon.partnerId to null
    const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
    if (!coupon || coupon.partnerId !== partnerId) {
        return res.status(404).json(new ApiResponsive(404, null, 'Coupon not assigned to this partner'));
    }
    await prisma.coupon.update({ where: { id: couponId }, data: { partnerId: null } });
    res.status(200).json(new ApiResponsive(200, null, 'Coupon removed from partner'));
});

// Deactivate partner (admin only)
export const deactivatePartner = asyncHandler(async (req, res) => {
    const { partnerId } = req.params;

    const partner = await prisma.partner.findUnique({ where: { id: partnerId } });
    if (!partner) {
        return res.status(404).json(new ApiResponsive(404, null, 'Partner not found'));
    }

    // Deactivate the partner
    await prisma.partner.update({
        where: { id: partnerId },
        data: { isActive: false }
    });

    res.status(200).json(new ApiResponsive(200, null, 'Partner deactivated successfully'));
});

// Get partner details by ID with earnings (admin only)
export const getPartnerById = asyncHandler(async (req, res) => {
    const { partnerId } = req.params;

    const partner = await prisma.partner.findUnique({
        where: { id: partnerId },
        include: {
            earnings: {
                include: {
                    order: {
                        select: {
                            orderNumber: true,
                            total: true,
                            createdAt: true,
                            user: {
                                select: {
                                    name: true,
                                    email: true
                                }
                            }
                        }
                    },
                    coupon: {
                        select: {
                            code: true,
                            description: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            },
            monthlyEarnings: {
                orderBy: [
                    { year: 'desc' },
                    { month: 'desc' }
                ]
            },
            couponPartners: {
                include: {
                    coupon: {
                        select: {
                            id: true,
                            code: true,
                            description: true,
                            discountType: true,
                            discountValue: true,
                            minOrderAmount: true,
                            maxUses: true,
                            usedCount: true,
                            isActive: true,
                            startDate: true,
                            endDate: true,
                            isDiscountCapped: true,
                            createdAt: true
                        }
                    }
                }
            },
            request: {
                select: {
                    message: true,
                    createdAt: true
                }
            }
        }
    });

    if (!partner) {
        return res.status(404).json(new ApiResponsive(404, null, 'Partner not found'));
    }

    // Dynamically aggregate monthly totals from actual earnings
    const totalEarnings = partner.earnings.reduce((sum, earning) => sum + parseFloat(earning.amount), 0);
    const totalOrders = partner.earnings.length;

    const monthlyEarningsMap = {};
    partner.earnings.forEach(earning => {
        const date = new Date(earning.createdAt);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const key = `${year}-${month}`;

        if (!monthlyEarningsMap[key]) {
            monthlyEarningsMap[key] = {
                year,
                month,
                totalAmount: 0,
                totalOrders: 0
            };
        }
        monthlyEarningsMap[key].totalAmount += parseFloat(earning.amount);
        monthlyEarningsMap[key].totalOrders += 1;
    });

    const dbMonthlyByKey = new Map(
        partner.monthlyEarnings.map(m => [`${m.year}-${m.month}`, m])
    );

    const calculatedMonths = Object.values(monthlyEarningsMap).sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
    });

    const dynamicMonthlyEarnings = calculatedMonths.map(calc => {
        const dbRow = dbMonthlyByKey.get(`${calc.year}-${calc.month}`);
        return {
            id: dbRow?.id || `temp-${calc.year}-${calc.month}`,
            year: calc.year,
            month: calc.month,
            totalAmount: calc.totalAmount,
            totalOrders: calc.totalOrders,
            paymentStatus: dbRow?.paymentStatus ?? 'PENDING',
            paidAt: dbRow?.paidAt ?? null,
            notes: dbRow?.notes ?? ''
        };
    });

    const paidAmount = dynamicMonthlyEarnings
        .filter(monthly => monthly.paymentStatus === 'PAID')
        .reduce((sum, monthly) => sum + monthly.totalAmount, 0);

    const pendingAmount = totalEarnings - paidAmount;
    
    // Update partner object with dynamically calculated accurate array
    partner.monthlyEarnings = dynamicMonthlyEarnings;

    // Remove password from response and transform couponPartners to simple coupons array
    const { password, couponPartners, ...partnerData } = partner;

    // Transform couponPartners to coupons with commission info
    const coupons = couponPartners?.map(cp => ({
        ...cp.coupon,
        commission: cp.commission,
        assignedAt: cp.createdAt
    })) || [];

    res.status(200).json(new ApiResponsive(200, {
        ...partnerData,
        coupons, // Add coupons data
        totalEarnings,
        pendingAmount,
        paidAmount,
        totalOrders,
        registeredAt: partner.createdAt
    }, 'Partner details fetched successfully'));
});

export const markPaymentAsPaid = asyncHandler(async (req, res) => {
    const { earningId } = req.params;
    const { notes, year, month, partnerId } = req.body;
    const adminId = req.admin.id;

    try {
        // Check if this is a temporary ID (temp-YYYY-M format)
        if (earningId.startsWith('temp-')) {
            const parts = earningId.split('-'); // temp-year-month
            const earningYear = parseInt(parts[1]);
            const earningMonth = parseInt(parts[2]);

            if (!partnerId) {
                return res.status(400).json(new ApiResponsive(400, null, 'partnerId is required for marking temporary months as paid'));
            }

            // Find the partner's earnings for this specific month
            const partnerEarnings = await prisma.partnerEarning.findMany({
                where: {
                    partnerId: partnerId,
                    AND: [
                        {
                            createdAt: {
                                gte: new Date(earningYear, earningMonth - 1, 1),
                                lt: new Date(earningYear, earningMonth, 1)
                            }
                        }
                    ]
                }
            });

            if (partnerEarnings.length === 0) {
                return res.status(404).json(new ApiResponsive(404, null, 'No earnings found for this partner this month'));
            }

            const totalAmount = partnerEarnings.reduce((sum, e) => sum + parseFloat(e.amount), 0);
            const totalOrders = partnerEarnings.length;

            // Create or update monthly earning record
            const updatedEarning = await prisma.partnerMonthlyEarning.upsert({
                where: {
                    partnerId_year_month: {
                        partnerId: partnerId,
                        year: earningYear,
                        month: earningMonth
                    }
                },
                update: {
                    paymentStatus: 'PAID',
                    paidBy: adminId,
                    paidAt: new Date(),
                    notes: notes || ''
                },
                create: {
                    partnerId: partnerId,
                    year: earningYear,
                    month: earningMonth,
                    totalAmount: totalAmount,
                    totalOrders: totalOrders,
                    paymentStatus: 'PAID',
                    paidBy: adminId,
                    paidAt: new Date(),
                    notes: notes || ''
                }
            });

            console.log(`Admin ${adminId} marked payment as paid for earning ${earningId}`, {
                year, month, notes
            });

            res.status(200).json(new ApiResponsive(200, updatedEarning, 'Payment marked as paid successfully'));
        } else {
            // Handle regular UUID-based earning IDs
            const updatedEarning = await prisma.partnerMonthlyEarning.update({
                where: { id: earningId },
                data: {
                    paymentStatus: 'PAID',
                    paidBy: adminId,
                    paidAt: new Date(),
                    notes: notes || ''
                }
            });

            console.log(`Admin ${adminId} marked payment as paid for earning ${earningId}`, {
                year, month, notes
            });

            res.status(200).json(new ApiResponsive(200, updatedEarning, 'Payment marked as paid successfully'));
        }
    } catch (error) {
        console.error('Error updating payment status:', error);
        res.status(500).json(new ApiResponsive(500, null, 'Failed to update payment status'));
    }
});

// Get partner earnings with filters (admin only)
export const getPartnerEarnings = asyncHandler(async (req, res) => {
    const { partnerId } = req.params;
    const { year, month } = req.query;

    const whereClause = { partnerId };

    if (year || month) {
        whereClause.createdAt = {};

        if (year) {
            const startYear = new Date(`${year}-01-01`);
            const endYear = new Date(`${parseInt(year) + 1}-01-01`);
            whereClause.createdAt.gte = startYear;
            whereClause.createdAt.lt = endYear;
        }

        if (month && year) {
            const startMonth = new Date(`${year}-${month.padStart(2, '0')}-01`);
            const nextMonth = new Date(startMonth);
            nextMonth.setMonth(nextMonth.getMonth() + 1);

            whereClause.createdAt.gte = startMonth;
            whereClause.createdAt.lt = nextMonth;
        }
    }

    const earnings = await prisma.partnerEarning.findMany({
        where: whereClause,
        include: {
            order: {
                select: {
                    orderNumber: true,
                    total: true,
                    createdAt: true
                }
            },
            coupon: {
                select: {
                    code: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    const totalAmount = earnings.reduce((sum, earning) => sum + parseFloat(earning.amount), 0);

    res.status(200).json(new ApiResponsive(200, {
        earnings,
        totalAmount,
        totalOrders: earnings.length,
        filters: { year, month }
    }, 'Partner earnings fetched successfully'));
});

// Get top 5 partners by coupon sales (last month)
export const getTopPartnersByCouponSales = asyncHandler(async (req, res) => {
    const now = new Date();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);

    const topPartners = await prisma.partnerEarning.groupBy({
        by: ['partnerId'],
        where: {
            createdAt: {
                gte: lastMonthStart,
                lt: lastMonthEnd
            }
        },
        _sum: {
            amount: true
        },
        _count: true,
        orderBy: {
            _sum: {
                amount: 'desc'
            }
        },
        take: 5
    });

    // Get partner details for each top partner
    const partnersWithDetails = await Promise.all(
        topPartners.map(async (tp) => {
            const partner = await prisma.partner.findUnique({
                where: { id: tp.partnerId },
                select: { id: true, name: true, email: true }
            });
            return {
                partnerId: tp.partnerId,
                name: partner?.name || 'Unknown',
                email: partner?.email || '',
                totalEarnings: parseFloat(tp._sum.amount || 0),
                orderCount: tp._count,
                month: `${lastMonthStart.getFullYear()}-${String(lastMonthStart.getMonth() + 1).padStart(2, '0')}`
            };
        })
    );

    res.status(200).json(new ApiResponsive(200, { topPartners: partnersWithDetails }, 'Top partners fetched'));
});

// Get partner earnings summary for dashboard (admin)
export const getPartnersEarningsSummary = asyncHandler(async (req, res) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Get all partners
    const partners = await prisma.partner.findMany({
        where: { isActive: true },
        select: {
            id: true,
            name: true,
            email: true,
            earnings: {
                select: {
                    amount: true,
                    createdAt: true
                }
            }
        }
    });

    // Calculate total earnings per partner and monthly breakdown
    const summary = partners.map(partner => {
        const totalEarnings = parseFloat(
            partner.earnings.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0).toFixed(2)
        );

        // This year earnings
        const thisYearEarnings = parseFloat(
            partner.earnings
                .filter(e => new Date(e.createdAt).getFullYear() === currentYear)
                .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)
                .toFixed(2)
        );

        // Last month earnings
        const lastMonthStart = new Date(currentYear, currentMonth - 2, 1);
        const lastMonthEnd = new Date(currentYear, currentMonth - 1, 1);
        const lastMonthEarnings = parseFloat(
            partner.earnings
                .filter(e => {
                    const d = new Date(e.createdAt);
                    return d >= lastMonthStart && d < lastMonthEnd;
                })
                .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)
                .toFixed(2)
        );

        // This month earnings
        const thisMonthStart = new Date(currentYear, currentMonth - 1, 1);
        const thisMonthEnd = new Date(currentYear, currentMonth, 1);
        const thisMonthEarnings = parseFloat(
            partner.earnings
                .filter(e => {
                    const d = new Date(e.createdAt);
                    return d >= thisMonthStart && d < thisMonthEnd;
                })
                .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)
                .toFixed(2)
        );

        return {
            partnerId: partner.id,
            name: partner.name,
            email: partner.email,
            totalEarnings,
            thisYearEarnings,
            lastMonthEarnings,
            thisMonthEarnings,
            orderCount: partner.earnings.length
        };
    });

    // Sort by total earnings descending
    summary.sort((a, b) => b.totalEarnings - a.totalEarnings);

    // Get monthly aggregated data for chart
    const allEarnings = await prisma.partnerEarning.findMany({
        select: {
            amount: true,
            createdAt: true
        }
    });

    const monthlyData = {};
    const today = new Date();

    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthlyData[monthKey] = 0;
    }

    // Aggregate earnings by month
    allEarnings.forEach(earning => {
        const d = new Date(earning.createdAt);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyData.hasOwnProperty(monthKey)) {
            monthlyData[monthKey] += parseFloat(earning.amount || 0);
        }
    });

    const monthlyChartData = Object.entries(monthlyData).map(([month, total]) => ({
        month,
        total: parseFloat(total.toFixed(2))
    }));

    res.status(200).json(new ApiResponsive(200, {
        summary,
        monthlyChartData,
        totalPartners: partners.length,
        totalEarnings: parseFloat(summary.reduce((sum, p) => sum + p.totalEarnings, 0).toFixed(2))
    }, 'Partners earnings summary fetched'));
});

// Get monthly payment confirmation status
export const getMonthlyPaymentStatus = asyncHandler(async (req, res) => {
    const { partnerId, year, month } = req.params;

    const monthlyEarning = await prisma.partnerMonthlyEarning.findUnique({
        where: {
            partnerId_year_month: {
                partnerId,
                year: parseInt(year),
                month: parseInt(month)
            }
        },
        select: {
            id: true,
            totalAmount: true,
            totalOrders: true,
            paymentStatus: true,
            paidAt: true,
            paidBy: true,
            notes: true
        }
    });

    res.status(200).json(new ApiResponsive(200, { monthlyEarning }, 'Payment status fetched'));
});

// Confirm monthly payment for partner
export const confirmMonthlyPayment = asyncHandler(async (req, res) => {
    const { partnerId } = req.params;
    const { year, month, notes } = req.body;

    const monthlyEarning = await prisma.partnerMonthlyEarning.upsert({
        where: {
            partnerId_year_month: {
                partnerId,
                year: parseInt(year),
                month: parseInt(month)
            }
        },
        update: {
            paymentStatus: 'CONFIRMED',
            paidAt: new Date(),
            paidBy: req.admin?.id ?? null,
            notes: notes || ''
        },
        create: {
            partnerId,
            year: parseInt(year),
            month: parseInt(month),
            totalAmount: 0,
            totalOrders: 0,
            paymentStatus: 'CONFIRMED',
            paidAt: new Date(),
            paidBy: req.admin?.id ?? null,
            notes: notes || ''
        }
    });

    res.status(200).json(new ApiResponsive(200, monthlyEarning, 'Payment confirmed'));
});
