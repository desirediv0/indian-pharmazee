import React, { useState, useEffect } from 'react';
import {
    Calendar, Download, IndianRupee, Clock, CheckCircle,
    TrendingUp, AlertCircle, Filter, ArrowUpRight
} from 'lucide-react';
import apiService from '../services/apiService';
import PartnerEarningsChart from '../components/PartnerEarningsChart';

const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const formatAmount = (val) => {
    const n = parseFloat(val || 0);
    return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
};

const PartnerEarnings = () => {
    const [earnings, setEarnings] = useState([]);
    const [monthlyEarnings, setMonthlyEarnings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        year: String(new Date().getFullYear()),
        month: '',
        startDate: '',
        endDate: ''
    });
    const [stats, setStats] = useState({
        totalEarnings: 0,
        thisMonthEarnings: 0,
        pendingPayments: 0,
        totalCommissions: 0
    });

    useEffect(() => {
        const fetchEarnings = async () => {
            try {
                setLoading(true);
                setError(null);
                const queryParams = new URLSearchParams();
                if (filters.year) queryParams.append('year', filters.year);
                if (filters.month) queryParams.append('month', filters.month);
                if (filters.startDate) queryParams.append('startDate', filters.startDate);
                if (filters.endDate) queryParams.append('endDate', filters.endDate);

                const response = await apiService.getEarnings(queryParams.toString());
                if (response.success) {
                    setEarnings(response.data.earnings || []);
                    setMonthlyEarnings(response.data.monthlyEarnings || []);
                    setStats(response.data.stats || {
                        totalEarnings: 0, thisMonthEarnings: 0,
                        pendingPayments: 0, totalCommissions: 0
                    });
                } else {
                    setError(response.message || 'Failed to fetch earnings');
                }
            } catch (err) {
                setError(err.message || 'Failed to load earnings data');
            } finally {
                setLoading(false);
            }
        };
        fetchEarnings();
    }, [filters]);

    const handleFilterChange = (name, value) => {
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const exportToCSV = () => {
        if (!earnings.length) return;
        const headers = ['Date', 'Order ID', 'Commission', 'Status'];
        const csvData = earnings.map(e => [
            new Date(e.createdAt).toLocaleDateString(),
            e.orderId || 'N/A',
            `Rs.${e.commission?.toFixed(2) || '0.00'}`,
            e.status || 'Pending'
        ]);
        const csvContent = [headers, ...csvData]
            .map(row => row.map(f => `"${f}"`).join(','))
            .join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `earnings-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 border-t-orange-500 mx-auto mb-4"></div>
                    <p className="text-gray-500 font-medium">Loading your earnings...</p>
                </div>
            </div>
        );
    }

    // ── Derived values ──────────────────────────────────────────────
    const now = new Date();
    const thisYear = now.getFullYear();
    const thisMonthNum = now.getMonth() + 1;
    const lastMonthNum = now.getMonth() === 0 ? 12 : now.getMonth();
    const lastMonthYear = now.getMonth() === 0 ? thisYear - 1 : thisYear;

    // Parse month key like "2025-3" or "2025-03"
    const getMonthEntry = (year, month) =>
        monthlyEarnings.find(m => {
            if (m.month) {
                const parts = m.month.split('-');
                return parseInt(parts[0]) === year && parseInt(parts[1]) === month;
            }
            return m.year === year && m.month === month;
        });

    const thisMonthEntry = getMonthEntry(thisYear, thisMonthNum);
    const lastMonthEntry = getMonthEntry(lastMonthYear, lastMonthNum);

    const thisMonthAmount = parseFloat(thisMonthEntry?.totalEarnings || thisMonthEntry?.totalAmount || stats.thisMonthEarnings || 0);
    const lastMonthAmount = parseFloat(lastMonthEntry?.totalEarnings || lastMonthEntry?.totalAmount || 0);
    const lastMonthPaid = lastMonthEntry?.paymentStatus === 'PAID';
    const totalEarnings = parseFloat(stats.totalEarnings || 0);
    const pendingAmount = parseFloat(stats.pendingPayments || 0);

    const currentYear = now.getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
    const months = monthNames.map((label, i) => ({ value: i + 1, label }));

    // ── Render ──────────────────────────────────────────────────────
    return (
        <div className="space-y-6 max-w-7xl mx-auto">

            {/* Header Banner */}
            <div className="bg-gradient-to-r from-[#DE7A3E] to-[#7596DB] rounded-2xl p-6 text-white shadow-lg">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold mb-1">Earnings Dashboard</h1>
                        <p className="text-white/80 text-sm">Track your commissions and payment status</p>
                    </div>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${lastMonthPaid
                        ? 'bg-green-500/20 border border-green-300/30 text-green-100'
                        : 'bg-amber-500/20 border border-amber-300/30 text-amber-100'
                        }`}>
                        {lastMonthPaid
                            ? <CheckCircle className="h-4 w-4 flex-shrink-0" />
                            : <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        }
                        <span>
                            Last Month ({monthNames[lastMonthNum - 1]}):&nbsp;
                            <strong>{lastMonthPaid ? 'Paid' : 'Payment Pending'}</strong>
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Lifetime Earnings */}
                <div className="bg-white rounded-xl p-5 border-l-4 border-l-blue-500 border-t border-r border-b border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                            <IndianRupee className="h-5 w-5 text-blue-600" />
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">&#8377;{formatAmount(totalEarnings)}</p>
                    <p className="text-xs text-gray-500 mt-1 font-medium">Lifetime Earnings</p>
                </div>

                {/* Total Pending Balance */}
                <div className={`rounded-xl p-5 border-l-4 shadow-sm ${pendingAmount > 0
                    ? 'bg-red-50 border-l-red-500 border-t border-r border-b border-red-100'
                    : 'bg-white border-l-gray-200 border-t border-r border-b border-gray-100'
                    }`}>
                    <div className="flex items-center justify-between mb-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${pendingAmount > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
                            <IndianRupee className={`h-5 w-5 ${pendingAmount > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                        </div>
                    </div>
                    <p className={`text-2xl font-bold ${pendingAmount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        &#8377;{formatAmount(pendingAmount)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 font-medium">Total Pending Balance</p>
                </div>

                {/* This Month Earnings */}
                <div className="bg-white rounded-xl p-5 border-l-4 border-l-orange-400 border-t border-r border-b border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-orange-500" />
                        </div>
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                            {monthNames[thisMonthNum - 1]}
                        </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">&#8377;{formatAmount(thisMonthAmount)}</p>
                    <p className="text-xs text-gray-500 mt-1 font-medium">This Month Earnings</p>
                </div>

                {/* Last Month Status */}
                <div className={`rounded-xl p-5 border-l-4 shadow-sm ${lastMonthPaid
                    ? 'bg-green-50 border-l-green-500 border-t border-r border-b border-green-100'
                    : 'bg-white border-l-amber-400 border-t border-r border-b border-gray-100'
                    }`}>
                    <div className="flex items-center justify-between mb-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${lastMonthPaid ? 'bg-green-100' : 'bg-amber-100'}`}>
                            {lastMonthPaid
                                ? <CheckCircle className="h-5 w-5 text-green-600" />
                                : <Clock className="h-5 w-5 text-amber-500" />
                            }
                        </div>
                        <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded-full font-bold ${lastMonthPaid
                            ? 'bg-green-200 text-green-800'
                            : 'bg-amber-100 text-amber-700'
                            }`}>
                            {lastMonthPaid ? 'Paid' : 'Pending'}
                        </span>
                    </div>
                    <p className={`text-2xl font-bold ${lastMonthPaid ? 'text-gray-900' : 'text-gray-900'}`}>
                        &#8377;{formatAmount(lastMonthAmount)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 font-medium">Last Month ({monthNames[lastMonthNum - 1]})</p>
                </div>
            </div>

            {/* Chart */}
            <PartnerEarningsChart filters={filters} />

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                        <Filter className="h-4 w-4" />
                        Filter:
                    </div>
                    <select
                        value={filters.year}
                        onChange={(e) => handleFilterChange('year', e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
                    >
                        <option value="">All Years</option>
                        {years.map(year => <option key={year} value={year}>{year}</option>)}
                    </select>
                    <select
                        value={filters.month}
                        onChange={(e) => handleFilterChange('month', e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
                    >
                        <option value="">All Months</option>
                        {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                    <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
                    />
                    <span className="text-gray-400 text-sm">to</span>
                    <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
                    />
                    <button
                        onClick={exportToCSV}
                        disabled={!earnings.length}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ml-auto"
                    >
                        <Download className="h-4 w-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Monthly Payment Status Table */}
            {monthlyEarnings.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-base font-semibold text-gray-900">Monthly Payment History</h2>
                        <span className="text-xs text-gray-400">{monthlyEarnings.length} month(s) total</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Month</th>
                                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount Earned</th>
                                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Orders</th>
                                    <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Paid On</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment Reference</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {monthlyEarnings.map((monthly, index) => {
                                    const isPaid = monthly.paymentStatus === 'PAID';
                                    const monthLabel = (() => {
                                        if (monthly.month && typeof monthly.month === 'string' && monthly.month.includes('-')) {
                                            const [y, m] = monthly.month.split('-');
                                            return `${monthNames[parseInt(m) - 1]} ${y}`;
                                        }
                                        if (monthly.year && monthly.month) {
                                            return `${monthNames[parseInt(monthly.month) - 1]} ${monthly.year}`;
                                        }
                                        return monthly.month;
                                    })();

                                    return (
                                        <tr key={index} className={`transition-colors ${isPaid ? 'bg-green-50/60' : 'hover:bg-gray-50'}`}>
                                            <td className="px-5 py-4 text-sm font-semibold text-gray-900 whitespace-nowrap">
                                                {monthLabel}
                                            </td>
                                            <td className="px-5 py-4 text-sm font-bold text-gray-900 text-right whitespace-nowrap">
                                                &#8377;{formatAmount(monthly.totalEarnings || monthly.totalAmount)}
                                            </td>
                                            <td className="px-5 py-4 text-sm text-gray-700 text-right whitespace-nowrap">
                                                {monthly.commissionCount || monthly.totalOrders || 0}
                                            </td>
                                            <td className="px-5 py-4 text-center whitespace-nowrap">
                                                {isPaid ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                                                        <CheckCircle className="h-3.5 w-3.5" />
                                                        Paid
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        Pending
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">
                                                {monthly.paidAt
                                                    ? <span className="font-medium text-green-700">{formatDate(monthly.paidAt)}</span>
                                                    : <span className="text-gray-300">—</span>
                                                }
                                            </td>
                                            <td className="px-5 py-4 text-sm text-gray-600 max-w-xs">
                                                {monthly.notes
                                                    ? <span className="italic text-gray-700 line-clamp-1" title={monthly.notes}>{monthly.notes}</span>
                                                    : <span className="text-gray-300">—</span>
                                                }
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Detailed Earnings Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-base font-semibold text-gray-900">Commission Details</h2>
                </div>
                <div className="overflow-x-auto">
                    {earnings.length > 0 ? (
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</th>
                                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Commission</th>
                                    <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {earnings.map((earning, index) => (
                                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-5 py-3.5 text-sm text-gray-700 whitespace-nowrap">
                                            {new Date(earning.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-5 py-3.5 text-sm font-mono text-gray-600 whitespace-nowrap">
                                            {earning.orderId ? `#${earning.orderId.substring(0, 12)}...` : 'N/A'}
                                        </td>
                                        <td className="px-5 py-3.5 text-sm font-bold text-gray-900 text-right whitespace-nowrap">
                                            &#8377;{parseFloat(earning.commission || earning.amount || 0).toFixed(2)}
                                        </td>
                                        <td className="px-5 py-3.5 text-center whitespace-nowrap">
                                            <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${earning.status === 'PAID'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-amber-100 text-amber-800'
                                                }`}>
                                                {earning.status || 'PENDING'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="py-16 text-center">
                            <IndianRupee className="h-12 w-12 mx-auto text-gray-200 mb-3" />
                            <h3 className="text-sm font-semibold text-gray-500">No earnings found</h3>
                            <p className="text-xs text-gray-400 mt-1">No commission data for the selected period.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PartnerEarnings;
