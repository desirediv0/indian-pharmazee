import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, RefreshCw, Truck } from "lucide-react";
import { toast } from "sonner";
import api from "@/api/api";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/openDocument";
import ShiprocketOrderActions from "@/components/ShiprocketOrderActions";
import DelhiveryOrderActions from "@/components/DelhiveryOrderActions";

type Courier = "SHIPROCKET" | "DELHIVERY";
type Speed = "SURFACE" | "EXPRESS";

interface Warehouse {
  id: string;
  nickname: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  delhiverySynced: boolean;
}

interface CourierOverview {
  defaultCourier: Courier;
  shiprocket: { enabled: boolean };
  delhivery: { enabled: boolean; shippingSpeed: Speed };
  warehouses: Warehouse[];
}

interface RateEstimate {
  surface: { total: number } | null;
  express: { total: number } | null;
  errors: { surface: string | null; express: string | null };
  serviceability: { serviceable: boolean; cod?: boolean; prepaid?: boolean } | null;
}

interface ShiprocketInfo {
  orderId?: number;
  shipmentId?: number;
  awbCode?: string;
  courierName?: string;
  status?: string;
}

interface CourierInfo {
  provider: Courier | null;
  status?: string | null;
  awbCode?: string | null;
  trackingUrl?: string | null;
  bookingFailed?: boolean;
}

interface ShipmentPanelProps {
  orderId: string;
  postalCode?: string;
  shiprocket: ShiprocketInfo;
  courier?: CourierInfo;
  // Reload the order after something changed
  onChanged: () => void;
}

const COURIER_LABEL: Record<Courier, string> = {
  SHIPROCKET: "Shiprocket",
  DELHIVERY: "Delhivery",
};

const SPEED_LABEL: Record<Speed, string> = {
  SURFACE: "Surface",
  EXPRESS: "Express",
};

const rupees = (value: number) =>
  `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// How many leading digits two pincodes share (closer region = longer match)
const sharedPrefix = (a: string, b: string) => {
  let count = 0;
  while (count < a.length && count < b.length && a[count] === b[count]) count += 1;
  return count;
};

// Warehouse closest to the delivery pincode; the default one wins a tie
const nearestWarehouse = (warehouses: Warehouse[], postalCode?: string): Warehouse | undefined => {
  if (warehouses.length === 0) return undefined;
  const start = warehouses.find((w) => w.isDefault) ?? warehouses[0];
  if (!postalCode) return start;

  return warehouses.reduce((best, current) => {
    const bestScore = sharedPrefix(best.pincode, postalCode);
    const score = sharedPrefix(current.pincode, postalCode);
    return score > bestScore ? current : best;
  }, start);
};

export default function ShipmentPanel({
  orderId,
  postalCode,
  shiprocket,
  courier,
  onChanged,
}: ShipmentPanelProps) {
  const { admin } = useAuth();
  const canUpdate =
    admin?.role === "SUPER_ADMIN" ||
    Boolean(admin?.permissions?.includes("orders:update"));

  const [overview, setOverview] = useState<CourierOverview | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [choice, setChoice] = useState<Courier | null>(null);
  const [warehouseId, setWarehouseId] = useState("");
  const [speed, setSpeed] = useState<Speed>("SURFACE");
  const [estimate, setEstimate] = useState<RateEstimate | null>(null);
  const [busy, setBusy] = useState<"estimate" | "book" | null>(null);

  const provider: Courier | null =
    courier?.provider ?? (shiprocket.orderId ? "SHIPROCKET" : null);
  const bookedWithShiprocket = provider === "SHIPROCKET" && Boolean(shiprocket.orderId);
  const bookedWithDelhivery = provider === "DELHIVERY" && Boolean(courier?.awbCode);
  const booked = bookedWithShiprocket || bookedWithDelhivery;

  // What can be chosen, and sensible starting values
  useEffect(() => {
    if (booked) return;

    let cancelled = false;
    api
      .get("/api/admin/couriers/overview")
      .then((response) => {
        if (cancelled) return;
        const data: CourierOverview = response.data.data;
        setOverview(data);

        const enabled = (["SHIPROCKET", "DELHIVERY"] as Courier[]).filter((c) =>
          c === "SHIPROCKET" ? data.shiprocket.enabled : data.delhivery.enabled
        );
        setChoice(enabled.includes(data.defaultCourier) ? data.defaultCourier : enabled[0] ?? null);
        setWarehouseId(nearestWarehouse(data.warehouses, postalCode)?.id ?? "");
        setSpeed(data.delhivery.shippingSpeed === "EXPRESS" ? "EXPRESS" : "SURFACE");
      })
      .catch((error) => {
        console.error("Failed to load courier options:", error);
        if (!cancelled) setLoadFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [booked, postalCode]);

  // A different warehouse means different rates
  useEffect(() => {
    setEstimate(null);
  }, [warehouseId, choice]);

  const enabledCouriers = useMemo(
    () =>
      overview
        ? ((["SHIPROCKET", "DELHIVERY"] as Courier[]).filter((c) =>
            c === "SHIPROCKET" ? overview.shiprocket.enabled : overview.delhivery.enabled
          ))
        : [],
    [overview]
  );

  const selectedWarehouse = overview?.warehouses.find((w) => w.id === warehouseId);

  const viewRates = async () => {
    try {
      setBusy("estimate");
      const response = await api.post(`/api/admin/delhivery/orders/${orderId}/estimate`, {
        warehouseId: warehouseId || undefined,
      });
      setEstimate(response.data.data);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not get rates from Delhivery"));
    } finally {
      setBusy(null);
    }
  };

  const syncToCourier = async () => {
    if (!choice) return;

    try {
      setBusy("book");

      if (choice === "DELHIVERY") {
        const response = await api.post(`/api/admin/delhivery/orders/${orderId}/book`, {
          warehouseId: warehouseId || undefined,
          speed,
        });
        toast.success(response.data.message);
      } else {
        const response = await api.post(`/api/admin/shiprocket/orders/${orderId}/sync`, {
          warehouseId: warehouseId || undefined,
        });
        if (response.data?.data?.awb && !response.data.data.awb.assigned) {
          toast.warning(response.data.message);
        } else {
          toast.success(response.data.message);
        }
      }

      onChanged();
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          `Could not send the order to ${COURIER_LABEL[choice]}`
        )
      );
    } finally {
      setBusy(null);
    }
  };

  /* ---------------- already with a courier ---------------- */

  if (bookedWithShiprocket) {
    return (
      <ShiprocketOrderActions
        orderId={orderId}
        shiprocket={shiprocket}
        onChanged={onChanged}
      />
    );
  }

  if (bookedWithDelhivery) {
    return (
      <div className="mt-5 border-t border-[#E5E7EB] pt-5">
        <DelhiveryOrderActions
          orderId={orderId}
          status={courier?.status}
          trackingUrl={courier?.trackingUrl}
          onChanged={onChanged}
        />
      </div>
    );
  }

  /* ---------------- not synced yet ---------------- */

  const failedBefore = courier?.bookingFailed || shiprocket.status === "SYNC_FAILED";

  return (
    <div className="mt-5 border-t border-[#E5E7EB] pt-6">
      <div className="mb-5 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#ECFDF5]">
          <Truck className="h-7 w-7 text-[#16A34A]" />
        </div>
        <h3 className="text-base font-semibold text-[#1F2937]">Not Synced to a Courier Yet</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-[#9CA3AF]">
          Choose a courier below, then fetch available rates or send the order directly.
        </p>
      </div>

      {failedBefore && (
        <div className="mb-4 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] p-3 text-sm text-[#92400E]">
          The last attempt to send this order to a courier failed. Check the
          customer&apos;s phone number, address and pincode and your warehouse,
          then try again.
        </div>
      )}

      {loadFailed && (
        <p className="text-sm text-[#EF4444]">Could not load the courier options. Refresh the page.</p>
      )}

      {!overview && !loadFailed && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-[#9CA3AF]" />
        </div>
      )}

      {overview && enabledCouriers.length === 0 && (
        <div className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-4 text-sm text-[#4B5563]">
          No courier is turned on yet. Set one up in{" "}
          <Link to="/shiprocket-settings" className="text-primary underline">Shiprocket settings</Link>{" "}
          or{" "}
          <Link to="/delhivery-settings" className="text-primary underline">Delhivery settings</Link>.
        </div>
      )}

      {overview && enabledCouriers.length > 0 && (
        <div className="space-y-5">
          {/* Courier */}
          <div>
            <p className="mb-2 text-sm font-semibold text-[#1F2937]">Courier</p>
            <div className="grid grid-cols-2 gap-2">
              {(["SHIPROCKET", "DELHIVERY"] as Courier[]).map((option) => {
                const enabled = enabledCouriers.includes(option);
                const selected = choice === option;
                return (
                  <button
                    key={option}
                    type="button"
                    disabled={!enabled}
                    onClick={() => setChoice(option)}
                    className={cn(
                      "rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors",
                      selected
                        ? "border-[#22C55E] bg-[#ECFDF5] text-[#15803D]"
                        : "border-[#E5E7EB] bg-white text-[#1F2937] hover:border-[#9CA3AF]",
                      !enabled && "cursor-not-allowed opacity-50"
                    )}
                  >
                    {COURIER_LABEL[option]}
                    {!enabled && <span className="block text-[10px] font-normal">Not turned on</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Warehouse */}
          <div>
            <p className="mb-2 text-sm font-semibold text-[#1F2937]">Ship from warehouse</p>
            {overview.warehouses.length === 0 ? (
              <p className="text-sm text-[#92400E]">
                Add a warehouse first in{" "}
                <Link to={choice === "DELHIVERY" ? "/delhivery-settings" : "/shiprocket-settings"} className="text-primary underline">
                  courier settings
                </Link>.
              </p>
            ) : (
              <>
                <select
                  value={warehouseId}
                  onChange={(event) => setWarehouseId(event.target.value)}
                  className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-[#1F2937] focus:border-primary focus:outline-none"
                >
                  {overview.warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.nickname} — {warehouse.city} ({warehouse.pincode})
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-[#9CA3AF]">
                  Pre-selected the warehouse nearest the delivery pincode. Change it if needed.
                </p>
                {choice === "DELHIVERY" && selectedWarehouse && !selectedWarehouse.delhiverySynced && (
                  <p className="mt-1 text-xs text-[#92400E]">
                    This warehouse will be registered with Delhivery automatically.
                  </p>
                )}
              </>
            )}
          </div>

          {/* Delivery speed (Delhivery) */}
          {choice === "DELHIVERY" && (
            <div>
              <p className="mb-2 text-sm font-semibold text-[#1F2937]">Delivery speed</p>
              <div className="grid grid-cols-2 gap-2">
                {(["SURFACE", "EXPRESS"] as Speed[]).map((option) => {
                  const selected = speed === option;
                  const price = option === "SURFACE" ? estimate?.surface : estimate?.express;
                  const error = option === "SURFACE" ? estimate?.errors.surface : estimate?.errors.express;

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setSpeed(option)}
                      className={cn(
                        "rounded-lg border px-3 py-2.5 text-left transition-colors",
                        selected
                          ? "border-[#22C55E] bg-[#ECFDF5]"
                          : "border-[#E5E7EB] bg-white hover:border-[#9CA3AF]"
                      )}
                    >
                      <span className={cn("block text-sm font-semibold", selected ? "text-[#15803D]" : "text-[#1F2937]")}>
                        {SPEED_LABEL[option]}
                      </span>
                      <span className="block text-xs text-[#9CA3AF]">
                        {option === "SURFACE" ? "Slower, cheaper" : "Faster, costlier"}
                      </span>
                      <span className="mt-1 block text-xs font-semibold text-[#15803D]">
                        {price
                          ? rupees(price.total)
                          : estimate
                            ? error ? "Not available" : "—"
                            : "Tap View Rate Estimate"}
                      </span>
                    </button>
                  );
                })}
              </div>

              {estimate?.serviceability && !estimate.serviceability.serviceable && (
                <p className="mt-2 text-xs text-[#B91C1C]">
                  Delhivery does not deliver to this pincode.
                </p>
              )}

              <div className="mt-3 flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-[#93C5FD] text-[#2563EB] hover:bg-[#EFF6FF]"
                  onClick={viewRates}
                  disabled={busy !== null || overview.warehouses.length === 0}
                >
                  {busy === "estimate" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Truck className="mr-2 h-4 w-4" />
                  )}
                  View Rate Estimate
                </Button>
              </div>
            </div>
          )}

          {/* Send */}
          {canUpdate ? (
            <div className="flex justify-center">
              <Button
                type="button"
                className="bg-[#22C55E] text-white hover:bg-[#16A34A]"
                onClick={syncToCourier}
                disabled={busy !== null || !choice || overview.warehouses.length === 0}
              >
                {busy === "book" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                {choice === "DELHIVERY"
                  ? `Sync to Delhivery (${SPEED_LABEL[speed]})`
                  : `Sync to ${choice ? COURIER_LABEL[choice] : "courier"}`}
              </Button>
            </div>
          ) : (
            <p className="text-center text-xs text-[#9CA3AF]">
              You need permission to update orders to send this to a courier.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
