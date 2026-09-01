import { useState, useEffect, useCallback, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  MoreHorizontal,
  Eye,
  Trash2,
  MessageSquare,
  Search,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  X,
  ExternalLink,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useLanguage } from "@/context/LanguageContext";
import {
  contactService,
  type ContactSubmission,
} from "@/api/adminService";

const updateStatusSchema = z.object({
  status: z.enum(["NEW", "IN_PROGRESS", "RESOLVED", "SPAM"]),
  notes: z.string().optional(),
});

type StatusType = "NEW" | "IN_PROGRESS" | "RESOLVED" | "SPAM";

const ContactManagementPage = () => {
  const { t } = useLanguage();
  const [, startTransition] = useTransition();

  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusCounts, setStatusCounts] = useState<{
    total?: number;
    all?: number;
    new?: number;
    inProgress?: number;
    resolved?: number;
    spam?: number;
  }>({});

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] =
    useState<ContactSubmission | null>(null);

  const statusLabels: Record<string, string> = {
    NEW: t("contact_management.status.new") || "New",
    IN_PROGRESS: t("contact_management.status.in_progress") || "In Progress",
    RESOLVED: t("contact_management.status.resolved") || "Resolved",
    SPAM: t("contact_management.status.spam") || "Spam",
  };

  const updateForm = useForm<z.infer<typeof updateStatusSchema>>({
    resolver: zodResolver(updateStatusSchema),
    defaultValues: {
      status: "NEW",
      notes: "",
    },
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        setDebouncedSearch(searchQuery);
        setPage(1);
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchSubmissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await contactService.getSubmissions({
        page,
        limit: 10,
        status: selectedStatus || undefined,
        search: debouncedSearch ? debouncedSearch.trim() : undefined,
      });

      const responseData = response.data?.data;
      if (responseData) {
        setSubmissions(responseData.submissions || []);
        setTotalPages(responseData.pagination?.totalPages || 1);
        setTotalSubmissions(responseData.pagination?.totalSubmissions || 0);
        if (responseData.counts) {
          setStatusCounts(responseData.counts);
        }
      } else {
        setSubmissions([]);
      }
    } catch (error: any) {
      console.error("Error fetching contact submissions:", error);
      setSubmissions([]);
      toast.error(
        error?.response?.data?.message ||
          t("contact_management.messages.fetch_error") ||
          "Failed to fetch contact submissions"
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, selectedStatus, debouncedSearch, t]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value === "ALL" ? null : value);
    setPage(1);
  };

  const handleViewSubmission = (submission: ContactSubmission) => {
    setSelectedSubmission(submission);
    setViewDialogOpen(true);
  };

  const handleUpdateStatus = (submission: ContactSubmission) => {
    setSelectedSubmission(submission);
    updateForm.setValue("status", submission.status);
    updateForm.setValue("notes", submission.notes || "");
    setUpdateDialogOpen(true);
  };

  const confirmDelete = (submission: ContactSubmission) => {
    setSelectedSubmission(submission);
    setDeleteDialogOpen(true);
  };

  const handleDeleteSubmission = async () => {
    if (!selectedSubmission) return;

    try {
      setActionLoading(true);
      await contactService.deleteSubmission(selectedSubmission.id);

      toast.success(
        t("contact_management.messages.delete_success") ||
          "Contact submission deleted successfully"
      );

      setDeleteDialogOpen(false);
      setSelectedSubmission(null);
      fetchSubmissions();
    } catch (error: any) {
      console.error("Error deleting contact submission:", error);
      toast.error(
        error?.response?.data?.message ||
          t("contact_management.messages.delete_error") ||
          "Failed to delete contact submission"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateSubmission = async (
    values: z.infer<typeof updateStatusSchema>
  ) => {
    if (!selectedSubmission) return;

    try {
      setActionLoading(true);
      await contactService.updateStatus(selectedSubmission.id, {
        status: values.status,
        notes: values.notes,
      });

      toast.success(
        t("contact_management.messages.update_success") ||
          "Contact submission updated successfully"
      );

      setUpdateDialogOpen(false);
      setSelectedSubmission(null);
      fetchSubmissions();
    } catch (error: any) {
      console.error("Error updating contact submission:", error);
      toast.error(
        error?.response?.data?.message ||
          t("contact_management.messages.update_error") ||
          "Failed to update contact submission"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: StatusType | string) => {
    switch (status) {
      case "NEW":
        return (
          <Badge className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-xs font-medium">
            {statusLabels.NEW}
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge className="bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 text-xs font-medium">
            {statusLabels.IN_PROGRESS}
          </Badge>
        );
      case "RESOLVED":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-medium">
            {statusLabels.RESOLVED}
          </Badge>
        );
      case "SPAM":
        return (
          <Badge className="bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 text-xs font-medium">
            {statusLabels.SPAM}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            {status}
          </Badge>
        );
    }
  };

  const statusTabButtons = [
    { value: "ALL", label: t("contact_management.all_status") || "All", count: statusCounts.all ?? totalSubmissions },
    { value: "NEW", label: statusLabels.NEW, count: statusCounts.new },
    { value: "IN_PROGRESS", label: statusLabels.IN_PROGRESS, count: statusCounts.inProgress },
    { value: "RESOLVED", label: statusLabels.RESOLVED, count: statusCounts.resolved },
    { value: "SPAM", label: statusLabels.SPAM, count: statusCounts.spam },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            {t("contact_management.title") || "Contact Management"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {t("contact_management.description") ||
              "Manage customer inquiries and contact form submissions"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchSubmissions()}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Quick Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {statusTabButtons.map((tab) => {
          const isSelected =
            (tab.value === "ALL" && !selectedStatus) ||
            selectedStatus === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => handleStatusChange(tab.value)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                isSelected
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filters Bar */}
      <Card className="bg-white border-gray-200 shadow-sm rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder={
                  t("contact_management.search_placeholder") ||
                  "Search by name, email, subject..."
                }
                className="pl-9 pr-8 border-gray-200 focus-visible:ring-1"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Select
              value={selectedStatus || "ALL"}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-full sm:w-[200px] border-gray-200">
                <SelectValue
                  placeholder={
                    t("contact_management.filter_status") || "Filter by status"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  {t("contact_management.all_status") || "All Status"}
                </SelectItem>
                <SelectItem value="NEW">{statusLabels.NEW}</SelectItem>
                <SelectItem value="IN_PROGRESS">
                  {statusLabels.IN_PROGRESS}
                </SelectItem>
                <SelectItem value="RESOLVED">{statusLabels.RESOLVED}</SelectItem>
                <SelectItem value="SPAM">{statusLabels.SPAM}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Submissions List */}
      <Card className="bg-white border-gray-200 shadow-sm rounded-xl overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="flex flex-col items-center">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-3 text-sm text-gray-500">
                  {t("contact_management.loading") || "Loading submissions..."}
                </p>
              </div>
            </div>
          ) : !submissions || submissions.length === 0 ? (
            <div className="flex items-center justify-center py-16 px-4">
              <div className="text-center max-w-sm">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 mb-3">
                  <MessageSquare className="h-7 w-7 text-gray-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  {t("contact_management.no_submissions") ||
                    "No contact submissions found"}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500">
                  {searchQuery || selectedStatus
                    ? "Try adjusting your filters or search terms"
                    : t("contact_management.no_submissions_desc") ||
                      "Contact form submissions will appear here"}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-100">
                {submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="p-4 sm:p-5 hover:bg-gray-50/80 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0 font-semibold text-sm">
                          {submission.name ? submission.name.charAt(0).toUpperCase() : "C"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                              {submission.name}
                            </h3>
                            {getStatusBadge(submission.status)}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
                            <a
                              href={`mailto:${submission.email}`}
                              className="flex items-center gap-1 hover:text-primary hover:underline"
                            >
                              <Mail className="h-3 w-3" />
                              <span className="truncate max-w-[200px]">
                                {submission.email}
                              </span>
                            </a>
                            {submission.phone && (
                              <a
                                href={`tel:${submission.phone}`}
                                className="flex items-center gap-1 hover:text-primary"
                              >
                                <Phone className="h-3 w-3" />
                                <span>{submission.phone}</span>
                              </a>
                            )}
                            <span className="flex items-center gap-1 text-gray-400">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(submission.createdAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>

                          {submission.subject && (
                            <p className="text-xs font-medium text-gray-700 mt-2 truncate">
                              <span className="text-gray-400 mr-1">Subject:</span>
                              {submission.subject}
                            </p>
                          )}

                          <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2 bg-gray-50 p-2 rounded-md border border-gray-100">
                            {submission.message}
                          </p>

                          {submission.notes && (
                            <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded mt-2 border border-amber-100">
                              <span className="font-medium">Admin Note:</span>{" "}
                              {submission.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 flex-shrink-0 self-end sm:self-start">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs"
                          onClick={() => handleViewSubmission(submission)}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          <span>View</span>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-500 hover:text-gray-900"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                              onClick={() => handleViewSubmission(submission)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              {t("contact_management.actions.view_details") ||
                                "View Details"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(submission)}
                            >
                              <MessageSquare className="mr-2 h-4 w-4" />
                              {t("contact_management.actions.update_status") ||
                                "Update Status"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => confirmDelete(submission)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t("contact_management.actions.delete") || "Delete"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-100 px-4 sm:px-6 py-3 gap-3">
                <div className="text-xs sm:text-sm text-gray-500">
                  {t("contact_management.page") || "Page"} {page}{" "}
                  {t("contact_management.of") || "of"} {totalPages} (
                  {totalSubmissions} total)
                </div>
                {totalPages > 1 && (
                  <Pagination className="justify-end w-auto mx-0">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                          className={
                            page <= 1
                              ? "pointer-events-none opacity-40 cursor-not-allowed"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let pageNum = i + 1;
                        if (totalPages > 5 && page > 3) {
                          pageNum = page - 2 + i;
                          if (pageNum > totalPages) {
                            pageNum = totalPages - (4 - i);
                          }
                        }
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => setPage(pageNum)}
                              isActive={pageNum === page}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            setPage((prev) =>
                              prev < totalPages ? prev + 1 : prev
                            )
                          }
                          className={
                            page >= totalPages
                              ? "pointer-events-none opacity-40 cursor-not-allowed"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900">
              {t("contact_management.view_dialog.title") ||
                "Contact Submission Details"}
            </DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4 py-2 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div>
                  <p className="text-xs text-gray-400">
                    {t("contact_management.view_dialog.name") || "Name"}
                  </p>
                  <p className="font-semibold text-gray-900 mt-0.5">
                    {selectedSubmission.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">
                    {t("contact_management.view_dialog.email") || "Email"}
                  </p>
                  <a
                    href={`mailto:${selectedSubmission.email}`}
                    className="font-medium text-primary hover:underline mt-0.5 flex items-center gap-1"
                  >
                    {selectedSubmission.email}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div>
                  <p className="text-xs text-gray-400">
                    {t("contact_management.view_dialog.phone") || "Phone"}
                  </p>
                  {selectedSubmission.phone ? (
                    <a
                      href={`tel:${selectedSubmission.phone}`}
                      className="font-medium text-primary hover:underline mt-0.5 inline-block"
                    >
                      {selectedSubmission.phone}
                    </a>
                  ) : (
                    <p className="text-gray-500 mt-0.5">
                      {t("contact_management.view_dialog.not_provided") ||
                        "Not provided"}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-400">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedSubmission.status)}</div>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">
                  {t("contact_management.view_dialog.subject") || "Subject"}
                </p>
                <p className="font-medium text-gray-900 bg-gray-50 p-2.5 rounded-md border border-gray-100">
                  {selectedSubmission.subject ||
                    t("contact_management.view_dialog.no_subject") ||
                    "No subject"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">
                  {t("contact_management.view_dialog.message") || "Message"}
                </p>
                <div className="p-3 bg-gray-50 rounded-md border border-gray-100 whitespace-pre-wrap text-gray-700 text-xs sm:text-sm max-h-56 overflow-y-auto">
                  {selectedSubmission.message}
                </div>
              </div>

              {selectedSubmission.notes && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    {t("contact_management.view_dialog.admin_notes") ||
                      "Admin Notes"}
                  </p>
                  <div className="p-3 bg-amber-50 rounded-md border border-amber-200 text-amber-900 text-xs whitespace-pre-wrap">
                    {selectedSubmission.notes}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-500 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                  <span>
                    {t("contact_management.view_dialog.submitted") || "Submitted"}:{" "}
                    {new Date(selectedSubmission.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                  <span>
                    {t("contact_management.view_dialog.last_updated") ||
                      "Updated"}:{" "}
                    {new Date(selectedSubmission.updatedAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewDialogOpen(false);
                    setSelectedSubmission(null);
                  }}
                >
                  {t("contact_management.view_dialog.close") || "Close"}
                </Button>
                <Button
                  onClick={() => {
                    setViewDialogOpen(false);
                    handleUpdateStatus(selectedSubmission);
                  }}
                >
                  {t("contact_management.view_dialog.update") || "Update Status"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900">
              {t("contact_management.update_dialog.title") ||
                "Update Submission Status"}
            </DialogTitle>
          </DialogHeader>
          <Form {...updateForm}>
            <form
              onSubmit={updateForm.handleSubmit(handleUpdateSubmission)}
              className="space-y-4 py-2"
            >
              <FormField
                control={updateForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-gray-700">
                      {t("contact_management.update_dialog.status_label") ||
                        "Status"}
                    </FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              t(
                                "contact_management.update_dialog.select_status"
                              ) || "Select a status"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NEW">{statusLabels.NEW}</SelectItem>
                          <SelectItem value="IN_PROGRESS">
                            {statusLabels.IN_PROGRESS}
                          </SelectItem>
                          <SelectItem value="RESOLVED">
                            {statusLabels.RESOLVED}
                          </SelectItem>
                          <SelectItem value="SPAM">{statusLabels.SPAM}</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={updateForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-gray-700">
                      {t("contact_management.update_dialog.notes_label") ||
                        "Admin Notes"}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={
                          t(
                            "contact_management.update_dialog.notes_placeholder"
                          ) || "Add internal notes or follow-up details..."
                        }
                        rows={4}
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  disabled={actionLoading}
                  onClick={() => {
                    setUpdateDialogOpen(false);
                    setSelectedSubmission(null);
                  }}
                >
                  {t("contact_management.update_dialog.cancel") || "Cancel"}
                </Button>
                <Button type="submit" disabled={actionLoading}>
                  {actionLoading ? "Updating..." : t("contact_management.update_dialog.update") || "Update"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900">
              {t("contact_management.delete_dialog.title") ||
                "Delete Contact Submission"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-3 text-sm text-gray-600">
            <p>
              {t("contact_management.delete_dialog.desc") ||
                "Are you sure you want to delete this contact submission from"}{" "}
              <span className="font-semibold text-gray-900">
                {selectedSubmission?.name}
              </span>
              ? This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button
              variant="outline"
              disabled={actionLoading}
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedSubmission(null);
              }}
            >
              {t("contact_management.update_dialog.cancel") || "Cancel"}
            </Button>
            <Button
              variant="destructive"
              disabled={actionLoading}
              onClick={handleDeleteSubmission}
            >
              {actionLoading
                ? "Deleting..."
                : t("contact_management.delete_dialog.confirm") || "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContactManagementPage;
