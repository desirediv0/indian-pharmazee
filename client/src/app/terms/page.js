import { PageHero } from "@/components/ui/PageHero";
import { Gavel, CheckSquare, ShieldCheck, CreditCard } from "lucide-react";

export const metadata = {
    title: "Terms & Conditions | Indian Pharmazee",
    description: "Read Indian Pharmazee's Terms of Use, prescription guidelines, medical disclaimer, and patient purchasing agreements in compliance with Razorpay standards.",
};

const provisions = [
    {
        icon: Gavel,
        title: "Compliance Guidelines",
        description: "All transactions and sourcing enquiries are conducted under the Drugs and Cosmetics Act, 1940 and other applicable Indian pharmaceutical guidelines."
    },
    {
        icon: ShieldCheck,
        title: "Prescription Integrity",
        description: "We require valid, physician-signed prescriptions for all scheduled medicines. Fake or tampered uploads will be immediately rejected."
    },
    {
        icon: CreditCard,
        title: "Payment Security",
        description: "All online transactions are securely routed through Razorpay's PCI-DSS compliant infrastructure with multiple checks."
    }
];

export default function TermsPage() {
    return (
        <div className="bg-slate-50 min-h-screen font-sans">
            <PageHero
                title="Terms & Conditions"
                description="Regulatory frameworks, user agreements, Razorpay payment processing terms, and medical sourcing terms of service"
                breadcrumbs={[{ label: "Terms & Conditions" }]}
                variant="default"
                size="sm"
            />

            <section className="py-16 px-6 sm:px-8 lg:px-12">
                <div className="max-w-4xl mx-auto">
                    
                    {/* Key terms grid */}
                    <div className="grid md:grid-cols-3 gap-6 mb-12">
                        {provisions.map((item, index) => (
                            <div key={index} className="bg-white rounded-2xl p-6 border border-[#DCE7F2] shadow-sm flex flex-col items-center text-center">
                                <div className="w-12 h-12 bg-blue-50 text-[#005EB8] rounded-xl flex items-center justify-center mb-4">
                                    <item.icon className="h-5.5 w-5.5" />
                                </div>
                                <h3 className="font-display font-bold text-slate-900 text-sm mb-2">{item.title}</h3>
                                <p className="text-slate-500 text-[11px] leading-relaxed">{item.description}</p>
                            </div>
                        ))}
                    </div>

                    {/* Terms Details */}
                    <div className="bg-white rounded-3xl p-8 md:p-12 border border-[#DCE7F2] shadow-sm space-y-10">
                        
                        <div>
                            <h2 className="font-display text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-[#005EB8] rounded-full" />
                                User Agreement & Acceptance
                            </h2>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                By visiting Indian Pharmazee, registering an account, uploading a clinical prescription, submitting a specialty sourcing query, or completing a product purchase, you explicitly accept these Terms and Conditions. These terms govern your use of the website and constitute a binding legal agreement between you and Indian Pharmazee. If you do not agree to these terms, please do not access or use the platform.
                            </p>
                        </div>

                        <div>
                            <h2 className="font-display text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-[#16C7D9] rounded-full" />
                                Clinical Prescription Sourcing Mandate
                            </h2>
                            <p className="text-slate-600 text-sm leading-relaxed mb-3">
                                For all scheduled medications (including oncology therapeutics, IVF hormones, and transplant drugs):
                            </p>
                            <ul className="space-y-2 pl-5 list-disc text-xs md:text-sm text-slate-600">
                                <li>You must provide a clear scan of a valid prescription signed by a registered medical practitioner (with registration number visible).</li>
                                <li>All uploaded documents undergo rigorous clinical audit by our licensed partner pharmacists before dispatch approval.</li>
                                <li>We reserve the right to cancel any order if the prescription is found to be expired, altered, or otherwise invalid.</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="font-display text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-[#005EB8] rounded-full" />
                                Payments, Fees & Secure Processing (Razorpay)
                            </h2>
                            <p className="text-slate-600 text-sm leading-relaxed mb-3">
                                Online transactions on Indian Pharmazee are processed using the secure Razorpay payment gateway:
                            </p>
                            <ul className="space-y-2 pl-5 list-disc text-xs md:text-sm text-slate-600">
                                <li>We accept major Credit Cards, Debit Cards, Net Banking, UPI, and authorized Wallets supported by Razorpay.</li>
                                <li>All payments are billed in Indian Rupees (INR). You agree to pay the complete price listed at the time of checkout, including any applicable Goods and Services Tax (GST) and shipping fees.</li>
                                <li>In the event of payment failure or technical error, the transaction may be rolled back, and any debited amount will be refunded directly via Razorpay to your original payment source within 5–7 business days.</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="font-display text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-[#9333EA] rounded-full" />
                                Product Returns & 7-Day Refund Policy
                            </h2>
                            <p className="text-slate-600 text-sm leading-relaxed mb-3">
                                Our return policy is structured to preserve clinical safety and drug efficacy:
                            </p>
                            <ul className="space-y-2 pl-5 list-disc text-xs md:text-sm text-slate-600">
                                <li><strong>Only non-cold chain products</strong> can be returned within our standard <strong>7-day return policy</strong>.</li>
                                <li>All temperature-sensitive, cold chain products (2°C–8°C) are strictly non-returnable and non-refundable once dispatched, as storage stability cannot be verified post-delivery.</li>
                                <li>Returned items must be completely unopened, with original seals, packaging, and batch details intact.</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="font-display text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-[#16C7D9] rounded-full" />
                                Pricing & Stock Availability
                            </h2>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                While we work hard to keep medicine pricing accurate, system errors can sometimes occur. If an incorrect price is listed due to a typographical or system glitch, we reserve the right to coordinate pricing updates or cancel the order before dispatch. If a payment has already been captured for a cancelled order, a full refund will be immediately issued back to the source account.
                            </p>
                        </div>

                        <div>
                            <h2 className="font-display text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-[#005EB8] rounded-full" />
                                Medical Disclaimer & Patient Advice
                            </h2>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                The informational content, medicine details, and sourcing guidance presented on Indian Pharmazee serve strictly as educational references. This information does not substitute professional medical diagnosis, advice, or treatment from a certified doctor. Always discuss therapeutic benefits and side effects directly with your physician.
                            </p>
                        </div>

                        <div>
                            <h2 className="font-display text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-[#16C7D9] rounded-full" />
                                Limitation of Liability
                            </h2>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                Indian Pharmazee facilitates direct-to-patient pharmacy sourcing through authorized, licensed retail and wholesale pharmacy partners. We are not the manufacturers of the medicines. Consequently, Indian Pharmazee shall not be held liable for any therapeutic side-effects, product recalls, or issues relating to manufacturer quality control.
                            </p>
                        </div>

                        <div>
                            <h2 className="font-display text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-[#005EB8] rounded-full" />
                                Governing Law & Jurisdiction
                            </h2>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                These Terms and Conditions and any transactions executed on this platform shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or in connection with these terms shall be subject to the exclusive jurisdiction of the courts in **New Delhi, India**.
                            </p>
                        </div>

                        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div>
                                <p className="text-sm font-bold text-slate-800">Have questions about our user terms?</p>
                                <p className="text-xs text-slate-500 mt-0.5">Our support desk is active daily to resolve your queries.</p>
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
