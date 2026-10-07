import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  Trash2,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/api/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import DefaultCourierCard from "@/components/DefaultCourierCard";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/openDocument";

type BookingMode = "AUTO" | "MANUAL";
type ShippingSpeed = "SURFACE" | "EXPRESS";

interface DelhiverySettings {
  isEnabled: boolean;
  clientName: string | null;
  apiToken: string | null;
  sellerGstTin: string | null;
  defaultHsnCode: string | null;
  defaultLength: number;
  defaultBreadth: number;
  defaultHeight: number;
  defaultWeight: number;
  bookingMode: BookingMode;
  shippingSpeed: ShippingSpeed;
}

interface PickupAddress {
  id: string;
  nickname: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  address2: string | null;
  city: string;
  state: string;
  country: string;
  pincode: string;
  isDefault: boolean;
  delhiverySynced: boolean;
}

const MASK = "********";

const CARD =
  "bg-[#FFFFFF] border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.04)] rounded-xl";

const emptyAddress = {
  nickname: "Primary Warehouse",
  name: "",
  email: "",
  phone: "",
  address: "",
  address2: "",
  city: "",
  state: "",
  country: "India",
  pincode: "",
  isDefault: true,
};

// A big selectable card (booking mode / speed)
function OptionCard({
  selected,
  title,
  description,
  onClick,
}: {
  selected: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-start gap-4 rounded-xl border-2 px-5 py-5 text-left transition-colors",
        selected
          ? "border-[#22C55E] bg-[#ECFDF5]"
          : "border-[#E5E7EB] bg-white hover:border-[#9CA3AF]"
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2",
          selected ? "border-[#22C55E]" : "border-[#D1D5DB]"
        )}
      >
        {selected && <span className="h-2.5 w-2.5 rounded-full bg-[#22C55E]" />}
      </span>
      <span>
        <span className="block text-base font-semibold text-[#1F2937]">{title}</span>
        <span className="mt-1 block text-sm text-[#6B7280]">{description}</span>
      </span>
    </button>
  );
}

export default function DelhiverySettingsPage() {
  const [settings, setSettings] = useState<DelhiverySettings | null>(null);
  const [addresses, setAddresses] = useState<PickupAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Credentials
  const [clientName, setClientName] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [sellerGstTin, setSellerGstTin] = useState("");
  const [defaultHsnCode, setDefaultHsnCode] = useState("");

  // Dimensions (kept as text while typing)
  const [length, setLength] = useState("10");
  const [breadth, setBreadth] = useState("10");
  const [height, setHeight] = useState("10");
  const [weight, setWeight] = useState("0.5");

  const [bookingMode, setBookingMode] = useState<BookingMode>("AUTO");
  const [shippingSpeed, setShippingSpeed] = useState<ShippingSpeed>("SURFACE");

  const [busy, setBusy] = useState<
    "toggle" | "credentials" | "test" | "dimensions" | "mode" | "speed" | "address" | null
  >(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Address dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PickupAddress | null>(null);
  const [form, setForm] = useState(emptyAddress);

  const applySettings = (data: DelhiverySettings) => {
    setSettings(data);
    setClientName(data.clientName || "");
    setApiToken(data.apiToken || "");
    setSellerGstTin(data.sellerGstTin || "");
    setDefaultHsnCode(data.defaultHsnCode || "");
    setLength(String(data.defaultLength));
    setBreadth(String(data.defaultBreadth));
    setHeight(String(data.defaultHeight));
    setWeight(String(data.defaultWeight));
    setBookingMode(data.bookingMode);
    setShippingSpeed(data.shippingSpeed);
  };

  const fetchSettings = async () => {
    try {
      const response = await api.get("/api/admin/delhivery/settings");
      applySettings(response.data.data.settings);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not load Delhivery settings"));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const response = await api.get("/api/admin/delhivery/pickup-addresses");
      setAddresses(response.data.data.addresses || []);
    } catch (error) {
      console.error("Error fetching pickup addresses:", error);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchAddresses();
  }, []);

  /** Save part of the settings; returns true on success */
  const save = async (
    key: NonNullable<typeof busy>,
    body: Record<string, unknown>,
    successMessage: string
  ): Promise<boolean> => {
    try {
      setBusy(key);
      const response = await api.put("/api/admin/delhivery/settings", body);
      applySettings(response.data.data.settings);
      toast.success(successMessage);
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not save the settings"));
      return false;
    } finally {
      setBusy(null);
    }
  };

  const hasToken = Boolean(settings?.apiToken) || (apiToken !== "" && apiToken !== MASK);

  const handleToggle = async (enabled: boolean) => {
    if (enabled && !hasToken) {
      toast.error("Add your Delhivery API token first");
      return;
    }
    await save(
      "toggle",
      { isEnabled: enabled, ...(enabled && apiToken && apiToken !== MASK ? { apiToken, clientName } : {}) },
      enabled ? "Delhivery turned on" : "Delhivery turned off"
    );
  };

  const credentialsBody = () => ({
    clientName,
    apiToken: apiToken && apiToken !== MASK ? apiToken : undefined,
    sellerGstTin,
    defaultHsnCode,
  });

  const handleSaveCredentials = () =>
    save("credentials", credentialsBody(), "Credentials saved");

  const handleTestConnection = async () => {
    if (!hasToken) {
      toast.error("Add your Delhivery API token first");
      return;
    }

    // The test uses the saved token, so save first
    const saved = await save("test", credentialsBody(), "Credentials saved");
    if (!saved) return;

    try {
      setBusy("test");
      const response = await api.post("/api/admin/delhivery/test-connection");
      if (response.data.success) toast.success("Connected to Delhivery");
    } catch (error) {
      toast.error(getErrorMessage(error, "Connection failed"));
    } finally {
      setBusy(null);
    }
  };

  const handleSaveDimensions = () => {
    const values = { defaultLength: Number(length), defaultBreadth: Number(breadth), defaultHeight: Number(height), defaultWeight: Number(weight) };
    if (Object.values(values).some((value) => !Number.isFinite(value) || value <= 0)) {
      toast.error("Enter a positive number for every size");
      return;
    }
    save("dimensions", values, "Default dimensions saved");
  };

  /* ---------------- warehouses ---------------- */

  const openAddDialog = () => {
    setEditing(null);
    setForm({ ...emptyAddress, isDefault: addresses.length === 0 });
    setDialogOpen(true);
  };

  const openEditDialog = (address: PickupAddress) => {
    setEditing(address);
    setForm({
      nickname: address.nickname,
      name: address.name,
      email: address.email,
      phone: address.phone,
      address: address.address,
      address2: address.address2 || "",
      city: address.city,
      state: address.state,
      country: address.country,
      pincode: address.pincode,
      isDefault: address.isDefault,
    });
    setDialogOpen(true);
  };

  const handleSaveAddress = async () => {
    if (!form.name || !form.email || !form.phone || !form.address || !form.city || !form.state || !form.pincode) {
      toast.error("Please fill in every required field");
      return;
    }

    try {
      setBusy("address");
      if (editing) {
        await api.put(`/api/admin/delhivery/pickup-addresses/${editing.id}`, form);
        toast.success("Warehouse updated");
      } else {
        const response = await api.post("/api/admin/delhivery/pickup-addresses", form);
        toast.success("Warehouse added");
        const warning = response.data?.data?.syncWarning;
        if (warning) {
          toast.warning("Saved, but not registered everywhere yet: " + warning, { duration: 10000 });
        }
      }
      setDialogOpen(false);
      fetchAddresses();
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not save the warehouse"));
    } finally {
      setBusy(null);
    }
  };

  const handleDeleteAddress = async (address: PickupAddress) => {
    if (!window.confirm(`Delete the warehouse "${address.nickname}"?`)) return;

    try {
      await api.delete(`/api/admin/delhivery/pickup-addresses/${address.id}`);
      toast.success("Warehouse deleted");
      fetchAddresses();
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not delete the warehouse"));
    }
  };

  const handleSyncAddress = async (address: PickupAddress) => {
    try {
      setSyncingId(address.id);
      const response = await api.post(`/api/admin/delhivery/pickup-addresses/${address.id}/sync`);
      toast.success(response.data.message);
      fetchAddresses();
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not register the warehouse with Delhivery"));
    } finally {
      setSyncingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-10 w-10 animate-spin text-[#4CAF50]" />
      </div>
    );
  }

  const field = (key: keyof typeof emptyAddress, label: string, required = true, type = "text") => (
    <div className="space-y-1.5">
      <Label htmlFor={`addr-${key}`}>
        {label} {required && "*"}
      </Label>
      <Input
        id={`addr-${key}`}
        type={type}
        value={String(form[key] ?? "")}
        onChange={(event) => setForm({ ...form, [key]: event.target.value })}
      />
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-semibold text-[#1F2937] tracking-tight">Delhivery Settings</h1>
          <p className="text-[#9CA3AF] text-sm mt-1.5">
            Configure the Delhivery courier integration for order fulfillment
          </p>
        </div>
        <div className="h-px bg-[#E5E7EB]" />
      </div>

      <DefaultCourierCard />

      {/* Enable */}
      <Card className={CARD}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#EFF6FF] border border-[#DBEAFE]">
                <Truck className="h-6 w-6 text-[#3B82F6]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Label className="text-base font-semibold text-[#1F2937]">Enable Delhivery Integration</Label>
                  {settings?.isEnabled && <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />}
                </div>
                <p className="text-sm text-[#9CA3AF]">Turn on to allow orders to be shipped through Delhivery</p>
              </div>
            </div>
            <Switch
              checked={settings?.isEnabled || false}
              onCheckedChange={handleToggle}
              disabled={busy !== null}
            />
          </div>
        </CardContent>
      </Card>

      {/* API credentials */}
      <Card className={CARD}>
        <CardHeader className="px-6 pt-6 pb-4">
          <CardTitle className="text-lg font-semibold text-[#1F2937] flex items-center">
            <Package className="h-5 w-5 mr-2 text-[#4CAF50]" />
            API Credentials
          </CardTitle>
          <p className="text-sm text-[#9CA3AF] mt-1">
            Delhivery authenticates every request with a single static API token — no login step
          </p>
        </CardHeader>
        <CardContent className="px-6 pb-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name</Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(event) => setClientName(event.target.value)}
                placeholder="As registered with Delhivery"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiToken">API Token *</Label>
              <div className="relative">
                <Input
                  id="apiToken"
                  type={showToken ? "text" : "password"}
                  value={apiToken}
                  onChange={(event) => setApiToken(event.target.value)}
                  placeholder="Paste your Delhivery API token"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  aria-label={showToken ? "Hide token" : "Show token"}
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sellerGstTin">Seller GST Number (optional)</Label>
              <Input
                id="sellerGstTin"
                value={sellerGstTin}
                onChange={(event) => setSellerGstTin(event.target.value.toUpperCase())}
                placeholder="15 character GSTIN"
                maxLength={15}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultHsnCode">Default HSN Code (optional)</Label>
              <Input
                id="defaultHsnCode"
                value={defaultHsnCode}
                onChange={(event) => setDefaultHsnCode(event.target.value.replace(/\D/g, ""))}
                placeholder="4 to 8 digits"
                maxLength={8}
              />
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-[#FEF3C7] border border-[#FCD34D] rounded-xl">
            <AlertCircle className="h-5 w-5 text-[#D97706] mt-0.5 flex-shrink-0" />
            <div className="text-sm text-[#92400E]">
              <p className="font-medium mb-1">How to get your API token</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Log in to your Delhivery One / seller dashboard</li>
                <li>Go to API Settings and generate an API token</li>
                <li>Paste it here and click Test Connection</li>
              </ol>
              <p className="mt-2 text-xs">
                GST number and HSN code are sent with every shipment. Fill them in if your Delhivery
                account does not already have them on file.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleTestConnection} disabled={busy !== null || !hasToken}>
              {busy === "test" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Test Connection
            </Button>
            <Button onClick={handleSaveCredentials} disabled={busy !== null}>
              {busy === "credentials" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Credentials
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Default shipping dimensions */}
      <Card className={CARD}>
        <CardHeader className="px-6 pt-6 pb-4">
          <CardTitle className="text-lg font-semibold text-[#1F2937] flex items-center">
            <Package className="h-5 w-5 mr-2 text-[#4CAF50]" />
            Default Shipping Dimensions
          </CardTitle>
          <p className="text-sm text-[#9CA3AF] mt-1">
            Fallback dimensions used when a product variant doesn&apos;t specify its own
          </p>
        </CardHeader>
        <CardContent className="px-6 pb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { id: "len", label: "Length (cm)", value: length, set: setLength },
              { id: "bre", label: "Breadth (cm)", value: breadth, set: setBreadth },
              { id: "hei", label: "Height (cm)", value: height, set: setHeight },
              { id: "wei", label: "Weight (kg)", value: weight, set: setWeight },
            ].map((item) => (
              <div key={item.id} className="space-y-2">
                <Label htmlFor={item.id}>{item.label}</Label>
                <Input
                  id={item.id}
                  type="number"
                  min="0"
                  step="any"
                  value={item.value}
                  onChange={(event) => item.set(event.target.value)}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveDimensions} disabled={busy !== null}>
              {busy === "dimensions" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Booking mode */}
      <Card className={CARD}>
        <CardHeader className="px-6 pt-6 pb-4">
          <CardTitle className="text-lg font-semibold text-[#1F2937] flex items-center">
            <Package className="h-5 w-5 mr-2 text-[#4CAF50]" />
            Shipment Booking Mode
          </CardTitle>
          <p className="text-sm text-[#9CA3AF] mt-1">Choose how shipments are created in Delhivery</p>
        </CardHeader>
        <CardContent className="px-6 pb-6 space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <OptionCard
              selected={bookingMode === "AUTO"}
              title="Auto (Recommended)"
              description="Shipments are automatically created in Delhivery when a customer places an order and Delhivery is the default courier. A waybill is assigned automatically."
              onClick={() => setBookingMode("AUTO")}
            />
            <OptionCard
              selected={bookingMode === "MANUAL"}
              title="Manual"
              description="Shipments are NOT created automatically. You book each shipment manually from the order details page when ready to ship."
              onClick={() => setBookingMode("MANUAL")}
            />
          </div>
          <div className="flex justify-end border-t border-[#E5E7EB] pt-5">
            <Button
              onClick={() => save("mode", { bookingMode }, "Booking mode saved")}
              disabled={busy !== null || bookingMode === settings?.bookingMode}
            >
              {busy === "mode" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Booking Mode
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Shipping speed */}
      <Card className={CARD}>
        <CardHeader className="px-6 pt-6 pb-4">
          <CardTitle className="text-lg font-semibold text-[#1F2937] flex items-center">
            <Truck className="h-5 w-5 mr-2 text-[#4CAF50]" />
            Shipping Speed
          </CardTitle>
          <p className="text-sm text-[#9CA3AF] mt-1">Which Delhivery service shipments book as by default</p>
        </CardHeader>
        <CardContent className="px-6 pb-6 space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <OptionCard
              selected={shippingSpeed === "SURFACE"}
              title="Surface (Recommended)"
              description="Standard ground shipping — slower, lower cost."
              onClick={() => setShippingSpeed("SURFACE")}
            />
            <OptionCard
              selected={shippingSpeed === "EXPRESS"}
              title="Express"
              description="Air/priority shipping — faster, higher cost."
              onClick={() => setShippingSpeed("EXPRESS")}
            />
          </div>
          <div className="flex items-start gap-3 p-4 bg-[#FEF3C7] border border-[#FCD34D] rounded-xl">
            <AlertCircle className="h-5 w-5 text-[#D97706] mt-0.5 flex-shrink-0" />
            <p className="text-sm text-[#92400E]">
              If Delhivery keeps booking Express even with Surface selected here, check your Delhivery
              seller dashboard — some accounts have the pickup location/warehouse itself registered for
              Express only, which overrides this setting.
            </p>
          </div>
          <div className="flex justify-end border-t border-[#E5E7EB] pt-5">
            <Button
              onClick={() => save("speed", { shippingSpeed }, "Shipping speed saved")}
              disabled={busy !== null || shippingSpeed === settings?.shippingSpeed}
            >
              {busy === "speed" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Shipping Speed
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pickup addresses */}
      <Card className={CARD}>
        <CardHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold text-[#1F2937] flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-[#4CAF50]" />
                Pickup Addresses
              </CardTitle>
              <p className="text-sm text-[#9CA3AF] mt-1">
                Warehouses Delhivery picks up shipments from (shared with Shiprocket)
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-1" />
              Add Address
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {addresses.length === 0 ? (
            <div className="text-center py-8 text-[#9CA3AF]">
              <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No pickup addresses yet</p>
              <p className="text-sm">Add the warehouse your parcels leave from.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {addresses.map((address) => (
                <div
                  key={address.id}
                  className="flex flex-col gap-3 rounded-xl border border-[#E5E7EB] p-4 transition-colors hover:border-[#4CAF50] sm:flex-row sm:items-start sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-[#1F2937]">{address.nickname}</span>
                      {address.isDefault && (
                        <span className="rounded-full bg-[#EFF6FF] px-2 py-0.5 text-xs text-[#3B82F6]">Default</span>
                      )}
                      {address.delhiverySynced ? (
                        <span className="rounded-full bg-[#ECFDF5] px-2 py-0.5 text-xs text-[#22C55E]">Synced</span>
                      ) : (
                        <span className="rounded-full bg-[#FFFBEB] px-2 py-0.5 text-xs text-[#B45309]">Not in Delhivery yet</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-[#6B7280]">
                      {address.name} • {address.phone}
                    </p>
                    <p className="text-sm text-[#9CA3AF]">
                      {address.address}, {address.city}, {address.state} - {address.pincode}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!address.delhiverySynced && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSyncAddress(address)}
                        disabled={syncingId === address.id}
                      >
                        {syncingId === address.id ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-1" />
                        )}
                        Sync
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(address)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => handleDeleteAddress(address)}
                      aria-label={`Delete ${address.nickname}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / edit warehouse */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Pickup Address" : "Add Pickup Address"}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">{field("nickname", "Warehouse name", false)}</div>
            {field("name", "Contact name")}
            {field("phone", "Phone", true, "tel")}
            <div className="sm:col-span-2">{field("email", "Email", true, "email")}</div>
            <div className="sm:col-span-2">{field("address", "Address")}</div>
            <div className="sm:col-span-2">{field("address2", "Address line 2", false)}</div>
            {field("city", "City")}
            {field("state", "State")}
            {field("pincode", "Pincode")}
            {field("country", "Country", false)}
          </div>

          <p className="text-xs text-[#9CA3AF]">
            The warehouse name is what couriers match on, so keep it short and unique. Renaming a
            warehouse registers it again with each courier.
          </p>

          <div className="flex items-center justify-between rounded-lg bg-[#F9FAFB] p-3">
            <Label htmlFor="addr-default" className="cursor-pointer">Use as the default warehouse</Label>
            <Switch
              id="addr-default"
              checked={form.isDefault}
              onCheckedChange={(checked) => setForm({ ...form, isDefault: checked })}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAddress} disabled={busy === "address"}>
              {busy === "address" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? "Save changes" : "Add address"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
