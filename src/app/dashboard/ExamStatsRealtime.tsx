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
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <Card className="overflow-hidden border-border/60 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Exams Attempted</p>
              <p className="mt-1 text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.totalAttempts}</p>
              <div className="mt-2 text-xs text-muted-foreground">User-specific submitted attempts</div>
            </div>
            <LayoutGrid className="h-10 w-10 text-sky-600 opacity-50" />
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border/60 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Exams Passed</p>
              <p className="mt-1 text-3xl font-bold text-green-600 dark:text-green-400">{stats.passedExams}</p>
              <div className="mt-2 text-xs text-muted-foreground">From submitted attempts only</div>
            </div>
            <Trophy className="h-10 w-10 text-amber-600 opacity-50" />
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border/60 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Average Score</p>
              <p className="mt-1 text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.averageScore.toFixed(1)}%</p>
              <div className="mt-2 text-xs text-muted-foreground">Recent submitted attempts</div>
            </div>
            <TrendingUp className="h-10 w-10 text-emerald-600 opacity-50" />
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border/60 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Streak</p>
              <p className="mt-1 text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.currentStreak}</p>
              <div className="mt-2 text-xs text-muted-foreground">Stored user streak value</div>
            </div>
            <Flame className="h-10 w-10 text-orange-500 opacity-50" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
