import { useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/api/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ImportIssue {
  row: number;
  product: string;
  message: string;
}

interface ImportReport {
  summary: {
    totalRows: number;
    products: number;
    toCreate: number;
    toUpdate: number;
    variantsToCreate: number;
    variantsToUpdate: number;
    skipped: number;
    withErrors: number;
  };
  errors: ImportIssue[];
  errorCount: number;
  warnings: ImportIssue[];
  preview: { row: number; name: string; action: string; variants: number }[];
  result?: {
    created: number;
    updated: number;
    variantsCreated: number;
    variantsUpdated: number;
    failed: ImportIssue[];
  };
}

interface ProductImportDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onImported: () => void;
}

const MODES = [
  { value: "both", label: "Add new products and update existing ones" },
  { value: "create", label: "Only add new products (leave existing ones alone)" },
  { value: "update", label: "Only update existing products (do not add new)" },
];

// Errors come back as a Blob/JSON/axios error: show the server's own message
const messageFrom = (error: any, fallback: string) =>
  error?.response?.data?.message || error?.message || fallback;

export function ProductImportDialog({
  open,
  setOpen,
  onImported,
}: ProductImportDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState("both");
  const [report, setReport] = useState<ImportReport | null>(null);
  const [checking, setChecking] = useState(false);
  const [importing, setImporting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const busy = checking || importing;
  const finished = Boolean(report?.result);

  const reset = () => {
    setFile(null);
    setReport(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const close = () => {
    if (busy) return;
    setOpen(false);
    reset();
    setMode("both");
  };

  const downloadTemplate = async () => {
    setDownloading(true);
    try {
      const response = await api.get("/api/admin/products/import/template", {
        responseType: "blob",
      });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = "product-import-template.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Could not download the template");
    } finally {
      setDownloading(false);
    }
  };

  const send = async (dryRun: boolean) => {
    if (!file) return null;
    const body = new FormData();
    body.append("file", file);
    body.append("mode", mode);
    body.append("dryRun", String(dryRun));
    const response = await api.post("/api/admin/products/import", body, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 0, // large files can take a while
    });
    return response.data?.data as ImportReport;
  };

  const check = async () => {
    setChecking(true);
    setReport(null);
    try {
      setReport(await send(true));
    } catch (error) {
      toast.error(messageFrom(error, "Could not check the file"));
    } finally {
      setChecking(false);
    }
  };

  const runImport = async () => {
    setImporting(true);
    try {
      const done = await send(false);
      if (done) {
        setReport(done);
        const saved = (done.result?.created ?? 0) + (done.result?.updated ?? 0);
        toast.success(`${saved} product(s) saved`);
        onImported();
      }
    } catch (error) {
      toast.error(messageFrom(error, "Import failed"));
    } finally {
      setImporting(false);
    }
  };

  const readyCount = (report?.summary.toCreate ?? 0) + (report?.summary.toUpdate ?? 0);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import products from Excel</DialogTitle>
          <DialogDescription>
            Add many products at once (or update them) from an Excel file. Images
            are not imported: add them to each product afterwards.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Step 1 */}
          <div className="rounded-md bg-[#F9FAFB] p-4 space-y-2">
            <p className="text-sm font-semibold">1. Download the template</p>
            <p className="text-xs text-[#6B7280]">
              It has an Instructions sheet, an empty Products sheet, an Example
              sheet and a Lists sheet with the exact category, brand and option
              names. One row = one variant. Required: Product Name and Price.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              disabled={downloading}
            >
              {downloading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="mr-2 h-4 w-4" />
              )}
              Download template (.xlsx)
            </Button>
            <p className="text-xs text-[#6B7280]">
              To update products already in the store, use Export, edit the file
              and import it back.
            </p>
          </div>

          {/* Step 2 */}
          <div className="space-y-3">
            <p className="text-sm font-semibold">2. Choose your filled file</p>
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.csv"
                className="text-sm"
                disabled={busy || finished}
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null);
                  setReport(null);
                }}
              />
            </div>
            <select
              className="rounded-md border border-[#E5E7EB] bg-white px-3 py-1.5 text-sm w-full"
              value={mode}
              disabled={busy || finished}
              onChange={(e) => {
                setMode(e.target.value);
                setReport(null);
              }}
            >
              {MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            {!finished && (
              <Button onClick={check} disabled={!file || busy}>
                {checking ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {checking ? "Checking..." : "Check file"}
              </Button>
            )}
            <p className="text-xs text-[#9CA3AF]">
              "Check file" saves nothing. You see the result first and decide.
            </p>
          </div>

          {/* Check report */}
          {report && !report.result && (
            <div className="space-y-3 rounded-md border border-[#E5E7EB] p-4">
              <p className="text-sm font-semibold">3. Check result</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <Stat label="New products" value={report.summary.toCreate} tone="green" />
                <Stat label="To update" value={report.summary.toUpdate} tone="blue" />
                <Stat label="With mistakes" value={report.summary.withErrors} tone="red" />
                <Stat label="Skipped" value={report.summary.skipped} tone="gray" />
              </div>
              <p className="text-xs text-[#6B7280]">
                {report.summary.totalRows} rows read &middot;{" "}
                {report.summary.variantsToCreate} new variant(s),{" "}
                {report.summary.variantsToUpdate} variant(s) to update.
                Products with mistakes are skipped; the others will be saved.
              </p>

              {report.errors.length > 0 && (
                <IssueList
                  title={`Mistakes to fix in Excel (${report.errorCount})`}
                  issues={report.errors}
                  tone="red"
                />
              )}
              {report.warnings.length > 0 && (
                <IssueList
                  title={`Notes (${report.warnings.length})`}
                  issues={report.warnings}
                  tone="amber"
                />
              )}
              {readyCount === 0 && (
                <p className="flex items-center gap-2 text-sm text-[#B91C1C]">
                  <AlertTriangle className="h-4 w-4" />
                  Nothing can be imported yet. Fix the mistakes, save the file and
                  check it again.
                </p>
              )}
            </div>
          )}

          {/* Import result */}
          {report?.result && (
            <div className="space-y-3 rounded-md border border-[#BBF7D0] bg-[#F0FDF4] p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-[#15803D]">
                <CheckCircle2 className="h-4 w-4" />
                Import finished
              </p>
              <p className="text-sm">
                {report.result.created} product(s) added, {report.result.updated}{" "}
                updated ({report.result.variantsCreated} variant(s) added,{" "}
                {report.result.variantsUpdated} updated).
              </p>
              {report.summary.withErrors > 0 && (
                <p className="text-sm text-[#B45309]">
                  {report.summary.withErrors} product(s) were skipped because of
                  mistakes. Fix them in Excel and import the file again: the
                  products that are already saved will simply be updated.
                </p>
              )}
              {report.result.failed.length > 0 && (
                <IssueList
                  title="Not saved"
                  issues={report.result.failed}
                  tone="red"
                />
              )}
              <p className="text-xs text-[#6B7280]">
                Now open the new products and add their images.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={close} disabled={busy}>
            {finished ? "Close" : "Cancel"}
          </Button>
          {finished ? (
            <Button onClick={reset}>Import another file</Button>
          ) : (
            report && (
              <Button onClick={runImport} disabled={busy || readyCount === 0}>
                {importing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {importing ? "Importing..." : `Import ${readyCount} product(s)`}
              </Button>
            )
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "green" | "blue" | "red" | "gray";
}) {
  const colors = {
    green: "bg-[#F0FDF4] text-[#15803D]",
    blue: "bg-[#EFF6FF] text-[#1D4ED8]",
    red: "bg-[#FEF2F2] text-[#B91C1C]",
    gray: "bg-[#F3F4F6] text-[#4B5563]",
  };
  return (
    <div className={`rounded-md px-2 py-2 ${colors[tone]}`}>
      <div className="text-xl font-semibold">{value}</div>
      <div className="text-xs">{label}</div>
    </div>
  );
}

function IssueList({
  title,
  issues,
  tone,
}: {
  title: string;
  issues: ImportIssue[];
  tone: "red" | "amber";
}) {
  const color = tone === "red" ? "text-[#B91C1C]" : "text-[#B45309]";
  return (
    <div>
      <p className={`text-sm font-medium ${color}`}>{title}</p>
      <ul className="mt-1 max-h-48 overflow-y-auto space-y-1 text-xs text-[#374151]">
        {issues.map((issue, index) => (
          <li key={`${issue.row}-${index}`}>
            <span className="font-medium">Row {issue.row}</span>
            {issue.product ? ` (${issue.product})` : ""}: {issue.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
