import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "./SectionHeading";
import { vacancyRows, vacancyTotals } from "./data";

export function VacancyTable() {
  return (
    <section id="vacancies" className="border-b border-border/60 bg-background py-14 md:py-18">
      <div className="container mx-auto px-4">
        <SectionHeading
          eyebrow="Openings"
          title="Vacancies — 301 (indicative)"
          description="301 IT Officer (Scale I) posts are notified across participating banks, and the count can rise as more banks report their vacancies."
        />

        <Card className="mt-8 border-border/60 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <caption className="sr-only">Bank-wise IT Officer (Scale I) vacancies</caption>
                <thead className="bg-slate-900 text-white dark:bg-slate-800">
                  <tr>
                    <th scope="col" className="px-4 py-4 text-left font-semibold">Bank</th>
                    <th scope="col" className="px-4 py-4 text-right font-semibold">SC</th>
                    <th scope="col" className="px-4 py-4 text-right font-semibold">ST</th>
                    <th scope="col" className="px-4 py-4 text-right font-semibold">OBC</th>
                    <th scope="col" className="px-4 py-4 text-right font-semibold">EWS</th>
                    <th scope="col" className="px-4 py-4 text-right font-semibold">UR</th>
                    <th scope="col" className="px-4 py-4 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {vacancyRows.map(([bank, sc, st, obc, ews, ur, total], index) => (
                    <tr key={bank} className={index % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50 dark:bg-slate-900/60"}>
                      <td className="px-4 py-4 font-medium text-slate-900 dark:text-slate-50">{bank}</td>
                      <td className="px-4 py-4 text-right">{sc}</td>
                      <td className="px-4 py-4 text-right">{st}</td>
                      <td className="px-4 py-4 text-right">{obc}</td>
                      <td className="px-4 py-4 text-right">{ews}</td>
                      <td className="px-4 py-4 text-right">{ur}</td>
                      <td className="px-4 py-4 text-right font-semibold text-slate-900 dark:text-slate-50">{total}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-amber-50 text-amber-950 dark:bg-amber-950/25 dark:text-amber-100">
                  <tr>
                    <td className="px-4 py-4 font-semibold">Total (reported)</td>
                    <td className="px-4 py-4 text-right font-semibold">{vacancyTotals.sc}</td>
                    <td className="px-4 py-4 text-right font-semibold">{vacancyTotals.st}</td>
                    <td className="px-4 py-4 text-right font-semibold">{vacancyTotals.obc}</td>
                    <td className="px-4 py-4 text-right font-semibold">{vacancyTotals.ews}</td>
                    <td className="px-4 py-4 text-right font-semibold">{vacancyTotals.ur}</td>
                    <td className="px-4 py-4 text-right font-semibold">{vacancyTotals.total}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* <p className="mt-4 text-sm leading-7 text-muted-foreground">
            <div className="bx-l" style={{color:"var(--gold-deep)"}}>Reservation note</div>
            PwBD posts are horizontal: HI (hearing), OC (orthopedic/locomotor), VI (visual) and ID (intellectual disability). A reserve list of about 20% of vacancies per category may also be maintained.
        </p> */}

        <p className="mt-4 text-sm leading-7 text-muted-foreground">
            <span
                className="font-semibold"
                style={{ color: "var(--gold-deep)" }}
            >
                Reservation note:
            </span>{" "}
            PwBD posts are horizontal: HI (hearing), OC (orthopedic/locomotor), VI
            (visual) and ID (intellectual disability). A reserve list of about 20% of
            vacancies per category may also be maintained.
        </p>
      </div>
    </section>
  );
}
