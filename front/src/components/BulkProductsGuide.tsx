import { useState } from "react";
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Package,
  Layers,
  ImageIcon,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/context/LanguageContext";

interface BulkProductsGuideProps {
  onLoadExample: (type: "simple" | "variant") => void;
}

function StepList({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-2 text-sm text-gray-700">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2E7D32] text-[10px] font-bold text-white">
            {i + 1}
          </span>
          <span className="pt-0.5">{step}</span>
        </li>
      ))}
    </ol>
  );
}

function ImageFlowDiagram({
  type,
  t,
}: {
  type: "simple" | "variant";
  t: (key: string) => string;
}) {
  if (type === "simple") {
    return (
      <div className="rounded-lg border border-dashed border-[#2E7D32]/40 bg-white p-4 text-xs">
        <p className="font-semibold text-[#2E7D32] mb-3 flex items-center gap-1">
          <ImageIcon className="h-3.5 w-3.5" />
          {t("bulk_products.guide.image_flow_simple")}
        </p>
        <div className="flex flex-wrap items-center gap-2 justify-center">
          <div className="rounded border bg-gray-50 px-3 py-2 text-center">
            <Package className="h-5 w-5 mx-auto text-gray-500 mb-1" />
            <span className="font-medium">{t("bulk_products.guide.one_product")}</span>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400 shrink-0" />
          <div className="rounded border-2 border-[#2E7D32] bg-green-50 px-3 py-2 text-center">
            <div className="flex gap-1 justify-center mb-1">
              <div className="h-8 w-8 rounded bg-gray-200 border" />
              <div className="h-8 w-8 rounded bg-gray-200 border" />
              <div className="h-8 w-8 rounded bg-gray-200 border" />
            </div>
            <span className="text-[#2E7D32] font-medium">
              {t("bulk_products.guide.product_images_box")}
            </span>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400 shrink-0" />
          <div className="rounded border bg-gray-50 px-3 py-2 text-center">
            <span>{t("bulk_products.guide.storefront")}</span>
          </div>
        </div>
        <p className="text-muted-foreground mt-3 text-center">
          {t("bulk_products.guide.simple_image_note")}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-dashed border-blue-400/50 bg-white p-4 text-xs">
      <p className="font-semibold text-blue-700 mb-3 flex items-center gap-1">
        <ImageIcon className="h-3.5 w-3.5" />
        {t("bulk_products.guide.image_flow_variant")}
      </p>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 justify-center">
          <div className="rounded border bg-gray-50 px-3 py-2 text-center">
            <Layers className="h-5 w-5 mx-auto text-gray-500 mb-1" />
            <span className="font-medium">{t("bulk_products.guide.one_product")}</span>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400" />
          <Badge variant="outline">Weight: 500g</Badge>
          <Badge variant="outline">Weight: 1kg</Badge>
        </div>
        <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
          <div className="rounded border-2 border-blue-500 bg-blue-50 p-2 text-center">
            <p className="font-medium text-blue-800 mb-1">Variant 1 — 500g</p>
            <div className="flex gap-1 justify-center mb-1">
              <div className="h-7 w-7 rounded bg-gray-200 border" />
              <div className="h-7 w-7 rounded bg-gray-200 border" />
            </div>
            <span className="text-blue-600">{t("bulk_products.guide.variant_images_box")}</span>
          </div>
          <div className="rounded border-2 border-blue-500 bg-blue-50 p-2 text-center">
            <p className="font-medium text-blue-800 mb-1">Variant 2 — 1kg</p>
            <div className="flex gap-1 justify-center mb-1">
              <div className="h-7 w-7 rounded bg-gray-200 border" />
            </div>
            <span className="text-blue-600">{t("bulk_products.guide.variant_images_box")}</span>
          </div>
        </div>
        <p className="text-muted-foreground text-center">
          {t("bulk_products.guide.variant_image_note")}
        </p>
      </div>
    </div>
  );
}

export default function BulkProductsGuide({ onLoadExample }: BulkProductsGuideProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(true);

  const simpleSteps = [
    t("bulk_products.guide.simple_step_1"),
    t("bulk_products.guide.simple_step_2"),
    t("bulk_products.guide.simple_step_3"),
    t("bulk_products.guide.simple_step_4"),
    t("bulk_products.guide.simple_step_5"),
  ];

  const variantSteps = [
    t("bulk_products.guide.variant_step_1"),
    t("bulk_products.guide.variant_step_2"),
    t("bulk_products.guide.variant_step_3"),
    t("bulk_products.guide.variant_step_4"),
    t("bulk_products.guide.variant_step_5"),
    t("bulk_products.guide.variant_step_6"),
  ];

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader className="py-3 px-4 cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-amber-700" />
            <h2 className="font-semibold text-amber-900">{t("bulk_products.guide.title")}</h2>
          </div>
          {open ? (
            <ChevronUp className="h-5 w-5 text-amber-700" />
          ) : (
            <ChevronDown className="h-5 w-5 text-amber-700" />
          )}
        </div>
        <p className="text-xs text-amber-800/80 mt-1">{t("bulk_products.guide.subtitle")}</p>
      </CardHeader>

      {open && (
        <CardContent className="pt-0 px-4 pb-4 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-white border-green-100">
              <CardHeader className="py-3 px-4 pb-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-[#2E7D32]" />
                    <h3 className="font-semibold text-sm">{t("bulk_products.guide.simple_title")}</h3>
                  </div>
                  <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
                    {t("bulk_products.guide.no_variants")}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("bulk_products.guide.simple_example_name")}
                </p>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                <StepList steps={simpleSteps} />
                <ImageFlowDiagram type="simple" t={t} />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full border-[#2E7D32] text-[#2E7D32] hover:bg-green-50"
                  onClick={() => onLoadExample("simple")}
                >
                  <Sparkles className="h-3.5 w-3.5 mr-2" />
                  {t("bulk_products.guide.load_simple")}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white border-blue-100">
              <CardHeader className="py-3 px-4 pb-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-blue-600" />
                    <h3 className="font-semibold text-sm">{t("bulk_products.guide.variant_title")}</h3>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                    {t("bulk_products.guide.with_variants")}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("bulk_products.guide.variant_example_name")}
                </p>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                <StepList steps={variantSteps} />
                <ImageFlowDiagram type="variant" t={t} />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full border-blue-500 text-blue-700 hover:bg-blue-50"
                  onClick={() => onLoadExample("variant")}
                >
                  <Sparkles className="h-3.5 w-3.5 mr-2" />
                  {t("bulk_products.guide.load_variant")}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="rounded-lg bg-white border p-3 text-xs text-gray-600">
            <p className="font-medium text-gray-800 mb-1">{t("bulk_products.guide.tip_title")}</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>{t("bulk_products.guide.tip_1")}</li>
              <li>{t("bulk_products.guide.tip_2")}</li>
              <li>{t("bulk_products.guide.tip_3")}</li>
            </ul>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
