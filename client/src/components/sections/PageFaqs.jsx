import { Suspense } from "react";
import { ChevronDown } from "lucide-react";
import { API_URL } from "@/lib/utils";
import { processFaqAnswer } from "@/lib/faq-html";

// Server component: the FAQs are in the HTML Google crawls, and the page also
// carries FAQPage structured data. FAQs are managed in the admin panel
// (FAQ Management → "Where to show this FAQ").

async function getPageFaqs(type, slug) {
  try {
    const base = API_URL.endsWith("/api") ? API_URL : `${API_URL}/api`;
    const query = new URLSearchParams({ type });
    if (slug) query.set("slug", slug);

    const response = await fetch(`${base}/faqs/for-page?${query}`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return [];

    const json = await response.json();
    const faqs = json?.data?.faqs;
    return Array.isArray(faqs) ? faqs : [];
  } catch (error) {
    // FAQs are an enhancement — never break the page because they failed to load
    console.error("Failed to load page FAQs:", error);
    return [];
  }
}

// Placeholder shown in the same spot while the FAQs are still loading
// (pages that render at request time stream it, then swap in the real list).
function FaqSkeleton() {
  return (
    <section
      aria-busy="true"
      aria-label="Loading frequently asked questions"
      className="max-w-4xl mx-auto px-4 py-10 md:py-14 animate-pulse"
    >
      <div className="mx-auto mb-6 md:mb-8 h-8 w-64 max-w-full rounded-lg bg-gray-200" />
      <div className="space-y-3">
        {["w-11/12", "w-3/4", "w-5/6"].map((width) => (
          <div
            key={width}
            className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4"
          >
            <div className={`h-4 rounded bg-gray-200 ${width}`} />
            <div className="h-5 w-5 flex-shrink-0 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function PageFaqs(props) {
  return (
    <Suspense fallback={<FaqSkeleton />}>
      <PageFaqsContent {...props} />
    </Suspense>
  );
}

async function PageFaqsContent({
  type,
  slug,
  heading = "Frequently Asked Questions",
}) {
  const faqs = await getPageFaqs(type, slug);

  const items = faqs
    .map((faq) => ({
      id: String(faq.id),
      question: String(faq.question ?? "").trim(),
      ...processFaqAnswer(faq.answer),
    }))
    .filter((item) => item.question && item.text);

  if (items.length === 0) return null;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.text },
    })),
  };

  return (
    <section
      aria-labelledby="page-faqs-heading"
      className="max-w-4xl mx-auto px-4 py-10 md:py-14"
    >
      <script
        type="application/ld+json"
        // "<" is escaped so answer text can never close the script tag
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />

      <h2
        id="page-faqs-heading"
        className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-6 md:mb-8"
      >
        {heading}
      </h2>

      <div className="space-y-3">
        {items.map((item) => (
          <details
            key={item.id}
            className="rounded-xl border border-gray-200 bg-white open:shadow-sm"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left text-base font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
              <span>{item.question}</span>
              <ChevronDown
                aria-hidden="true"
                className="h-5 w-5 flex-shrink-0 text-gray-400 transition-transform [details[open]_&]:rotate-180"
              />
            </summary>
            <div
              className="px-5 pb-5 text-sm md:text-base leading-relaxed text-gray-600 [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:pl-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:font-semibold [&_h4]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5"
              dangerouslySetInnerHTML={{ __html: item.html }}
            />
          </details>
        ))}
      </div>
    </section>
  );
}
