// /app/dashboard/ExamStatsRealtime.tsx
"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Flame, LayoutGrid, Trophy, TrendingUp } from 'lucide-react';

type Props = {
  userId: string;
  initial: {
    totalAttempts: number;
    passedExams: number;
    averageScore: number;
    currentStreak: number;
  };
};

export default function ExamStatsRealtime({ initial }: Props) {
  const stats = {
    totalAttempts: initial?.totalAttempts ?? 0,
    passedExams: initial?.passedExams ?? 0,
    averageScore: initial?.averageScore ?? 0,
    currentStreak: initial?.currentStreak ?? 0,
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      {/* Exams Attempted */}
      <Card className="overflow-hidden border border-border bg-card hover:shadow-md hover:border-sky-500/30 dark:hover:border-sky-500/20 transition-all duration-300 group">
        <CardContent className="p-6 relative">
          <div className="absolute top-0 right-0 h-16 w-16 bg-sky-500/5 rounded-bl-full transition-all group-hover:scale-110" />
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Exams Attempted</p>
              <p className="mt-2 text-3xl font-extrabold text-sky-600 dark:text-sky-400">{stats.totalAttempts}</p>
              <div className="mt-2 text-xs text-muted-foreground">Total mock tests submitted</div>
            </div>
            <div className="rounded-xl bg-sky-500/10 p-3 text-sky-600 dark:text-sky-400 transition-colors group-hover:bg-sky-500/20">
              <LayoutGrid className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exams Passed */}
      <Card className="overflow-hidden border border-border bg-card hover:shadow-md hover:border-emerald-500/30 dark:hover:border-emerald-500/20 transition-all duration-300 group">
        <CardContent className="p-6 relative">
          <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-500/5 rounded-bl-full transition-all group-hover:scale-110" />
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Exams Passed</p>
              <p className="mt-2 text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.passedExams}</p>
              <div className="mt-2 text-xs text-muted-foreground">Mock tests with passing marks</div>
            </div>
            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400 transition-colors group-hover:bg-emerald-500/20">
              <Trophy className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Average Score */}
      <Card className="overflow-hidden border border-border bg-card hover:shadow-md hover:border-indigo-500/30 dark:hover:border-indigo-500/20 transition-all duration-300 group">
        <CardContent className="p-6 relative">
          <div className="absolute top-0 right-0 h-16 w-16 bg-indigo-500/5 rounded-bl-full transition-all group-hover:scale-110" />
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Average Score</p>
              <p className="mt-2 text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">{stats.averageScore.toFixed(1)}%</p>
              <div className="mt-2 text-xs text-muted-foreground">Recent exam performance</div>
            </div>
            <div className="rounded-xl bg-indigo-500/10 p-3 text-indigo-600 dark:text-indigo-400 transition-colors group-hover:bg-indigo-500/20">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Streak */}
      <Card className="overflow-hidden border border-border bg-card hover:shadow-md hover:border-orange-500/30 dark:hover:border-orange-500/20 transition-all duration-300 group">
        <CardContent className="p-6 relative">
          <div className="absolute top-0 right-0 h-16 w-16 bg-orange-500/5 rounded-bl-full transition-all group-hover:scale-110" />
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current Streak</p>
              <p className="mt-2 text-3xl font-extrabold text-orange-600 dark:text-orange-400">{stats.currentStreak}</p>
              <div className="mt-2 text-xs text-muted-foreground">Consecutive days active</div>
            </div>
            <div className="rounded-xl bg-orange-500/10 p-3 text-orange-500 transition-colors group-hover:bg-orange-500/20">
              <Flame className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
