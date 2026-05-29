import { useEffect, useState, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import axios from "axios";
import { formatDate } from "@/lib/utils";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Copy, AlertTriangle } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

type PendingPartner = {
    id: string;
    name: string;
    email: string;
    number: string;
    status: "PENDING" | "REJECTED";
    message: string;
    createdAt: string;
    city?: string;
    state?: string;
};

export default function NonApprovedPartnersTab() {
    const { t } = useLanguage();
    const [partners, setPartners] = useState<PendingPartner[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Details dialog state
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
    const [selectedPartner, setSelectedPartner] = useState<PendingPartner | null>(null);

    // Message dialog state
    const [messageDialogOpen, setMessageDialogOpen] = useState(false);
    const [messagePartnerId, setMessagePartnerId] = useState<string | null>(null);
    const [messageText, setMessageText] = useState("");
    const [messageSending, setMessageSending] = useState(false);
    const [messageError, setMessageError] = useState("");

    // Approve dialog state
    const [approveDialogOpen, setApproveDialogOpen] = useState(false);
    const [approveId, setApproveId] = useState<string | null>(null);
    const [approveLoading, setApproveLoading] = useState(false);
    const [approveApiError, setApproveApiError] = useState("");
    const [customPassword, setCustomPassword] = useState("GenuineGrocery");
    const [passwordCopied, setPasswordCopied] = useState(false);

    // Success dialog after approval
    const [successDialogOpen, setSuccessDialogOpen] = useState(false);
    const [approvedPassword, setApprovedPassword] = useState("");
    const successInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        async function fetchNonApprovedPartners() {
            try {
                const res = await axios.get(`${API_URL}/api/admin/partners/requests`, {
                    params: { status: "PENDING" },
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
                    },
                });
                setPartners(res.data.data.requests || []);
            } catch {
                setError(t("reviews.messages.fetch_error"));
            }
            setLoading(false);
        }
        fetchNonApprovedPartners();
    }, []);

    const openDetailsDialog = (partner: PendingPartner) => {
        setSelectedPartner(partner);
        setDetailsDialogOpen(true);
    };

    const openApproveDialog = (id: string) => {
        setApproveId(id);
        setApproveApiError("");
        setCustomPassword("GenuineGrocery");
        setPasswordCopied(false);
        setApproveDialogOpen(true);
    };

    const closeApproveDialog = () => {
        setApproveDialogOpen(false);
        setApproveId(null);
        setApproveApiError("");
        setCustomPassword("GenuineGrocery");
    };

    const handleApprove = async () => {
        const passwordToSend = customPassword.trim().length >= 6 ? customPassword.trim() : "GenuineGrocery";

        setApproveLoading(true);
        setApproveApiError("");
        try {
            const response = await axios.post(
                `${API_URL}/api/admin/partners/requests/${approveId}/approve`,
                { password: passwordToSend },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
                    },
                }
            );
            // Remove from list since it's now approved
            setPartners(prev => prev.filter(p => p.id !== approveId));
            closeApproveDialog();

            // Show confirmed password from backend in a proper dialog
            const confirmedPassword = response.data.data?.demoPassword || passwordToSend;
            setApprovedPassword(confirmedPassword);
            setSuccessDialogOpen(true);
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setApproveApiError(err.response?.data?.message || t("partners_tab.non_approved.approve_error"));
            } else {
                setApproveApiError(t("partners_tab.non_approved.approve_error"));
            }
        } finally {
            setApproveLoading(false);
        }
    };

    const handleReject = async (id: string) => {
        if (!window.confirm(t("partners_tab.non_approved.confirm_reject"))) return;
        try {
            await axios.post(`${API_URL}/api/admin/partners/requests/${id}/reject`);
            setPartners(prev => prev.map(p => p.id === id ? { ...p, status: "REJECTED" as const } : p));
        } catch {
            alert(t("partners_tab.non_approved.reject_error"));
        }
    };

    const openMessageDialog = (partnerId: string) => {
        setMessagePartnerId(partnerId);
        setMessageText("");
        setMessageError("");
        setMessageDialogOpen(true);
    };

    const closeMessageDialog = () => {
        setMessageDialogOpen(false);
        setMessagePartnerId(null);
        setMessageText("");
        setMessageError("");
    };

    const handleSendMessage = async () => {
        if (!messageText.trim()) {
            setMessageError(t("partner_management.registrations.message_dialog.placeholder"));
            return;
        }
        if (!messagePartnerId) {
            setMessageError(t("partner_management.registrations.message_dialog.error"));
            return;
        }

        setMessageSending(true);
        setMessageError("");
        try {
            const res = await axios.post(
                `${API_URL}/api/admin/partners/${messagePartnerId}/message`,
                { message: messageText },
                { headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` } }
            );

            if (res?.data && res.data.success !== false) {
                alert(t("partner_management.registrations.message_dialog.success"));
                closeMessageDialog();
            } else {
                setMessageError(res?.data?.message || t("partner_management.registrations.message_dialog.error"));
            }
        } catch (err) {
            setMessageError(t("partner_management.registrations.message_dialog.error"));
        } finally {
            setMessageSending(false);
        }
    };

    if (loading) {
        return <div className="text-center py-10 text-muted-foreground">{t("partners_tab.common.loading")}</div>;
    }

    if (error) {
        return <div className="text-red-600 text-center py-10">{error}</div>;
    }

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t("partners_tab.common.name")}</TableHead>
                        <TableHead>{t("partners_tab.common.email")}</TableHead>
                        <TableHead>{t("partners_tab.common.number")}</TableHead>
                        <TableHead>{t("partners_tab.common.status")}</TableHead>
                        <TableHead>{t("partners_tab.common.monthly_earnings")}</TableHead>
                        <TableHead>{t("partners_tab.common.actions")}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {partners.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                {t("partners_tab.non_approved.no_requests")}
                            </TableCell>
                        </TableRow>
                    ) : partners.map((partner) => (
                        <TableRow key={partner.id}>
                            <TableCell>{partner.name}</TableCell>
                            <TableCell>{partner.email}</TableCell>
                            <TableCell>{partner.number}</TableCell>
                            <TableCell>
                                <Badge variant={partner.status === "PENDING" ? "secondary" : "destructive"}>
                                    {partner.status === "PENDING" ? t("reviews.status.pending") : t("reviews.status.rejected")}
                                </Badge>
                            </TableCell>
                            <TableCell>₹0.00</TableCell>
                            <TableCell>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => openDetailsDialog(partner)}
                                    >
                                        {t("partners_tab.common.details")}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => openMessageDialog(partner.id)}
                                    >
                                        {t("partner_management.registrations.actions.message")}
                                    </Button>
                                    {partner.status === "PENDING" && (
                                        <>
                                            <Button
                                                size="sm"
                                                variant="default"
                                                onClick={() => openApproveDialog(partner.id)}
                                            >
                                                {t("partners_tab.non_approved.accept")}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleReject(partner.id)}
                                            >
                                                {t("partners_tab.non_approved.decline")}
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {/* Details Dialog */}
            <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{t("partners_tab.non_approved.app_details")}</DialogTitle>
                        <DialogDescription>
                            {t("partners_tab.non_approved.app_details_desc", { name: selectedPartner?.name || t("partners_tab.common.unknown") })}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedPartner && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="font-semibold text-sm">{t("partners_tab.common.name")}:</label>
                                    <p className="text-sm">{selectedPartner.name}</p>
                                </div>
                                <div>
                                    <label className="font-semibold text-sm">{t("partners_tab.common.email")}:</label>
                                    <p className="text-sm">{selectedPartner.email}</p>
                                </div>
                                <div>
                                    <label className="font-semibold text-sm">{t("partners_tab.common.number")}:</label>
                                    <p className="text-sm">{selectedPartner.number}</p>
                                </div>
                                <div>
                                    <label className="font-semibold text-sm">{t("partners_tab.non_approved.applied_date")}:</label>
                                    <p className="text-sm">{formatDate(selectedPartner.createdAt)}</p>
                                </div>
                                {selectedPartner.city && (
                                    <div>
                                        <label className="font-semibold text-sm">{t("partners_tab.non_approved.city")}:</label>
                                        <p className="text-sm">{selectedPartner.city}</p>
                                    </div>
                                )}
                                {selectedPartner.state && (
                                    <div>
                                        <label className="font-semibold text-sm">{t("partners_tab.non_approved.state")}:</label>
                                        <p className="text-sm">{selectedPartner.state}</p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="font-semibold text-sm">{t("partners_tab.approved.message")}:</label>
                                <p className="text-sm bg-accent p-3 rounded mt-1">
                                    {selectedPartner.message || t("partners_tab.approved.no_desc")}
                                </p>
                            </div>

                            <div>
                                <label className="font-semibold text-sm">{t("partners_tab.common.status")}:</label>
                                <Badge
                                    variant={selectedPartner.status === "PENDING" ? "secondary" : "destructive"}
                                    className="ml-2"
                                >
                                    {selectedPartner.status === "PENDING" ? t("reviews.status.pending") : t("reviews.status.rejected")}
                                </Badge>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        {selectedPartner?.status === "PENDING" && (
                            <div className="flex gap-2 mr-auto">
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => {
                                        setDetailsDialogOpen(false);
                                        openApproveDialog(selectedPartner.id);
                                    }}
                                >
                                    {t("partners_tab.non_approved.accept")}
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                        setDetailsDialogOpen(false);
                                        handleReject(selectedPartner.id);
                                    }}
                                >
                                    {t("partners_tab.non_approved.decline")}
                                </Button>
                            </div>
                        )}
                        <DialogClose asChild>
                            <Button variant="outline">{t("partners_tab.common.close")}</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Approve Dialog */}
            <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t("partners_tab.non_approved.approve_title")}</DialogTitle>
                        <DialogDescription>
                            Set a demo password for this partner. They will log in with this password and be prompted to change it.
                        </DialogDescription>
                    </DialogHeader>

                    {approveApiError && (
                        <Alert variant="destructive" className="mb-2">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{approveApiError}</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Set Login Password for Partner</label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="text"
                                    value={customPassword}
                                    onChange={e => setCustomPassword(e.target.value)}
                                    placeholder="Min 6 characters"
                                    className="font-mono tracking-wider"
                                    disabled={approveLoading}
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    type="button"
                                    onClick={() => {
                                        navigator.clipboard.writeText(customPassword);
                                        setPasswordCopied(true);
                                        setTimeout(() => setPasswordCopied(false), 1500);
                                    }}
                                    title="Copy password"
                                    className="shrink-0"
                                >
                                    {passwordCopied
                                        ? <CheckCircle className="h-4 w-4 text-green-500" />
                                        : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                            {customPassword.trim().length > 0 && customPassword.trim().length < 6 && (
                                <p className="text-xs text-destructive mt-1.5">Password must be at least 6 characters.</p>
                            )}
                        </div>
                        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2.5">
                            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-500" />
                            <span>Note this password carefully. Share it with the partner after approval. They can change it after first login.</span>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            onClick={handleApprove}
                            disabled={approveLoading || customPassword.trim().length < 6}
                        >
                            {approveLoading ? t("partners_tab.non_approved.approving") : t("partners_tab.non_approved.approve_btn")}
                        </Button>
                        <DialogClose asChild>
                            <Button variant="outline" type="button" disabled={approveLoading}>
                                {t("partners_tab.common.cancel")}
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Success Dialog - shows confirmed password after approval */}
            <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span>Partner Approved Successfully</span>
                        </DialogTitle>
                        <DialogDescription>
                            Share the password below with the partner so they can log in.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-3">
                        <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">Login Password</p>
                        <div className="flex items-center gap-2">
                            <Input
                                ref={successInputRef}
                                value={approvedPassword}
                                readOnly
                                className="font-mono text-base font-bold bg-white border-green-300 text-green-900 tracking-widest"
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                className="shrink-0 border-green-300 text-green-700 hover:bg-green-100"
                                onClick={async () => {
                                    await navigator.clipboard.writeText(approvedPassword);
                                    setPasswordCopied(true);
                                    setTimeout(() => setPasswordCopied(false), 1500);
                                }}
                            >
                                {passwordCopied
                                    ? <CheckCircle className="h-4 w-4 text-green-600" />
                                    : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                        <div className="text-xs text-green-700 space-y-0.5">
                            <p>Partner dashboard: <strong>partner.indianpharmazee.com</strong></p>
                            <p>The partner can change this password after their first login.</p>
                        </div>
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="default" type="button" className="w-full sm:w-auto">Done</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Message Dialog */}
            <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t("partner_management.registrations.message_dialog.title")}</DialogTitle>
                        <DialogDescription>
                            {t("partner_management.registrations.message_dialog.description")}
                        </DialogDescription>
                    </DialogHeader>

                    {messageError && (
                        <Alert variant="destructive" className="mb-2">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{messageError}</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-4">
                        <Textarea
                            placeholder={t("partner_management.registrations.message_dialog.placeholder")}
                            value={messageText}
                            onChange={(e) => {
                                setMessageText(e.target.value);
                                setMessageError("");
                            }}
                            className="min-h-32"
                        />
                    </div>

                    <DialogFooter>
                        <Button onClick={handleSendMessage} disabled={messageSending}>
                            {messageSending ? t("partner_management.registrations.message_dialog.sending") : t("partner_management.registrations.message_dialog.send")}
                        </Button>
                        <DialogClose asChild>
                            <Button variant="outline" type="button" disabled={messageSending}>
                                {t("partners_tab.common.cancel")}
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
