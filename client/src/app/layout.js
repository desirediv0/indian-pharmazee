import "./globals.css";
import { Navbar } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from "@/lib/cart-context";
import { AuthProvider } from "@/lib/auth-context";
import { FloatingWhatsApp } from "@/components/ui/FloatingWhatsApp";

export const metadata = {
  title: "Indian Pharmazee | Trusted Specialty Medicines Across India",
  description: "Indian Pharmazee provides genuine branded medicines and healthcare products — IVF, oncology, transplant, sexual wellness, chronic care, cold chain delivery across India.",
  keywords: "Indian Pharmazee, specialty medicines, oncology medicines, IVF medicines, transplant medicines, cold chain delivery, genuine medicines India, pharmaceutical ecommerce",
  authors: [{ name: "Indian Pharmazee" }],
  openGraph: {
    title: "Indian Pharmazee | Trusted Specialty Medicines Across India",
    description: "Genuine branded medicines, oncology care, IVF solutions, chronic care treatments with reliable delivery across India. Cold chain 2°C–8°C support.",
    type: "website",
    locale: "en_IN",
    siteName: "Indian Pharmazee",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <main className="min-h-screen">
              {children}
            </main>
            <Footer />
            <FloatingWhatsApp />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
