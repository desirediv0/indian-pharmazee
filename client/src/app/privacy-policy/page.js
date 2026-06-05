import { PageHero } from "@/components/ui/PageHero";
import { Shield, Eye, Lock, CheckCircle } from "lucide-react";

export const metadata = {
    title: "Privacy Policy | Indian Pharmazee",
    description: "Learn how Indian Pharmazee handles patient health records, prescription uploads, SSL-encrypted transactional data, and cookie compliance in accordance with Razorpay and RBI regulations.",
};

const principles = [
    {
        icon: Lock,
        title: "Clinical Confidentiality",
        description: "Your health records, prescription scans, and specialized medication requirements are kept strictly confidential. We never sell or share patient data."
    },
    {
        icon: Shield,
        title: "Secure Encryption & Payments",
        description: "All payments are processed securely via Razorpay with PCI-DSS compliance. We do not store your credit card or payment credentials."
    },
    {
        icon: Eye,
        title: "Transparent Sourcing",
        description: "We are transparent about where our medicines come from. Only authorized regulatory officers get access to batch traceability records."
    }
];

export default function PrivacyPolicyPage() {
    return (
        <div className="bg-slate-50 min-h-screen font-sans">
            <PageHero
                title="Privacy Policy"
                description="Our clinical guidelines for securing patient files, healthcare records, and secure Razorpay payment transactions"
                breadcrumbs={[{ label: "Privacy Policy" }]}
                variant="default"
                size="sm"
            />

            <section className="py-16 px-6 sm:px-8 lg:px-12">
                <div className="max-w-4xl mx-auto">
                    
                    {/* Top core pillars */}
                    <div className="grid md:grid-cols-3 gap-6 mb-12">
                        {principles.map((item, index) => (
                            <div key={index} className="bg-white rounded-2xl p-6 border border-[#DCE7F2] shadow-sm flex flex-col items-center text-center">
                                <div className="w-12 h-12 bg-teal-50 text-[#16C7D9] rounded-xl flex items-center justify-center mb-4">
                                    <item.icon className="h-5.5 w-5.5" />
                                </div>
                                <h3 className="font-display font-bold text-slate-900 text-sm mb-2">{item.title}</h3>
                                <p className="text-slate-500 text-[11px] leading-relaxed">{item.description}</p>
                            </div>
                        ))}
                    </div>

                    {/* Policy Details */}
                    <div className="bg-white rounded-3xl p-8 md:p-12 border border-[#DCE7F2] shadow-sm space-y-10">
                        
                        <div>
                            <h2 className="font-display text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-[#005EB8] rounded-full" />
                                Introduction & Regulatory Compliance
                            </h2>
                            <p className="text-slate-600 text-sm leading-relaxed mb-3">
                                Indian Pharmazee (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting your privacy and personal health information. This Privacy Policy details how we collect, use, and safeguard your personal details, clinical prescriptions, and payment data in compliance with the **Information Technology Act, 2000**, the **Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011**, and other applicable pharmaceutical regulations in India.
                            </p>
                        </div>

                        <div>
                            <h2 className="font-display text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-[#16C7D9] rounded-full" />
                                Collection of Patient & User Information
                            </h2>
                            <p className="text-slate-600 text-sm leading-relaxed mb-3">
                                When you access Indian Pharmazee or request specialty medicine sourcing, we collect necessary data to ensure clinical compliance, verify doctor credentials, and deliver orders safely:
                            </p>
                            <ul className="space-y-2 pl-5 list-disc text-xs md:text-sm text-slate-600">
                                <li><strong>Identity & Demographics:</strong> Full name, telephone numbers, shipping coordinates, billing addresses, and active email contacts.</li>
                                <li><strong>Prescription Documentation:</strong> Uploaded copies of clinical prescriptions, doctor credentials, and disease indicators (IVF, oncology, etc.) to verify medical compliance.</li>
                                <li><strong>Technical Identifiers:</strong> Log analytics, secure session tokens, cookies, and IP addresses to maintain shopping sessions and prevent fraud.</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="font-display text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-[#005EB8] rounded-full" />
                                Secure Payment Gateway & Financial Data Protection
                            </h2>
                            <p className="text-slate-600 text-sm leading-relaxed mb-3">
                                To ensure the highest level of security for your financial transactions, Indian Pharmazee uses **Razorpay** as its primary payment aggregator gateway:
                            </p>
                            <ul className="space-y-2 pl-5 list-disc text-xs md:text-sm text-slate-600">
                                <li>All online transactions are encrypted using industry-standard **256-bit SSL certificates**.</li>
                                <li>Payment information (such as credit/debit card numbers, UPI PINs, net banking credentials) is processed directly by Razorpay on their secure PCI-DSS compliant servers.</li>
                                <li>**Indian Pharmazee does not store, capture, or have access to** your sensitive financial credentials.</li>
                                <li>Razorpay adheres to all security standards mandated by the Reserve Bank of India (RBI) and card networks (Visa, Mastercard, RuPay).</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="font-display text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-[#16C7D9] rounded-full" />
                                Usage of Sourced Data
                            </h2>
                            <p className="text-slate-600 text-sm leading-relaxed mb-3">
                                Sourced data is processed exclusively for clinical, shipping, and technical fulfillment:
                            </p>
                            <ul className="space-y-2 pl-5 list-disc text-xs md:text-sm text-slate-600">
                                <li>To verify and confirm prescription validity via our licensed partner pharmacist desk.</li>
                                <li>To share shipping logs (recipient name, address, phone number) with verified cold chain courier firms (e.g., Blue Dart, Delhivery).</li>
                                <li>To dispatch order status notifications, payment receipts, or regulatory alerts via WhatsApp and email.</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="font-display text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-[#005EB8] rounded-full" />
                                Safety & Prescription Protection
                            </h2>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                We utilize modern security systems to keep patient data secure. Any scanned medical documents, patient names, and private addresses are saved on encrypted network storage. We restrict access to this data, allowing only authorized pharmacists and shipping supervisors to see it to process deliveries.
                            </p>
                        </div>

                        <div>
                            <h2 className="font-display text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-[#16C7D9] rounded-full" />
                                Cookies and Session Tokens
                            </h2>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                Our platform utilizes simple security cookies and storage variables to remember your product cart items, keep you logged into your secure profile dashboard, and analyze browser usage patterns. You can choose to disable cookies through your browser settings, but please note that some essential parts of the shop system may not work correctly as a result.
                            </p>
                        </div>

                        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div>
                                <p className="text-sm font-bold text-slate-800">Have privacy concerns or data requests?</p>
                                <p className="text-xs text-slate-500 mt-0.5">Contact our dedicated Compliance and Security Officer.</p>
                            </div>
                            <a
                                href="mailto:indianpharmazee@gmail.com"
                                className="text-xs font-bold text-[#005EB8] bg-blue-50 px-4 py-2.5 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors"
                            >
                                indianpharmazee@gmail.com
                            </a>
                        </div>

                    </div>
                </div>
            </section>
        </div>
    );
}
