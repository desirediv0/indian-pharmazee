"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Mail, Lock, User, Phone, ArrowRight,
  Eye, EyeOff, Loader2, ShieldCheck, Thermometer, BadgeCheck
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

const TRUST_POINTS = [
  { icon: BadgeCheck, text: "100% Genuine Medicines" },
  { icon: Thermometer, text: "Cold Chain 2°C–8°C Delivery" },
  { icon: ShieldCheck, text: "Trusted Across India" },
];

/* ── Shared field style ── */
const inputCls = "w-full pl-11 pr-4 py-3.5 border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 transition-all";
const inputStyle = { borderColor: "#DCE7F2", background: "#F7FAFC" };
const inputFocus = "focus:ring-[#005EB8]/20 focus:border-[#005EB8]";

function AuthForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const tabFromUrl = searchParams.get("tab") || "login";
  const [activeTab, setActiveTab] = useState(tabFromUrl);

  useEffect(() => { setActiveTab(tabFromUrl); }, [tabFromUrl]);
  useEffect(() => { if (isAuthenticated) router.push("/"); }, [isAuthenticated, router]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    router.push(`/auth?tab=${tab}`, { scroll: false });
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#F7FAFC" }}>

      {/* ── Left panel — branding (desktop only) ── */}
      <div
        className="hidden lg:flex lg:w-[45%] xl:w-[40%] flex-col justify-between p-12 relative overflow-hidden flex-shrink-0"
        style={{ background: "linear-gradient(135deg, #0A2540 0%, #005EB8 60%, #0074e4 100%)" }}
      >
        {/* Decorative */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #16C7D9, transparent 70%)" }} />
          <div className="absolute bottom-20 -left-10 w-60 h-60 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #16C7D9, transparent 70%)" }} />
          {/* Cross */}
          <svg className="absolute bottom-10 right-10 opacity-5" width="160" height="160" viewBox="0 0 160 160" fill="none">
            <rect x="64" y="10" width="32" height="140" rx="8" fill="white" />
            <rect x="10" y="64" width="140" height="32" rx="8" fill="white" />
          </svg>
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/">
            <Image src="/logo.jpeg" alt="Indian Pharmazee" width={160} height={54} className="h-20 w-auto object-contain " />
          </Link>
        </div>

        {/* Center copy */}
        <div className="relative z-10">
          <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-4">
            Your Trusted<br />
            <span style={{ color: "#16C7D9" }}>Pharma Platform</span>
          </h2>
          <p className="text-white/60 text-sm leading-relaxed mb-8 max-w-xs">
            Access genuine branded medicines, track orders, and get cold chain delivery across India — all in one place.
          </p>

          {/* Trust points */}
          <div className="space-y-3">
            {TRUST_POINTS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(22,199,217,0.15)" }}>
                  <Icon className="h-4 w-4" style={{ color: "#16C7D9" }} />
                </div>
                <span className="text-white/75 text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom tagline */}
        <div className="relative z-10">
          <p className="text-white/30 text-xs">
            indianpharmazee@gmail.com &nbsp;·&nbsp; +91 95602 47619
          </p>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/">
              <Image src="/logo.jpeg" alt="Indian Pharmazee" width={140} height={48} className="h-12 w-auto object-contain mx-auto" />
            </Link>
          </div>

          {/* Card */}
          <div className="bg-white rounded shadow-xl border overflow-hidden" style={{ borderColor: "#DCE7F2", boxShadow: "0 20px 60px rgba(0,94,184,0.10)" }}>

            {/* Tabs */}
            <div className="flex border-b" style={{ borderColor: "#DCE7F2" }}>
              {["login", "register"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className="flex-1 py-4 text-sm font-semibold transition-all capitalize"
                  style={activeTab === tab
                    ? { color: "#005EB8", borderBottom: "2px solid #005EB8", background: "rgba(0,94,184,0.03)" }
                    : { color: "#6b7280" }
                  }
                >
                  {tab === "login" ? "Sign In" : "Register"}
                </button>
              ))}
            </div>

            <div className="p-7 md:p-9">
              {activeTab === "login" && <LoginForm />}
              {activeTab === "register" && <RegisterForm />}
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-gray-600">Terms</Link>{" "}
            &amp;{" "}
            <Link href="/privacy-policy" className="underline hover:text-gray-600">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Email and password are required"); return; }
    setIsSubmitting(true);
    try {
      await login(email, password);
      sessionStorage.setItem("justLoggedIn", "true");
      toast.success("Login successful!");
      const returnUrl = searchParams.get("returnUrl") || searchParams.get("redirect");
      setTimeout(() => router.push(returnUrl ? decodeURIComponent(returnUrl) : "/"), 300);
    } catch (error) {
      const msg = error.message || "Login failed. Please check your credentials.";
      if (msg.toLowerCase().includes("verify") || msg.toLowerCase().includes("verification")) {
        toast.error(<div>{msg}{" "}<Link href="/resend-verification" className="font-medium underline text-black">Resend verification</Link></div>);
      } else {
        toast.error(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="mb-7">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "#0A2540" }}>Welcome Back</h1>
        <p className="text-gray-400 text-sm">Sign in to your Indian Pharmazee account</p>
      </div>

      {/* Email */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#0A2540" }}>Email Address</label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" style={{ width: 18, height: 18 }} />
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            placeholder="you@example.com"
            className={`${inputCls} ${inputFocus}`} style={inputStyle}
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: "#0A2540" }}>Password</label>
          <Link href="/forgot-password" className="text-xs font-medium hover:underline" style={{ color: "#005EB8" }}>Forgot password?</Link>
        </div>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" style={{ width: 18, height: 18 }} />
          <input
            type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required
            placeholder="••••••••"
            className={`${inputCls} pr-12 ${inputFocus}`} style={inputStyle}
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPassword ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-12 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60 mt-2"
        style={{ background: "linear-gradient(135deg, #005EB8, #0074e4)" }}
      >
        {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</> : <>Sign In <ArrowRight className="h-4 w-4" /></>}
      </button>

      <p className="text-center text-sm text-gray-400">
        No account?{" "}
        <Link href="/auth?tab=register" className="font-semibold hover:underline" style={{ color: "#005EB8" }}>Register here</Link>
      </p>
    </form>
  );
}

function RegisterForm() {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (formData.name.trim().length < 3) { toast.error("Name should be at least 3 characters"); return false; }
    if (!formData.phone || formData.phone.length < 10) { toast.error("Please enter a valid phone number"); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { toast.error("Please enter a valid email address"); return false; }
    if (formData.password.length < 8) { toast.error("Password should be at least 8 characters"); return false; }
    if (formData.password !== formData.confirmPassword) { toast.error("Passwords do not match"); return false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const res = await register({ name: formData.name, email: formData.email, phone: formData.phone, password: formData.password });
      const payload = res?.data ?? res;
      const emailSent = payload?.emailSent !== false;
      if (payload?.debugOtp) {
        toast.success(`Verification code (dev): ${payload.debugOtp}`, { duration: 25000 });
      } else if (emailSent) {
        toast.success("Registration successful! Check your email for the OTP.", { duration: 4000 });
      } else {
        toast.warning(res?.message || "Account created but email could not be sent.");
      }
      localStorage.setItem("registeredEmail", formData.email);
      setTimeout(() => router.push(`/verify-otp?email=${encodeURIComponent(formData.email)}`), 600);
    } catch (error) {
      toast.error(error.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "#0A2540" }}>Create Account</h1>
        <p className="text-gray-400 text-sm">Join Indian Pharmazee today</p>
      </div>

      {[
        { label: "Full Name", name: "name", type: "text", icon: User, placeholder: "Your full name" },
        { label: "Email Address", name: "email", type: "email", icon: Mail, placeholder: "you@example.com" },
        { label: "Phone Number", name: "phone", type: "tel", icon: Phone, placeholder: "+91 9876543210" },
      ].map(({ label, name, type, icon: Icon, placeholder }) => (
        <div key={name}>
          <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#0A2540" }}>{label}</label>
          <div className="relative">
            <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" style={{ width: 18, height: 18 }} />
            <input
              type={type} name={name} value={formData[name]} onChange={handleChange} required placeholder={placeholder}
              className={`${inputCls} ${inputFocus}`} style={inputStyle}
            />
          </div>
        </div>
      ))}

      {/* Password */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#0A2540" }}>Password</label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" style={{ width: 18, height: 18 }} />
          <input
            type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} required
            placeholder="Min 8 characters"
            className={`${inputCls} pr-12 ${inputFocus}`} style={inputStyle}
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPassword ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
          </button>
        </div>
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "#0A2540" }}>Confirm Password</label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" style={{ width: 18, height: 18 }} />
          <input
            type={showPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required
            placeholder="Confirm your password"
            className={`${inputCls} ${inputFocus}`} style={inputStyle}
          />
        </div>
      </div>

      <button
        type="submit" disabled={isSubmitting}
        className="w-full h-12 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60 mt-2"
        style={{ background: "linear-gradient(135deg, #005EB8, #0074e4)" }}
      >
        {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account...</> : <>Create Account <ArrowRight className="h-4 w-4" /></>}
      </button>

      <p className="text-center text-sm text-gray-400">
        Already have an account?{" "}
        <Link href="/auth?tab=login" className="font-semibold hover:underline" style={{ color: "#005EB8" }}>Sign In</Link>
      </p>
    </form>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F7FAFC" }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#005EB8" }} />
      </div>
    }>
      <AuthForm />
    </Suspense>
  );
}
