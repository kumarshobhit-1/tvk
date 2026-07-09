import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "./SectionHeading";
import { ibpsOverviewCards } from "./data";
import { Award, BookOpen, Clock3, Scale, ShieldCheck, Target } from "lucide-react";

const ICONS = [Scale, Award, Target, BookOpen, Clock3, ShieldCheck];

export function Overview() {
  return (
    <section className="border-b border-border/60 bg-background py-14 md:py-18">
      <div className="container mx-auto px-4">
        <SectionHeading
          eyebrow="At a glance"
          title="IBPS SO IT Officer 2026 — overview"
          description="IBPS conducts the Specialist Officer recruitment (CRP SPL-XVI) to fill IT Officer (Scale I) posts across participating public sector banks."
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {ibpsOverviewCards.map((card, index) => {
            const Icon = ICONS[index % ICONS.length];
            return (
              <Card key={card.title} className="border-border/60 shadow-sm transition-shadow hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-950 dark:text-slate-50">{card.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground" style={{ fontFamily: "Arial, sans-serif" }}>{card.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Badge variant="outline" className="rounded-full px-3 py-1">New pattern: PK in Prelims</Badge>
          <Badge variant="outline" className="rounded-full px-3 py-1">All-India cadre</Badge>
          <Badge variant="outline" className="rounded-full px-3 py-1">Negative marking: 0.25</Badge>
          <Badge variant="outline" className="rounded-full px-3 py-1">Final merit: 80:20</Badge>
        </div>
      </div>
    </section>
  );
}
