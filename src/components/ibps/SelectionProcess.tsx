import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "./SectionHeading";
import { selectionSteps } from "./data";

export function SelectionProcess() {
  return (
    <section id="selection" className="border-b border-border/60 bg-slate-50/70 py-14 dark:bg-slate-950/40 md:py-18">
      <div className="container mx-auto px-4">
        <SectionHeading
          eyebrow="Final merit"
          title="Selection process"
          description="Three stages, one rank. Prelims screens, the Main's Professional Knowledge builds your merit, and the interview is the final 20%."
        />

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {selectionSteps.map((step, index) => (
            <Card key={step.title} className="border-border/60 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sm font-bold text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
                    {index + 1}
                  </span>
                  <h3 className="text-lg font-semibold text-slate-950 dark:text-slate-50">{step.title}</h3>
                </div>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8 border-border/60 shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">Merit path</p>
            <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
              <div className="rounded-2xl border border-border/60 bg-background p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Stage 1 · gate</p>
                <p className="mt-2 text-base font-semibold text-slate-950 dark:text-slate-50">Prelims</p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">Clear all 4 sectional cut-offs. Marks not counted.</p>
              </div>
              <div className="text-center text-2xl font-semibold text-amber-600">→</div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900 dark:bg-amber-950/20">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Stage 2 · decides rank</p>
                <p className="mt-2 text-base font-semibold text-slate-950 dark:text-slate-50">Main — PK score</p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">Only Professional Knowledge builds merit; other sections qualify.</p>
              </div>
              <div className="text-center text-2xl font-semibold text-amber-600">→</div>
              <div className="rounded-2xl border border-border/60 bg-background p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Stage 3 · 100 marks</p>
                <p className="mt-2 text-base font-semibold text-slate-950 dark:text-slate-50">Interview</p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">Qualify at 40% (35% for SC/ST/OBC/PwBD).</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">Final merit is built with Main : Interview weighted at 80:20.</p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
