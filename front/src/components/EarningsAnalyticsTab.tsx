import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

const API_URL = import.meta.env.VITE_API_URL;

type PartnerSummary = {
    partnerId: string;
    name: string;
    email: string;
    totalEarnings: number;
    thisYearEarnings: number;
    lastMonthEarnings: number;
    thisMonthEarnings: number;
    orderCount: number;
};

type MonthlyData = {
    month: string;
    total: number;
};


export default function EarningsAnalyticsTab() {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [topPartners, setTopPartners] = useState<PartnerSummary[]>([]);
    const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
    const [totalEarnings, setTotalEarnings] = useState(0);
    const [totalPartners, setTotalPartners] = useState(0);

    useEffect(() => {
        async function fetchEarningsData() {
            try {
                setLoading(true);
                setError("");

                const response = await axios.get(
                    `${API_URL}/api/admin/partners/analytics/earnings-summary`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
                        },
                    }
                );

                const data = response.data.data;
                setTopPartners(data.summary.slice(0, 5));
                setMonthlyData(data.monthlyChartData);
                setTotalEarnings(data.totalEarnings);
                setTotalPartners(data.totalPartners);
            } catch (err) {
                console.error("Failed to fetch earnings data:", err);
                setError("Failed to load earnings data");
            } finally {
                setLoading(false);
            }
        }

        fetchEarningsData();
    }, []);

    if (loading) {
        return <div className="text-center py-8">{t("partners_tab.common.loading")}</div>;
    }

    if (error) {
        return (
            <Alert className="border-red-200 bg-red-50">
                <AlertTitle className="text-red-800">Error</AlertTitle>
                <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
                    <div className="text-sm text-gray-600">Total Earnings</div>
                    <div className="text-2xl font-bold text-blue-900 mt-2">
                        ₹{totalEarnings.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </div>
                </Card>
                <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
                    <div className="text-sm text-gray-600">Active Partners</div>
                    <div className="text-2xl font-bold text-green-900 mt-2">{totalPartners}</div>
                </Card>
                <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100">
                    <div className="text-sm text-gray-600">Avg per Partner</div>
                    <div className="text-2xl font-bold text-purple-900 mt-2">
                        ₹{totalPartners > 0 ? (totalEarnings / totalPartners).toLocaleString("en-IN", { maximumFractionDigits: 0 }) : 0}
                    </div>
                </Card>
                <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100">
                    <div className="text-sm text-gray-600">Top Partner</div>
                    <div className="text-lg font-bold text-orange-900 mt-2">
                        {topPartners.length > 0 ? topPartners[0].name : "N/A"}
                    </div>
                </Card>
            </div>

            {/* Monthly Earnings Chart */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Monthly Earnings Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => `₹${value}`} />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="total"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            name="Earnings"
                            dot={{ fill: "#8b5cf6" }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </Card>

            {/* Top 5 Partners */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Top 5 Partners by Earnings</h3>
                <div className="space-y-3">
                    {topPartners.map((partner, index) => (
                        <div key={partner.partnerId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                                    {index + 1}
                                </div>
                                <div>
                                    <div className="font-medium">{partner.name}</div>
                                    <div className="text-sm text-gray-500">{partner.email}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-lg">₹{partner.totalEarnings.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
                                <div className="text-xs text-gray-500">{partner.orderCount} orders</div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Partners Performance Grid */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Partner Performance Summary</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left font-medium">Partner Name</th>
                                <th className="px-4 py-2 text-right font-medium">Total Earnings</th>
                                <th className="px-4 py-2 text-right font-medium">This Year</th>
                                <th className="px-4 py-2 text-right font-medium">Last Month</th>
                                <th className="px-4 py-2 text-right font-medium">This Month</th>
                                <th className="px-4 py-2 text-right font-medium">Orders</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {topPartners.slice(0, 10).map((partner) => (
                                <tr key={partner.partnerId} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">{partner.name}</td>
                                    <td className="px-4 py-3 text-right font-medium">
                                        ₹{partner.totalEarnings.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        ₹{partner.thisYearEarnings.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-4 py-3 text-right text-blue-600">
                                        ₹{partner.lastMonthEarnings.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-4 py-3 text-right text-green-600 font-medium">
                                        ₹{partner.thisMonthEarnings.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-4 py-3 text-right">{partner.orderCount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
