import { Heart, PartyPopper, Building2, Truck, ShoppingBasket } from "lucide-react";
import { FaSeedling } from "react-icons/fa";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const industries = [
  {
    icon: ShoppingBasket,
    name: "Home Kitchen",
    description: "Daily essentials for your family",
    products: "Milk, Ghee, Paneer & more",
  },
  {
    icon: FaSeedling,
    name: "Farm & Agriculture",
    description: "Quality feed and supplements",
    products: "Cow Feed, Calf Feed, Nutrients",
  },
  {
    icon: Heart,
    name: "Health & Wellness",
    description: "Pure nutritional products",
    products: "Turmeric, Supplements, Organic",
  },
  {
    icon: PartyPopper,
    name: "Events & Catering",
    description: "Bulk supplies for celebrations",
    products: "Sweets, Curd, Bulk Milk",
  },
  {
    icon: Building2,
    name: "Offices & Institutions",
    description: "Pantry and refreshment solutions",
    products: "Beverages, Snacks, Tea/Coffee",
  },
  {
    icon: Truck,
    name: "Bulk Orders",
    description: "Custom solutions for business",
    products: "Wholesale Grocery & Essentials",
  },
];

export const IndustriesSection = () => {
  return (
    <section className="section-padding bg-muted">
      <div className="section-container">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Shop By Use Case</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-2 mb-4">
            Find the Perfect Grocery Solution
          </h2>
          <p className="text-muted-foreground">
            Tell us your needs and we&apos;ll help you find the right nutritional products.
          </p>
        </div>

        {/* Industries Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {industries.map((industry, index) => (
            <Link 
              key={index} 
              href="/products"
              className="bg-card p-6 rounded-xl card-shadow card-hover group"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
                <industry.icon className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors" />
              </div>
              <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                {industry.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">{industry.description}</p>
              <p className="text-xs text-primary font-medium">{industry.products}</p>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <p className="text-muted-foreground mb-4">Not sure what you need?</p>
          <Link href="/contact">
            <Button variant="outline" size="lg">
              Get Expert Advice
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
