import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { adminAuth, adminDB } from "@/lib/firebase/firebase-admin";
import { isPremiumUser, normalizePremiumCategories } from "@/lib/premium-access";
import { cacheAside } from "@/lib/cache-strategy";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight,
  BookOpen,
  Code,
  Database,
  FileText,
  Flame,
  IndianRupee,
  LayoutGrid,
  Medal,
  Radar,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  TrendingUp,
  User,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import ExamStatsRealtime from './ExamStatsRealtime';
import PassedExamsRealtime from './PassedExamsRealtime';
import RecentActivityRealtime from './RecentActivityRealtime';

import type { Timestamp } from "firebase-admin/firestore";

type UserDoc = {
  uid?: string;
  email?: string;
  displayName?: string;
  photoURL?: string | null;
  isPremium?: boolean;
  premium?: boolean;
  premiumCategories?: string[];
  premiumAccessCategories?: string[];
  allowedExamIds?: string[];
  allowedPdfIds?: string[];
  streakCount?: number;
  lastActivityDate?: Timestamp | { toDate?: () => Date } | string | number | null;
  recentActivity?: Array<{ id: string; title: string; type: "dsa" | "cs"; timestamp: string }>;
  firstExamSubmittedAt?: Timestamp | { toDate?: () => Date } | string | number | null;
  hasSubmittedExam?: boolean;
  hasPassed?: boolean;
  createdAt?: Timestamp | { toDate?: () => Date } | string | number | null;
};

type ExamAttemptDoc = {
  id: string;
  examId: string;
  examTitle?: string;
  score?: number;
  percentage?: number;
  passed?: boolean;
  submittedAt?: Timestamp | { toDate?: () => Date } | string | number | null;
};

type DashboardPayload = {
  user: UserDoc;
  examStats: {
    totalAttempts: number;
    passedExams: number;
    averageScore: number;
    currentStreak: number;
  };

  learningProgress: {
    totalPremiumExams: number;
    attemptedExams: number;
    passedExams: number;
  };

  platformStats: {
    activeUsersCount: number;
    successRate: number;
    uniqueExamTakers: number;
  };

  recentAttempts: ExamAttemptDoc[];
  passedExams: ExamAttemptDoc[];
  recentActivity: Array<{
    id: string;
    title: string;
    type: "dsa" | "cs";
    timestamp: string;
  }>;
};

function toDateString(value: UserDoc["createdAt"] | ExamAttemptDoc["submittedAt"] | UserDoc["firstExamSubmittedAt"]) {
  if (!value) return null;

  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString();
  }

  if (typeof value === "object" && value && "toDate" in value && typeof value.toDate === "function") {
    const date = value.toDate();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString() : null;
  }

  return null;
}

function toTimestamp(value: UserDoc["createdAt"] | ExamAttemptDoc["submittedAt"] | UserDoc["firstExamSubmittedAt"]) {
  if (!value) return 0;
  if (typeof value === "string" || typeof value === "number") return new Date(value).getTime();
  if (typeof value === "object" && value && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().getTime();
  }
  return 0;
}

function getInitials(name?: string) {
  if (!name) return "U";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getPremiumDestinations(user: UserDoc) {
  const allowedExamIds = Array.isArray(user.allowedExamIds) ? user.allowedExamIds.filter(Boolean) : [];
  const allowedPdfIds = Array.isArray(user.allowedPdfIds) ? user.allowedPdfIds.filter(Boolean) : [];
  const premiumCategories = normalizePremiumCategories(user);
  const isPremium = isPremiumUser(user);

  if (!isPremium) {
    return {
      label: "Upgrade to Premium",
      href: "/contact",
      note: "Contact us through the existing support page or WhatsApp.",
    };
  }

  // if (premiumCategories.length > 0) {
  //   const category =
  //     premiumCategories[0] === "ALL"
  //       ? ""
  //       : premiumCategories[0].toLowerCase();

  //   return {
  //     label: "Open Premium Content",
  //     href: category
  //       ? `/library?category=${encodeURIComponent(category)}`
  //       : "/library",
  //     note: "Open your assigned premium category content.",
  //   };
  // }

  // if (allowedExamIds.length > 0) {
  //   return {
  //     label: "Open Premium Content",
  //     href: `/exam/${encodeURIComponent(allowedExamIds[0])}`,
  //     note: premiumCategories.includes("ALL") ? "Open your premium exam access." : "Open your assigned premium exam.",
  //   };
  // }

  // return {
  //   label: "Open Premium Content",
  //   href: "/library",
  //   note: premiumCategories.includes("ALL") ? "Open premium library and exam access." : "Open premium-enabled content.",
  // };
}

async function getCachedExamsList() {
  return cacheAside(
    "dashboard:exams_metadata",
    async () => {
      const snap = await adminDB
        .collection("exams")
        .where("isPublished", "==", true)
        .select("category", "isPremium")
        .get();
      return snap.docs.map(doc => ({
        id: doc.id,
        category: String(doc.data().category || "").trim().toUpperCase(),
        isPremium: doc.data().isPremium === true
      }));
    },
    30 * 60 * 1000 // 30 minutes cache
  );
}

async function getCachedPlatformStats() {
  return cacheAside(
    "dashboard:platform_stats",
    async () => {
      const statsRef = adminDB.collection("system_config").doc("platform_stats");
      const snap = await statsRef.get();
      if (!snap.exists) return { activeUsersCount: 0, successRate: 0, uniqueExamTakers: 0 };
      const data = snap.data() || {};
      return {
        activeUsersCount: Number(data.activeUsersCount || 0),
        successRate: Number(data.successRate || 0),
        uniqueExamTakers: Number(data.uniqueExamTakers || 0)
      };
    },
    5 * 60 * 1000 // 5 minutes cache
  );
}

async function getDashboardData(userId: string): Promise<DashboardPayload> {
  const userRef = adminDB.collection("users").doc(userId);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    return {
      user: { uid: userId },

      examStats: {
        totalAttempts: 0,
        passedExams: 0,
        averageScore: 0,
        currentStreak: 0,
      },

      learningProgress: {
        totalPremiumExams: 0,
        attemptedExams: 0,
        passedExams: 0,
      },

      platformStats: {
        activeUsersCount: 0,
        successRate: 0,
        uniqueExamTakers: 0,
      },

      recentAttempts: [],
      passedExams: [],
      recentActivity: [],
    };
  }

  const userData = userSnap.data() as UserDoc;
  const premiumCategories = normalizePremiumCategories(userData);

  const attemptsQuery = adminDB
    .collection("exam_attempts")
    .where("userId", "==", userId)
    .where("status", "==", "submitted");

  // Load cached exams metadata and platform stats
  const [allExams, platformStats, attemptSnap] = await Promise.all([
    getCachedExamsList(),
    getCachedPlatformStats(),
    attemptsQuery.get()
  ]);

  let totalPremiumExams = 0;
  const allowedExamIds = new Set<string>();

  if (premiumCategories.includes("ALL")) {
    allExams.forEach((exam) => {
      allowedExamIds.add(exam.id);
    });
    totalPremiumExams = allExams.length;
  } else if (premiumCategories.length > 0) {
    const catsSet = new Set(premiumCategories.map(c => c.toUpperCase()));
    allExams.forEach((exam) => {
      if (catsSet.has(exam.category)) {
        allowedExamIds.add(exam.id);
      }
    });
    totalPremiumExams = allowedExamIds.size;
  }

  const recentAttempts = attemptSnap.docs
    .map((doc) => {
      const d = doc.data() as any;
      const submittedAt = d?.submittedAt && typeof d.submittedAt === 'object' && 'toDate' in d.submittedAt
        ? d.submittedAt.toDate().toISOString()
        : d?.submittedAt ? new Date(d.submittedAt).toISOString() : null;

      return {
        id: doc.id,
        examId: d.examId ?? null,
        examTitle: d.examTitle ?? null,
        score: typeof d.score === 'number' ? d.score : Number(d.score ?? 0),
        percentage: typeof d.percentage === 'number' ? d.percentage : Number(d.percentage ?? 0),
        passed: !!d.passed,
        submittedAt,
      } as ExamAttemptDoc;
    })
    .sort((left, right) => toTimestamp(right.submittedAt) - toTimestamp(left.submittedAt));

  const uniqueAttemptedExamIds = new Set(
    recentAttempts
      .filter((a) => a.examId && allowedExamIds.has(a.examId))
      .map((a) => a.examId)
  );

  // Eliminate redundant database query by filtering attempts in memory
  const passedExams = recentAttempts
    .filter((a) => a.passed)
    .slice(0, 5)
    .map((a) => ({
      id: a.id,
      examId: a.examId,
      examTitle: a.examTitle,
      score: a.score,
      percentage: a.percentage,
      passed: a.passed,
    }));

  const uniquePassedExamIds = new Set(
    passedExams
      .filter((a) => a.examId && allowedExamIds.has(a.examId))
      .map((a) => a.examId)
  );

  const totalAttempts = recentAttempts.length;
  const passedCount = recentAttempts.filter((attempt) => attempt.passed).length;
  const averageScore = totalAttempts > 0
    ? recentAttempts.reduce((sum, attempt) => sum + Number(attempt.percentage || 0), 0) / totalAttempts
    : 0;

  const { activeUsersCount, successRate, uniqueExamTakers } = platformStats;

  return {
    user: userData,

    examStats: {
      totalAttempts,
      passedExams: passedCount,
      averageScore,
      currentStreak: Number(userData.streakCount || 0),
    },

    learningProgress: {
      totalPremiumExams,
      attemptedExams: uniqueAttemptedExamIds.size,
      passedExams: uniquePassedExamIds.size,
    },

    platformStats: {
      activeUsersCount,
      successRate,
      uniqueExamTakers,
    },

    recentAttempts,
    passedExams,
    recentActivity: Array.isArray(userData.recentActivity)
      ? userData.recentActivity.slice(0, 5).map((a: any) => ({
        id: a.id ?? null,
        title: a.title ?? '',
        type: a.type === 'cs' ? 'cs' : 'dsa',
        timestamp: a?.timestamp && typeof a.timestamp === 'object' && 'toDate' in a.timestamp
          ? a.timestamp.toDate().toISOString()
          : a?.timestamp ? new Date(a.timestamp).toISOString() : null,
      }))
      : [],
  };
}

function SectionTitle({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {icon}
          {title}
        </div>
        {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
    </div>
  );
}

function StatCard({ label, value, helper, icon, tone }: { label: string; value: string | number; helper: string; icon: React.ReactNode; tone: string }) {
  return (
    <Card className="overflow-hidden border-border/60 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="mt-1 text-3xl font-semibold tracking-tight">{value}</div>
            <div className="mt-2 text-xs text-muted-foreground">{helper}</div>
          </div>
          <div className={`rounded-2xl p-3 ${tone}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;

  if (!sessionCookie) {
    redirect("/login?redirect=/dashboard");
  }

  const decoded = await adminAuth.verifySessionCookie(sessionCookie);
  const payload = await getDashboardData(decoded.uid);
  const user = payload.user;
  const premium = isPremiumUser(user);
  const premiumDest = getPremiumDestinations(user);
  const premiumCategories = normalizePremiumCategories(user);
  const premiumCategory =
    premiumCategories.length > 0 &&
      premiumCategories[0] !== "ALL"
      ? premiumCategories[0].toLowerCase()
      : null;

  function toCategorySlug(category: string) {
    return category
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");
  }

  const totalPremiumExams = payload.learningProgress.totalPremiumExams;
  const attemptedPremiumExams = payload.learningProgress.attemptedExams;
  const passedPremiumExams = payload.learningProgress.passedExams;
  const examsRemaining = Math.max(0, totalPremiumExams - passedPremiumExams);

  const attemptPercent =
    totalPremiumExams > 0
      ? Math.round((attemptedPremiumExams / totalPremiumExams) * 100)
      : 0;

  const passPercent =
    totalPremiumExams > 0
      ? Math.round((passedPremiumExams / totalPremiumExams) * 100)
      : 0;
  const pdfHref = premiumCategory
    ? `/library?category=${toCategorySlug(premiumCategory)}`
    : "/library";

  const examHref = premiumCategory
    ? `/exam/category/${toCategorySlug(premiumCategory)}`
    : "/exam";
  const streak = Number(payload.examStats.currentStreak || user.streakCount || 0);

  // Leadership Rank Calculations (Where Do They Stand?)
  const totalCompared = payload.platformStats.activeUsersCount || payload.platformStats.uniqueExamTakers || 100;
  const platformSuccessRate = payload.platformStats.successRate || 60;
  const averageScore = payload.examStats.averageScore;
  const passedCount = payload.examStats.passedExams;
  const totalAttempts = payload.examStats.totalAttempts;

  let estimatedPercentile = 0;
  if (totalAttempts > 0) {
    const scoreWeight = averageScore * 0.6; // 60% score weight
    const passedWeight = Math.min(10, passedCount) * 4; // up to 40% passed count weight
    estimatedPercentile = Math.min(99, Math.round(scoreWeight + passedWeight));
  }

  const userRank = totalAttempts > 0
    ? Math.max(1, Math.round(totalCompared * (1 - estimatedPercentile / 100)))
    : "-";
  const progressPercent =
    payload.learningProgress.totalPremiumExams > 0
      ? Math.round(
        (payload.learningProgress.passedExams /
          payload.learningProgress.totalPremiumExams) *
        100
      )
      : 0;

  const achievements = [
    { label: "First Exam Completed", unlocked: payload.examStats.totalAttempts >= 1 },
    { label: "10 Exams Passed", unlocked: payload.examStats.passedExams >= 10 },
    { label: "80% Average Score", unlocked: payload.examStats.averageScore >= 80 },
    { label: "7 Day Streak", unlocked: streak >= 7 },
  ].filter((item) => item.unlocked);

  const joinDate = toDateString(user.createdAt || user.firstExamSubmittedAt);
  const memberLabel = premium ? "PREMIUM MEMBER" : "FREE MEMBER";
  const memberBadgeClass = premium
    ? "bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-300/60"
    : "bg-slate-500/10 text-slate-700 dark:text-slate-200 border-slate-300/60";

  return (
    <main className="bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border/60 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.10),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.78),transparent_55%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.12),transparent_28%),linear-gradient(180deg,rgba(2,6,23,0.96),transparent_55%)]">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-500/60 to-transparent" />
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
            <Card className="border-border/60 shadow-sm">
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-4 md:gap-5">
                    <Avatar className="h-20 w-20 ring-2 ring-border/80">
                      <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || "Student"} />
                      <AvatarFallback className="text-lg">{getInitials(user.displayName || user.email)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.16em] ${memberBadgeClass}`}>
                        {premium ? <Sparkles className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                        {memberLabel}
                      </div>
                      <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">{user.displayName || "Student"}</h1>
                      <p className="mt-2 text-sm text-muted-foreground">{user.email || "No email available"}</p>
                      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-2 rounded-full border border-border/60 px-3 py-1">
                          <User className="h-4 w-4" />
                          Joined {joinDate || "recently"}
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full border border-border/60 px-3 py-1">
                          <Flame className="h-4 w-4 text-orange-500" />
                          Streak {streak} days
                        </span>
                        {/* {premiumCategories.includes("ALL") ? (
                          <Badge className="bg-amber-500/10 text-amber-800 border-amber-300/60">All premium categories</Badge>
                        ) : premiumCategories.length > 0 ? (
                          <Badge variant="secondary">{premiumCategories.length} premium categories</Badge>
                        ) : null} */}

                        {premiumCategories.includes("ALL") ? (
                          <Badge className="bg-amber-500/10 text-amber-800 border-amber-300/60">
                            ALL Categories
                          </Badge>
                        ) : premiumCategories.length > 0 ? (
                          <Badge
                            variant="secondary"
                            className="max-w-[400px] whitespace-normal break-words"
                          >
                            {premiumCategories.join(", ").toUpperCase()}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 md:items-end">
                    {premium ? (
                      <>
                        <Button asChild className="min-w-[220px]">
                          <Link href={pdfHref}>
                            <FileText className="h-4 w-4 mr-2" />
                            Open Premium PDFs
                          </Link>
                        </Button>

                        <Button asChild variant="outline" className="min-w-[220px]">
                          <Link href={examHref}>
                            <BookOpen className="h-4 w-4 mr-2" />
                            Open Premium Exams
                          </Link>
                        </Button>

                        <p className="max-w-xs text-xs leading-5 text-muted-foreground">
                          Open your assigned premium category content.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="max-w-xs text-xs leading-5 text-muted-foreground">
                          Upgrade to premium to access premium PDFs and exams.
                        </p>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="min-w-[220px]">
                              Upgrade to Premium
                            </Button>
                          </DialogTrigger>

                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Upgrade to Premium</DialogTitle>
                              <DialogDescription>
                                Contact us through any of the following methods.
                              </DialogDescription>
                            </DialogHeader>

                            <div className="flex flex-col gap-3 mt-4">

                              {/* WhatsApp */}
                              <Button asChild>
                                <a
                                  href={`https://wa.me/919452903509?text=${encodeURIComponent(
                                    `Hi, I want to upgrade to Premium.`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  WhatsApp
                                </a>
                              </Button>

                              {/* Call */}
                              <Button variant="outline" asChild>
                                <a href="tel:+919452903509">
                                  Call: +91 9452903509
                                </a>
                              </Button>

                              {/* Contact Form */}
                              <Button variant="secondary" asChild>
                                <Link href="/contact">
                                  Contact Form
                                </Link>
                              </Button>

                            </div>
                          </DialogContent>
                        </Dialog>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="h-4 w-4 text-sky-600" />
                  Learning Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 px-6 pb-6">
                <div className="flex items-center gap-4">
                  <div className="relative h-28 w-28 shrink-0 rounded-full bg-slate-100 p-3 dark:bg-slate-800">
                    <div
                      className="absolute inset-3 rounded-full border-8 border-slate-200 dark:border-slate-700"
                      style={{
                        borderTopColor: "hsl(var(--primary))",
                        borderRightColor: progressPercent >= 25 ? "hsl(var(--primary))" : undefined,
                        borderBottomColor: progressPercent >= 50 ? "hsl(var(--primary))" : undefined,
                        borderLeftColor: progressPercent >= 75 ? "hsl(var(--primary))" : undefined,
                        transform: `rotate(${progressPercent * 3.6}deg)`,
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-semibold">{progressPercent}%</div>
                        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Done</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-muted-foreground">Overall Learning Progress</div>
                      <div className="mt-1 text-2xl font-semibold">
                        {payload.examStats.passedExams} / {payload.examStats.totalAttempts}
                      </div>
                      <div className="text-sm text-muted-foreground">Passed exams / attempted exams</div>
                    </div>
                    <Progress value={progressPercent} className="h-2.5" />
                  </div>
                </div>
              </CardContent>
            </Card> */}

            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Target className="h-4 w-4 text-sky-600" />
                  Overall Progress
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                {!premium ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Target className="h-12 w-12 text-muted-foreground mb-3" />
                    <h3 className="text-lg font-semibold">Upgrade to Premium</h3>
                    <p className="mt-2 text-sm text-muted-foreground max-w-xs">
                      Upgrade your premium membership to view overall progress, milestone tracking, and detailed course completion status.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Milestone-enabled progress bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-muted-foreground">Course Completion</span>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{passPercent}%</span>
                      </div>

                      <div className="relative pt-3 pb-6">
                        <Progress value={passPercent} className="h-2.5 bg-slate-100 dark:bg-slate-800" />
                        <div className="absolute inset-x-0 top-3 pointer-events-none">
                          {[25, 50, 75, 100].map((milestone) => {
                            const isReached = passPercent >= milestone;
                            return (
                              <div
                                key={milestone}
                                className="absolute flex flex-col items-center -translate-x-1/2"
                                style={{ left: `${milestone}%` }}
                              >
                                <div
                                  className={`w-3 h-3 rounded-full border-2 transition-all ${isReached
                                    ? 'bg-emerald-500 border-emerald-500 scale-110 shadow-sm'
                                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700'
                                    }`}
                                />
                                <span
                                  className={`text-[9px] font-bold mt-1 transition-colors ${isReached ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : 'text-muted-foreground'
                                    }`}
                                >
                                  {milestone}%
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Detailed counts */}
                    <div className="rounded-xl border p-4 bg-muted/20 space-y-3">
                      <div className="grid grid-cols-3 gap-2 text-center divide-x divide-border">
                        <div>
                          <p className="text-lg font-bold text-sky-600 dark:text-sky-400">
                            {totalPremiumExams}
                          </p>
                          <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                            Assigned
                          </p>
                        </div>

                        <div>
                          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                            {passedPremiumExams}
                          </p>
                          <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                            Completed
                          </p>
                        </div>

                        <div>
                          <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                            {examsRemaining}
                          </p>
                          <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                            Remaining
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8 md:py-10">
        <ExamStatsRealtime userId={decoded.uid} initial={{ totalAttempts: payload.examStats.totalAttempts, passedExams: payload.examStats.passedExams, averageScore: payload.examStats.averageScore, currentStreak: streak }} />
      </section>

      {/* <section className="container mx-auto grid gap-6 px-4 pb-10 lg:grid-cols-[1.1fr_0.9fr]"> */}
      <section className="container mx-auto grid gap-6 px-4 pb-10 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Milestone Achievements */}
        <Card className="border-border/60 shadow-sm bg-card hover:shadow-md transition-shadow">
          <CardHeader>
            <SectionTitle
              icon={<Medal className="h-4 w-4 text-purple-600 animate-bounce" />}
              title="Milestone Achievements"
              subtitle="Track your exam progress and streak milestones."
            />
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "First Exam", unlocked: payload.examStats.totalAttempts >= 1, desc: "Complete 1 exam attempt", icon: "🎯", progress: `${payload.examStats.totalAttempts}/1` },
              { label: "Exam Conqueror", unlocked: payload.examStats.passedExams >= 10, desc: "Pass 10 mock exams", icon: "🏆", progress: `${payload.examStats.passedExams}/10` },
              { label: "High Scorer", unlocked: payload.examStats.averageScore >= 80 && payload.examStats.totalAttempts >= 1, desc: "Get 80%+ average score", icon: "⭐", progress: `${payload.examStats.averageScore.toFixed(0)}%/80%` },
              { label: "Streak Master", unlocked: streak >= 7, desc: "Reach a 7-day study streak", icon: "🔥", progress: `${streak}/7d` }
            ].map((item) => (
              <div
                key={item.label}
                className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${item.unlocked
                  ? 'bg-gradient-to-br from-purple-500/5 to-indigo-500/5 border-purple-500/20 dark:border-purple-500/10'
                  : 'bg-muted/30 border-border/40 opacity-70'
                  }`}
              >
                <div className={`text-2xl p-2 rounded-lg ${item.unlocked ? 'bg-purple-500/10' : 'bg-muted'}`}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-semibold text-sm truncate">{item.label}</h4>
                    <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                      {item.progress}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-4">{item.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Study Hub / Quick Navigation */}
        <Card className="border-border/60 shadow-sm bg-card hover:shadow-md transition-shadow">
          <CardHeader>
            <SectionTitle
              icon={<Radar className="h-4 w-4 text-cyan-600" />}
              title="Study Hub"
              subtitle="Quick navigation to learning materials and tools."
            />
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Button asChild variant="outline" className="h-auto py-3 px-4 justify-start hover:border-sky-500/30 hover:bg-sky-500/5 group transition-all">
              <Link href="/exam" className="flex items-start gap-3 text-left">
                <BookOpen className="h-5 w-5 text-sky-500 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-semibold text-sm">Browse Exams</div>
                  <div className="text-xs text-muted-foreground mt-0.5 leading-4">Take a full mock test</div>
                </div>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto py-3 px-4 justify-start hover:border-emerald-500/30 hover:bg-emerald-500/5 group transition-all">
              <Link href="/library" className="flex items-start gap-3 text-left">
                <FileText className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-semibold text-sm">PDF Library</div>
                  <div className="text-xs text-muted-foreground mt-0.5 leading-4">Access syllabus & resources</div>
                </div>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto py-3 px-4 justify-start hover:border-orange-500/30 hover:bg-orange-500/5 group transition-all">
              <Link href="/dsa" className="flex items-start gap-3 text-left">
                <Database className="h-5 w-5 text-orange-500 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-semibold text-sm">DSA Sheets</div>
                  <div className="text-xs text-muted-foreground mt-0.5 leading-4">Master algorithms & code</div>
                </div>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto py-3 px-4 justify-start hover:border-purple-500/30 hover:bg-purple-500/5 group transition-all">
              <Link href="/playground" className="flex items-start gap-3 text-left">
                <Code className="h-5 w-5 text-purple-500 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-semibold text-sm">Playground IDE</div>
                  <div className="text-xs text-muted-foreground mt-0.5 leading-4">Write, run & compile code</div>
                </div>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="container mx-auto grid gap-6 px-4 pb-10 xl:grid-cols-[1fr_1fr]">
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <SectionTitle icon={<TrendingUp className="h-4 w-4 text-emerald-600" />} title="Passed Exams" subtitle="Latest five passed attempts only." />
          </CardHeader>
          <CardContent className="space-y-3">
            <PassedExamsRealtime userId={decoded.uid} initial={payload.passedExams as any} />
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <SectionTitle
              icon={<Radar className="h-4 w-4 text-sky-600" />}
              title="Where Do They Stand?"
              subtitle="Comparing your progress and score with other candidates."
            />
          </CardHeader>
          <CardContent className="space-y-6">
            {totalAttempts === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Radar className="h-10 w-10 text-muted-foreground/60 mb-2 animate-pulse" />
                <p className="text-sm font-semibold text-foreground">No mock attempts recorded yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
                  Submit your first exam attempt to unlock your leaderboard ranking and percentile standing.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 items-center">
                {/* Radial Percentile Indicator */}
                <div className="relative h-28 w-28 mx-auto flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-900 border border-border">
                  <div
                    className="absolute inset-0 rounded-full border-8 border-slate-100 dark:border-slate-800"
                  />
                  <div
                    className="absolute inset-0 rounded-full border-8 border-transparent"
                    style={{
                      borderTopColor: "hsl(var(--primary))",
                      borderRightColor: estimatedPercentile >= 25 ? "hsl(var(--primary))" : "transparent",
                      borderBottomColor: estimatedPercentile >= 50 ? "hsl(var(--primary))" : "transparent",
                      borderLeftColor: estimatedPercentile >= 75 ? "hsl(var(--primary))" : "transparent",
                      transform: `rotate(${estimatedPercentile * 3.6}deg)`,
                    }}
                  />
                  <div className="text-center z-10">
                    <div className="text-2xl font-extrabold tracking-tight text-primary">
                      {estimatedPercentile}th
                    </div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                      Percentile
                    </div>
                  </div>
                </div>

                {/* Standing Stats */}
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center text-sm border-b pb-2 border-border/40">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-amber-500" />
                      Estimated Rank
                    </span>
                    <span className="font-semibold text-foreground">
                      #{userRank} <span className="text-xs text-muted-foreground font-normal">of {totalCompared}</span>
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm border-b pb-2 border-border/40">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                      Your Avg Score
                    </span>
                    <span className="font-semibold text-foreground">
                      {averageScore.toFixed(1)}% <span className="text-xs text-muted-foreground font-normal">vs {platformSuccessRate}% avg</span>
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Flame className="h-4 w-4 text-orange-500" />
                      Active Streak
                    </span>
                    <span className="font-semibold text-foreground">
                      {streak} {streak === 1 ? "day" : "days"} <span className="text-xs text-muted-foreground font-normal">Active</span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* <section className="container mx-auto px-4 pb-12">
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <SectionTitle icon={<IndianRupee className="h-4 w-4 text-emerald-600" />} title="Premium Access" subtitle="Uses existing contact and content routes from the project." />
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <Button asChild variant="outline" className="justify-start">
              <Link href={premiumDest.href}><ShieldCheck className="h-4 w-4" /> {premiumDest.label}</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/contact"><ArrowRight className="h-4 w-4" /> Contact Support</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="mailto:Consultantstvk@gmail.com"><FileText className="h-4 w-4" /> Email Support</Link>
            </Button>
          </CardContent>
        </Card>
      </section> */}
    </main>
  );
}
