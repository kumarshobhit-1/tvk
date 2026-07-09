import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "./SectionHeading";
import { faqItems } from "./data";

export function FAQ() {
  return (
    <section id="faq" className="border-b border-border/60 bg-slate-50/70 py-14 dark:bg-slate-950/40 md:py-18">
      <div className="container mx-auto px-4">
        <SectionHeading eyebrow="Answers" title="Frequently asked questions" />

        <div className="mt-8 space-y-4">
          {faqItems.map((item) => (
            <details key={item.question} className="group rounded-2xl border border-border/60 bg-background shadow-sm">
              <summary className="cursor-pointer list-none px-5 py-4 text-left text-base font-semibold text-slate-950 dark:text-slate-50">
                <span className="flex items-center justify-between gap-4">
                  <span>{item.question}</span>
                  <span className="text-2xl leading-none text-muted-foreground transition-transform group-open:rotate-45">+</span>
                </span>
              </summary>
              <CardContent className="px-5 pb-5 pt-0">
                <p className="text-sm leading-7 text-muted-foreground" style={{ fontFamily: "Arial, sans-serif" }}>{item.answer}</p>
              </CardContent>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
