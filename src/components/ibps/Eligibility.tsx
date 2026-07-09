import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "./SectionHeading";
import { ageRelaxationRows, eligibleDegrees, eligibilityBullets } from "./data";

export function Eligibility() {
  return (
    <section id="eligibility" className="border-b border-border/60 bg-slate-50/70 py-14 dark:bg-slate-950/40 md:py-18">
      <div className="container mx-auto px-4">
        <SectionHeading
          eyebrow="Who can apply"
          title="Eligibility criteria"
          description="Three gates — nationality, age, and a degree that matches the notification list exactly. There is no equivalent qualification allowance here."
        />

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {eligibilityBullets.map((item) => (
            <Card key={item} className="border-border/60 shadow-sm">
              <CardContent className="p-5">
                <p className="text-sm leading-7 text-muted-foreground">{item}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-950 dark:text-slate-50">Educational qualification (any one)</h3>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
                {eligibleDegrees.map((degree) => (
                  <li key={degree} className="rounded-2xl border border-border/60 bg-background p-4">
                    {degree}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-slate-900 text-white dark:bg-slate-800">
                    <tr>
                      <th scope="col" className="px-5 py-4 text-left font-semibold">Category</th>
                      <th scope="col" className="px-5 py-4 text-right font-semibold">Relaxation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ageRelaxationRows.map(([category, relaxation], index) => (
                      <tr key={category} className={index % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50 dark:bg-slate-900/60"}>
                        <td className="px-5 py-4 font-medium text-slate-900 dark:text-slate-50">{category}</td>
                        <td className="px-5 py-4 text-right text-muted-foreground">{relaxation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
