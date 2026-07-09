import Link from "next/link";
import { ArrowRight, PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "./SectionHeading";
import { strategyPoints } from "./data";
import { FaTelegramPlane } from "react-icons/fa";

export function Strategy() {
  return (
    <section id="strategy" className="border-b border-border/60 bg-background py-14 md:py-18">
      <div className="container mx-auto px-4">
        <SectionHeading
          eyebrow="The Victory Key way"
          title="A strategy built around what scores"
          description="Because only Professional Knowledge builds rank, generic bank-exam prep leaves marks on the table. The track here is engineered for the 2026 pattern."
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {strategyPoints.map((point) => (
            <Card key={point.title} className="border-border/60 shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-950 dark:text-slate-50">{point.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{point.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-950 p-6 text-slate-50 shadow-2xl md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <Badge className="bg-amber-500 text-slate-950 hover:bg-amber-400">Start prep</Badge>
              <h3 className="mt-4 text-2xl font-bold tracking-tight md:text-3xl">Start your IT Officer 2026 prep with The Victory Key</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Join thousands of aspirants preparing the smart way — deep Professional Knowledge, new-pattern mocks, and free classes on YouTube.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="h-11 bg-amber-500 text-slate-950 hover:bg-amber-400">
                <Link href="/contact">
                  Enroll in the course
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-11 border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white">
                <Link href="/library">
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Open library
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-11 border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white">
                <Link href="https://t.me/TheVictoryKey">
                  <FaTelegramPlane className="mr-2 h-4 w-4" />
                  Join telegram
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
