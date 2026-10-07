import { useEffect, useState } from "react";
import { Loader2, Truck } from "lucide-react";
import { toast } from "sonner";
import api from "@/api/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/openDocument";

type Courier = "SHIPROCKET" | "DELHIVERY";

interface CourierOverview {
  defaultCourier: Courier;
  shiprocket: { enabled: boolean };
  delhivery: { enabled: boolean };
}

const OPTIONS: { value: Courier; label: string }[] = [
  { value: "SHIPROCKET", label: "Shiprocket" },
  { value: "DELHIVERY", label: "Delhivery" },
];

// Which courier new orders are sent to automatically (shown on both courier settings pages)
export default function DefaultCourierCard() {
  const [overview, setOverview] = useState<CourierOverview | null>(null);
  const [saving, setSaving] = useState<Courier | null>(null);

  const load = async () => {
    try {
      const response = await api.get("/api/admin/couriers/overview");
      setOverview(response.data.data);
    } catch (error) {
      console.error("Failed to load courier settings:", error);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const choose = async (courier: Courier) => {
    if (!overview || courier === overview.defaultCourier || saving) return;

    try {
      setSaving(courier);
      const response = await api.put("/api/admin/couriers/default", {
        defaultCourier: courier,
      });
      setOverview({ ...overview, defaultCourier: courier });

      const warning = response.data?.data?.warning;
      if (warning) {
        toast.warning(warning, { duration: 8000 });
      } else {
        toast.success(`New orders will now go to ${courier === "DELHIVERY" ? "Delhivery" : "Shiprocket"}`);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not change the default courier"));
    } finally {
      setSaving(null);
    }
  };

  return (
    <Card className="bg-[#FFFFFF] border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.04)] rounded-xl">
      <CardHeader className="px-6 pt-6 pb-4">
        <CardTitle className="text-lg font-semibold text-[#1F2937] flex items-center">
          <Truck className="h-5 w-5 mr-2 text-[#4CAF50]" />
          Default Courier
        </CardTitle>
        <p className="text-sm text-[#9CA3AF] mt-1">
          Which courier auto-syncs new orders. You can still choose a different
          courier for an individual order from its order details page.
        </p>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {OPTIONS.map((option) => {
            const selected = overview?.defaultCourier === option.value;
            const enabled =
              option.value === "SHIPROCKET"
                ? overview?.shiprocket.enabled
                : overview?.delhivery.enabled;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => choose(option.value)}
                disabled={!overview || saving !== null}
                className={cn(
                  "flex items-center gap-4 rounded-xl border-2 px-5 py-5 text-left transition-colors",
                  selected
                    ? "border-[#22C55E] bg-[#ECFDF5]"
                    : "border-[#E5E7EB] bg-white hover:border-[#9CA3AF]"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2",
                    selected ? "border-[#22C55E]" : "border-[#D1D5DB]"
                  )}
                >
                  {saving === option.value ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#22C55E]" />
                  ) : (
                    selected && <span className="h-3 w-3 rounded-full bg-[#22C55E]" />
                  )}
                </span>
                <span className="text-base font-semibold text-[#1F2937]">
                  {option.label}
                </span>
                {overview && !enabled && (
                  <span className="ml-auto rounded-full bg-[#F3F4F6] px-2 py-0.5 text-xs text-[#6B7280]">
                    Not turned on
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
