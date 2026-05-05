import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Banknote,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Landmark,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminDB } from "@/lib/firebase/firebase-admin";

type FeaturedTrack = {
  title: string;
  category: string;
  subtitle: string;
  icon: LucideIcon;
  slug?: string;
  tint: string;
};

type QuickLink = {
  label: string;
  href: string;
};

const FEATURED_TRACKS: FeaturedTrack[] = [
  {
    title: "Asst Dir Income Tax",
    category: "Assistant Director IT",
    slug: "ad-systems-it",
    subtitle: "IT leadership and system exams",
    icon: BriefcaseBusiness,
    tint: "from-sky-500/15 to-sky-500/5",
  },
  {
    title: "RBI Grade B",
    category: "RBI GRADE B",
    slug: "rbi",
    subtitle: "High-value finance and policy exam prep",
    icon: Landmark,
    tint: "from-indigo-500/15 to-indigo-500/5",
  },
  {
    title: "SEBI",
    category: "SEBI",
    slug: "sebi",
    subtitle: "Grade A, IT and regulatory style papers",
    icon: ShieldCheck,
    tint: "from-emerald-500/15 to-emerald-500/5",
  },
  {
    title: "IBPS SO IT",
    category: "IBPS SO IT",
    slug: "ibps-so-it",
    subtitle: "Specialist officer IT mock tests",
    icon: BriefcaseBusiness,
    tint: "from-sky-500/15 to-sky-500/5",
  },
  {
    title: "Banking IT",
    category: "BANKING",
    slug: "banking",
    subtitle: "Bank exams, IT officer and technical tracks",
    icon: Banknote,
    tint: "from-cyan-500/15 to-cyan-500/5",
  },
  {
    title: "NABARD",
    category: "NABARD",
    slug: "nabard",
    subtitle: "Development banking and rural finance",
    icon: Building2,
    tint: "from-amber-500/15 to-amber-500/5",
  },
  {
    title: "PFRDA",
    category: "PFRDA",
    slug: "pfrda",
    subtitle: "Pension and retirement finance exams",
    icon: BarChart3,
    tint: "from-violet-500/15 to-violet-500/5",
  },
];

const quickHighlights = [
  "Published exam collections only",
  "Premium access flow for locked exams",
  "Category-based navigation for fast study",
];

const QUICK_LINKS: QuickLink[] = [
  { label: "Asst Dir Income Tax", href: "/adit" },
  { label: "ICAI EO IT", href: "/exam/category/icai-eo-it" },
  { label: "HPCL IS", href: "/hpcl-is-pyq" },
  { label: "RBI Grade B", href: "/exam/category/rbi" },
  { label: "IBPS SO IT", href: "/exam/category/ibps-so-it" },
  { label: "SEBI", href: "/exam/category/sebi" },
  { label: "Banking IT", href: "/exam/category/banking" },
  { label: "NABARD", href: "/exam/category/nabard" },
  { label: "PFRDA", href: "/exam/category/pfrda" },
];

const spotlightPaths = [
  {
    title: "Asst Dir Income Tax",
    href: "/adit",
    note: "focused IT leadership prep",
  },
  {
    title: "RBI Grade B",
    href: "/rbi",
    note: "High priority finance prep",
  },
  {
    title: "SEBI Grade A",
    href: "/exam/category/sebi",
    note: "Regulatory and IT mock tests",
  },
  {
    title: "IBPS SO IT",
    href: "/exam/category/ibps-so-it",
    note: "Specialist officer IT tests",
  },
  {
    title: "NABARD",
    href: "/exam/category/nabard",
    note: "Development banking focus",
  },
  {
    title: "PFRDA",
    href: "/exam/category/pfrda",
    note: "Pension sector exam prep",
  },
  {
    title: "Banking IT",
    href: "/exam/category/banking",
    note: "Bank exams and tech roles",
  },
];

function normalizeCategory(value: string) {
  return value.trim().toUpperCase();
}

function toSlug(value: string) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default async function Home() {
  let totalPublishedExams = 0;
  let totalFeaturedTracks = FEATURED_TRACKS.length;
  let totalPremiumExams = 0;
  const trackCounts = new Map<string, number>();

  try {
    const publishedSnap = await adminDB
      .collection("exams")
      .where("isPublished", "==", true)
      .select("category", "isPremium")
      .get();

    totalPublishedExams = publishedSnap.size;

    const uniqueCategories = new Set<string>();
    publishedSnap.docs.forEach((doc) => {
      const data = doc.data() as { category?: string; isPremium?: boolean };
      const category = normalizeCategory(String(data.category || "OTHER"));
      uniqueCategories.add(category);
      if (data.isPremium) totalPremiumExams += 1;
    });

    totalFeaturedTracks = Math.max(totalFeaturedTracks, uniqueCategories.size);

    FEATURED_TRACKS.forEach((track) => {
      const count = publishedSnap.docs.filter((doc) => {
        const data = doc.data() as { category?: string };
        const docCat = String(data.category || "");
        if (track.slug) {
          return toSlug(docCat) === toSlug(track.slug);
        }
        return normalizeCategory(String(docCat || "OTHER")) === normalizeCategory(track.category);
      }).length;
      trackCounts.set(track.category, count);
    });
  } catch (error) {
    console.error("Failed to fetch home page exam counts:", error);
  }

  return (
    <main className="bg-background text-foreground">
      <section className="relative overflow-hidden border-b bg-background">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_30%),radial-gradient(circle_at_top_left,rgba(16,185,129,0.10),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.65),transparent_40%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.10),transparent_30%),radial-gradient(circle_at_top_left,rgba(16,185,129,0.08),transparent_28%),linear-gradient(180deg,rgba(2,6,23,0.96),transparent_44%)]" />
        <div className="absolute left-1/2 top-10 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl dark:bg-primary/20" />
        <div className="container mx-auto px-4 py-16 md:py-20">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="relative">
              <Badge variant="secondary" className="mb-5 gap-2 rounded-full px-4 py-2 text-sm shadow-sm ring-1 ring-black/5">
                <Sparkles className="h-4 w-4" />
                Finance exam hub for serious prep
              </Badge>

              <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
                RBI, SEBI, IBPS, SBI, ICAI, HPCL and other IT - focused prep.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                Find category-wise mock tests, premium exam tracks and focused preparation routes for Asst Dir Income Tax,
                RBI Grade B, IBPS SO IT, SEBI, ICAI EO IT, HPCL IS, Banking IT, NABARD, PFRDA and other IT-led competitive exams.
              </p>

              <div className="mt-7 rounded-3xl border border-border bg-background/90 p-4 shadow-sm backdrop-blur md:p-5 dark:bg-card/90">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Start here</p>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {spotlightPaths.slice(0, 4).map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      className="group rounded-2xl border border-border bg-card px-4 py-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md dark:bg-slate-900"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold tracking-tight">{item.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{item.note}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mt-7 flex flex-wrap gap-2.5">
                {QUICK_LINKS.map((item) => (
                  <Button key={item.label} asChild variant="outline" className="h-10 rounded-full border-zinc-200 bg-background/90 px-4 text-sm font-medium shadow-sm hover:border-primary hover:bg-primary/5 dark:border-zinc-700 dark:bg-slate-900 dark:hover:bg-slate-800">
                    <Link href={item.href}>{item.label}</Link>
                  </Button>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 rounded-full px-6 text-base font-semibold shadow-lg">
                  <Link href="/exam">
                    Explore Exams
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 rounded-full px-6 text-base font-medium">
                  <Link href="/contact">Contact Us</Link>
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {quickHighlights.map((item) => (
                  <div key={item} className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-4 py-2 text-sm shadow-sm backdrop-blur dark:bg-slate-900">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-2xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.16),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.14),transparent_30%)]" />
              <CardContent className="relative space-y-5 p-6 md:p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur dark:bg-white/10">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-white/60">Live platform stats</p>
                    <h2 className="text-2xl font-semibold">Everything organized for your next exam</h2>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur dark:border-white/10 dark:bg-slate-950/60">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/55">Published exams</p>
                    <p className="mt-2 text-3xl font-bold">{totalPublishedExams}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur dark:border-white/10 dark:bg-slate-950/60">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/55">Premium tests</p>
                    <p className="mt-2 text-3xl font-bold">{totalPremiumExams}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur dark:border-white/10 dark:bg-slate-950/60">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/55">Study tracks</p>
                    <p className="mt-2 text-3xl font-bold">{totalFeaturedTracks}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur dark:border-white/10 dark:bg-slate-950/60">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/55">IT focus</p>
                    <p className="mt-2 text-3xl font-bold">SEBI+</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur dark:border-white/10 dark:bg-slate-950/60">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/55">Popular exam routes</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {spotlightPaths.slice(0, 4).map((item) => (
                      <Link
                        key={item.title}
                        href={item.href}
                        className="rounded-xl border border-white/10 bg-white/10 px-3 py-3 transition-colors hover:bg-white/15 dark:bg-slate-900/70 dark:hover:bg-slate-800/80"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-white">{item.title}</p>
                            <p className="mt-1 text-xs leading-5 text-white/65">{item.note}</p>
                          </div>
                          <ArrowRight className="mt-0.5 h-4 w-4 text-white/70" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur dark:border-white/10 dark:bg-slate-950/60">
                  <div className="flex items-start gap-3">
                    <Target className="mt-0.5 h-5 w-5 text-emerald-300" />
                    <div>
                      <p className="font-semibold">Built for focused category navigation</p>
                      <p className="mt-1 text-sm leading-6 text-white/70">
                        Move from category to exam card in one step, with premium gates and direct support when needed.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Featured tracks</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Choose your exam lane</h2>
          </div>
          <Button asChild variant="ghost" className="hidden rounded-full md:inline-flex">
            <Link href="/exam">View all categories</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {FEATURED_TRACKS.map((track) => {
            const Icon = track.icon;
            const count = trackCounts.get(track.category) ?? 0;
            return (
                    <Link key={track.category} href={`/exam/category/${track.slug ?? track.category.toLowerCase().replace(/\s+/g, "-")}`} className="group">
                <Card className="h-full overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
                  <CardContent className="p-5">
                    <div className={`rounded-2xl bg-gradient-to-br ${track.tint} p-5 transition-transform group-hover:scale-[1.01]`}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/90 text-slate-900 shadow-sm dark:bg-slate-100 dark:text-slate-900">
                            <Icon className="h-6 w-6" />
                          </div>
                          <h3 className="mt-4 text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-50">{track.title}</h3>
                          <p className="mt-2 max-w-xs text-sm leading-6 text-slate-700 dark:text-slate-300">{track.subtitle}</p>
                        </div>

                        <div className="rounded-full border border-white/60 bg-white/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 shadow-sm dark:border-white/15 dark:bg-slate-900/80 dark:text-slate-200">
                          {count} live
                        </div>
                      </div>

                      <div className="mt-6 flex items-center justify-between rounded-2xl bg-white/75 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm backdrop-blur dark:bg-slate-900/80 dark:text-slate-200">
                        <span>Open exams</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="border-y bg-muted/30 dark:bg-slate-950/70">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <Card className="rounded-3xl border bg-background shadow-sm dark:bg-slate-900 dark:border-slate-800">
              <CardContent className="space-y-4 p-6 md:p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Why this landing page works</p>
                <h3 className="text-2xl font-bold tracking-tight">Fast access to the exact exam families your users care about</h3>
                <p className="text-sm leading-7 text-muted-foreground">
                  Users can immediately jump to SEBI, RBI Grade B, IBPS SO IT, NABARD, PFRDA and related banking/IT tracks
                  without extra noise.
                </p>
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  title: "Clear entry points",
                  text: "The homepage starts with the strongest exam families and avoids generic clutter.",
                  icon: BookOpen,
                },
                {
                  title: "Premium-friendly flow",
                  text: "Premium access stays visible and easy to understand from the first screen.",
                  icon: ShieldCheck,
                },
                {
                  title: "Better exam discovery",
                  text: "Every tile opens a category page with its published exams immediately visible.",
                  icon: Users,
                },
                {
                  title: "Built for conversion",
                  text: "Buy now and contact support actions stay available from the key exam paths.",
                  icon: Sparkles,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                    <Card key={item.title} className="rounded-3xl border bg-background shadow-sm dark:bg-slate-900 dark:border-slate-800">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-base font-semibold">{item.title}</h4>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.text}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <Card className="overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-emerald-500/10 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
          <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Next step</p>
              <h3 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
                Go straight to the category that matches your exam goal.
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                From SEBI to IBPS SO IT, each category page is ready with live tests and a premium gate where needed.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-11 rounded-full px-6">
                <Link href="/exam">
                  Browse categories
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-11 rounded-full px-6">
                <Link href="/contact">Contact support</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}