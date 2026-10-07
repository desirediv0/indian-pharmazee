import { useState } from "react";
import { ExternalLink, FileText, Loader2, MapPin, Truck, XCircle } from "lucide-react";
import { toast } from "sonner";
import api from "@/api/api";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import TrackingTimeline, { TrackingResult } from "@/components/TrackingTimeline";
import {
  getErrorMessage,
  openHtmlDocument,
  openRemoteDocument,
} from "@/lib/openDocument";

interface DelhiveryOrderActionsProps {
  orderId: string;
  status?: string | null;
  trackingUrl?: string | null;
  // Reload the order after something changed
  onChanged: () => void;
}

type ActionKey = "track" | "label" | "invoice" | "cancel";

// Track / label / invoice / cancel for an order that is booked with Delhivery
export default function DelhiveryOrderActions({
  orderId,
  status,
  trackingUrl,
  onChanged,
}: DelhiveryOrderActionsProps) {
  const { admin } = useAuth();
  const [busy, setBusy] = useState<ActionKey | null>(null);
  const [tracking, setTracking] = useState<TrackingResult | null>(null);
  const [links, setLinks] = useState<{ label?: string; invoice?: string }>({});

  const canUpdate =
    admin?.role === "SUPER_ADMIN" ||
    Boolean(admin?.permissions?.includes("orders:update"));

  const cancelled = status === "CANCELLED";
  const delivered = status === "DELIVERED";

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

  const refreshTracking = () =>
    run(
      "track",
      async () => {
        const response = await api.get(`/api/admin/delhivery/orders/${orderId}/tracking`);
        setTracking(response.data.data.tracking);
        onChanged();
      },
      "Could not fetch tracking from Delhivery"
    );

  const openLabel = () =>
    run(
      "label",
      async () => {
        const response = await api.get(`/api/admin/delhivery/orders/${orderId}/label`);
        const { url, html } = response.data?.data ?? {};

        if (url) {
          setLinks((prev) => ({ ...prev, label: url }));
          openRemoteDocument(url);
        } else if (html) {
          setLinks((prev) => ({ ...prev, label: openHtmlDocument(html) }));
        } else {
          throw new Error("Delhivery did not return a label");
        }
      },
      "Could not generate the shipping label"
    );

  const openInvoice = () =>
    run(
      "invoice",
      async () => {
        const response = await api.get(`/api/admin/couriers/orders/${orderId}/invoice`);
        const html: string | undefined = response.data?.data?.html;
        if (!html) throw new Error("The invoice could not be generated");
        setLinks((prev) => ({ ...prev, invoice: openHtmlDocument(html) }));
      },
      "Could not generate the invoice"
    );

  const cancelShipment = () => {
    if (
      !window.confirm(
        "Cancel this shipment with Delhivery? This only works until the courier has picked it up."
      )
    ) {
      return;
    }

    run(
      "cancel",
      async () => {
        const response = await api.post(`/api/admin/delhivery/orders/${orderId}/cancel`);
        toast.success(response.data.message);
        onChanged();
      },
      "Could not cancel the shipment"
    );
  };

  const spinnerOr = (action: ActionKey, icon: JSX.Element) =>
    busy === action ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : icon;

  return (
    <div className="space-y-4">
      {cancelled && (
        <div className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-3 text-sm text-[#991B1B]">
          This Delhivery shipment was cancelled.
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={refreshTracking} disabled={busy !== null}>
          {spinnerOr("track", <MapPin className="mr-2 h-4 w-4" />)}
          Track shipment
        </Button>

        <Button size="sm" variant="outline" onClick={openLabel} disabled={busy !== null || cancelled}>
          {spinnerOr("label", <Truck className="mr-2 h-4 w-4" />)}
          Shipping label
        </Button>

        <Button size="sm" variant="outline" onClick={openInvoice} disabled={busy !== null}>
          {spinnerOr("invoice", <FileText className="mr-2 h-4 w-4" />)}
          Invoice
        </Button>

        {canUpdate && !cancelled && !delivered && (
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

      {(links.label || links.invoice || trackingUrl) && (
        <div className="flex flex-wrap gap-4 text-sm">
          {links.label && (
            <a href={links.label} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-primary hover:underline">
              <ExternalLink className="mr-1 h-3.5 w-3.5" /> Open shipping label
            </a>
          )}
          {links.invoice && (
            <a href={links.invoice} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-primary hover:underline">
              <ExternalLink className="mr-1 h-3.5 w-3.5" /> Open invoice
            </a>
          )}
          {trackingUrl && (
            <a href={trackingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-primary hover:underline">
              <ExternalLink className="mr-1 h-3.5 w-3.5" /> Customer tracking page
            </a>
          )}
        </div>
      )}

      {tracking && <TrackingTimeline tracking={tracking} />}
    </div>
  );
}
