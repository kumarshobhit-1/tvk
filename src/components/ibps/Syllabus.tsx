import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "./SectionHeading";
import { syllabusSections } from "./data";

function renderSyllabusItem(item: string) {
  const colonIndex = item.indexOf(":");

  if (colonIndex === -1) {
    return item;
  }

  const label = item.slice(0, colonIndex);
  const body = item.slice(colonIndex + 1);

  return (
    <>
      <strong className="font-semibold text-slate-900 dark:text-slate-50">{label}:</strong>
      {body}
    </>
  );
}

export function Syllabus() {
  return (
    <section id="syllabus" className="border-b border-border/60 bg-slate-50/70 py-14 dark:bg-slate-950/40 md:py-18">
      <div className="container mx-auto px-4">
        <SectionHeading
          eyebrow="What to study"
          title="Syllabus"
          description="Professional Knowledge (Information Technology) is the deepest and only merit-deciding part — treat it as the core. English, Reasoning and Quant follow the standard banking-exam set."
        />

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {syllabusSections.map((section) => (
            <Card key={section.key} className="border-border/60 shadow-sm">
              <CardContent className="p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700 dark:text-sky-300">{section.key}</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-50">{section.title}</h3>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
                  {section.items.map((item) => (
                    <li key={item} className="rounded-2xl border border-border/60 bg-background p-4">
                      {renderSyllabusItem(item)}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
