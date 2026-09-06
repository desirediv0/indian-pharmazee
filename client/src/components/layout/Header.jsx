"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { fetchApi, cn, sortCategories } from "@/lib/utils";
import { ClientOnly } from "@/components/client-only";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast, Toaster } from "sonner";
import {
  FiShoppingCart, FiUser, FiMenu, FiX, FiSearch,
  FiHeart, FiChevronDown, FiChevronRight, FiPackage,
  FiLogOut, FiMapPin, FiMail, FiPhone,
} from "react-icons/fi";
import {
  User, Package, MapPin, Heart, LogOut,
  ChevronDown, Stethoscope, Pill, FlaskConical,
  Thermometer, ShieldCheck, Phone,
} from "lucide-react";

/* ── Constants ─────────────────────────────── */
const CONTACT = {
  email: "indianpharmazee@gmail.com",
  phone: "+91 95602 47619",
  whatsapp: "919560247619",
};

const NAV_LINKS = [
  { href: "/products", label: "Medicines" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

const FOOTER_LINKS = [
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
  { href: "/shipping-policy", label: "Shipping Policy" },
  { href: "/faqs", label: "FAQs" },
];

/* ── Avatar ─────────────────────────────────── */
function AvatarCircle({ name, size = "sm" }) {
  const dim = size === "lg" ? "w-11 h-11 text-base" : "w-8 h-8 text-sm";
  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center text-white font-bold shadow-md flex-shrink-0`}
      style={{ background: "linear-gradient(135deg, #005EB8, #16C7D9)" }}
    >
      {name?.charAt(0)?.toUpperCase() || "U"}
    </div>
  );
}

/* ── Mobile Nav Item ────────────────────────── */
function MobileNavItem({ href, icon: Icon, label, onClick, badge }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:text-primary hover:bg-blue-50/60 transition-all duration-200"
    >
      <Icon className="h-5 w-5 text-gray-400 flex-shrink-0" />
      <span className="text-sm font-medium">{label}</span>
      {badge > 0 && (
        <span className="ml-auto bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
          {badge}
        </span>
      )}
    </Link>
  );
}

/* ── Section helper (mobile drawer) ────────── */
function DrawerSection({ title, children }) {
  return (
    <div className="mt-2 pt-2 border-t border-gray-100">
      <p className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</p>
      <div className="space-y-0.5 px-2">{children}</div>
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN NAVBAR
════════════════════════════════════════════ */
export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { getCartItemCount } = useCart();
  const router = useRouter();
  const pathname = usePathname();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Live Debounced Search States
  const [liveSearchResults, setLiveSearchResults] = useState([]);
  const [isSearchingLive, setIsSearchingLive] = useState(false);
  const [showLiveDropdown, setShowLiveDropdown] = useState(false);

  const searchInputRef = useRef(null);
  const navbarRef = useRef(null);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 300ms Debounced Search Effect
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) {
      setLiveSearchResults([]);
      setIsSearchingLive(false);
      setShowLiveDropdown(false);
      return;
    }

    setIsSearchingLive(true);
    setShowLiveDropdown(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetchApi(
          `/public/products?search=${encodeURIComponent(q)}&limit=6`
        );
        if (res?.data?.products) {
          setLiveSearchResults(res.data.products);
        } else if (res?.products) {
          setLiveSearchResults(res.products);
        } else {
          setLiveSearchResults([]);
        }
      } catch (err) {
        console.error("Debounced search error:", err);
        setLiveSearchResults([]);
      } finally {
        setIsSearchingLive(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close live search dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target)
      ) {
        setShowLiveDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsSearchOpen(false);
    setActiveDropdown(null);
    setShowLiveDropdown(false);
  }, [pathname]);

  useEffect(() => {
    const handler = (e) => {
      if (navbarRef.current && !navbarRef.current.contains(e.target))
        setActiveDropdown(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (isSearchOpen) setTimeout(() => searchInputRef.current?.focus(), 100);
  }, [isSearchOpen]);

  useEffect(() => {
    fetchApi("/public/categories-with-subcategories")
      .then((res) => setCategories(sortCategories(res.data?.categories || [])))
      .catch(console.error);
  }, []);

  const handleSearch = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    setIsSearchOpen(false);
    setShowLiveDropdown(false);
    setSearchQuery("");
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    router.push("/");
  };

  const cartCount = getCartItemCount();

  return (
    <>
      <header
        ref={navbarRef}
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-300",
          isScrolled
            ? "shadow-[0_4px_24px_rgba(0,94,184,0.12)] backdrop-blur-xl"
            : "",
        )}
        style={{ background: isScrolled ? "rgba(255,255,255,0.97)" : "#ffffff" }}
      >
        <Toaster position="top-center" richColors />

        {/* ── TOP INFO BAR ── */}
        <div
          className="hidden md:block text-white text-[11px] font-medium"
          style={{ background: "linear-gradient(90deg, #0A2540 0%, #005EB8 50%, #0A2540 100%)" }}
        >
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between h-9">
              {/* Left */}
              <div className="flex items-center gap-5">
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="flex items-center gap-1.5 hover:text-white/75 transition-colors"
                >
                  <FiMail className="h-3 w-3" />
                  {CONTACT.email}
                </a>
                <a
                  href={`tel:${CONTACT.phone}`}
                  className="flex items-center gap-1.5 hover:text-white/75 transition-colors"
                >
                  <FiPhone className="h-3 w-3" />
                  {CONTACT.phone}
                </a>
              </div>
              {/* Center */}
              <div className="flex items-center gap-1.5 text-white/70">
                <Thermometer className="h-3 w-3 text-cyan-400" />
                <span>Temp-Controlled 2°C–8°C Delivery Available</span>
                <span className="mx-2 text-white/30">|</span>
                <ShieldCheck className="h-3 w-3 text-cyan-400" />
                <span>100% Genuine Medicines</span>
              </div>
              {/* Right */}
              <div className="flex items-center gap-4">
                <Link href="/faqs" className="hover:text-white/75 transition-colors">FAQs</Link>
                <Link href="/shipping-policy" className="hover:text-white/75 transition-colors">Shipping</Link>
                <a
                  href={`https://wa.me/${CONTACT.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold transition-all hover:opacity-90"
                  style={{ background: "#25D366" }}
                >
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ── MAIN HEADER ── */}
        <div
          className="border-b"
          style={{ borderColor: "#DCE7F2" }}
        >
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex items-center justify-between h-[68px] md:h-[76px] gap-4">

              {/* LOGO */}
              <Link href="/" className="flex items-center gap-2 flex-shrink-0">
                <Image
                  src="/logo.png"
                  alt="Indian Pharmazee"
                  width={160}
                  height={56}
                  className=" h-4 md:h-5 w-auto object-contain"
                  priority
                />
              </Link>

              {/* SEARCH BAR — desktop center */}
              <div ref={searchContainerRef} className="hidden lg:flex flex-1 max-w-xl mx-6 relative">
                <form
                  onSubmit={handleSearch}
                  className="relative w-full group"
                >
                  <FiSearch
                    className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors"
                  />
                  <input
                    type="text"
                    placeholder="Search medicines, IVF, oncology..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                      if (searchQuery.trim().length >= 2) setShowLiveDropdown(true);
                    }}
                    className="w-full h-11 pl-11 pr-24 text-sm rounded-xl border focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400"
                    style={{
                      borderColor: "#DCE7F2",
                      background: "#F7FAFC",
                      "--tw-ring-color": "rgba(0,94,184,0.2)",
                    }}
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 px-4 rounded-lg text-white text-xs font-bold transition-opacity hover:opacity-90"
                    style={{ background: "#005EB8" }}
                  >
                    Search
                  </button>
                </form>

                {showLiveDropdown && (
                  <SearchResultsDropdown
                    results={liveSearchResults}
                    loading={isSearchingLive}
                    query={searchQuery}
                    onSelectProduct={(slug) => {
                      setShowLiveDropdown(false);
                      setSearchQuery("");
                      router.push(`/products/${slug}`);
                    }}
                    onViewAll={handleSearch}
                  />
                )}
              </div>

              {/* RIGHT ACTIONS */}
              <div className="flex items-center gap-0.5 md:gap-1">

                {/* Mobile search */}
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="lg:hidden p-2.5 rounded-xl text-gray-600 hover:text-primary hover:bg-blue-50 transition-all"
                  aria-label="Search"
                >
                  <FiSearch className="h-5 w-5" />
                </button>

                {/* Wishlist */}
                <Link
                  href="/wishlist"
                  className="hidden sm:flex p-2.5 rounded-xl text-gray-600 hover:text-primary hover:bg-blue-50 transition-all"
                  aria-label="Wishlist"
                >
                  <FiHeart className="h-5 w-5" />
                </Link>

                {/* Cart */}
                <ClientOnly>
                  <Link
                    href="/cart"
                    className="hidden sm:flex p-2.5 rounded-xl text-gray-600 hover:text-primary hover:bg-blue-50 transition-all relative"
                    aria-label="Cart"
                  >
                    <FiShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && (
                      <span
                        className="absolute top-1 right-1 min-w-[18px] h-[18px] text-white text-[9px] font-black rounded-full flex items-center justify-center px-1"
                        style={{ background: "#005EB8" }}
                      >
                        {cartCount}
                      </span>
                    )}
                  </Link>
                </ClientOnly>

                {/* Account */}
                <AccountDropdown
                  user={user}
                  isAuthenticated={isAuthenticated}
                  activeDropdown={activeDropdown}
                  setActiveDropdown={setActiveDropdown}
                  handleLogout={handleLogout}
                />

                {/* Hamburger */}
                <button
                  onClick={() => setIsMenuOpen(true)}
                  className="lg:hidden p-2.5 rounded-xl text-gray-600 hover:text-primary hover:bg-blue-50 transition-all ml-1"
                  aria-label="Menu"
                >
                  <FiMenu className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── NAV BAR (desktop second row) ── */}
        <div
          className="hidden lg:block border-b"
          style={{ background: "#F7FAFC", borderColor: "#DCE7F2" }}
        >
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center gap-1 h-11">

              {/* All Medicines pill */}
              <Link
                href="/products"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white mr-2 transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #005EB8, #0074e4)" }}
              >
                <Pill className="h-4 w-4" />
                All Medicines
              </Link>

              {/* Nav links */}
              {NAV_LINKS.slice(1).map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    pathname === href
                      ? "text-primary bg-blue-50 font-semibold"
                      : "text-gray-600 hover:text-primary hover:bg-blue-50"
                  )}
                >
                  {label}
                </Link>
              ))}

              {/* Categories dropdown */}
              <CategoriesDropdown
                categories={categories}
                activeDropdown={activeDropdown}
                setActiveDropdown={setActiveDropdown}
                pathname={pathname}
              />

              {/* Spacer */}
              <div className="flex-1" />

              {/* Trust badges */}
              <div className="flex items-center gap-4 text-[11px] text-gray-400 font-medium">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  Genuine Medicines
                </span>
                <span className="flex items-center gap-1">
                  <Thermometer className="h-3.5 w-3.5 text-primary" />
                  Temp-Controlled Support
                </span>
                <span className="flex items-center gap-1">
                  <Stethoscope className="h-3.5 w-3.5 text-primary" />
                  Specialty Pharma
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Search Dialog */}
      <SearchDialog
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearch={handleSearch}
        searchInputRef={searchInputRef}
        categories={categories}
      />

      {/* Mobile Drawer */}
      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        user={user}
        isAuthenticated={isAuthenticated}
        categories={categories}
        cartCount={cartCount}
        handleLogout={handleLogout}
        pathname={pathname}
      />

      {/* Mobile Bottom Nav */}
      <BottomNav
        pathname={pathname}
        isAuthenticated={isAuthenticated}
        cartCount={cartCount}
        onMenuOpen={() => setIsMenuOpen(true)}
      />
    </>
  );
}

function CategoriesDropdown({ categories, activeDropdown, setActiveDropdown, pathname }) {
  return (
    <div
      className="relative"
      onMouseEnter={() => setActiveDropdown("categories")}
      onMouseLeave={() => setActiveDropdown(null)}
    >
      <button
        className={cn(
          "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all",
          activeDropdown === "categories"
            ? "text-primary bg-blue-50"
            : "text-gray-600 hover:text-primary hover:bg-blue-50"
        )}
      >
        <FlaskConical className="h-4 w-4" />
        Categories
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", activeDropdown === "categories" && "rotate-180")} />
      </button>

      {activeDropdown === "categories" && (
        <div className="absolute right-1/2 translate-x-1/2 top-full pt-2 z-50">
          <div
            className="bg-white rounded-2xl shadow-[0_20px_70px_rgba(0,94,184,0.18)] border p-6 w-[860px] max-h-[580px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200"
            style={{ borderColor: "#E5EBEF" }}
          >
            {categories.length > 0 ? (
              <div className="space-y-6">
                <div className="grid grid-cols-4 gap-x-8 gap-y-6">
                  {categories.slice(0, 16).map((cat) => (
                    <div key={cat.id} className="space-y-2.5">
                      <Link
                        href={`/category/${cat.slug}`}
                        className="font-bold text-sm text-gray-900 hover:text-primary transition-colors flex items-center gap-1.5 group"
                        onClick={() => setActiveDropdown(null)}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 group-hover:bg-primary transition-colors" />
                        {cat.name}
                      </Link>

                      {cat.subCategories && cat.subCategories.length > 0 && (
                        <div className="flex flex-col gap-2 pl-3 border-l border-gray-100">
                          {cat.subCategories.slice(0, 4).map((sub) => (
                            <Link
                              key={sub.id}
                              href={`/subcategory/${sub.slug}`}
                              className="text-[12px] text-gray-500 hover:text-primary transition-all duration-150 hover:pl-1 truncate"
                              onClick={() => setActiveDropdown(null)}
                            >
                              {sub.name}
                            </Link>
                          ))}
                          {cat.subCategories.length > 4 && (
                            <Link
                              href={`/category/${cat.slug}`}
                              className="text-[11px] font-semibold text-gray-400 hover:text-primary transition-colors"
                              onClick={() => setActiveDropdown(null)}
                            >
                              + {cat.subCategories.length - 4} more
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 flex items-center justify-between" style={{ borderColor: "#E5EBEF" }}>
                  <p className="text-[12px] text-gray-400 font-medium">Explore all healthcare categories and products</p>
                  <Link
                    href="/categories"
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-full transition-all bg-blue-50 text-primary hover:bg-primary hover:text-white"
                    onClick={() => setActiveDropdown(null)}
                  >
                    View All Categories
                    <FiChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                <p className="text-sm text-gray-400">Loading categories...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Account Dropdown ───────────────────────── */
function AccountDropdown({ user, isAuthenticated, activeDropdown, setActiveDropdown, handleLogout }) {
  const open = activeDropdown === "account";

  return (
    <div
      className="relative hidden sm:block"
      onMouseEnter={() => setActiveDropdown("account")}
      onMouseLeave={() => setActiveDropdown(null)}
    >
      <ClientOnly>
        <button
          className={cn(
            "flex items-center gap-1.5 p-2.5 rounded-xl transition-all",
            open ? "text-primary bg-blue-50" : "text-gray-600 hover:text-primary hover:bg-blue-50"
          )}
        >
          {isAuthenticated ? (
            <AvatarCircle name={user?.name} />
          ) : (
            <>
              <FiUser className="h-5 w-5" />
              <FiChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
            </>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-full pt-2 z-50">
            <div
              className="bg-white rounded-2xl shadow-2xl border w-72 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden"
              style={{ borderColor: "#DCE7F2", boxShadow: "0 20px 60px rgba(0,94,184,0.15)" }}
            >
              {isAuthenticated ? (
                <>
                  <div
                    className="p-4 border-b"
                    style={{ background: "linear-gradient(135deg, rgba(0,94,184,0.05), rgba(22,199,217,0.05))", borderColor: "#DCE7F2" }}
                  >
                    <div className="flex items-center gap-3">
                      <AvatarCircle name={user?.name} size="lg" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{user?.name || "User"}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{user?.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="py-2">
                    {[
                      { href: "/account", icon: User, label: "My Profile" },
                      { href: "/account/orders", icon: Package, label: "My Orders" },
                      { href: "/account/addresses", icon: MapPin, label: "Addresses" },
                      { href: "/wishlist", icon: Heart, label: "Wishlist" },
                    ].map(({ href, icon: Icon, label }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:text-primary hover:bg-blue-50/60 transition-colors"
                      >
                        <Icon className="h-4 w-4 text-gray-400" />
                        {label}
                      </Link>
                    ))}
                  </div>
                  <div className="border-t py-2" style={{ borderColor: "#DCE7F2" }}>
                    <button
                      onClick={() => { handleLogout(); setActiveDropdown(null); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-5">
                  <div className="text-center mb-5">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                      style={{ background: "rgba(0,94,184,0.08)" }}
                    >
                      <User className="h-7 w-7" style={{ color: "#005EB8" }} />
                    </div>
                    <h3 className="font-bold text-gray-900">Welcome!</h3>
                    <p className="text-xs text-gray-500 mt-1">Sign in to track your orders</p>
                  </div>
                  <div className="space-y-2">
                    <Link href="/auth" onClick={() => setActiveDropdown(null)}>
                      <Button
                        className="w-full h-10 font-semibold text-white"
                        style={{ background: "#005EB8" }}
                      >
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/auth?tab=register" onClick={() => setActiveDropdown(null)}>
                      <Button variant="outline" className="w-full h-10 font-semibold border-2" style={{ borderColor: "#DCE7F2" }}>
                        Create Account
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </ClientOnly>
    </div>
  );
}

/* ── Highlight matched query text ──────────── */
function HighlightText({ text, query }) {
  const value = String(text ?? "");
  const q = String(query ?? "").trim();
  if (!value || !q) return value;

  // Split on the query, case-insensitive, keeping the matched chunks
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = value.split(new RegExp(`(${escaped})`, "ig"));

  return parts.map((part, i) =>
    part.toLowerCase() === q.toLowerCase() ? (
      <mark
        key={i}
        className="bg-yellow-200 text-slate-900 rounded-[3px] px-0.5 font-bold"
      >
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

/* ── Live Search Dropdown Component ────────── */
function SearchResultsDropdown({
  results,
  loading,
  query,
  onSelectProduct,
  onViewAll,
}) {
  if (!query.trim() || query.trim().length < 2) return null;

  return (
    <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-50 animate-in fade-in duration-150">
      {loading ? (
        <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-[#005EB8] border-t-transparent rounded-full animate-spin" />
          <span>Searching medicines & subcategories for &quot;{query}&quot;...</span>
        </div>
      ) : results.length > 0 ? (
        <div>
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            <span>Matching Medicines ({results.length})</span>
            <span className="text-[10px] text-[#005EB8] font-medium">By Title & Subcategory</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
            {results.map((product) => {
              const imgUrl =
                product.image ||
                product.images?.[0]?.url ||
                "/placeholder-medicine.png";
              const displayPrice =
                product.salePrice || product.price || product.basePrice || product.variants?.[0]?.price;
              const subCategoryName =
                product.subCategory?.name ||
                product.subCategories?.[0]?.name ||
                product.subCategories?.[0]?.subCategory?.name;
              const categoryName =
                product.category?.name ||
                product.categories?.[0]?.category?.name ||
                product.categories?.[0]?.name;

              return (
                <div
                  key={product.id}
                  onClick={() => onSelectProduct(product.slug)}
                  className="p-3 hover:bg-blue-50/70 transition-colors flex items-center gap-3 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center p-0.5">
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={product.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Pill className="w-5 h-5 text-[#005EB8]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-800 truncate group-hover:text-[#005EB8] transition-colors">
                      <HighlightText text={product.name} query={query} />
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {subCategoryName && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                          <HighlightText text={subCategoryName} query={query} />
                        </span>
                      )}
                      {categoryName && (
                        <span className="text-[10px] text-slate-400 truncate">
                          <HighlightText text={categoryName} query={query} />
                        </span>
                      )}
                      {product.brand?.name && !subCategoryName && (
                        <span className="text-[10px] text-slate-400 truncate">
                          <HighlightText text={product.brand.name} query={query} />
                        </span>
                      )}
                    </div>
                  </div>

                  {displayPrice && (
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-bold text-[#005EB8]">
                        ₹{Number(displayPrice).toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onViewAll}
            className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-[#005EB8] text-xs font-bold text-center transition-colors border-t border-slate-100 flex items-center justify-center gap-1"
          >
            <span>View All Results for &quot;{query}&quot;</span>
            <FiChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="p-6 text-center space-y-1">
          <p className="text-xs font-semibold text-slate-700">
            No products found for &quot;{query}&quot;
          </p>
          <p className="text-[11px] text-slate-400">
            Search by medicine title or subcategory (e.g. Oncology, IVF, Tablets)
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Search Dialog ──────────────────────────── */
function SearchDialog({ open, onOpenChange, searchQuery, setSearchQuery, handleSearch, searchInputRef, categories }) {
  const router = useRouter();
  const [dialogResults, setDialogResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) {
      setDialogResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetchApi(
          `/public/products?search=${encodeURIComponent(q)}&limit=6`
        );
        if (res?.data?.products) {
          setDialogResults(res.data.products);
        } else if (res?.products) {
          setDialogResults(res.products);
        } else {
          setDialogResults([]);
        }
      } catch (err) {
        console.error("Search dialog fetch error:", err);
        setDialogResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[580px] bg-white p-0 overflow-hidden border shadow-2xl rounded-2xl" style={{ borderColor: "#DCE7F2" }}>
        <DialogHeader className="px-6 pt-5 pb-4 border-b" style={{ borderColor: "#DCE7F2" }}>
          <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2.5">
            <div className="p-2 rounded-xl" style={{ background: "rgba(0,94,184,0.08)" }}>
              <FiSearch className="h-4 w-4" style={{ color: "#005EB8" }} />
            </div>
            Search Medicines & Healthcare Products
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-5">
          <form onSubmit={handleSearch} className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#005EB8" }} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by title, subcategory, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-11 pr-28 text-sm rounded-xl border focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400"
              style={{ borderColor: "#DCE7F2", background: "#F7FAFC" }}
              autoComplete="off"
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <FiX className="h-4 w-4" />
                </button>
              )}
              <button
                type="submit"
                className="h-9 px-4 rounded-lg text-white text-xs font-bold"
                style={{ background: "#005EB8" }}
              >
                Search
              </button>
            </div>
          </form>

          {/* Instant Live Results inside Search Modal */}
          {searchQuery.trim().length >= 2 && (
            <div className="mt-4 border rounded-xl overflow-hidden" style={{ borderColor: "#DCE7F2" }}>
              {isSearching ? (
                <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-[#005EB8] border-t-transparent rounded-full animate-spin" />
                  <span>Searching medicines & subcategories for &quot;{searchQuery}&quot;...</span>
                </div>
              ) : dialogResults.length > 0 ? (
                <div>
                  <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <span>Products Found ({dialogResults.length})</span>
                    <span className="text-[10px] text-[#005EB8] font-medium">Live Search</span>
                  </div>

                  <div className="divide-y divide-slate-100 max-h-[280px] overflow-y-auto">
                    {dialogResults.map((product) => {
                      const imgUrl =
                        product.image ||
                        product.images?.[0]?.url ||
                        "/placeholder-medicine.png";
                      const displayPrice =
                        product.salePrice || product.price || product.basePrice || product.variants?.[0]?.price;
                      const subCategoryName =
                        product.subCategory?.name ||
                        product.subCategories?.[0]?.name ||
                        product.subCategories?.[0]?.subCategory?.name;
                      const categoryName =
                        product.category?.name ||
                        product.categories?.[0]?.category?.name ||
                        product.categories?.[0]?.name;

                      return (
                        <div
                          key={product.id}
                          onClick={() => {
                            onOpenChange(false);
                            setSearchQuery("");
                            router.push(`/products/${product.slug}`);
                          }}
                          className="p-3 hover:bg-blue-50/70 transition-colors flex items-center gap-3 cursor-pointer group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center p-0.5">
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt={product.name}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <Pill className="w-5 h-5 text-[#005EB8]" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-slate-800 truncate group-hover:text-[#005EB8] transition-colors">
                              <HighlightText text={product.name} query={searchQuery} />
                            </h4>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              {subCategoryName && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                                  <HighlightText text={subCategoryName} query={searchQuery} />
                                </span>
                              )}
                              {categoryName && (
                                <span className="text-[10px] text-slate-400 truncate">
                                  <HighlightText text={categoryName} query={searchQuery} />
                                </span>
                              )}
                              {product.brand?.name && !subCategoryName && (
                                <span className="text-[10px] text-slate-400 truncate">
                                  <HighlightText text={product.brand.name} query={searchQuery} />
                                </span>
                              )}
                            </div>
                          </div>

                          {displayPrice && (
                            <div className="text-right flex-shrink-0">
                              <span className="text-xs font-bold text-[#005EB8]">
                                ₹{Number(displayPrice).toLocaleString("en-IN")}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      onOpenChange(false);
                      handleSearch(e);
                    }}
                    className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-[#005EB8] text-xs font-bold text-center transition-colors border-t border-slate-100 flex items-center justify-center gap-1"
                  >
                    <span>View All Results for &quot;{searchQuery}&quot;</span>
                    <FiChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-500">
                  No products found for &quot;{searchQuery}&quot;
                </div>
              )}
            </div>
          )}

          {categories.length > 0 && (
            <div className="mt-5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Browse Categories</p>
              <div className="flex flex-wrap gap-2">
                {categories.slice(0, 15).map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.slug}`}
                    onClick={() => onOpenChange(false)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all hover:text-white"
                    style={{ borderColor: "#DCE7F2", color: "#005EB8", background: "rgba(0,94,184,0.04)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#005EB8"; e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,94,184,0.04)"; e.currentTarget.style.color = "#005EB8"; }}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 pt-4 border-t flex justify-between text-gray-400 text-[11px]" style={{ borderColor: "#DCE7F2" }}>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 border rounded bg-gray-50 text-gray-500 text-[10px]" style={{ borderColor: "#DCE7F2" }}>ESC</kbd>
              close
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 border rounded bg-gray-50 text-gray-500 text-[10px]" style={{ borderColor: "#DCE7F2" }}>ENTER</kbd>
              search
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Mobile Drawer ──────────────────────────── */
function MobileMenu({ isOpen, onClose, user, isAuthenticated, categories, cartCount, handleLogout, pathname }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] lg:hidden">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="absolute left-0 top-0 bottom-0 w-[85%] max-w-[340px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">

        {/* Drawer Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
          style={{ borderColor: "#DCE7F2", background: "linear-gradient(135deg, rgba(0,94,184,0.03), rgba(22,199,217,0.04))" }}
        >
          <Image src="/logo.png" alt="Indian Pharmazee" width={130} height={44} className="h-4 w-auto object-contain" />
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* User section */}
        <ClientOnly>
          <div
            className="px-4 py-3 border-b flex-shrink-0"
            style={{ borderColor: "#DCE7F2", background: "rgba(0,94,184,0.02)" }}
          >
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <AvatarCircle name={user?.name} size="lg" />
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate text-sm">{user?.name || "User"}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link href="/auth" className="flex-1" onClick={onClose}>
                  <Button className="w-full h-9 text-sm font-semibold text-white" style={{ background: "#005EB8" }}>
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth?tab=register" className="flex-1" onClick={onClose}>
                  <Button variant="outline" className="w-full h-9 text-sm font-semibold border-2" style={{ borderColor: "#DCE7F2" }}>
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </ClientOnly>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto py-2">
          <div className="px-2 space-y-0.5">
            <MobileNavItem href="/products" icon={FiPackage} label="All Medicines" onClick={onClose} />
            <MobileNavItem href="/categories" icon={FiSearch} label="Categories" onClick={onClose} />
            <MobileNavItem href="/wishlist" icon={FiHeart} label="Wishlist" onClick={onClose} />
            <MobileNavItem href="/cart" icon={FiShoppingCart} label="Cart" onClick={onClose} badge={cartCount} />
          </div>

          {categories.length > 0 && (
            <DrawerSection title="Medicine Categories">
              {categories.slice(0, 15).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-600 hover:text-primary hover:bg-blue-50/60 transition-all"
                >
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#16C7D9" }} />
                  {cat.name}
                </Link>
              ))}
              <Link
                href="/categories"
                onClick={onClose}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-colors hover:bg-blue-50"
                style={{ color: "#005EB8" }}
              >
                View All <FiChevronRight className="h-4 w-4" />
              </Link>
            </DrawerSection>
          )}

          <ClientOnly>
            {isAuthenticated && (
              <DrawerSection title="Account">
                {[
                  { href: "/account", icon: FiUser, label: "Profile" },
                  { href: "/account/orders", icon: FiPackage, label: "My Orders" },
                  { href: "/account/addresses", icon: FiMapPin, label: "Addresses" },
                ].map(({ href, icon, label }) => (
                  <MobileNavItem key={href} href={href} icon={icon} label={label} onClick={onClose} />
                ))}
                <button
                  onClick={() => { handleLogout(); onClose(); }}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-all"
                >
                  <FiLogOut className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </DrawerSection>
            )}
          </ClientOnly>

          <DrawerSection title="More">
            {FOOTER_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-600 hover:text-primary hover:bg-blue-50/60 transition-all"
              >
                {label}
              </Link>
            ))}
          </DrawerSection>

          {/* Contact block */}
          <div
            className="mx-3 mt-3 p-4 rounded-2xl space-y-2.5"
            style={{ background: "rgba(0,94,184,0.04)", border: "1px solid #DCE7F2" }}
          >
            <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-2.5 text-xs text-gray-500 hover:text-primary transition-colors">
              <FiMail className="h-4 w-4 flex-shrink-0" style={{ color: "#005EB8" }} />
              {CONTACT.email}
            </a>
            <a href={`tel:${CONTACT.phone}`} className="flex items-center gap-2.5 text-xs text-gray-500 hover:text-primary transition-colors">
              <FiPhone className="h-4 w-4 flex-shrink-0" style={{ color: "#005EB8" }} />
              {CONTACT.phone}
            </a>
            <a
              href={`https://wa.me/${CONTACT.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 text-xs font-semibold text-green-600 hover:text-green-700 transition-colors"
            >
              <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Message us on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Mobile Bottom Nav ──────────────────────── */
function BottomNav({ pathname, isAuthenticated, cartCount, onMenuOpen }) {
  const items = [
    {
      href: "/",
      label: "Home",
      active: pathname === "/",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      href: "/products",
      label: "Medicines",
      active: pathname.startsWith("/products"),
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50" style={{ borderColor: "#DCE7F2" }}>
      <div className="grid grid-cols-5 h-14">
        {/* Home */}
        <Link
          href="/"
          className={cn("flex flex-col items-center justify-center gap-0.5 transition-colors", pathname === "/" ? "text-primary" : "text-gray-400")}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-[9px] font-semibold">Home</span>
        </Link>

        {/* Medicines */}
        <Link
          href="/products"
          className={cn("flex flex-col items-center justify-center gap-0.5 transition-colors", pathname.startsWith("/products") ? "text-primary" : "text-gray-400")}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          <span className="text-[9px] font-semibold">Medicines</span>
        </Link>

        {/* Cart — center elevated */}
        <Link
          href="/cart"
          className="flex flex-col items-center justify-center gap-0.5 relative"
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg -mt-4 relative"
            style={{ background: "linear-gradient(135deg, #005EB8, #0074e4)" }}
          >
            <FiShoppingCart className="h-5 w-5 text-white" />
            <ClientOnly>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1">
                  {cartCount}
                </span>
              )}
            </ClientOnly>
          </div>
          <span className="text-[9px] font-semibold text-gray-400 mt-0.5">Cart</span>
        </Link>

        {/* Account */}
        <Link
          href={isAuthenticated ? "/account" : "/auth"}
          className={cn("flex flex-col items-center justify-center gap-0.5 transition-colors", pathname.startsWith("/account") || pathname === "/auth" ? "text-primary" : "text-gray-400")}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
          </svg>
          <span className="text-[9px] font-semibold">Account</span>
        </Link>

        {/* More */}
        <button
          onClick={onMenuOpen}
          className="flex flex-col items-center justify-center gap-0.5 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="text-[9px] font-semibold">More</span>
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
