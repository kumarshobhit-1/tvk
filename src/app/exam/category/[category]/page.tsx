"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { authenticatedFetch } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, ArrowRight, BookOpen, Clock, Layers3, ShieldCheck, Sparkles, Trophy, ChevronLeft } from "lucide-react";
import Loading from "@/components/ui/loading";

interface ExamListItem {
  id: string;
  title: string;
  description: string;
  isPremium?: boolean;
  isLocked?: boolean;
  type: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  category: string;
  questionCount: number;
}

interface ExamStatus {
  hasPassed: boolean;
  attemptCount: number;
  maxAttempts: number;
  canRetake: boolean;
  lastAttemptId: string | null;
  isPremiumUser?: boolean;
  canAttemptPremium?: boolean;
  isPremiumExam?: boolean;
}

export default function CategoryExamsPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const params = useParams();
  const rawCategory = params.category as string;
  // Decode the category slug (hyphen-separated) into a display value
  // e.g. "ibps-so-it" -> "ibps so it". Also handle legacy %20 encodings.
  const category = decodeURIComponent(rawCategory).replace(/-/g, " ");
  const [exams, setExams] = useState<ExamListItem[]>([]);
  const [examStatuses, setExamStatuses] = useState<Record<string, ExamStatus>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showLoading, setShowLoading] = useState(true);
  const [premiumDialogOpen, setPremiumDialogOpen] = useState(false);
  const [selectedPremiumExam, setSelectedPremiumExam] = useState<ExamListItem | null>(null);
  const supportPhone = "9452903509";
  const supportEmail = "Consultantstvk@gmail.com";

  const openPremiumDialog = (exam: ExamListItem) => {
    if (premiumDialogOpen && selectedPremiumExam?.id === exam.id) return;
    setSelectedPremiumExam(exam);
    setPremiumDialogOpen(true);
  };

  const handlePremiumHover = (exam: ExamListItem, status?: ExamStatus) => {
    if (!(status?.isPremiumExam && !status?.canAttemptPremium)) return;
    if (typeof window === "undefined") return;

    // Open on hover only for mouse/trackpad devices; keep click behavior for touch devices.
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!canHover) return;

    openPremiumDialog(exam);
  };

  // Add minimum delay to show loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const displayCategory = category === "other" ? "Other" : (category?.toUpperCase() || "Exams");
    document.title = `${displayCategory} Exams | The Victory Key`;
  }, [category]);

  const displayCategory = category === "other" ? "Other" : (category?.toUpperCase() || "Exams");
  const subtitle =
    category === "other"
      ? "Browse mixed-topic and uncategorized practice exams in one place."
      : `Targeted exam sets for ${displayCategory} with a cleaner study flow.`;

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    const fetchExams = async () => {
      setLoading(true);
      try {
        // For "other" category, fetch exams without category or with empty category
        const url = category === "other" 
          ? "/api/exam/list?category=other&noCache=1"
          : `/api/exam/list?category=${encodeURIComponent(category)}&noCache=1`;
        
        const response = await authenticatedFetch(url, { cache: "no-store" });
        const data = await response.json();
        
        if (data.exams) {
          setExams(data.exams);
          
          // Fetch status for each exam
          const statuses: Record<string, ExamStatus> = {};
          for (const exam of data.exams) {
            try {
              const statusRes = await fetch(`/api/exam/status?examId=${exam.id}`, { cache: "no-store" });
              statuses[exam.id] = await statusRes.json();
            } catch (err) {
              console.error(`Error fetching status for exam ${exam.id}:`, err);
            }
          }
          setExamStatuses(statuses);
        } else {
          setExams([]);
        }
        
        setError("");
      } catch (err) {
        console.error("Error fetching exams:", err);
        setError("");
        setExams([]);
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, [user, authLoading, category]);

  if (authLoading || loading || showLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link href="/exam" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
          Back to Categories
        </Link>
        <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.22em]">
          {exams.length} exams
        </Badge>
      </div>

      <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-background via-background to-primary/5 p-6 shadow-sm md:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,0,0,0.06),transparent_30%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1">
                <Sparkles className="h-3.5 w-3.5" />
                Category view
              </Badge>
              <Badge variant="outline" className="gap-1.5 rounded-full px-3 py-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                Published exams only
              </Badge>
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{displayCategory} Exams</h1>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground md:text-lg">
              {subtitle}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[360px] lg:grid-cols-1">
            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Layers3 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Available exams</p>
                  <p className="text-sm font-semibold">{exams.length} active cards</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Best next step</p>
                  <p className="text-sm font-semibold">Open the strongest match</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {exams.length === 0 ? (
        <Card className="mt-8 border-dashed">
          <CardContent className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 text-muted-foreground">
              <BookOpen className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-semibold">No exams available here yet</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              We’ll show published exams in this category as soon as they’re available. For now, you can go back and explore another category.
            </p>
            <div className="mt-6">
              <Button asChild>
                <Link href="/exam">
                  Browse all categories
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {exams.map((exam) => {
            const status = examStatuses[exam.id];
            const isPremium = status?.isPremiumExam ?? exam.isPremium;
            const isLocked = status?.isLocked ?? exam.isLocked;
            const actionLabel = !status
              ? "Start exam"
              : !status.canRetake && status.hasPassed
                ? "Review"
                : `${status.attemptCount > 0 ? "Retake" : "Start"} exam`;

            return (
              <Card
                key={exam.id}
                className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-zinc-800 dark:bg-zinc-950"
                onMouseEnter={() => handlePremiumHover(exam, status)}
              >
                <div className="h-1 bg-gradient-to-r from-primary/80 via-primary to-emerald-500/80" />

                <CardHeader className="space-y-3 p-4 pb-3 md:p-5 md:pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em]">
                        {exam.category || "Other"}
                      </Badge>
                      {isPremium && (
                        <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em]">
                          Premium
                        </Badge>
                      )}
                      {isLocked && (
                        <Badge variant="destructive" className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em]">
                          Locked
                        </Badge>
                      )}
                      <Badge
                        variant={exam.type === "practice" ? "secondary" : "default"}
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em]"
                      >
                        {exam.type}
                      </Badge>
                    </div>

                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-500 transition-colors group-hover:border-primary/30 group-hover:bg-primary/5 group-hover:text-primary dark:border-zinc-800 dark:bg-zinc-900">
                      <ChevronLeft className="h-4 w-4 rotate-180" />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <CardTitle className="text-xl font-bold leading-tight tracking-tight text-zinc-900 line-clamp-2 dark:text-zinc-100">
                      {exam.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 max-w-3xl text-sm leading-5 text-slate-600 dark:text-slate-400">
                      {exam.description}
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="px-4 pb-4 md:px-5">
                  <div className="grid gap-2.5 sm:grid-cols-3">
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/40">
                      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        <Clock className="h-3.5 w-3.5" />
                        Time
                      </div>
                      <p className="mt-1 text-[14px] font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                        {exam.durationMinutes} min
                      </p>
                    </div>

                    <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/40">
                      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        <BookOpen className="h-3.5 w-3.5" />
                        Questions
                      </div>
                      <p className="mt-1 text-[14px] font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                        {exam.questionCount}
                      </p>
                    </div>

                    <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/40">
                      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        <Trophy className="h-3.5 w-3.5" />
                        Marks
                      </div>
                      <p className="mt-1 text-[14px] font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                        {exam.totalMarks}
                      </p>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-2 border-t border-zinc-200 bg-zinc-50/70 px-4 py-3 sm:flex-row md:px-5 dark:border-zinc-800 dark:bg-zinc-900/40">
                  {(() => {
                    if (!status) {
                      return (
                        <>
                          <Button asChild className="h-9 flex-1 rounded-full px-4 text-sm font-semibold shadow-sm">
                            <Link href={`/exam/${exam.id}`}>
                              Start exam
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                          <Button asChild variant="outline" className="h-9 rounded-full px-4 text-sm font-medium">
                            <Link href={`/exam/leaderboard/${exam.id}`}>Leaderboard</Link>
                          </Button>
                        </>
                      );
                    }

                    if (status.isPremiumExam && !status.canAttemptPremium) {
                      return (
                        <Button
                          type="button"
                          onClick={() => openPremiumDialog(exam)}
                          className="h-9 flex-1 rounded-full px-4 text-sm font-semibold shadow-sm"
                        >
                          Premium required
                        </Button>
                      );
                    }

                    if (isLocked || status?.isLocked) {
                      return (
                        <>
                          <Button disabled className="h-9 flex-1 rounded-full px-4 text-sm font-semibold shadow-sm">
                            Locked
                          </Button>
                          <Button asChild variant="outline" className="h-9 rounded-full px-4 text-sm font-medium">
                            <Link href={`/exam/leaderboard/${exam.id}`}>Leaderboard</Link>
                          </Button>
                        </>
                      );
                    }

                    if (!status.canRetake && status.hasPassed) {
                      return (
                        <>
                          <Button asChild className="h-9 flex-1 rounded-full px-4 text-sm font-semibold shadow-sm">
                            <Link href={`/exam/${exam.id}?mode=review`}>Review</Link>
                          </Button>
                          <Button asChild variant="outline" className="h-9 rounded-full px-4 text-sm font-medium">
                            <Link href={`/exam/leaderboard/${exam.id}`}>Leaderboard</Link>
                          </Button>
                        </>
                      );
                    }

                    return (
                      <>
                        <Button asChild className="h-9 flex-1 rounded-full px-4 text-sm font-semibold shadow-sm">
                          <Link href={`/exam/${exam.id}`}>
                            {actionLabel}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                        <Button asChild variant="outline" className="h-9 rounded-full px-4 text-sm font-medium">
                          <Link href={`/exam/leaderboard/${exam.id}`}>Leaderboard</Link>
                        </Button>
                      </>
                    );
                  })()}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={premiumDialogOpen}
        onOpenChange={(open) => {
          setPremiumDialogOpen(open);
          if (!open) {
            setSelectedPremiumExam(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg rounded-2xl border border-zinc-200 p-0 shadow-2xl dark:border-zinc-800">
          <div className="border-b border-zinc-200 bg-gradient-to-r from-primary/10 via-background to-emerald-500/10 px-6 py-5 dark:border-zinc-800">
            <DialogHeader className="space-y-4 text-left sm:text-left">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <DialogTitle className="text-2xl font-bold tracking-tight">Premium required</DialogTitle>
                  <DialogDescription className="text-sm leading-6 text-muted-foreground">
                    {selectedPremiumExam
                      ? `${selectedPremiumExam.title} is available for premium users only.`
                      : "This exam is available for premium users only."}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="px-6 py-5">
            <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-4 text-sm leading-6 text-foreground">
              <p className="font-semibold">If you want premium access, buy now.</p>
              <p className="mt-1 text-muted-foreground">
                Premium access unlocks this exam and other exclusive premium tests.
              </p>
              <div className="mt-3 space-y-1 text-sm">
                <p>
                  Mobile: <a className="font-medium underline" href={`tel:${supportPhone}`}>{supportPhone}</a>
                </p>
                <p>
                  Email: <a className="font-medium underline" href={`mailto:${supportEmail}`}>{supportEmail}</a>
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Button asChild className="h-11 rounded-full px-5 shadow-sm">
                <Link href="/contact">Buy Now</Link>
              </Button>
              <Button asChild variant="outline" className="h-11 rounded-full px-5 font-medium">
                <a href={`tel:${supportPhone}`}>Call Now</a>
              </Button>
              <Button asChild variant="secondary" className="h-11 rounded-full px-5 font-medium">
                <a href={`mailto:${supportEmail}`}>Email Us</a>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
