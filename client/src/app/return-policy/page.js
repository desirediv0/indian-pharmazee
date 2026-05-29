import { PageHero } from "@/components/ui/PageHero";
import { BadgeAlert, ShieldCheck, RefreshCw, Mail } from "lucide-react";

export const metadata = {
    title: "Return & Cancellation Policy | Indian Pharmazee",
    description: "Review Indian Pharmazee's pharmaceutical return guidelines, cold chain safety restrictions, refund approvals, and replacement terms.",
};

const returnSteps = [
    {
        step: 1,
        title: "Report Issue",
        description: "Submit details or photo proof of your query within 24 hours of delivery."
    },
    {
        step: 2,
        title: "Clinical Review",
        description: "Our quality control team inspects packaging and cold chain logs."
    },
    {
        step: 3,
        title: "Free Retrieval",
        description: "For approved claims, we schedule a secure pickup at your address."
    },
    {
        step: 4,
        title: "Refund/Exchange",
        description: "Credit processed to original payment method within 5–7 days."
    }
];

export default function ReturnPolicyPage() {
    return (
        <div className="bg-slate-50 min-h-screen font-sans">
            <PageHero
                title="Return & Cancellation Policy"
                description="Our strict commitment to product purity, thermal safety, and patient satisfaction"
                breadcrumbs={[{ label: "Return Policy" }]}
                variant="default"
                size="sm"
            />

            <section className="py-16 px-6 sm:px-8 lg:px-12">
                <div className="max-w-4xl mx-auto">
                    
                    {/* Return Process Timeline */}
                    <div className="bg-white rounded-3xl p-8 border border-[#DCE7F2] shadow-sm mb-12">
                        <h2 className="font-display text-2xl font-bold text-slate-900 mb-8 text-center flex items-center justify-center gap-2">
                            <RefreshCw className="w-5.5 h-5.5 text-[#005EB8]" /> Return & Sourcing Claims Workflow
                        </h2>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {returnSteps.map((item) => (
                                <div key={item.step} className="text-center relative">
                                    <div className="w-12 h-12 bg-blue-50 text-[#005EB8] border border-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 font-display font-bold text-lg">
                                        {item.step}
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-sm mb-1.5">{item.title}</h3>
                                    <p className="text-slate-500 text-[11px] leading-normal px-2">{item.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Detailed Guidelines Prose */}
                    <div className="bg-white rounded-3xl p-8 md:p-12 border border-[#DCE7F2] shadow-sm space-y-10">
                        
                        {/* CRITICAL WARNING ALERT */}
                        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200/60 flex gap-4 items-start">
                            <BadgeAlert className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold text-amber-900">Important Safety Notice: Cold Chain Restrictions</h4>
                                <p className="text-xs text-amber-800 leading-relaxed mt-1">
                                    To protect clinical integrity and ensure patient safety, all **temperature-sensitive cold chain medications (2°C–8°C)**—such as IVF injections, oncology therapies, and biological immunoglobulins—are strictly **non-returnable and non-refundable** once dispatched. We cannot guarantee storage conditions once the package leaves our thermal transit systems.
                                </p>
                            </div>
                        </div>

                        <div>
                            <h2 className="font-display text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-[#005EB8] rounded-full" />
                                Return Eligibility Criteria
                            </h2>
                            <p className="text-slate-600 text-sm leading-relaxed mb-4">
                                Non-cold-chain pharmaceuticals, OTC formulations, and general wellness items can be returned within **7 days of delivery** under the following strict conditions:
                            </p>
                            <ul className="space-y-3 pl-5 list-disc text-xs md:text-sm text-slate-600">
                                <li>The outer security seals and therapeutic blister foil packs must remain 100% unopened and undamaged.</li>
                                <li>The product packaging must be original, showing visible batch numbers and expiry dates matching our system invoice.</li>
                                <li>The product must not show physical scratches, liquid exposure, or environmental contamination.</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="font-display text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-[#16C7D9] rounded-full" />
                                Damaged, Defective, or Wrong Deliveries
                            </h2>
                            <p className="text-slate-600 text-sm leading-relaxed mb-4">
                                In the rare case that your shipment arrived damaged, physically compromised, or expired, we will initiate a **free priority replacement or 100% full refund**:
                            </p>
                            <ul className="space-y-3 pl-5 list-disc text-xs md:text-sm text-slate-600">
                                <li>Please take high-resolution photos of the package and immediately contact us at **indianpharmazee@gmail.com** or WhatsApp (+91 95602 47619) within **24 hours** of delivery.</li>
                                <li>Do not discard the insulation material or the original box, as it may be audited by our shipping partners.</li>
                                <li>Upon verification, our courier will collect the parcel free of charge and deliver a priority replacement.</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="font-display text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-[#005EB8] rounded-full" />
                                Refund Disbursement Schedules
                            </h2>
                            <p className="text-slate-600 text-sm leading-relaxed mb-4">
                                Once returned items are received at our warehouse and successfully audited by our clinical pharmacist:
                            </p>
                            <ul className="space-y-3 pl-5 list-disc text-xs md:text-sm text-slate-600">
                                <li>Refund approvals are finalized within **2 business days** of receiving the return.</li>
                                <li>Credit card, netbanking, or UPI payments are refunded to the original payment source within **5–7 business days**.</li>
                                <li>For Cash on Delivery (COD) transactions, refunds will be credited via a secure NEFT bank transfer to an account matching the billing name.</li>
                            </ul>
                        </div>

                        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div>
                                <p className="text-sm font-bold text-slate-800">Need support with a refund claim?</p>
                                <p className="text-xs text-slate-500 mt-0.5">Our support staff is ready to assist you. Responses are active daily.</p>
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
