// /app/dashboard/ExamStatsRealtime.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { collection, limit, orderBy, onSnapshot, query, where, doc, onSnapshot as onDocSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

import { Card, CardContent } from '@/components/ui/card';
import { Trophy, TrendingUp, Flame, LayoutGrid } from 'lucide-react';

export default function ExamStatsRealtime({ userId, initial }: { userId: string; initial: { totalAttempts: number; passedExams: number; averageScore: number; currentStreak: number } }) {
  const [stats, setStats] = useState(() => ({
    totalAttempts: initial?.totalAttempts ?? 0,
    passedExams: initial?.passedExams ?? 0,
    averageScore: initial?.averageScore ?? 0,
    currentStreak: initial?.currentStreak ?? 0,
  }));

  useEffect(() => {
    if (!userId) return;

    // Listen to exam_attempts for counts and averages
    // const q = query(collection(db, 'exam_attempts'), where('userId', '==', userId));
  const q = query(
    collection(db, "exam_attempts"),
    where("userId", "==", userId),
    orderBy("submittedAt", "desc"),
    limit(20)
  );
    const unsubAttempts = onSnapshot(q, (snap) => {
      const attempts = snap.docs.map(d => d.data() as any);
      const submitted = attempts.filter(a => a.status === 'submitted' || a.submittedAt);
      const totalAttempts = submitted.length;
      const passedExams = submitted.filter(a => a.passed).length;
      const averageScore = totalAttempts > 0 ? submitted.reduce((s, a) => s + Number(a.percentage || 0), 0) / totalAttempts : 0;
      setStats(prev => ({ ...prev, totalAttempts, passedExams, averageScore }));
    });

    // Listen to user doc for streak changes
    const userRef = doc(db, 'users', userId);
    const unsubUser = onDocSnapshot(userRef, (snap) => {
      const d = snap.data() as any;
      const streak = typeof d?.streakCount === 'number' ? d.streakCount : Number(d?.streakCount ?? 0);
      setStats(prev => ({ ...prev, currentStreak: streak }));
    });

    return () => {
      unsubAttempts();
      unsubUser();
    };
  }, [userId]);

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
