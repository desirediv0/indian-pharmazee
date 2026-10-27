import { useEffect, useMemo, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/api/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ExportColumn {
  key: string;
  label: string;
  group: "product" | "variant";
}

interface PickOption {
  id: string;
  name: string;
}

interface ProductExportDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  // Filters currently applied on the products list (used as the starting point)
  search: string;
  category: string;
}

// Columns selected the first time the dialog opens
const DEFAULT_KEYS = [
  "productId",
  "name",
  "brandName",
  "categories",
  "isActive",
  "variantId",
  "sku",
  "variantAttributes",
  "price",
  "salePrice",
  "quantity",
];

const GROUP_TITLES: Record<ExportColumn["group"], string> = {
  product: "Product details",
  variant: "Variants, price & stock",
};

const selectClass =
  "rounded-md border border-[#E5E7EB] bg-white px-3 py-1.5 text-sm w-full";

// A scrollable checklist with a search box (categories / brands can be long)
function CheckList({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: PickOption[];
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const shown = options.filter((o) =>
    o.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div className="rounded-md border border-[#E5E7EB] p-2 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-[#4B5563]">
          {title} {value.length > 0 ? `(${value.length} selected)` : "(all)"}
        </span>
        {value.length > 0 && (
          <button
            type="button"
            className="text-xs text-primary hover:underline"
            onClick={() => onChange([])}
          >
            Clear
          </button>
        )}
      </div>
      <Input
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-8 text-sm"
      />
      <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
        {options.length === 0 ? (
          <p className="text-xs text-[#9CA3AF]">Nothing to pick from.</p>
        ) : shown.length === 0 ? (
          <p className="text-xs text-[#9CA3AF]">No match.</p>
        ) : (
          shown.map((option) => (
            <label
              key={option.id}
              className="flex items-start gap-2 text-sm cursor-pointer"
            >
              <Checkbox
                className="mt-0.5"
                checked={value.includes(option.id)}
                onCheckedChange={(checked) =>
                  onChange(
                    checked === true
                      ? [...value, option.id]
                      : value.filter((id) => id !== option.id)
                  )
                }
              />
              <span>{option.name}</span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}

export function ProductExportDialog({
  open,
  setOpen,
  search: listSearch,
  category: listCategory,
}: ProductExportDialogProps) {
  const [columns, setColumns] = useState<ExportColumn[]>([]);
  const [categories, setCategories] = useState<PickOption[]>([]);
  const [subCategories, setSubCategories] = useState<PickOption[]>([]);
  const [brands, setBrands] = useState<PickOption[]>([]);
  const [lowStockLimit, setLowStockLimit] = useState(10);
  const [optionsLoaded, setOptionsLoaded] = useState(false);

  const [selected, setSelected] = useState<string[]>(DEFAULT_KEYS);
  const [scope, setScope] = useState<"all" | "limit">("all");
  const [limit, setLimit] = useState("100");
  const [format, setFormat] = useState<"xlsx" | "csv">("xlsx");

  const [search, setSearch] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [subCategoryIds, setSubCategoryIds] = useState<string[]>([]);
  const [brandIds, setBrandIds] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [featured, setFeatured] = useState("");
  const [ourProduct, setOurProduct] = useState("");
  const [stock, setStock] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");

  const [exporting, setExporting] = useState(false);

  // Load the pickers once
  useEffect(() => {
    if (!open || optionsLoaded) return;
    api
      .get("/api/admin/products/export/options")
      .then((response) => {
        const data = response.data?.data ?? {};
        setColumns(data.columns ?? []);
        setCategories(data.categories ?? []);
        setSubCategories(data.subCategories ?? []);
        setBrands(data.brands ?? []);
        if (data.lowStockLimit) setLowStockLimit(data.lowStockLimit);
        setOptionsLoaded(true);
      })
      .catch(() => toast.error("Could not load the export options"));
  }, [open, optionsLoaded]);

  // Each time the dialog opens, start from what the list is showing
  useEffect(() => {
    if (!open) return;
    setSearch(listSearch);
    setCategoryIds(listCategory ? [listCategory] : []);
  }, [open, listSearch, listCategory]);

  const grouped = useMemo(
    () =>
      (["product", "variant"] as const).map((group) => ({
        group,
        items: columns.filter((c) => c.group === group),
      })),
    [columns]
  );

  const toggleColumn = (key: string, checked: boolean) =>
    setSelected((prev) =>
      checked ? [...new Set([...prev, key])] : prev.filter((k) => k !== key)
    );

  const resetFilters = () => {
    setSearch("");
    setCategoryIds([]);
    setSubCategoryIds([]);
    setBrandIds([]);
    setStatus("");
    setFeatured("");
    setOurProduct("");
    setStock("");
    setMinPrice("");
    setMaxPrice("");
    setCreatedFrom("");
    setCreatedTo("");
  };

  const handleExport = async () => {
    if (selected.length === 0) {
      toast.error("Select at least one column");
      return;
    }
    const limitNumber = Number.parseInt(limit, 10);
    if (scope === "limit" && (!limitNumber || limitNumber < 1)) {
      toast.error("Enter how many products to export");
      return;
    }
    if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
      toast.error("Minimum price is more than the maximum price");
      return;
    }
    if (createdFrom && createdTo && createdFrom > createdTo) {
      toast.error("The 'from' date is after the 'to' date");
      return;
    }

    setExporting(true);
    try {
      // Keep the order of the columns the same as in the dialog
      const fields = columns.map((c) => c.key).filter((k) => selected.includes(k));
      const response = await api.get("/api/admin/products/export", {
        params: {
          scope,
          format,
          fields: fields.join(","),
          ...(scope === "limit" ? { limit: limitNumber } : {}),
          ...(search.trim() ? { search: search.trim() } : {}),
          ...(categoryIds.length ? { categoryIds: categoryIds.join(",") } : {}),
          ...(subCategoryIds.length
            ? { subCategoryIds: subCategoryIds.join(",") }
            : {}),
          ...(brandIds.length ? { brandIds: brandIds.join(",") } : {}),
          ...(status ? { isActive: status } : {}),
          ...(featured ? { featured } : {}),
          ...(ourProduct ? { ourProduct } : {}),
          ...(stock ? { stock } : {}),
          ...(minPrice ? { minPrice } : {}),
          ...(maxPrice ? { maxPrice } : {}),
          ...(createdFrom ? { createdFrom } : {}),
          ...(createdTo ? { createdTo } : {}),
        },
        responseType: "blob",
        timeout: 0, // a large catalog can take longer than the default 60s
      });

      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `products-${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      toast.success("Export downloaded");
      setOpen(false);
    } catch (error: any) {
      // With responseType "blob" the error message arrives as a Blob too
      let message = "Export failed";
      try {
        const text = await error?.response?.data?.text?.();
        if (text) message = JSON.parse(text).message || message;
      } catch {
        // keep the generic message
      }
      toast.error(message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !exporting && setOpen(next)}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export products</DialogTitle>
          <DialogDescription>
            Choose which products and which details you need. Each variant is
            one row in the file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* How many */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">How many products?</Label>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="export-scope"
                  checked={scope === "all"}
                  onChange={() => setScope("all")}
                />
                All matching products
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="export-scope"
                  checked={scope === "limit"}
                  onChange={() => setScope("limit")}
                />
                Only the latest
                <Input
                  type="number"
                  min={1}
                  max={50000}
                  value={limit}
                  disabled={scope !== "limit"}
                  onChange={(e) => setLimit(e.target.value)}
                  className="h-8 w-24"
                />
                products
              </label>
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Filters</Label>
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={resetFilters}
              >
                Reset all filters
              </button>
            </div>

            <Input
              placeholder="Search name, brand, description or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <CheckList
                title="Categories"
                options={categories}
                value={categoryIds}
                onChange={setCategoryIds}
              />
              <CheckList
                title="Sub categories"
                options={subCategories}
                value={subCategoryIds}
                onChange={setSubCategoryIds}
              />
              <CheckList
                title="Brands"
                options={brands}
                value={brandIds}
                onChange={setBrandIds}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <span className="text-xs text-[#6B7280]">Status</span>
                <select
                  className={selectClass}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="true">Active only</option>
                  <option value="false">Inactive only</option>
                </select>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-[#6B7280]">Stock</span>
                <select
                  className={selectClass}
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="in">In stock</option>
                  <option value="low">{`Low stock (1-${lowStockLimit})`}</option>
                  <option value="out">Out of stock</option>
                </select>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-[#6B7280]">Featured</span>
                <select
                  className={selectClass}
                  value={featured}
                  onChange={(e) => setFeatured(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="true">Featured only</option>
                  <option value="false">Not featured</option>
                </select>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-[#6B7280]">Our product</span>
                <select
                  className={selectClass}
                  value={ourProduct}
                  onChange={(e) => setOurProduct(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="true">Our products only</option>
                  <option value="false">Other products</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <span className="text-xs text-[#6B7280]">Price from</span>
                <Input
                  type="number"
                  min={0}
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-[#6B7280]">Price to</span>
                <Input
                  type="number"
                  min={0}
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-[#6B7280]">Added from</span>
                <Input
                  type="date"
                  value={createdFrom}
                  onChange={(e) => setCreatedFrom(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-[#6B7280]">Added until</span>
                <Input
                  type="date"
                  value={createdTo}
                  onChange={(e) => setCreatedTo(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
            <p className="text-xs text-[#9CA3AF]">
              Price and stock filters apply to each variant, so only the
              matching variants are written to the file.
            </p>
          </div>

          {/* Columns */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">
                What to include ({selected.length} selected)
              </Label>
              <div className="flex gap-3 text-xs">
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => setSelected(columns.map((c) => c.key))}
                >
                  Select all
                </button>
                <button
                  type="button"
                  className="text-[#6B7280] hover:underline"
                  onClick={() => setSelected([])}
                >
                  Clear
                </button>
              </div>
            </div>

            {columns.length === 0 ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#9CA3AF]" />
            ) : (
              grouped.map(({ group, items }) => (
                <div key={group} className="rounded-md bg-[#F9FAFB] p-3">
                  <p className="text-xs font-medium text-[#4B5563] mb-2">
                    {GROUP_TITLES[group]}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                    {items.map((column) => (
                      <label
                        key={column.key}
                        className="flex items-start gap-2 text-sm cursor-pointer"
                      >
                        <Checkbox
                          className="mt-0.5"
                          checked={selected.includes(column.key)}
                          onCheckedChange={(checked) =>
                            toggleColumn(column.key, checked === true)
                          }
                        />
                        <span>{column.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* File type */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">File type</Label>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="export-format"
                  checked={format === "xlsx"}
                  onChange={() => setFormat("xlsx")}
                />
                Excel (.xlsx)
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="export-format"
                  checked={format === "csv"}
                  onChange={() => setFormat("csv")}
                />
                CSV (.csv)
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={exporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={exporting || columns.length === 0}>
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {exporting ? "Preparing..." : "Download"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
