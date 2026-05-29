import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import axios from "axios";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const API_URL = import.meta.env.VITE_API_URL;

type RejectedPartner = {
    id: string;
    name: string;
    email: string;
    number: string;
    status: "REJECTED";
    message: string;
    createdAt: string;
    city?: string;
    state?: string;
};

export default function RejectedPartnersTab() {
    const { t } = useLanguage();
    const [partners, setPartners] = useState<RejectedPartner[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Details dialog state
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
    const [selectedPartner, setSelectedPartner] = useState<RejectedPartner | null>(null);

    useEffect(() => {
        async function fetchRejectedPartners() {
            try {
                setLoading(true);
                setError("");
                const response = await axios.get(`${API_URL}/api/admin/partners/requests`, {
                    params: { status: "REJECTED" },
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
                    },
                });
                setPartners(response.data.data.requests || []);
            } catch (err) {
                console.error("Failed to fetch rejected partners:", err);
                setError(t("partner_management.error.load_failed"));
                setPartners([]);
            } finally {
                setLoading(false);
            }
        }

        fetchRejectedPartners();
    }, [t]);

    const openDetailsDialog = (partner: RejectedPartner) => {
        setSelectedPartner(partner);
        setDetailsDialogOpen(true);
    };

    if (loading) {
        return <div className="text-center py-8">{t("partners_tab.common.loading")}</div>;
    }

    if (error) {
        return (
            <Alert className="border-red-200 bg-red-50">
                <AlertTitle className="text-red-800">{"Error"}</AlertTitle>
                <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
        );
    }

    if (partners.length === 0) {
        return <div className="text-center py-8 text-gray-500">{t("partners_tab.rejected.no_requests")}</div>;
    }

    return (
        <div className="space-y-4">
            <div className="rounded-lg border border-gray-200">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-gray-700">{t("partners_tab.common.name")}</TableHead>
                            <TableHead className="text-gray-700">{t("partners_tab.common.email")}</TableHead>
                            <TableHead className="text-gray-700">{t("partners_tab.common.number")}</TableHead>
                            <TableHead className="text-gray-700">{t("partners_tab.rejected.applied_date")}</TableHead>
                            <TableHead className="text-right">{t("partners_tab.common.actions")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {partners.map((partner) => (
                            <TableRow key={partner.id}>
                                <TableCell className="font-medium">{partner.name}</TableCell>
                                <TableCell>{partner.email}</TableCell>
                                <TableCell>{partner.number}</TableCell>
                                <TableCell>{formatDate(partner.createdAt)}</TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        className="text-blue-600 hover:text-blue-700"
                                        onClick={() => openDetailsDialog(partner)}
                                    >
                                        {t("partners_tab.rejected.details")}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Details Dialog */}
            <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t("partners_tab.rejected.app_details")}</DialogTitle>
                        <DialogDescription>
                            {selectedPartner && t("partners_tab.rejected.app_details_desc", { name: selectedPartner.name })}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedPartner && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium">{t("partners_tab.common.name")}</label>
                                <p className="text-sm text-gray-700">{selectedPartner.name}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">{t("partners_tab.common.email")}</label>
                                <p className="text-sm text-gray-700">{selectedPartner.email}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">{t("partners_tab.common.number")}</label>
                                <p className="text-sm text-gray-700">{selectedPartner.number}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">{t("partners_tab.rejected.city")}</label>
                                <p className="text-sm text-gray-700">{selectedPartner.city || t("partners_tab.common.unknown")}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">{t("partners_tab.rejected.state")}</label>
                                <p className="text-sm text-gray-700">{selectedPartner.state || t("partners_tab.common.unknown")}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">{t("partners_tab.rejected.applied_date")}</label>
                                <p className="text-sm text-gray-700">{formatDate(selectedPartner.createdAt)}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">{t("partner_management.registrations.message")}</label>
                                <p className="text-sm text-gray-700">{selectedPartner.message || t("partners_tab.rejected.no_message")}</p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">{t("partners_tab.common.close")}</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
