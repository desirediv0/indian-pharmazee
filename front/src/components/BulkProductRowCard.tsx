import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import JoditEditor from "jodit-react";
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  Plus,
  Layers,
  Sparkles,
  X,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/context/LanguageContext";
import { joditEditorConfig } from "@/config/joditEditorConfig";
import {
  BulkProductRow,
  BulkVariantRow,
  cartesianVariants,
  createEmptyVariantRow,
} from "@/utils/bulkProductUtils";

function RequiredLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label>
      {children} <span className="text-red-500">*</span>
    </Label>
  );
}

function ImageDropzone({
  files,
  onChange,
  label,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  label: string;
}) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (accepted) => onChange([...files, ...accepted]),
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    multiple: true,
  });

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          isDragActive ? "border-[#2E7D32] bg-green-50" : "border-gray-200 hover:border-[#2E7D32]/50"
        }`}
      >
        <input {...getInputProps()} />
        <ImageIcon className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
        <p className="text-xs text-muted-foreground">Drop images or click</p>
      </div>
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((file, i) => (
            <div key={`${file.name}-${i}`} className="relative group">
              <img
                src={URL.createObjectURL(file)}
                alt=""
                className="h-16 w-16 object-cover rounded border"
              />
              <button
                type="button"
                onClick={() => onChange(files.filter((_, idx) => idx !== i))}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VariantRowEditor({
  variant,
  index,
  autoSku,
  onChange,
  onRemove,
}: {
  variant: BulkVariantRow;
  index: number;
  autoSku: boolean;
  onChange: (v: BulkVariantRow) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <Card className="border border-gray-100">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <button type="button" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <span className="font-medium text-sm">Variant {index + 1}</span>
            {variant.attributePairs.map((p) => (
              <Badge key={`${p.attributeName}-${p.value}`} variant="outline" className="text-xs">
                {p.attributeName}: {p.value}
              </Badge>
            ))}
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0 px-4 pb-4 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <RequiredLabel>Price</RequiredLabel>
              <Input
                type="number"
                min="0"
                value={variant.price}
                onChange={(e) => onChange({ ...variant, price: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Sale Price (optional)</Label>
              <Input
                type="number"
                min="0"
                value={variant.salePrice}
                onChange={(e) => onChange({ ...variant, salePrice: e.target.value })}
              />
            </div>
            <div>
              <RequiredLabel>Stock</RequiredLabel>
              <Input
                type="number"
                min="0"
                value={variant.quantity}
                onChange={(e) => onChange({ ...variant, quantity: e.target.value })}
              />
            </div>
            {!autoSku && (
              <div>
                <Label className="text-xs">SKU (optional)</Label>
                <Input
                  value={variant.sku}
                  onChange={(e) => onChange({ ...variant, sku: e.target.value })}
                />
              </div>
            )}
          </div>
          <ImageDropzone
            label="Variant images (multiple) — optional"
            files={variant.images}
            onChange={(images) => onChange({ ...variant, images })}
          />
        </CardContent>
      )}
    </Card>
  );
}

interface BulkProductRowCardProps {
  row: BulkProductRow;
  index: number;
  allCategories: { id: string; name: string }[];
  subCategoriesMap?: Record<string, { id: string; name: string }[]>;
  allAttributes?: { id: string; name: string; values: { id: string; value: string }[] }[];
  brandsList: { id: string; name: string }[];
  autoSku: boolean;
  onChange: (r: BulkProductRow) => void;
  onRemove: () => void;
}

export default function BulkProductRowCard({
  row,
  index,
  allCategories,
  subCategoriesMap = {},
  allAttributes,
  brandsList,
  autoSku,
  onChange,
  onRemove,
}: BulkProductRowCardProps) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(true);
  const [newAttrName, setNewAttrName] = useState("");
  const [newAttrValue, setNewAttrValue] = useState<Record<number, string>>({});
  const [newCatInput, setNewCatInput] = useState("");

  const editorConfig = useMemo(() => joditEditorConfig, []);
  const hasErrors = (row.validationErrors?.length ?? 0) > 0;

  const productTypeOptions = [
    { key: "featured", label: t("products.form.settings.types.featured"), icon: "⭐" },
    { key: "bestseller", label: t("products.form.settings.types.bestseller"), icon: "📈" },
    { key: "trending", label: t("products.form.settings.types.trending"), icon: "🔥" },
    { key: "new", label: t("products.form.settings.types.new"), icon: "🆕" },
  ];

  const toggleCategory = (catId: string, checked: boolean) => {
    const next = checked
      ? [...row.categoryIds, catId]
      : row.categoryIds.filter((id) => id !== catId);
    const primary =
      row.primaryCategoryId && next.includes(row.primaryCategoryId)
        ? row.primaryCategoryId
        : next[0] || "";
    onChange({ ...row, categoryIds: next, primaryCategoryId: primary });
  };

  const addNewCategoryName = () => {
    const trimmed = newCatInput.trim();
    if (!trimmed) return;
    if (!row.newCategoryNames.some((n) => n.toLowerCase() === trimmed.toLowerCase())) {
      onChange({
        ...row,
        newCategoryNames: [...row.newCategoryNames, trimmed],
      });
    }
    setNewCatInput("");
  };

  const generateVariants = () => {
    const combos = cartesianVariants(row.attributeConfigs);
    if (combos.length === 0) {
      toast.error(t("bulk_products.add_attribute_first"));
      return;
    }
    const newVariants = combos.map((pairs) => {
      const existing = row.variants.find(
        (v) =>
          v.attributePairs.length === pairs.length &&
          pairs.every((p) =>
            v.attributePairs.some(
              (ap) => ap.attributeName === p.attributeName && ap.value === p.value
            )
          )
      );
      return existing || createEmptyVariantRow(pairs);
    });
    onChange({ ...row, variants: newVariants });
    toast.success(t("bulk_products.variants_generated", { count: newVariants.length }));
  };

  return (
    <Card
      id={`bulk-product-${row.id}`}
      className={`border-2 shadow-sm ${
        hasErrors ? "border-red-400 ring-1 ring-red-200" : "border-gray-100"
      }`}
    >
      <CardHeader className="bg-gray-50/80 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2E7D32] text-white font-bold text-sm">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <RequiredLabel>{t("bulk_products.product_name")}</RequiredLabel>
              <Input
                value={row.name}
                onChange={(e) => onChange({ ...row, name: e.target.value })}
                className={`font-medium bg-white mt-1 ${
                  row.validationErrors?.some((e) => e.field === "name")
                    ? "border-red-500"
                    : ""
                }`}
                placeholder={t("products.form.placeholders.enter_name")}
              />
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button type="button" variant="ghost" size="icon" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
        {hasErrors && (
          <div className="mt-3 rounded-md bg-red-50 border border-red-200 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <ul className="text-xs text-red-700 space-y-1">
                {row.validationErrors!.map((err, i) => (
                  <li key={i}>{err.message}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardHeader>

      {expanded && (
        <CardContent className="p-5 space-y-5">
          {/* Basic info */}
          <div className="rounded-lg border p-4 bg-white space-y-4">
            <h3 className="font-semibold text-sm text-gray-800">
              {t("products.form.sections.basic_info")}
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>{t("products.form.labels.description")} (optional)</Label>
                <div
                  className={`border rounded-md overflow-hidden mt-1 ${
                    row.validationErrors?.some((e) => e.field === "description")
                      ? "border-red-500"
                      : ""
                  }`}
                >
                  <JoditEditor
                    value={row.description}
                    config={editorConfig}
                    onBlur={(content: string) => onChange({ ...row, description: content })}
                    onChange={(content: string) => onChange({ ...row, description: content })}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("bulk_products.jodit_hint")}
                </p>
              </div>

              <div>
                <RequiredLabel>{t("bulk_products.categories")}</RequiredLabel>
                <p className="text-xs text-muted-foreground mb-2">
                  {t("bulk_products.categories_checkbox_hint")}
                </p>
                <div
                  className={`border rounded-md p-3 max-h-36 overflow-y-auto space-y-2 ${
                    row.validationErrors?.some((e) => e.field === "category")
                      ? "border-red-500"
                      : ""
                  }`}
                >
                  {allCategories.length === 0 ? (
                    <p className="text-xs text-muted-foreground">{t("bulk_products.no_categories")}</p>
                  ) : (
                    allCategories.map((cat) => (
                      <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={row.categoryIds.includes(cat.id)}
                          onCheckedChange={(c) => toggleCategory(cat.id, !!c)}
                        />
                        <span className="text-sm">{cat.name}</span>
                      </label>
                    ))
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {row.newCategoryNames.map((n) => (
                    <Badge key={n} variant="secondary" className="gap-1">
                      + {n}
                      <button
                        type="button"
                        onClick={() =>
                          onChange({
                            ...row,
                            newCategoryNames: row.newCategoryNames.filter((x) => x !== n),
                          })
                        }
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder={t("bulk_products.new_category_placeholder")}
                    value={newCatInput}
                    onChange={(e) => setNewCatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addNewCategoryName();
                      }
                    }}
                    className="h-8 text-sm"
                  />
                  <Button type="button" size="sm" variant="outline" onClick={addNewCategoryName}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                {(row.categoryIds.length > 0 || row.newCategoryNames.length > 0) && (
                  <div className="mt-2">
                    <Label className="text-xs">{t("bulk_products.primary_category")}</Label>
                    <select
                      className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                      value={row.primaryCategoryId}
                      onChange={(e) => onChange({ ...row, primaryCategoryId: e.target.value })}
                    >
                      <option value="">{t("bulk_products.auto_primary")}</option>
                      {row.categoryIds.map((id) => {
                        const cat = allCategories.find((c) => c.id === id);
                        return cat ? (
                          <option key={id} value={id}>
                            {cat.name}
                          </option>
                        ) : null;
                      })}
                    </select>
                  </div>
                )}

                {/* Sub-categories for selected categories */}
                {row.categoryIds.length > 0 && row.categoryIds.some((id) => (subCategoriesMap[id] || []).length > 0) && (
                  <div className="mt-3">
                    <Label className="text-xs text-muted-foreground">
                      {t("products.form.categories.sub_categories_optional")}
                    </Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      {t("products.form.categories.select_sub_categories_hint")}
                    </p>
                    <div className="border rounded-md p-3 max-h-36 overflow-y-auto space-y-3">
                      {row.categoryIds.map((catId) => {
                        const subs = subCategoriesMap[catId] || [];
                        if (subs.length === 0) return null;
                        const cat = allCategories.find((c) => c.id === catId);
                        return (
                          <div key={catId}>
                            <p className="text-xs font-medium text-gray-600 mb-1">{cat?.name}</p>
                            <div className="space-y-1 pl-2">
                              {subs.map((sub) => (
                                <label key={sub.id} className="flex items-center gap-2 cursor-pointer">
                                  <Checkbox
                                    checked={(row.subCategoryIds || []).includes(sub.id)}
                                    onCheckedChange={(checked) => {
                                      const current = row.subCategoryIds || [];
                                      const next = checked
                                        ? [...current, sub.id]
                                        : current.filter((id) => id !== sub.id);
                                      onChange({ ...row, subCategoryIds: next });
                                    }}
                                  />
                                  <span className="text-sm">{sub.name}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {(row.subCategoryIds || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(row.subCategoryIds || []).map((subId) => {
                          let name = "";
                          for (const subs of Object.values(subCategoriesMap)) {
                            const found = subs.find((s) => s.id === subId);
                            if (found) { name = found.name; break; }
                          }
                          return (
                            <Badge key={subId} variant="secondary" className="gap-1 text-xs">
                              {name}
                              <button
                                type="button"
                                onClick={() =>
                                  onChange({
                                    ...row,
                                    subCategoryIds: (row.subCategoryIds || []).filter((id) => id !== subId),
                                  })
                                }
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <Label>{t("products.form.labels.brand_optional")}</Label>
                <select
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  value={row.brandId}
                  onChange={(e) => onChange({ ...row, brandId: e.target.value })}
                >
                  <option value="">{t("products.form.placeholders.select_brand")}</option>
                  {brandsList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="rounded-lg border p-4 bg-gray-50 space-y-4">
            <h3 className="font-semibold text-sm">{t("products.form.settings.product_settings")}</h3>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={row.isActive}
                  onCheckedChange={(c) => onChange({ ...row, isActive: !!c })}
                />
                <Label>{t("products.form.labels.active")}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={row.ourProduct}
                  onCheckedChange={(c) => onChange({ ...row, ourProduct: !!c })}
                />
                <Label>{t("products.form.labels.our_product")}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Label>{t("bulk_products.has_variants")}</Label>
                <Switch
                  checked={row.hasVariants}
                  onCheckedChange={(hasVariants) =>
                    onChange({
                      ...row,
                      hasVariants,
                      variants: hasVariants ? row.variants : [],
                    })
                  }
                />
              </div>
            </div>
            <div>
              <Label>{t("products.form.settings.product_type")} (optional)</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {productTypeOptions.map((type) => (
                  <label key={type.key} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={row.productType.includes(type.key)}
                      onCheckedChange={(checked) => {
                        onChange({
                          ...row,
                          productType: checked
                            ? [...row.productType, type.key]
                            : row.productType.filter((k) => k !== type.key),
                          featured:
                            type.key === "featured"
                              ? !!checked
                              : row.featured,
                        });
                      }}
                    />
                    <span className="text-sm">
                      {type.icon} {type.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {!row.hasVariants ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <RequiredLabel>{t("bulk_products.price")}</RequiredLabel>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.price}
                    onChange={(e) => onChange({ ...row, price: e.target.value })}
                    className={
                      row.validationErrors?.some((e) => e.field === "price") ? "border-red-500" : ""
                    }
                  />
                </div>
                <div>
                  <Label>{t("bulk_products.sale_price")} (optional)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.salePrice}
                    onChange={(e) => onChange({ ...row, salePrice: e.target.value })}
                  />
                </div>
                <div>
                  <RequiredLabel>{t("bulk_products.stock")}</RequiredLabel>
                  <Input
                    type="number"
                    min="0"
                    value={row.quantity}
                    onChange={(e) => onChange({ ...row, quantity: e.target.value })}
                    className={
                      row.validationErrors?.some((e) => e.field === "quantity")
                        ? "border-red-500"
                        : ""
                    }
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{t("bulk_products.sku_auto_note")}</p>
              <ImageDropzone
                label={`${t("bulk_products.product_images")} (optional)`}
                files={row.images}
                onChange={(images) => onChange({ ...row, images })}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  {t("bulk_products.attributes")}
                </Label>
                <p className="text-xs text-muted-foreground mb-3">{t("bulk_products.attributes_hint")}</p>
                {row.attributeConfigs.map((attr, attrIdx) => (
                  <Card key={`${attr.name}-${attrIdx}`} className="mb-3 p-3 bg-gray-50/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{attr.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          onChange({
                            ...row,
                            attributeConfigs: row.attributeConfigs.filter((_, i) => i !== attrIdx),
                          })
                        }
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {attr.values.map((v) => (
                        <Badge key={v} variant="secondary" className="gap-1">
                          {v}
                          <button
                            type="button"
                            onClick={() => {
                              const configs = [...row.attributeConfigs];
                              configs[attrIdx] = {
                                ...configs[attrIdx],
                                values: configs[attrIdx].values.filter((x) => x !== v),
                              };
                              onChange({ ...row, attributeConfigs: configs });
                            }}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-100">
                      {(() => {
                        const existingAttr = allAttributes?.find((a) => a.name.toLowerCase() === attr.name.toLowerCase());
                        if (existingAttr && existingAttr.values && existingAttr.values.length > 0) {
                          return (
                            <div className="flex flex-col gap-1.5">
                              <Label className="text-xs text-muted-foreground">Select existing value</Label>
                              <select
                                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                onChange={(e) => {
                                  if (e.target.value) {
                                    const val = e.target.value;
                                    if (!attr.values.includes(val)) {
                                      const configs = [...row.attributeConfigs];
                                      configs[attrIdx] = {
                                        ...configs[attrIdx],
                                        values: [...configs[attrIdx].values, val],
                                      };
                                      onChange({ ...row, attributeConfigs: configs });
                                    }
                                    e.target.value = "";
                                  }
                                }}
                              >
                                <option value="" disabled selected>Choose a value...</option>
                                {existingAttr.values.map((v) => (
                                  <option key={v.id} value={v.value}>
                                    {v.value}
                                  </option>
                                ))}
                              </select>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs text-muted-foreground">Or type new value & press Enter</Label>
                        <Input
                          placeholder="Type custom value..."
                          value={newAttrValue[attrIdx] || ""}
                          onChange={(e) =>
                            setNewAttrValue({ ...newAttrValue, [attrIdx]: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const val = (newAttrValue[attrIdx] || "").trim();
                              if (val && !attr.values.includes(val)) {
                                const configs = [...row.attributeConfigs];
                                configs[attrIdx] = {
                                  ...configs[attrIdx],
                                  values: [...configs[attrIdx].values, val],
                                };
                                onChange({ ...row, attributeConfigs: configs });
                                setNewAttrValue({ ...newAttrValue, [attrIdx]: "" });
                              }
                            }
                          }}
                          className="h-9 text-sm w-full"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
                <div className="mt-4 p-4 border rounded-md bg-white space-y-4 shadow-sm">
                  <h4 className="text-sm font-medium text-gray-800">Add New Attribute</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Select Existing */}
                    <div className="flex flex-col gap-2 md:border-r md:pr-6">
                      <Label className="text-xs text-muted-foreground font-medium">1. Select from existing attributes</Label>
                      <select
                        className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        onChange={(e) => {
                          if (e.target.value) {
                            const val = e.target.value;
                            if (!row.attributeConfigs.some(a => a.name.toLowerCase() === val.toLowerCase())) {
                              onChange({
                                ...row,
                                attributeConfigs: [
                                  ...row.attributeConfigs,
                                  { name: val, values: [] },
                                ],
                              });
                            }
                            e.target.value = "";
                          }
                        }}
                      >
                        <option value="" disabled selected>Choose attribute...</option>
                        {allAttributes?.map((attr) => (
                          <option key={attr.id} value={attr.name}>
                            {attr.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Create Custom */}
                    <div className="flex flex-col gap-2">
                      <Label className="text-xs text-muted-foreground font-medium">2. Or create a custom attribute</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="e.g. Material, Pattern..."
                          value={newAttrName}
                          onChange={(e) => setNewAttrName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              if (newAttrName.trim()) {
                                if (!row.attributeConfigs.some(a => a.name.toLowerCase() === newAttrName.trim().toLowerCase())) {
                                  onChange({
                                    ...row,
                                    attributeConfigs: [
                                      ...row.attributeConfigs,
                                      { name: newAttrName.trim(), values: [] },
                                    ],
                                  });
                                }
                                setNewAttrName("");
                              }
                            }
                          }}
                          className="flex-1 h-9"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="h-9 w-9 p-0 bg-gray-50"
                          onClick={() => {
                            if (newAttrName.trim()) {
                              if (!row.attributeConfigs.some(a => a.name.toLowerCase() === newAttrName.trim().toLowerCase())) {
                                onChange({
                                  ...row,
                                  attributeConfigs: [
                                    ...row.attributeConfigs,
                                    { name: newAttrName.trim(), values: [] },
                                  ],
                                });
                              }
                              setNewAttrName("");
                            }
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={generateVariants}
                  className="bg-[#2E7D32] hover:bg-[#1B5E20]"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {t("bulk_products.generate_variants")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    onChange({
                      ...row,
                      variants: [...row.variants, createEmptyVariantRow()],
                    })
                  }
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t("bulk_products.add_variant_manual")}
                </Button>
              </div>
              {row.validationErrors?.some((e) => e.field === "variants") && (
                <p className="text-xs text-red-600">{t("bulk_products.add_attribute_first")}</p>
              )}
              <div className="space-y-3">
                {row.variants.map((variant, vIdx) => (
                  <VariantRowEditor
                    key={variant.id}
                    variant={variant}
                    index={vIdx}
                    autoSku={autoSku}
                    onChange={(v) => {
                      const variants = [...row.variants];
                      variants[vIdx] = v;
                      onChange({ ...row, variants });
                    }}
                    onRemove={() =>
                      onChange({
                        ...row,
                        variants: row.variants.filter((_, i) => i !== vIdx),
                      })
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

