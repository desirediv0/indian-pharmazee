import { useState } from "react";
import {
  ExternalLink,
  FileText,
  Loader2,
  MapPin,
  Send,
  Tag,
  Truck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/api/api";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

interface ShiprocketInfo {
  orderId?: number;
  shipmentId?: number;
  awbCode?: string;
  courierName?: string;
  status?: string;
}

interface TrackingActivity {
  date: string | null;
  status: string | null;
  activity: string | null;
  location: string | null;
}

interface TrackingResult {
  awbCode?: string | null;
  courierName?: string | null;
  currentStatus: string | null;
  trackUrl: string | null;
  etd: string | null;
  activities: TrackingActivity[];
  message: string | null;
}

interface ShiprocketOrderActionsProps {
  orderId: string;
  shiprocket: ShiprocketInfo;
  // Reload the order after something changed
  onChanged: () => void;
}

type ActionKey = "sync" | "awb" | "track" | "label" | "invoice" | "cancel";

const getErrorMessage = (error: unknown, fallback: string): string => {
  const axiosError = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return axiosError?.response?.data?.message || axiosError?.message || fallback;
};

export default function ShiprocketOrderActions({
  orderId,
  shiprocket,
  onChanged,
}: ShiprocketOrderActionsProps) {
  const { admin } = useAuth();
  const [busy, setBusy] = useState<ActionKey | null>(null);
  const [tracking, setTracking] = useState<TrackingResult | null>(null);
  const [links, setLinks] = useState<{ label?: string; invoice?: string }>({});

  const canUpdate =
    admin?.role === "SUPER_ADMIN" ||
    Boolean(admin?.permissions?.includes("orders:update"));

  const synced = Boolean(shiprocket.orderId);
  const hasAwb = Boolean(shiprocket.awbCode);
  const status = shiprocket.status;
  const cancelled = status === "CANCELLED";
  const delivered = status === "DELIVERED";

  const base = `/api/admin/shiprocket/orders/${orderId}`;

  const run = async (
    action: ActionKey,
    task: () => Promise<void>,
    fallbackError: string
  ) => {
    setBusy(action);
    try {
      await task();
    } catch (error) {
      toast.error(getErrorMessage(error, fallbackError));
    } finally {
      setBusy(null);
    }
  };

  const sendToShiprocket = () =>
    run(
      "sync",
      async () => {
        const response = await api.post(`${base}/sync`);
        const awb = response.data?.data?.awb;
        if (awb && !awb.assigned) {
          toast.warning(response.data.message);
        } else {
          toast.success(response.data.message);
        }
        onChanged();
      },
      "Could not send the order to Shiprocket"
    );

  const assignAwb = () =>
    run(
      "awb",
      async () => {
        const response = await api.post(`${base}/assign-awb`);
        if (response.data?.data?.awb?.pickupError) {
          toast.warning(response.data.message);
        } else {
          toast.success(response.data.message);
        }
        onChanged();
      },
      "Could not assign an AWB"
    );

  const refreshTracking = () =>
    run(
      "track",
      async () => {
        const response = await api.get(`${base}/tracking`);
        setTracking(response.data.data.tracking);
        onChanged();
      },
      "Could not fetch tracking"
    );

  const openDocument = (kind: "label" | "invoice") =>
    run(
      kind,
      async () => {
        const response = await api.get(`${base}/${kind}`);
        const url: string | undefined = response.data?.data?.url;
        if (!url) {
          throw new Error(`Shiprocket did not return a ${kind} link`);
        }

        setLinks((prev) => ({ ...prev, [kind]: url }));

        const opened = window.open(url, "_blank");
        if (opened) {
          opened.opener = null;
        } else {
          toast.info(
            "Your browser blocked the pop-up. Use the link shown under the buttons."
          );
        }
      },
      `Could not generate the ${kind}`
    );

  const cancelShipment = () => {
    if (
      !window.confirm(
        "Cancel this shipment in Shiprocket? The courier pickup will be cancelled."
      )
    ) {
      return;
    }

    run(
      "cancel",
      async () => {
        const response = await api.post(`${base}/cancel`);
        toast.success(response.data.message);
        onChanged();
      },
      "Could not cancel the shipment"
    );
  };

  const spinnerOr = (action: ActionKey, icon: JSX.Element) =>
    busy === action ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : icon;

  return (
    <div className="mt-5 space-y-4 border-t border-[#E5E7EB] pt-5">
      {/* What to do next */}
      {!synced && status === "SYNC_FAILED" && (
        <div className="rounded-lg border border-[#FDE68A] bg-[#FFFBEB] p-3 text-sm text-[#92400E]">
          The automatic send to Shiprocket failed. Check the customer&apos;s
          phone number and address and your pickup location, then try again.
        </div>
      )}
      {!synced && status !== "SYNC_FAILED" && (
        <p className="text-sm text-[#6B7280]">
          This order has not been sent to Shiprocket yet.
        </p>
      )}
      {synced && !hasAwb && !cancelled && (
        <div className="rounded-lg border border-[#FDE68A] bg-[#FFFBEB] p-3 text-sm text-[#92400E]">
          No AWB yet. This is usually low Shiprocket wallet balance, an
          unverified pickup location or no courier available. Fix it in
          Shiprocket, then click &ldquo;Assign AWB&rdquo;.
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {!synced && canUpdate && (
          <Button size="sm" onClick={sendToShiprocket} disabled={busy !== null}>
            {spinnerOr("sync", <Send className="mr-2 h-4 w-4" />)}
            Send to Shiprocket
          </Button>
        )}

        {synced && !hasAwb && !cancelled && canUpdate && (
          <Button size="sm" onClick={assignAwb} disabled={busy !== null}>
            {spinnerOr("awb", <Tag className="mr-2 h-4 w-4" />)}
            Assign AWB
          </Button>
        )}

        {hasAwb && (
          <Button
            size="sm"
            variant="outline"
            onClick={refreshTracking}
            disabled={busy !== null}
          >
            {spinnerOr("track", <MapPin className="mr-2 h-4 w-4" />)}
            Track shipment
          </Button>
        )}

        {hasAwb && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => openDocument("label")}
            disabled={busy !== null}
          >
            {spinnerOr("label", <Truck className="mr-2 h-4 w-4" />)}
            Shipping label
          </Button>
        )}

        {synced && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => openDocument("invoice")}
            disabled={busy !== null}
          >
            {spinnerOr("invoice", <FileText className="mr-2 h-4 w-4" />)}
            Invoice
          </Button>
        )}

        {synced && canUpdate && !cancelled && !delivered && (
          <Button
            size="sm"
            variant="outline"
            className="border-[#FECACA] text-[#EF4444] hover:bg-[#FEF2F2]"
            onClick={cancelShipment}
            disabled={busy !== null}
          >
            {spinnerOr("cancel", <XCircle className="mr-2 h-4 w-4" />)}
            Cancel shipment
          </Button>
        )}
      </div>

      {/* Links from the last label / invoice request (in case a pop-up was blocked) */}
      {(links.label || links.invoice) && (
        <div className="flex flex-wrap gap-4 text-sm">
          {links.label && (
            <a
              href={links.label}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-primary hover:underline"
            >
              <ExternalLink className="mr-1 h-3.5 w-3.5" /> Open shipping label
            </a>
          )}
          {links.invoice && (
            <a
              href={links.invoice}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-primary hover:underline"
            >
              <ExternalLink className="mr-1 h-3.5 w-3.5" /> Open invoice
            </a>
          )}
        </div>
      )}

      {/* Live tracking */}
      {tracking && (
        <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[#1F2937]">
              {tracking.currentStatus || "No tracking events yet"}
            </p>
            {tracking.trackUrl && (
              <a
                href={tracking.trackUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs text-primary hover:underline"
              >
                <ExternalLink className="mr-1 h-3 w-3" /> Public tracking page
              </a>
            )}
          </div>

          {tracking.etd && (
            <p className="mt-1 text-xs text-[#6B7280]">
              Expected delivery: {tracking.etd}
            </p>
          )}

          {tracking.activities.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {tracking.activities.slice(0, 8).map((activity, index) => (
                <li key={`${activity.date}-${index}`} className="flex gap-2">
                  <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                  <div>
                    <p className="text-xs font-medium text-[#1F2937]">
                      {activity.activity || activity.status}
                    </p>
                    <p className="text-[11px] text-[#9CA3AF]">
                      {[activity.date, activity.location]
                        .filter(Boolean)
                        .join(" • ")}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-[#6B7280]">
              {tracking.message ||
                "The courier has not reported any movement yet."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
