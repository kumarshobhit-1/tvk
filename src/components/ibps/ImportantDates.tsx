import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "./SectionHeading";
import { importantDates } from "./data";

export function ImportantDates() {
  return (
    <section id="dates" className="border-b border-border/60 bg-slate-50/70 py-14 dark:bg-slate-950/40 md:py-18">
      <div className="container mx-auto px-4">
        <SectionHeading
          eyebrow="Timeline"
          title="Important dates 2026"
          description="Mark the registration deadline first — the application and fee window is short. Everything after Prelims is tentative until IBPS confirms it on ibps.in."
        />

        <Card className="mt-8 border-border/60 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <caption className="sr-only">IBPS SO IT Officer 2026 schedule</caption>
                <thead className="bg-slate-900 text-white dark:bg-slate-800">
                  <tr>
                    <th scope="col" className="px-5 py-4 text-left font-semibold">Activity</th>
                    <th scope="col" className="px-5 py-4 text-left font-semibold">Schedule</th>
                  </tr>
                </thead>
                <tbody>
                  {importantDates.map(([activity, schedule], index) => (
                    <tr key={activity} className={index % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50 dark:bg-slate-900/60"}>
                      <td className="px-5 py-4 font-medium text-slate-900 dark:text-slate-50">{activity}</td>
                      <td className="px-5 py-4 text-muted-foreground">{schedule}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-5 border-amber-200 bg-amber-50/70 shadow-sm dark:border-amber-900 dark:bg-amber-950/20">
          <CardContent className="p-5">
            <div className="bx-l">Deadline trap</div>
            <p className="text-sm leading-7 text-amber-950 dark:text-amber-100">
              Your degree result and eligibility are judged as on <span className="font-semibold">21 July 2026</span> — the same day registration closes. If your final result is declared after that date, you are not eligible this cycle.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
