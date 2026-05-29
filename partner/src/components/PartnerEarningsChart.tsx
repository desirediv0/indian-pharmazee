import { useEffect, useState } from "react";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";
import { CheckCircle, AlertCircle, Clock, IndianRupee, TrendingUp } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

type MonthlyEarning = {
    month: string;
    total: number;
};

type PaymentStatus = {
    id?: string;
    totalAmount: number;
    totalOrders: number;
    paymentStatus: string;
    paidAt?: string;
    notes?: string;
};

interface EarningsChartProps {
    filters?: {
        year?: string;
        month?: string;
        startDate?: string;
        endDate?: string;
    };
}

export default function PartnerEarningsChart({ filters = {} }: EarningsChartProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [monthlyData, setMonthlyData] = useState<MonthlyEarning[]>([]);
    const [lastMonthEarnings, setLastMonthEarnings] = useState(0);
    const [thisMonthEarnings, setThisMonthEarnings] = useState(0);

    // Payment confirmation dialog states
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState<{ year: number; month: number } | null>(null);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState("");
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);

    useEffect(() => {
        async function fetchEarningsData() {
            try {
                setLoading(true);
                setError("");

                let url = `${API_URL}/api/partner/earnings`;
                const qp = new URLSearchParams();
                if (filters.year) qp.append('year', filters.year);
                if (filters.month) qp.append('month', filters.month);
                if (filters.startDate) qp.append('startDate', filters.startDate);
                if (filters.endDate) qp.append('endDate', filters.endDate);
                if ([...qp].length) {
                    url += `?${qp.toString()}`;
                }

                const response = await axios.get(url, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("partnerToken")}`,
                    },
                });

                const data = response.data.data;

                // Aggregate earnings using the pre-calculated monthlyEarnings array from the backend
                const monthlyEarningsList = data.monthlyEarnings || [];
                const monthlyMap: Record<string, number> = {};
                const now = new Date();

                // Initialize last 12 months with 0
                for (let i = 11; i >= 0; i--) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                    monthlyMap[monthKey] = 0;
                }

                // Apply actual data
                monthlyEarningsList.forEach((monthly: any) => {
                    if (monthlyMap.hasOwnProperty(monthly.month)) {
                        monthlyMap[monthly.month] = parseFloat(monthly.totalEarnings || 0);
                    }
                });

                const chartData = Object.entries(monthlyMap)
                    .map(([month, total]) => ({
                        month,
                        total: parseFloat(total.toFixed(2))
                    }))
                    .sort((a, b) => a.month.localeCompare(b.month));

                setMonthlyData(chartData);

                // Calculate Last Month and This Month for the comparison chart
                const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const lastMonthKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

                setThisMonthEarnings(monthlyMap[currentMonthKey] || 0);
                setLastMonthEarnings(monthlyMap[lastMonthKey] || 0);

            } catch (err) {
                console.error("Failed to fetch earnings data:", err);
                setError("Unable to load earnings trend data.");
            } finally {
                setLoading(false);
            }
        }
        fetchEarningsData();
    }, [filters]);

    const handleConfirmPayment = async (year: number, month: number) => {
        setSelectedMonth({ year, month });
        setConfirmDialogOpen(true);
        try {
            const response = await axios.get(`${API_URL}/api/partner/monthly-earning-status/${year}/${month}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("partnerToken")}`,
                },
            });
            setPaymentStatus(response.data.data.monthlyEarning);
        } catch (err) {
            console.error("Error fetching payment status:", err);
        }
    };

    const handleConfirmClick = async () => {
        if (!selectedMonth) return;
        setConfirmLoading(true);
        try {
            await axios.post(`${API_URL}/api/partner/confirm-payment`, {
                year: selectedMonth.year,
                month: selectedMonth.month,
                notes: confirmMessage
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("partnerToken")}`,
                },
            });
            setConfirmDialogOpen(false);
            setConfirmMessage("");
            setSelectedMonth(null);
            // Optionally refresh stats here
        } catch (err) {
            console.error("Error confirming payment:", err);
        } finally {
            setConfirmLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[400px] w-full flex items-center justify-center bg-gray-50/50 rounded-xl border border-gray-100">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-100 border-t-blue-600"></div>
                    <p className="text-sm font-medium text-gray-500">Generating your insights...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <Alert className="border-red-200 bg-red-50 mt-4 rounded-xl">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-800">Error</AlertTitle>
                <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Monthly Earnings Trend Graph */}
                <Card className="p-6 lg:col-span-2 border border-gray-100 shadow-sm rounded-xl bg-white">
                    <div className="flex items-center justify-between mb-8">
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold text-gray-900 leading-none">Earnings Trend</h3>
                            <p className="text-sm text-gray-500">Monthly commission performance</p>
                        </div>
                        <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                    </div>
                    
                    <ResponsiveContainer width="100%" height={320}>
                        <LineChart data={monthlyData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                            <XAxis
                                dataKey="month"
                                tickFormatter={(val) => {
                                    const parts = val.split('-');
                                    return parts.length === 2 ? `${monthNames[parseInt(parts[1]) - 1].substring(0, 3)}` : val;
                                }}
                                tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 600 }}
                                axisLine={false}
                                tickLine={false}
                                dy={10}
                            />
                            <YAxis
                                tickFormatter={(val) => `₹${val >= 1000 ? `${val / 1000}k` : val}`}
                                tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 600 }}
                                axisLine={false}
                                tickLine={false}
                                dx={-5}
                            />
                            <Tooltip
                                formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Earned']}
                                labelFormatter={(label) => {
                                    const parts = label.split('-');
                                    return `${monthNames[parseInt(parts[1]) - 1]} ${parts[0]}`;
                                }}
                                contentStyle={{ 
                                    borderRadius: '16px', 
                                    border: 'none', 
                                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                                    padding: '12px 16px'
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="total"
                                stroke="#2563EB"
                                strokeWidth={4}
                                dot={false}
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#2563EB' }}
                                animationDuration={1500}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </Card>

                <div className="space-y-6">
                    {/* Comparison Chart */}
                    <Card className="p-6 border border-gray-100 shadow-sm rounded-xl bg-white">
                         <div className="space-y-1 mb-8">
                            <h3 className="text-lg font-bold text-gray-900 leading-none">Growth</h3>
                            <p className="text-sm text-gray-500">Monthly comparison</p>
                        </div>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={[
                                { name: "Last", value: lastMonthEarnings },
                                { name: "Current", value: thisMonthEarnings }
                            ]}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
                                <Tooltip
                                    formatter={(value) => [`₹${value}`, 'Amount']}
                                    cursor={{ fill: '#F3F4F6' }}
                                    contentStyle={{ 
                                        borderRadius: '12px', 
                                        border: 'none', 
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                                    }}
                                />
                                <Bar dataKey="value" fill="#2563EB" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>

                    {/* Premium Payment Confirmation Card */}
                    <Card className="p-6 border-0 shadow-xl shadow-blue-500/10 rounded-2xl bg-gradient-to-br from-white to-blue-50/30 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-125 duration-700 ease-in-out" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-sm">
                                    <CheckCircle className="h-4 w-4" />
                                </div>
                                <h4 className="text-lg font-bold text-gray-900 uppercase tracking-tighter">Verification</h4>
                            </div>
                            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                                Ready for payout? Confirm your monthly earnings to notify the finance team.
                            </p>
                            <Button
                                onClick={() => {
                                    const now = new Date();
                                    handleConfirmPayment(now.getFullYear(), now.getMonth() + 1);
                                }}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:translate-y-[-2px] active:translate-y-[0px]"
                            >
                                Request Payout
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Confirmation Dialog */}
            <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                <DialogContent className="max-w-md bg-white border-0 shadow-2xl rounded-3xl p-0 overflow-hidden">
                    <div className="bg-blue-600 p-8 text-white relative">
                         <div className="absolute top-0 right-0 p-4 opacity-20">
                            <IndianRupee className="w-24 h-24 -mr-8 -mt-8" />
                        </div>
                        <DialogHeader>
                            <DialogTitle className="text-white text-2xl font-black tracking-tight mb-1">Confirm Earnings</DialogTitle>
                            <DialogDescription className="text-blue-100 font-medium">
                                Verify your commissions for {selectedMonth ? `${monthNames[selectedMonth.month - 1]} ${selectedMonth.year}` : "this month"}
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    
                    <div className="p-8 space-y-6 bg-white">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100 text-center">
                                <p className="text-[10px] uppercase font-black text-gray-400 mb-1 tracking-widest">Commission</p>
                                <p className="text-2xl font-black text-gray-900">
                                    ₹{paymentStatus ? Number(paymentStatus.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "0.00"}
                                </p>
                            </div>
                            <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100 text-center">
                                <p className="text-[10px] uppercase font-black text-gray-400 mb-1 tracking-widest">Total Orders</p>
                                <p className="text-2xl font-black text-gray-900">{paymentStatus?.totalOrders ?? 0}</p>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between">
                            <p className="text-xs font-black text-blue-700 uppercase tracking-widest">Status</p>
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                                paymentStatus?.paymentStatus === 'PAID' ? 'bg-green-500 text-white' : 
                                paymentStatus?.paymentStatus === 'CONFIRMED' ? 'bg-blue-500 text-white' : 'bg-amber-500 text-white'
                            }`}>
                                {paymentStatus?.paymentStatus ?? "PENDING"}
                            </span>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Optional Notes</label>
                            <textarea
                                className="w-full h-28 p-4 bg-gray-50 border border-gray-200 rounded-2xl resize-none text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none"
                                placeholder="Any specific details for our finance team?"
                                value={confirmMessage}
                                onChange={(e) => setConfirmMessage(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="p-8 pt-0 flex gap-4 bg-white">
                        <Button variant="outline" onClick={() => setConfirmDialogOpen(false)} className="flex-1 h-14 rounded-2xl border-gray-100 font-bold text-gray-400 hover:bg-gray-50 transition-colors">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirmClick}
                            disabled={confirmLoading}
                            className="flex-[2] h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {confirmLoading ? "Processing..." : "Confirm & Notify"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
