import Link from "next/link";
import { ArrowRight, PlayCircle, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ibpsHeroBadges, ibpsHeroStats, IBPS_SITE } from "./data";
import { Countdown } from "./Countdown";
import "./Hero.css";

export function Hero() {
  return (
    <section className="border-b border-border/60 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.08),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.88),transparent_54%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_28%),linear-gradient(180deg,rgba(2,6,23,0.96),transparent_54%)]">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-full border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-200">
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                IBPS Specialist Officer
              </Badge>
              <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200">
                <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                Official notification summary
              </Badge>
            </div>

            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              CRP SPL-XVI · IBPS SO IT Officer 2026
            </p>
            <h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight text-slate-950 dark:text-slate-50 md:text-5xl lg:text-6xl">
              IBPS SO <span className="text-sky-700 dark:text-sky-400">IT Officer</span> 2026
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
              The complete, notification-accurate guide to the IT Officer (Scale I) recruitment — pattern, syllabus, eligibility, salary, and the strategy that decides your rank.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {ibpsHeroBadges.map((badge) => (
                <Badge key={badge} variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium">
                  {badge}
                </Badge>
              ))}
            </div>

            <div className="hero-cta">
              <Link
                className="btn btn-gold"
                href="/ibps/course-overview"
              >
                Join the IT Officer course
              </Link>

              <a
                className="btn btn-outline"
                href="https://www.youtube.com/@TVK-TheVictoryKey"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M23 12s0-3.8-.5-5.6a2.9 2.9 0 0 0-2-2C18.7 4 12 4 12 4s-6.7 0-8.5.4a2.9 2.9 0 0 0-2 2C1 8.2 1 12 1 12s0 3.8.5 5.6a2.9 2.9 0 0 0 2 2C5.3 20 12 20 12 20s6.7 0 8.5-.4a2.9 2.9 0 0 0 2-2C23 15.8 23 12 23 12ZM10 15.5v-7l6 3.5-6 3.5Z" />
                </svg>

                <span>Watch free classes</span>
              </a>
            </div>
           
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 px-6">
                <Link href="/exam/category/ibps-so-it">
                  Browse related exams
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-6">
                <Link href="/library?category=ibps-so-it">
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Open the library
                </Link>
              </Button>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {ibpsHeroStats.map((stat) => (
                <Card key={stat.label} className="border-border/60 bg-background/90 shadow-sm">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-50"
                        style={{ fontFamily: "Arial, sans-serif" }}>
                        {stat.value}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <aside className="rounded-3xl border border-amber-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 text-slate-50 shadow-2xl dark:border-slate-800">
            <div className="rounded-2xl border border-white/10 bg-white/8 p-5 backdrop-blur">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-100/80">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.18)]" />
                Registration open
              </div>
              <p className="mt-3 text-2xl font-bold">Apply on ibps.in · 1–21 July 2026</p>
              <p className="mt-2 text-sm leading-6 text-slate-200/80">Online application &amp; fee window closes soon.</p>

              <div className="mt-5">
                <Countdown />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <Button asChild className="h-11 bg-white text-slate-950 hover:bg-slate-100">
                  <Link href="https://www.ibps.in" target="_blank" rel="noreferrer noopener">
                    Official site ↗
                  </Link>
                </Button>
                <Button asChild className="h-11 bg-amber-500 text-slate-950 hover:bg-amber-400">
                  <Link href="/contact">Start prep</Link>
                </Button>
              </div>

              <p className="mt-5 text-sm leading-6 text-slate-200/80">
                Dates are tentative and confirmed on <b>ibps.in</b>. Vacancy year: 2027–28.
              </p>
            </div>

            <p className="mt-4 text-xs text-slate-300/75">
              Canonical page: <span className="font-mono">{IBPS_SITE.canonicalUrl}</span>
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
