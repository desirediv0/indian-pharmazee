import { ArrowRight, Milk, ShoppingBag, Leaf, Utensils, Zap, Heart, Star, Store } from "lucide-react";
import Link from "next/link";

const productCategories = [
  {
    name: "Pure Farm Milk",
    slug: "milk",
    description: "A2 Desi Cow & Buffalo milk, delivered within 3-5 hours of milking.",
    icon: Milk,
    color: "bg-blue-500"
  },
  {
    name: "Fresh Curd & Paneer",
    slug: "curd-paneer",
    description: "Artisanal paneer and thick creamy curd made with traditional methods.",
    icon: Utensils,
    color: "bg-orange-500"
  },
  {
    name: "Pure Bilona Ghee",
    slug: "ghee",
    description: "Traditional hand-churned A2 ghee for superior health and taste.",
    icon: Heart,
    color: "bg-amber-500"
  },
  {
    name: "Butter & Cream",
    slug: "butter-cream",
    description: "Farm-fresh white butter and thick cream with zero additives.",
    icon: Star,
    color: "bg-yellow-500"
  },
  {
    name: "Milk Shakes",
    slug: "milk-shakes",
    description: "Refreshing milk-based beverages in variety of natural flavors.",
    icon: Zap,
    color: "bg-pink-500"
  },
  {
    name: "Organic Honey",
    slug: "honey",
    description: "100% raw and unfiltered forest honey sourced sustainably.",
    icon: Leaf,
    color: "bg-green-500"
  },
  {
    name: "Bakery & Breads",
    slug: "bakery",
    description: "Whole wheat breads and fresh bakes delivered from our kitchen.",
    icon: ShoppingBag,
    color: "bg-rose-500"
  },
  {
    name: "Organic Vegetables",
    slug: "vegetables",
    description: "Pesticide-free seasonal vegetables grown in our partner farms.",
    icon: Store,
    color: "bg-emerald-500"
  },
  {
    name: "Fresh Fruits",
    slug: "fruits",
    description: "Hand-picked seasonal fruits, ripened naturally without chemicals.",
    icon: Heart,
    color: "bg-red-500"
  },
];

export const ProductsSection = () => {
  return (
    <section id="products" className="py-24 bg-gray-50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary/5 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2" />
      
      <div className="section-container relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-primary text-[11px] font-bold uppercase tracking-wider mb-5">
              Explore Our Collection
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-[1.1] tracking-tight mb-4">
              Premium Nutrition <br />
              <span className="text-primary">Direct from Farms</span>
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed">
              Experience the true taste of purity. Every product is sourced directly from certified farms and delivered fresh to your doorstep.
            </p>
          </div>
          <div className="hidden md:block">
            <Link 
              href="/products"
              className="group flex items-center gap-3 text-gray-900 font-bold hover:text-primary transition-colors"
            >
              View Full Menu
              <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all">
                <ArrowRight className="h-5 w-5 group-hover:text-white transition-colors" />
              </div>
            </Link>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {productCategories.map((product, index) => (
            <Link
              key={index}
              href={`/products?category=${product.slug}`}
              className="group relative bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:-translate-y-2 transition-all duration-500 flex flex-col"
            >
              <div className={`w-16 h-16 rounded-2xl ${product.color}/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                <product.icon className={`h-8 w-8 text-${product.color.split('-')[1]}-500`} />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors">
                {product.name}
              </h3>
              
              <p className="text-gray-500 leading-relaxed mb-8 flex-1">
                {product.description}
              </p>
              
              <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                <span className="text-sm font-bold text-gray-400 group-hover:text-primary transition-colors uppercase tracking-wider">Explore Category</span>
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-primary transition-colors duration-300">
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Mobile View All Button */}
        <div className="md:hidden text-center mt-12">
          <Link 
            href="/products"
            className="inline-flex items-center gap-3 bg-primary text-white px-8 py-4 rounded-2xl font-bold hover:shadow-lg hover:shadow-primary/20 transition-all"
          >
            View All Products
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ProductsSection;
