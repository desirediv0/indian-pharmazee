import { useEffect, useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  FaqPlacement,
  FaqTarget,
  getFaqTargetCategories,
  getFaqTargetProducts,
} from "@/api/faqService";

interface FaqPlacementFieldsProps {
  value: FaqPlacement;
  onChange: (patch: Partial<FaqPlacement>) => void;
}

// "Where should this FAQ appear?" — used by both the create page and the edit dialog.
export default function FaqPlacementFields({
  value,
  onChange,
}: FaqPlacementFieldsProps) {
  const [categories, setCategories] = useState<FaqTarget[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState<FaqTarget[]>([]);
  const [productSearching, setProductSearching] = useState(false);
  // id -> product, so selected products keep their names while the search changes
  const [productNames, setProductNames] = useState<Record<string, FaqTarget>>(
    {}
  );
  const resolvedIds = useRef<Set<string>>(new Set());

  // Categories are a short list — load them once
  useEffect(() => {
    let cancelled = false;
    getFaqTargetCategories()
      .then((list) => {
        if (!cancelled) setCategories(list);
      })
      .catch((error) => console.error("Failed to load categories:", error))
      .finally(() => {
        if (!cancelled) setCategoriesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Look up names for already-selected products (when editing an existing FAQ)
  useEffect(() => {
    const missing = value.productIds.filter((id) => !resolvedIds.current.has(id));
    if (missing.length === 0) return;
    missing.forEach((id) => resolvedIds.current.add(id));

    getFaqTargetProducts({ ids: missing })
      .then((products) => {
        setProductNames((prev) => {
          const next = { ...prev };
          products.forEach((p) => {
            next[p.id] = p;
          });
          return next;
        });
      })
      .catch((error) => console.error("Failed to load products:", error));
  }, [value.productIds]);

  // Debounced product search
  useEffect(() => {
    const query = productQuery.trim();
    if (query.length < 2) {
      setProductResults([]);
      setProductSearching(false);
      return;
    }

    setProductSearching(true);
    const timer = setTimeout(() => {
      getFaqTargetProducts({ search: query })
        .then(setProductResults)
        .catch((error) => console.error("Product search failed:", error))
        .finally(() => setProductSearching(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [productQuery]);

  const toggleCategory = (id: string) => {
    onChange({
      categoryIds: value.categoryIds.includes(id)
        ? value.categoryIds.filter((c) => c !== id)
        : [...value.categoryIds, id],
    });
  };

  const addProduct = (product: FaqTarget) => {
    setProductNames((prev) => ({ ...prev, [product.id]: product }));
    resolvedIds.current.add(product.id);
    if (!value.productIds.includes(product.id)) {
      onChange({ productIds: [...value.productIds, product.id] });
    }
    setProductQuery("");
    setProductResults([]);
  };

  const removeProduct = (id: string) => {
    onChange({ productIds: value.productIds.filter((p) => p !== id) });
  };

  return (
    <div className="space-y-4 rounded-lg border border-[#E5E7EB] p-4">
      <div>
        <p className="text-sm font-semibold text-[#1F2937]">
          Where to show this FAQ
        </p>
        <p className="text-xs text-[#9CA3AF] mt-0.5">
          Shown pages also get FAQ rich-result markup for Google. Use the
          &ldquo;all&rdquo; switches to show one FAQ everywhere, or pick pages
          one by one.
        </p>
      </div>

      {/* FAQ page */}
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="showOnFaqPage" className="cursor-pointer">
          FAQ page <span className="text-xs text-[#9CA3AF]">(/faqs)</span>
        </Label>
        <Switch
          id="showOnFaqPage"
          checked={value.showOnFaqPage}
          onCheckedChange={(checked) => onChange({ showOnFaqPage: checked })}
        />
      </div>

      {/* Home */}
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="showOnHome" className="cursor-pointer">
          Home page
        </Label>
        <Switch
          id="showOnHome"
          checked={value.showOnHome}
          onCheckedChange={(checked) => onChange({ showOnHome: checked })}
        />
      </div>

      {/* Categories */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="showOnAllCategories" className="cursor-pointer">
            All category pages
          </Label>
          <Switch
            id="showOnAllCategories"
            checked={value.showOnAllCategories}
            onCheckedChange={(checked) =>
              onChange({ showOnAllCategories: checked })
            }
          />
        </div>

        {!value.showOnAllCategories && (
          <div className="rounded-md bg-[#F9FAFB] p-3">
            <p className="text-xs font-medium text-[#4B5563] mb-2">
              Or only these categories ({value.categoryIds.length} selected)
            </p>
            {categoriesLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#9CA3AF]" />
            ) : categories.length === 0 ? (
              <p className="text-xs text-[#9CA3AF]">No categories found.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 max-h-44 overflow-y-auto pr-1">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`faq-cat-${category.id}`}
                      checked={value.categoryIds.includes(category.id)}
                      onCheckedChange={() => toggleCategory(category.id)}
                    />
                    <Label
                      htmlFor={`faq-cat-${category.id}`}
                      className="text-xs font-normal cursor-pointer"
                    >
                      {category.name}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Products */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="showOnAllProducts" className="cursor-pointer">
            All product detail pages
          </Label>
          <Switch
            id="showOnAllProducts"
            checked={value.showOnAllProducts}
            onCheckedChange={(checked) =>
              onChange({ showOnAllProducts: checked })
            }
          />
        </div>

        {!value.showOnAllProducts && (
          <div className="rounded-md bg-[#F9FAFB] p-3 space-y-2">
            <p className="text-xs font-medium text-[#4B5563]">
              Or only these products ({value.productIds.length} selected)
            </p>

            {value.productIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {value.productIds.map((id) => (
                  <Badge
                    key={id}
                    variant="outline"
                    className="gap-1 bg-white text-xs font-normal"
                  >
                    {productNames[id]?.name ?? "Loading…"}
                    <button
                      type="button"
                      aria-label="Remove product"
                      onClick={() => removeProduct(id)}
                      className="text-[#9CA3AF] hover:text-[#EF4444]"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#9CA3AF]" />
              <Input
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                placeholder="Search a product by name…"
                className="pl-8 bg-white"
              />
            </div>

            {productSearching && (
              <Loader2 className="h-4 w-4 animate-spin text-[#9CA3AF]" />
            )}

            {!productSearching &&
              productQuery.trim().length >= 2 &&
              productResults.length === 0 && (
                <p className="text-xs text-[#9CA3AF]">No products found.</p>
              )}

            {productResults.length > 0 && (
              <ul className="max-h-40 overflow-y-auto rounded-md border border-[#E5E7EB] bg-white divide-y divide-[#F3F4F6]">
                {productResults.map((product) => {
                  const selected = value.productIds.includes(product.id);
                  return (
                    <li key={product.id}>
                      <button
                        type="button"
                        disabled={selected}
                        onClick={() => addProduct(product)}
                        className="w-full px-3 py-2 text-left text-xs hover:bg-[#F3F7F6] disabled:cursor-not-allowed disabled:text-[#9CA3AF]"
                      >
                        {product.name}
                        {selected && " (added)"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
