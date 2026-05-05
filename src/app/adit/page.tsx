import Link from "next/link";
import { adminDB } from "@/lib/firebase/firebase-admin";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, BookOpen, FileText, Users, Calendar, ArrowRight, CheckCircle2, ShieldCheck, Target, Layers3 } from "lucide-react";

function toSlug(value: string) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default async function Page() {
  let liveCount = 0;
  let premiumCount = 0;

  try {
    const snap = await adminDB.collection("exams").where("isPublished", "==", true).select("category", "isPremium").get();
    snap.docs.forEach((doc) => {
      const data = doc.data() as { category?: string; isPremium?: boolean };
      const slug = toSlug(String(data.category || ""));
      if (slug === "ad-systems-it") {
        liveCount += 1;
        if (data.isPremium) premiumCount += 1;
      }
    });
  } catch (err) {
    console.error("Failed to fetch AD IT counts:", err);
  }

  return (
    <main className="bg-background text-foreground">
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:border-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.10),transparent_26%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.14),transparent_24%)]" />
        <div className="container relative z-10 mx-auto px-4 py-20">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <Badge className="mb-4">Assistant Director IT</Badge>
              <h1 className="text-5xl font-extrabold leading-tight text-slate-950 dark:text-slate-50">Asst Dir Income Tax — AD Systems Exam Hub</h1>
              <p className="mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-300">Your central hub for AD IT preparation — curated notes, previous year papers, subject-wise mock tests, and strategy guides tailored for government IT roles.</p>

              <div className="mt-6 flex flex-wrap gap-2">
                {[
                  "Government exam style",
                  "Previous year papers",
                  "Mock tests",
                  "Syllabus-first prep",
                ].map((item) => (
                  <span key={item} className="inline-flex items-center rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/85 dark:text-slate-300">
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="h-12 px-6">
                  <Link href="/exam/category/ad-systems-it">View Exam Cards <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 px-6 border-slate-200 bg-white text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:hover:bg-slate-800">
                  <Link href="/library?category=ad-systems-it">AD IT Notes</Link>
                </Button>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 p-6 text-white shadow-2xl dark:border-slate-800">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.28),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.24),transparent_34%),radial-gradient(circle_at_center,rgba(255,255,255,0.06),transparent_30%)]" />
                <div className="relative grid gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-sky-200/80">Government Exam Focus</p>
                      <h3 className="mt-2 text-2xl font-bold">Assistant Director IT</h3>
                    </div>
                    <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-sky-100">AD Systems</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur">
                      <p className="text-xs text-sky-100/70">Exam cards</p>
                      <p className="mt-1 text-2xl font-bold">{liveCount}</p>
                      <p className="mt-1 text-xs text-sky-100/70">Live published tests</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur">
                      <p className="text-xs text-sky-100/70">Premium</p>
                      <p className="mt-1 text-2xl font-bold">{premiumCount}</p>
                      <p className="mt-1 text-xs text-sky-100/70">Locked practice papers</p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      "Syllabus",
                      "Mock Tests",
                      "Papers",
                    ].map((item) => (
                      <div key={item} className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm font-medium text-sky-50 backdrop-blur">
                        {item}
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur">
                    <p className="text-sm font-semibold text-white">Focused resources and past paper collections</p>
                    <p className="mt-1 text-sm text-sky-100/70">A clean, government-exam style landing block without relying on an external image file.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-sky-50 p-2 dark:bg-sky-500/10"><Target className="h-5 w-5 text-sky-600 dark:text-sky-300" /></div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Focused preparation</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">One-page exam roadmap</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-50 p-2 dark:bg-emerald-500/10"><ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-300" /></div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Trusted resources</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Curated PDFs and notes</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-violet-50 p-2 dark:bg-violet-500/10"><Layers3 className="h-5 w-5 text-violet-600 dark:text-violet-300" /></div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Exam lanes</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">AD IT, RBI, SEBI style prep</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-[1fr_340px] gap-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-950 dark:text-slate-50">What this hub offers</h2>
            <p className="mt-2 text-slate-600 dark:text-slate-300">A compact, exam-first study path that guides you from syllabus to mock performance.</p>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/70">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="font-semibold text-slate-950 dark:text-slate-50">Recommended starting path</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">1. Open the exam cards. 2. Read the syllabus notes. 3. Solve PDFs. 4. Take mocks and review weak areas.</p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="rounded-md bg-sky-50 p-2"><Calendar className="h-5 w-5 text-sky-600" /></div>
                    <div>
                      <p className="font-semibold text-slate-950 dark:text-slate-50">Structured mocks</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">Topic-wise timed tests and full-length mock exams.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="rounded-md bg-amber-50 p-2"><BookOpen className="h-5 w-5 text-amber-600" /></div>
                    <div>
                      <p className="font-semibold text-slate-950 dark:text-slate-50">Previous papers</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">Downloadable solved and unsolved papers.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="rounded-md bg-green-50 p-2"><Users className="h-5 w-5 text-green-600" /></div>
                    <div>
                      <p className="font-semibold text-slate-950 dark:text-slate-50">Mentor sessions</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">Live doubt-clearing and strategy calls.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="rounded-md bg-indigo-50 p-2"><FileText className="h-5 w-5 text-indigo-600" /></div>
                    <div>
                      <p className="font-semibold text-slate-950 dark:text-slate-50">PDF library</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">Syllabus notes, memos, and departmental reports.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold text-slate-950 dark:text-slate-50">Top resources</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Link href="/library?category=ad-systems-it" className="rounded-xl border border-slate-200 bg-white p-4 text-slate-900 transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50">Browse AD Systems PDFs</Link>
                <Link href="/exam/category/ad-systems-it" className="rounded-xl border border-slate-200 bg-white p-4 text-slate-900 transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50">View AD IT Exam Cards</Link>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 to-sky-900 p-5 text-white shadow-lg dark:border-slate-800">
              <p className="text-xs uppercase tracking-[0.24em] text-sky-100/70">Exam pattern</p>
              <h3 className="mt-2 text-xl font-semibold">Built like a government exam landing page</h3>
              <p className="mt-2 text-sm text-sky-100/80">Quick entry points, high-contrast cards, and direct access to PDFs and exam cards without extra clutter.</p>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h4 className="font-semibold text-slate-950 dark:text-slate-50">Quick links</h4>
              <div className="mt-3 flex flex-col gap-2">
                <Link href="/exam/category/ad-systems-it" className="text-sm text-primary">• AD Systems exam list</Link>
                <Link href="/library?category=ad-systems-it" className="text-sm text-slate-700 dark:text-slate-300">• PDF Library</Link>
                <Link href="/exam" className="text-sm text-slate-700 dark:text-slate-300">• All exam categories</Link>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">Need help?</p>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">Contact our support or join the community for discussion and guidance.</p>
              <div className="mt-3"><Button asChild variant="outline" className="border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"><Link href="/contact">Contact Support</Link></Button></div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
