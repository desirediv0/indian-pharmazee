import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Search,
  Trash2,
  Eye,
  ExternalLink,
  RefreshCw,
  Phone,
  Mail,
  Calendar,
  Clock,
  AlertCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { prescriptionService } from "@/api/adminService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PrescriptionItem {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
  fileUrl: string;
  fileType: string;
  originalName?: string | null;
  fileSize?: number | null;
  status: "PENDING" | "REVIEWED" | "COMPLETED";
  createdAt: string;
}

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Preview & Delete Modal state
  const [previewItem, setPreviewItem] = useState<PrescriptionItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPrescriptions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await prescriptionService.getPrescriptions({
        page,
        limit: 10,
        search,
        status: statusFilter,
      });

      if (res.data?.success) {
        setPrescriptions(res.data.data.prescriptions || []);
        setTotalPages(res.data.data.pagination?.totalPages || 1);
        setTotalCount(res.data.data.pagination?.total || 0);
      }
    } catch (error: any) {
      console.error("Error fetching prescriptions:", error);
      toast.error(error?.response?.data?.message || "Failed to load prescriptions");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await prescriptionService.updateStatus(id, newStatus);
      if (res.data?.success) {
        toast.success(`Status updated to ${newStatus}`);
        setPrescriptions((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: newStatus as any } : item))
        );
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      const res = await prescriptionService.deletePrescription(deleteId);
      if (res.data?.success) {
        toast.success("Prescription deleted and media storage cleared");
        setPrescriptions((prev) => prev.filter((item) => item.id !== deleteId));
        setTotalCount((prev) => Math.max(0, prev - 1));
        if (previewItem?.id === deleteId) {
          setPreviewItem(null);
        }
      }
    } catch (error: any) {
      console.error("Delete prescription error:", error);
      toast.error(error?.response?.data?.message || "Failed to delete prescription");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return "N/A";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">Completed</Badge>;
      case "REVIEWED":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Reviewed</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-800 border-amber-300">Pending</Badge>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <FileText className="h-7 w-7 text-emerald-600" />
            Uploaded Prescriptions
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage customer uploaded prescriptions, preview documents, and clean up storage.
          </p>
        </div>
        <Button
          onClick={fetchPrescriptions}
          variant="outline"
          className="flex items-center gap-2 shrink-0 border-slate-300 hover:bg-slate-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by customer name, phone, or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 text-sm border-slate-300 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="REVIEWED">Reviewed</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Prescriptions Table Card */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-200 py-3.5 px-6 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold text-slate-700">
            Prescription Submissions ({totalCount})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-slate-500 space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent mx-auto" />
              <p className="text-sm font-medium">Loading uploaded prescriptions...</p>
            </div>
          ) : prescriptions.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <FileText className="h-12 w-12 text-slate-300 mx-auto" />
              <p className="text-base font-semibold text-slate-700">No prescriptions found</p>
              <p className="text-xs text-slate-400">
                {search || statusFilter
                  ? "Try clearing your search query or filter"
                  : "Customer submitted prescriptions will appear here."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100/70 text-slate-600 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-6">Customer Details</th>
                    <th className="py-3.5 px-4">Format & Size</th>
                    <th className="py-3.5 px-4">Notes</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Submission Date</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {prescriptions.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-900">{item.name}</div>
                        <div className="flex items-center gap-1.5 text-xs text-emerald-700 mt-0.5">
                          <Phone className="h-3 w-3 shrink-0" />
                          <a href={`tel:${item.phone}`} className="hover:underline font-mono">
                            {item.phone}
                          </a>
                        </div>
                        {item.email && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span>{item.email}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 text-[11px] font-bold rounded uppercase tracking-wider ${
                              item.fileType?.toUpperCase() === "PDF"
                                ? "bg-red-100 text-red-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {item.fileType?.toUpperCase() || "IMAGE"}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">
                            {formatFileSize(item.fileSize)}
                          </span>
                        </div>
                        {item.originalName && (
                          <div className="text-[11px] text-slate-400 truncate max-w-[150px] mt-1" title={item.originalName}>
                            {item.originalName}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 max-w-xs">
                        {item.notes ? (
                          <p className="text-xs text-slate-700 line-clamp-2 italic" title={item.notes}>
                            "{item.notes}"
                          </p>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5">
                          {getStatusBadge(item.status)}
                          <select
                            value={item.status}
                            onChange={(e) => handleStatusChange(item.id, e.target.value)}
                            className="text-xs font-semibold px-2 py-1 border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          >
                            <option value="PENDING">Pending</option>
                            <option value="REVIEWED">Reviewed</option>
                            <option value="COMPLETED">Completed</option>
                          </select>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-xs text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          <span>{new Date(item.createdAt).toLocaleDateString("en-IN")}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(item.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPreviewItem(item)}
                            className="h-8 text-xs border-slate-300 hover:bg-slate-100 flex items-center gap-1"
                          >
                            <Eye className="h-3.5 w-3.5 text-slate-600" />
                            View
                          </Button>

                          <a
                            href={item.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-8 px-2.5 inline-flex items-center justify-center text-xs border border-slate-300 rounded-md hover:bg-slate-100 text-slate-700 transition-colors"
                            title="Open in new tab"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeleteId(item.id)}
                            className="h-8 px-2.5 bg-red-600 hover:bg-red-700 text-white"
                            title="Delete prescription & clear storage"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
              <span className="text-xs text-slate-500">
                Page {page} of {totalPages} ({totalCount} total)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  className="text-xs border-slate-300"
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  className="text-xs border-slate-300"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-400" />
                  Prescription Preview: {previewItem.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Phone: {previewItem.phone} {previewItem.email ? `| Email: ${previewItem.email}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewItem.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Open original file"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  onClick={() => setPreviewItem(null)}
                  className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1 bg-slate-100 flex flex-col items-center justify-center min-h-[400px]">
              {previewItem.fileType?.toUpperCase() === "PDF" ? (
                <iframe
                  src={previewItem.fileUrl}
                  className="w-full h-[550px] border border-slate-300 rounded bg-white"
                  title="Prescription PDF"
                />
              ) : (
                <img
                  src={previewItem.fileUrl}
                  alt="Prescription Scan"
                  className="max-w-full max-h-[550px] object-contain rounded border border-slate-200 shadow"
                />
              )}
            </div>

            <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <div>
                {previewItem.notes && (
                  <span>
                    <strong className="text-slate-800">Notes:</strong> "{previewItem.notes}"
                  </span>
                )}
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setDeleteId(previewItem.id);
                }}
                className="h-8 bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Delete Prescription
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-6 space-y-4 border border-slate-200">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Delete Prescription?</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Are you sure you want to delete this prescription record? This will permanently delete both the record from the database and the uploaded media file from cloud storage.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="border-slate-300"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleting ? "Deleting & Cleaning..." : "Yes, Delete & Clear Storage"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
