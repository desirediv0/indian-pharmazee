import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ApprovedPartnersTab from "../components/ApprovedPartnersTab";
import NonApprovedPartnersTab from "../components/NonApprovedPartnersTab";
import RejectedPartnersTab from "../components/RejectedPartnersTab";
import EarningsAnalyticsTab from "../components/EarningsAnalyticsTab";
import { useLanguage } from "@/context/LanguageContext";
import axios from "axios";
import { Badge } from "@/components/ui/badge";

const API_URL = import.meta.env.VITE_API_URL;

export default function PartnerPage() {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState("approved");
    const [nonApprovedCount, setNonApprovedCount] = useState(0);
    const [loadingCount, setLoadingCount] = useState(true);

    useEffect(() => {
        async function fetchNonApprovedCount() {
            try {
                const response = await axios.get(`${API_URL}/api/admin/partners/requests/count/non-approved`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
                    },
                });
                setNonApprovedCount(response.data.data.count || 0);
            } catch (error) {
                console.error("Failed to fetch non-approved count:", error);
                setNonApprovedCount(0);
            } finally {
                setLoadingCount(false);
            }
        }
        fetchNonApprovedCount();
    }, []);

    return (
        <div className="space-y-8">
            {/* Premium Page Header */}
            <div className="space-y-4">
                <div>
                    <h1 className="text-3xl font-semibold text-[#1F2937] tracking-tight">
                        {t('partner_management.title')}
                    </h1>
                    <p className="text-[#9CA3AF] text-sm mt-1.5">
                        {t('partner_management.description')}
                    </p>
                </div>
                <div className="h-px bg-[#E5E7EB]" />
            </div>

            <Card className="bg-[#FFFFFF] border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.04)] rounded-xl">
                <div className="p-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-4 bg-[#F3F7F6] p-1 rounded-lg">
                            <TabsTrigger
                                value="analytics"
                                className={
                                    activeTab === "analytics"
                                        ? "bg-[#E8F5E9] text-[#2E7D32] data-[state=active]:bg-[#E8F5E9] data-[state=active]:text-[#2E7D32]"
                                        : "data-[state=active]:bg-[#E8F5E9] data-[state=active]:text-[#2E7D32]"
                                }
                            >
                                {t('partner_management.tabs.analytics')}
                            </TabsTrigger>
                            <TabsTrigger
                                value="approved"
                                className={
                                    activeTab === "approved"
                                        ? "bg-[#E8F5E9] text-[#2E7D32] data-[state=active]:bg-[#E8F5E9] data-[state=active]:text-[#2E7D32]"
                                        : "data-[state=active]:bg-[#E8F5E9] data-[state=active]:text-[#2E7D32]"
                                }
                            >
                                {t('partner_management.tabs.approved')}
                            </TabsTrigger>
                            <TabsTrigger
                                value="non-approved"
                                className={
                                    activeTab === "non-approved"
                                        ? "bg-[#E8F5E9] text-[#2E7D32] data-[state=active]:bg-[#E8F5E9] data-[state=active]:text-[#2E7D32]"
                                        : "data-[state=active]:bg-[#E8F5E9] data-[state=active]:text-[#2E7D32]"
                                }
                            >
                                <div className="flex items-center gap-2">
                                    <span>{t('partner_management.tabs.non_approved')}</span>
                                    {nonApprovedCount > 0 && !loadingCount && (
                                        <Badge className="bg-red-500 hover:bg-red-600 text-white rounded-full px-2 py-0.5 text-xs font-bold">
                                            {nonApprovedCount}
                                        </Badge>
                                    )}
                                </div>
                            </TabsTrigger>
                            <TabsTrigger
                                value="rejected"
                                className={
                                    activeTab === "rejected"
                                        ? "bg-[#E8F5E9] text-[#2E7D32] data-[state=active]:bg-[#E8F5E9] data-[state=active]:text-[#2E7D32]"
                                        : "data-[state=active]:bg-[#E8F5E9] data-[state=active]:text-[#2E7D32]"
                                }
                            >
                                {t('partner_management.tabs.rejected')}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="analytics" className="mt-6">
                            <EarningsAnalyticsTab />
                        </TabsContent>

                        <TabsContent value="approved" className="mt-6">
                            <ApprovedPartnersTab />
                        </TabsContent>

                        <TabsContent value="non-approved" className="mt-6">
                            <NonApprovedPartnersTab />
                        </TabsContent>

                        <TabsContent value="rejected" className="mt-6">
                            <RejectedPartnersTab />
                        </TabsContent>
                    </Tabs>
                </div>
            </Card>
        </div>
    );
}
