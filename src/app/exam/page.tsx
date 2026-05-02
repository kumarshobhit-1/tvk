"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Banknote,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  Cpu,
  Gavel,
  GraduationCap,
  Landmark,
  ShieldCheck,
  Sparkles,
  Trees,
  Wrench,
} from "lucide-react";
import Loading from "@/components/ui/loading";

type CategoryMeta = {
  title: string;
  subtitle: string;
  icon: typeof Landmark;
};

const CATEGORY_META: Record<string, CategoryMeta> = {
  BANKING: {
    title: "Banking & Insurance",
    subtitle: "SBI, IBPS, LIC & Other Bank/Insurance Exams.",
    icon: Landmark,
  },
  REGULATORY: {
    title: "Regulatory",
    subtitle: "RBI Grade B, NABARD, SEBI",
    icon: Gavel,
  },
  SSC: {
    title: "SSC/Railways",
    subtitle: "CGL, CHSL, CPO & RRB NTPC",
    icon: GraduationCap,
  },
  AGRICULTURE: {
    title: "Agriculture Exams",
    subtitle: "ICAR IARI",
    icon: Trees,
  },
  AAI: {
    title: "AAI Exams",
    subtitle: "AAI JE ATC",
    icon: Building2,
  },
  UPSC: {
    title: "UPSC Exams",
    subtitle: "EPFO APFC",
    icon: ShieldCheck,
  },
  STATE: {
    title: "State Exams",
    subtitle: "UPSSSC VDO",
    icon: Sparkles,
  },
  DEFENCE: {
    title: "Defence Exams",
    subtitle: "AFCAT",
    icon: Banknote,
  },
  ENGINEERING: {
    title: "Engineering Exams",
    subtitle: "GATE ME, GATE CE, RRB JE",
    icon: Wrench,
  },
  MBA: {
    title: "MBA Exams",
    subtitle: "CAT",
    icon: BriefcaseBusiness,
  },
  JEE: {
    title: "Engineering Exams",
    subtitle: "GATE ME, GATE CE, RRB JE",
    icon: Cpu,
  },
  OTHER: {
    title: "Other",
    subtitle: "Mixed-topic and uncategorized exam sets.",
    icon: BookOpen,
  },
};

export default function ExamsPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.title = "Exam Categories | The Victory Key";
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    const fetchCategories = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/exam/categories");
        const data = await response.json();
        setCategories(Array.isArray(data.categories) ? data.categories : []);
        setError("");
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError("");
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [user, authLoading]);

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
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Exam Categories</h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            Select a category to view available exams.
          </p>
        </div>
        <Badge variant="outline" className="hidden rounded-full px-3 py-1 md:inline-flex">
          {categories.length} live categories
        </Badge>
      </div>

      {categories.length === 0 ? (
        <Card className="mt-6 border-dashed bg-background dark:border-zinc-700 dark:bg-slate-950">
          <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 text-muted-foreground dark:bg-slate-800 dark:text-slate-200">
              <BookOpen className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-semibold">No categories available yet</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              We couldn’t find any published exam categories right now.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((cat) => {
            const key = cat.toUpperCase();
            const meta = CATEGORY_META[key] ?? {
              title: cat === "OTHER" ? "Other" : cat,
              subtitle:
                cat === "OTHER"
                  ? "Mixed-topic and uncategorized exam sets."
                  : `Available exams for ${cat}.`,
              icon: BookOpen,
            };
            const Icon = meta.icon;

            return (
              <Link key={cat} href={`/exam/category/${encodeURIComponent(cat.toLowerCase())}`} className="group">
                <Card className="h-full min-h-[170px] rounded-none border border-zinc-300 bg-white shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-700 dark:bg-slate-950">
                  <CardContent className="flex h-full flex-col items-center justify-center px-4 py-5 text-center">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-white text-[#4b5fcc] transition-colors group-hover:border-[#4b5fcc] group-hover:bg-[#4b5fcc]/5 dark:border-zinc-700 dark:bg-slate-900 dark:text-slate-100">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="text-base font-bold leading-tight text-zinc-900 dark:text-zinc-100">
                      {meta.title}
                    </h2>
                    <p className="mt-2 max-w-[170px] text-sm leading-5 text-slate-500 dark:text-slate-400">
                      {meta.subtitle}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
