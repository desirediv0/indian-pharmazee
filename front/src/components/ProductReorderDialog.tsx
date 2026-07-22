import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  GripVertical,
  ArrowUp,
  ArrowDown,
  Loader2,
  Package,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  position: number;
  images: Array<{ url: string }>;
}

interface ProductReorderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: string;
  entityType: "category" | "subcategory";
  entityName: string;
  onSaved?: () => void;
}

export function ProductReorderDialog({
  open,
  onOpenChange,
  entityId,
  entityType,
  entityName,
  onSaved,
}: ProductReorderDialogProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && entityId) {
      fetchProducts();
    }
  }, [open, entityId]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const endpoint =
        entityType === "category"
          ? `/api/admin/categories/${entityId}/products`
          : `/api/admin/subcategories/${entityId}/products`;

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}${endpoint}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setProducts(data.data.products);
      } else {
        toast.error("Failed to fetch products");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Error fetching products");
    } finally {
      setLoading(false);
    }
  };

  const moveProduct = (index: number, direction: "up" | "down") => {
    const newProducts = [...products];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newProducts.length) return;

    // Swap positions
    const temp = newProducts[index];
    newProducts[index] = newProducts[targetIndex];
    newProducts[targetIndex] = temp;

    // Update position values
    newProducts.forEach((p, i) => {
      p.position = i;
    });

    setProducts(newProducts);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const endpoint =
        entityType === "category"
          ? `/api/admin/categories/${entityId}/products/reorder`
          : `/api/admin/subcategories/${entityId}/products/reorder`;

      const productOrders = products.map((p) => ({
        productId: p.id,
        position: p.position,
      }));

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}${endpoint}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
          body: JSON.stringify({ productOrders }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success("Product order updated successfully");
        onOpenChange(false);
        onSaved?.();
      } else {
        toast.error(data.message || "Failed to update order");
      }
    } catch (error) {
      console.error("Error saving order:", error);
      toast.error("Error saving order");
    } finally {
      setSaving(false);
    }
  };

  const getProductImage = (product: Product) => {
    if (product.images && product.images.length > 0) {
      const url = product.images[0].url;
      if (url.startsWith("http")) return url;
      return `${import.meta.env.VITE_API_URL}/${url}`;
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Reorder Products in {entityType === "category" ? "Category" : "SubCategory"}: {entityName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No products in this {entityType}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {products.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border"
                >
                  <GripVertical className="h-5 w-5 text-gray-400 flex-shrink-0" />

                  <div className="flex-1 flex items-center gap-3">
                    {getProductImage(product) ? (
                      <img
                        src={getProductImage(product) || undefined}
                        alt={product.name}
                        className="h-10 w-10 object-cover rounded"
                      />
                    ) : (
                      <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center">
                        <Package className="h-5 w-5 text-gray-400" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Position: {product.position + 1}
                      </p>
                    </div>

                    <Badge variant={product.isActive ? "default" : "secondary"}>
                      {product.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="flex flex-col gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => moveProduct(index, "up")}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => moveProduct(index, "down")}
                      disabled={index === products.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Order"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
