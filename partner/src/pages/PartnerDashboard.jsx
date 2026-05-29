import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { IndianRupee, Ticket, TrendingUp, Users, BarChart3, User, Calendar, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import apiService from '@/services/apiService';
import { toast } from 'sonner';

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const PartnerDashboard = () => {
    const { partner } = useAuth();
    const [stats, setStats] = useState({
        totalCoupons: 0,
        totalEarnings: 0,
        estimatedCommission: 0,
        commissionRate: 0
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [monthlyStats, setMonthlyStats] = useState({
        thisMonth: 0,
        lastMonth: 0,
        monthlyBreakdown: [],
        lastMonthPaymentStatus: null // 'PAID' | 'CONFIRMED' | 'PENDING'
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAllData();
    }, []);

    const formatCurrency = (amount) => {
        return `₹${parseFloat(amount || 0).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [dashData, earningsData] = await Promise.allSettled([
                apiService.getDashboardStats(),
                apiService.getEarnings('')
            ]);

            if (dashData.status === 'fulfilled' && dashData.value.success) {
                setStats(dashData.value.data.stats);
                setRecentOrders(dashData.value.data.recentOrders || []);
            }

            if (earningsData.status === 'fulfilled' && earningsData.value.success) {
                const monthly = earningsData.value.data.monthlyEarnings || [];
                const now = new Date();
                const thisYear = now.getFullYear();
                const thisMonth = now.getMonth() + 1;
                const lastMonthNum = thisMonth === 1 ? 12 : thisMonth - 1;
                const lastYear = thisMonth === 1 ? thisYear - 1 : thisYear;

                const thisMonthData = monthly.find(m => {
                    const [y, mo] = m.month.split('-').map(Number);
                    return y === thisYear && mo === thisMonth;
                });
                const lastMonthData = monthly.find(m => {
                    const [y, mo] = m.month.split('-').map(Number);
                    return y === lastYear && mo === lastMonthNum;
                });

                setMonthlyStats({
                    thisMonth: thisMonthData?.totalEarnings || 0,
                    lastMonth: lastMonthData?.totalEarnings || 0,
                    monthlyBreakdown: monthly.slice(0, 6),
                    lastMonthPaymentStatus: lastMonthData?.paymentStatus || 'PENDING'
                });
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const now = new Date();
    const thisMonthName = MONTH_NAMES[now.getMonth()];
    const lastMonthName = MONTH_NAMES[now.getMonth() === 0 ? 11 : now.getMonth() - 1];

    const statCards = [
        {
            title: 'Total Commission Earned',
            value: formatCurrency(stats.estimatedCommission || 0),
            icon: IndianRupee,
            color: 'text-green-600',
            bgColor: 'bg-green-50'
        },
        {
            title: `${thisMonthName} Earnings`,
            value: formatCurrency(monthlyStats.thisMonth),
            icon: Calendar,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50'
        },
        {
            title: `${lastMonthName} Revenue`,
            value: formatCurrency(monthlyStats.lastMonth),
            icon: Clock,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50'
        },
        {
            title: 'Total Coupons',
            value: stats.totalCoupons || 0,
            icon: Ticket,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50'
        },
        {
            title: 'Total Order Value',
            value: formatCurrency(stats.totalEarnings || 0),
            icon: TrendingUp,
            color: 'text-red-600',
            bgColor: 'bg-red-50'
        },
        {
            title: 'Commission Rate',
            value: `${stats.commissionRate || 0}%`,
            icon: Users,
            color: 'text-teal-600',
            bgColor: 'bg-teal-50'
        }
    ];

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
                        ))}
                    </div>
                    <div className="h-64 bg-gray-200 rounded-lg"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-[#DE7A3E] to-[#7596DB] rounded-xl p-6 text-white">
                <h1 className="text-3xl font-bold mb-2">
                    Welcome back{partner ? `, ${partner.name}` : ''}! 🎉
                </h1>
                <p className="text-orange-100 text-lg">
                    Here's an overview of your partnership performance with Genuine Grocery.
                </p>
                {/* Last month payment status - partner can see if last month is paid */}
                {monthlyStats.lastMonthPaymentStatus && (
                    <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/15 px-4 py-2">
                        <span className="font-medium">Last month payment:</span>
                        {(monthlyStats.lastMonthPaymentStatus === 'PAID' || monthlyStats.lastMonthPaymentStatus === 'CONFIRMED') ? (
                            <span className="font-semibold text-green-200 flex items-center gap-1">
                                <CheckCircle className="h-5 w-5" /> Paid
                            </span>
                        ) : (
                            <span className="font-semibold text-amber-200 flex items-center gap-1">
                                <Clock className="h-5 w-5" /> Pending
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {statCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={index} className="hover:shadow-lg transition-shadow duration-200 border-0 shadow-md">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-1">
                                            {stat.title}
                                        </p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {stat.value}
                                        </p>
                                    </div>
                                    <div className={`p-3 rounded-full ${stat.bgColor} shadow-sm`}>
                                        <Icon className={`h-6 w-6 ${stat.color}`} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Monthly Earnings Table */}
            {monthlyStats.monthlyBreakdown.length > 0 && (
                <Card className="shadow-lg border-0">
                    <CardHeader className="bg-gray-50 rounded-t-lg">
                        <CardTitle className="text-xl font-bold text-gray-800 flex items-center">
                            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                            Monthly Earnings Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commissions</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Earned</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {monthlyStats.monthlyBreakdown.map((m, i) => {
                                        const [y, mo] = m.month.split('-').map(Number);
                                        const isThisMonth = y === now.getFullYear() && mo === now.getMonth() + 1;
                                        return (
                                            <tr key={i} className={isThisMonth ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-gray-900">
                                                            {MONTH_NAMES[mo - 1]} {y}
                                                        </span>
                                                        {isThisMonth && (
                                                            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full font-medium">Current</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {m.commissionCount || 0} orders
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="font-semibold text-gray-900">
                                                        {formatCurrency(m.totalEarnings || 0)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                        m.paymentStatus === 'PAID' || m.paymentStatus === 'CONFIRMED'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-orange-100 text-orange-800'
                                                    }`}>
                                                        {m.paymentStatus || 'PENDING'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Recent Orders */}
            <Card className="shadow-lg border-0">
                <CardHeader className="bg-gray-50 rounded-t-lg">
                    <CardTitle className="text-xl font-bold text-gray-800 flex items-center">
                        <BarChart3 className="h-5 w-5 mr-2 text-orange-600" />
                        Recent Orders
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    {recentOrders.length > 0 ? (
                        <div className="space-y-4">
                            {recentOrders.slice(0, 3).map((order) => (
                                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">Order #{order.orderNumber}</p>
                                        <p className="text-sm text-gray-600 mb-1">
                                            Coupon: <span className="font-mono bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">{order.couponCode}</span>
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(order.createdAt).toLocaleDateString('en-IN')} •
                                            <span className={`ml-1 px-2 py-1 rounded-full text-xs ${order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-lg">{formatCurrency(order.total)}</p>
                                        <p className="text-sm text-green-600 font-medium">
                                            Commission: {formatCurrency(
                                                order.commissionEarned != null
                                                    ? order.commissionEarned
                                                    : (parseFloat(order.total) * (order.coupon?.couponPartners[0]?.commission || stats.commissionRate || 0)) / 100
                                            )}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Discount: {formatCurrency(order.discount || 0)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg mb-2">No recent orders found</p>
                            <p className="text-gray-400 text-sm">Orders will appear here once customers use your coupons</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Partner Info */}
            {partner && (
                <Card className="shadow-lg border-0">
                    <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 rounded-t-lg">
                        <CardTitle className="text-xl font-bold text-gray-800 flex items-center">
                            <User className="h-5 w-5 mr-2 text-orange-600" />
                            Partner Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                                    <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center mr-2">
                                        <User className="h-4 w-4 text-orange-600" />
                                    </div>
                                    Contact Details
                                </h4>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Email:</span>
                                        <span className="font-medium">{partner.email}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Name:</span>
                                        <span className="font-medium">{partner.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Partner ID:</span>
                                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{partner.id}</span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center mr-2">
                                        <TrendingUp className="h-4 w-4 text-green-600" />
                                    </div>
                                    Account Status
                                </h4>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Status:</span>
                                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                            Active Partner
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Member since:</span>
                                        <span className="font-medium">{new Date(partner.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Commission Rate:</span>
                                        <span className="font-bold text-orange-600">{stats.commissionRate}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default PartnerDashboard;
