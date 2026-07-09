import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "./SectionHeading";
import { salarySummary } from "./data";

export function Salary() {
  return (
    <section id="salary" className="border-b border-border/60 bg-background py-14 md:py-18">
      <div className="container mx-auto px-4">
        <SectionHeading
          eyebrow="Pay & perks"
          title="Salary overview"
          description="The starting basic pay is ₹48,480, with allowances and bank-specific benefits added on top."
        />

        <div className="mt-8">
          <Card className="border-border/60 bg-slate-50 shadow-sm dark:bg-slate-950">
            <CardContent className="p-6 sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-600 dark:text-slate-300">
                Starting basic pay
              </p>
              <p className="mt-4 text-4xl font-extrabold tracking-tight text-slate-950 dark:text-slate-50 sm:text-5xl"
                style={{ fontFamily: "Arial, sans-serif" }}>
                {salarySummary.basicPay}
              </p>
              <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-[15px]"
              style={{ fontFamily: "Arial, sans-serif" }}>
                {salarySummary.scale}
              </p>
            </CardContent>
          </Card>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">{salarySummary.note}</p>
        </div>
      </div>
    </section>
  );
}
