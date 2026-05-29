import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Package, Upload, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { Resource, Action } from "@/types/admin";
import { categories, attributes, brands, subCategories } from "@/api/adminService";
import BulkProductsGuide from "@/components/BulkProductsGuide";
import BulkProductRowCard from "@/components/BulkProductRowCard";
import {
  BulkProductRow,
  BulkSubmitResult,
  MAX_BULK_PRODUCTS,
  ResolveCache,
  createEmptyProductRow,
  createSimpleProductExample,
  createVariantProductExample,
  submitBulkProductsSequential,
  validateBulkProduct,
} from "@/utils/bulkProductUtils";

export default function BulkProductsPage() {
  const { t } = useLanguage();
  const { admin } = useAuth();
  const [rows, setRows] = useState<BulkProductRow[]>([createEmptyProductRow()]);
  const [autoSku, setAutoSku] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<BulkSubmitResult[] | null>(null);
  const [allCategories, setAllCategories] = useState<{ id: string; name: string }[]>([]);
  const [brandsList, setBrandsList] = useState<{ id: string; name: string }[]>([]);
  const [allAttributes, setAllAttributes] = useState<
    { id: string; name: string; values: { id: string; value: string }[] }[]
  >([]);
  const [subCategoriesMap, setSubCategoriesMap] = useState<Record<string, { id: string; name: string }[]>>({});
  const resultsRef = useRef<HTMLDivElement>(null);

  const hasPermission =
    admin?.role === "SUPER_ADMIN" ||
    admin?.permissions?.includes(`${Resource.PRODUCTS}:${Action.CREATE}`);

  useEffect(() => {
    const load = async () => {
      // Load categories
      try {
        const catRes = await categories.getCategories();
        const cats: { id: string; name: string }[] = catRes.data?.data?.categories || [];
        setAllCategories(cats.map((c) => ({ id: c.id, name: c.name })));

        // Load subcategories for each category
        const subMap: Record<string, { id: string; name: string }[]> = {};
        await Promise.all(
          cats.map(async (cat) => {
            try {
              const subRes = await subCategories.getSubCategoriesByCategory(cat.id);
              const subs: { id: string; name: string }[] = subRes.data?.data?.subCategories || [];
              if (subs.length > 0) subMap[cat.id] = subs;
            } catch {
              // subcategory load failure is non-critical
            }
          })
        );
        setSubCategoriesMap(subMap);
      } catch {
        toast.error(t("bulk_products.load_failed"));
      }

      // Load attributes
      try {
        const attrRes = await attributes.getAttributes();
        const attrs = attrRes.data?.data?.attributes || [];
        setAllAttributes(
          attrs.map((a: { id: string; name: string; values: { id: string; value: string }[] }) => ({
            id: a.id,
            name: a.name,
            values: a.values || [],
          }))
        );
      } catch {
        toast.error(t("bulk_products.load_failed"));
      }

      // Load brands
      try {
        const brandRes = await brands.getBrands({ limit: 500 });
        const bl = brandRes.data?.data?.brands || brandRes.data?.brands || [];
        setBrandsList(bl.map((b: { id: string; name: string }) => ({ id: b.id, name: b.name })));
      } catch {
        // brands are optional, silent fail
      }
    };
    load();
  }, [t]);

  const validationLabels = {
    nameRequired: t("bulk_products.validation.name_required"),
    categoryRequired: t("bulk_products.validation.category_required"),
    priceRequired: t("bulk_products.validation.price_required"),
    stockRequired: t("bulk_products.validation.stock_required"),
    variantRequired: t("bulk_products.validation.variant_required"),
    variantPrice: t("bulk_products.validation.variant_price"),
    variantStock: t("bulk_products.validation.variant_stock"),
    variantLabel: (n: number) => t("bulk_products.validation.variant_n", { n }),
  };

  const handleSubmitAll = async () => {
    const rowsWithNames = rows
      .map((r, i) => ({ row: r, index: i }))
      .filter(({ row }) => row.name.trim());

    if (rowsWithNames.length === 0) {
      toast.error(t("bulk_products.no_products"));
      return;
    }

    if (rowsWithNames.length > MAX_BULK_PRODUCTS) {
      toast.error(t("bulk_products.max_limit", { max: MAX_BULK_PRODUCTS }));
      return;
    }

    const updatedRows = [...rows];
    let firstErrorId: string | null = null;
    let hasAnyError = false;

    for (const { row, index } of rowsWithNames) {
      const issues = validateBulkProduct(row, index, validationLabels);
      updatedRows[index] = {
        ...row,
        validationErrors: issues.length > 0 ? issues : undefined,
      };
      if (issues.length > 0) {
        hasAnyError = true;
        if (!firstErrorId) firstErrorId = row.id;
      }
    }

    setRows(updatedRows);

    if (hasAnyError) {
      toast.error(t("bulk_products.validation.fix_errors"));
      if (firstErrorId) {
        setTimeout(() => {
          document
            .getElementById(`bulk-product-${firstErrorId}`)
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      }
      return;
    }

    const toSubmit = rowsWithNames.map(({ row }) => row);

    setSubmitting(true);
    setResults(null);
    setProgress({ current: 0, total: toSubmit.length });

    const cache: ResolveCache = {
      categories: new Map(),
      attributes: new Map(),
      attributeValues: new Map(),
    };

    const submitResults = await submitBulkProductsSequential(toSubmit, {
      autoSku,
      cache,
      allCategories,
      allAttributes,
      onProgress: (current, total) => setProgress({ current, total }),
    });

    setSubmitting(false);
    setResults(submitResults);

    const successCount = submitResults.filter((r) => r.success).length;
    const failCount = submitResults.length - successCount;

    if (successCount > 0) {
      toast.success(
        t("bulk_products.submit_success", {
          success: successCount,
          total: submitResults.length,
        })
      );
    }
    if (failCount > 0) {
      toast.error(t("bulk_products.submit_partial_fail", { count: failCount }));
    }

    if (successCount === submitResults.length) {
      setRows([createEmptyProductRow()]);
    } else {
      const failedOnly = toSubmit
        .map((row, i) => ({ row, result: submitResults[i] }))
        .filter(({ result }) => !result.success)
        .map(({ row, result }) => ({
          ...row,
          validationErrors: [
            {
              field: "api",
              message: result.error || t("bulk_products.api_error"),
            },
          ],
        }));
      setRows(failedOnly);
    }

    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  };

  if (!hasPermission) {
    return (
      <Card className="bg-amber-50">
        <CardContent className="p-6">
          <p className="text-amber-800">{t("products.form.permission_denied")}</p>
        </CardContent>
      </Card>
    );
  }

  const namedCount = rows.filter((r) => r.name.trim()).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="h-7 w-7 text-[#2E7D32]" />
            {t("bulk_products.title")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm max-w-xl">{t("bulk_products.subtitle")}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {t("bulk_products.max_hint", { max: MAX_BULK_PRODUCTS })}
          </p>
        </div>
        <Button
          onClick={handleSubmitAll}
          disabled={submitting || namedCount === 0}
          className="bg-[#2E7D32] hover:bg-[#1B5E20] shrink-0"
          size="lg"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t("bulk_products.submitting", {
                current: progress.current,
                total: progress.total,
              })}
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              {t("bulk_products.submit_all", { count: namedCount })}
            </>
          )}
        </Button>
      </div>

      <BulkProductsGuide
        onLoadExample={(type) => {
          const example =
            type === "simple" ? createSimpleProductExample() : createVariantProductExample();
          if (rows.length === 1 && !rows[0].name.trim()) {
            setRows([example]);
          } else {
            setRows([...rows, example]);
          }
          toast.success(
            type === "simple"
              ? t("bulk_products.guide.example_loaded_simple")
              : t("bulk_products.guide.example_loaded_variant")
          );
        }}
      />

      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-100">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={autoSku} onCheckedChange={setAutoSku} id="auto-sku" />
              <Label htmlFor="auto-sku" className="cursor-pointer">
                {t("bulk_products.auto_sku")}
              </Label>
            </div>
            <p className="text-xs text-muted-foreground flex-1">{t("bulk_products.auto_sku_hint")}</p>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg border bg-blue-50/50 border-blue-100 p-3 text-xs text-blue-900">
        <p className="font-medium mb-1">{t("bulk_products.required_optional_title")}</p>
        <ul className="list-disc list-inside space-y-0.5 text-blue-800">
          <li>{t("bulk_products.required_fields")}</li>
          <li>{t("bulk_products.optional_fields")}</li>
        </ul>
      </div>

      {rows.map((row, index) => (
        <BulkProductRowCard
          key={row.id}
          row={row}
          index={index}
          allCategories={allCategories}
          subCategoriesMap={subCategoriesMap}
          allAttributes={allAttributes}
          brandsList={brandsList}
          autoSku={autoSku}
          onChange={(updated) => {
            const next = [...rows];
            next[index] = { ...updated, validationErrors: undefined };
            setRows(next);
          }}
          onRemove={() => {
            if (rows.length === 1) setRows([createEmptyProductRow()]);
            else setRows(rows.filter((_, i) => i !== index));
          }}
        />
      ))}

      {rows.length < MAX_BULK_PRODUCTS && (
        <Button
          type="button"
          variant="outline"
          className="w-full border-dashed border-2 h-14 text-[#2E7D32] hover:bg-green-50"
          onClick={() => setRows([...rows, createEmptyProductRow()])}
          disabled={submitting}
        >
          <Plus className="h-5 w-5 mr-2" />
          {t("bulk_products.add_another")}
        </Button>
      )}

      {results && results.length > 0 && (
        <Card ref={resultsRef} className="border-gray-200">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">{t("bulk_products.results_title")}</h3>
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {results.map((r, i) => (
                <li
                  key={i}
                  className={`flex items-start gap-2 text-sm rounded p-2 ${
                    r.success ? "bg-green-50" : "bg-red-50"
                  }`}
                >
                  {r.success ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <span>
                    <strong>{r.productName}</strong>
                    {r.success ? (
                      <span className="text-green-700"> — {t("bulk_products.result_ok")}</span>
                    ) : (
                      <span className="text-red-700"> — {r.error}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
