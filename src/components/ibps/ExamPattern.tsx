import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "./SectionHeading";
import { mainDescriptiveRows, mainObjectiveRows, prelimsPatternRows } from "./data";

function PatternTable({
  title,
  rows,
  footnote,
}: {
  title: string;
  rows: ReadonlyArray<readonly [string, string, number, number, string]>;
  footnote?: string;
}) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="px-5 pt-5 text-left text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {title}
            </caption>
            <thead className="bg-slate-900 text-white dark:bg-slate-800">
              <tr>
                <th scope="col" className="px-5 py-4 text-left font-semibold">Test</th>
                <th scope="col" className="px-5 py-4 text-left font-semibold">Medium</th>
                <th scope="col" className="px-5 py-4 text-right font-semibold">Qs</th>
                <th scope="col" className="px-5 py-4 text-right font-semibold">Marks</th>
                <th scope="col" className="px-5 py-4 text-right font-semibold">Time</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([test, medium, questions, marks, time], index) => (
                <tr key={test} className={index % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50 dark:bg-slate-900/60"}>
                  <td className="px-5 py-4 font-medium text-slate-900 dark:text-slate-50">{test}</td>
                  <td className="px-5 py-4 text-muted-foreground">{medium}</td>
                  <td className="px-5 py-4 text-right">{questions}</td>
                  <td className="px-5 py-4 text-right font-semibold">{marks}</td>
                  <td className="px-5 py-4 text-right">{time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {footnote ? <p className="border-t border-border/60 px-5 py-4 text-sm text-muted-foreground">{footnote}</p> : null}
      </CardContent>
    </Card>
  );
}

export function ExamPattern() {
  return (
    <section id="pattern" className="border-b border-border/60 bg-background py-14 md:py-18">
      <div className="container mx-auto px-4">
        <SectionHeading
          eyebrow="Structure"
          title="Exam pattern — Prelims & Main"
          description="Both stages are online with sectional time limits and 0.25 negative marking. The 2026 revision adds Professional Knowledge to the Prelims and a Descriptive English paper to the Main."
        />

        <div className="mt-8 space-y-8">
          <div>
            <h3 className="mb-4 text-xl font-semibold text-slate-950 dark:text-slate-50">Preliminary exam — qualifying gate</h3>
            <PatternTable
              title="Prelims · clear each section's cut-off"
              rows={prelimsPatternRows}
              footnote="Prelims is a screening gate only — the marks do not count toward final merit — but you must clear the cut-off in all four tests to move to the Main."
            />
          </div>

          <div>
            <h3 className="mb-4 text-xl font-semibold text-slate-950 dark:text-slate-50">Main exam — Part I: Objective</h3>
            <PatternTable title="Main · objective (Part I)" rows={mainObjectiveRows} />
          </div>

          <div>
            <h3 className="mb-4 text-xl font-semibold text-slate-950 dark:text-slate-50">Main exam — Part II: Descriptive</h3>
            <PatternTable title="Main · descriptive (Part II)" rows={mainDescriptiveRows} footnote="Grand total for the Main: 225 marks in 155 minutes." />
          </div>
        </div>

        <Card className="mt-8 border-amber-200 bg-amber-50/70 shadow-sm dark:border-amber-900 dark:bg-amber-950/20">
          <CardContent className="p-5 text-sm leading-7 text-amber-950 dark:text-amber-100">
            <p className="font-semibold">Exam trap — get this right</p>
            <p className="mt-2">
              For IT Officer, the Main third section is Quantitative Aptitude, not General Awareness. Professional Knowledge in the Main is 40 minutes, and the Descriptive English paper is included.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
