"use client";

import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, limit } from "firebase/firestore";
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type Attempt = {
  id: string;
  examId?: string;
  examTitle?: string;
  score?: number;
  percentage?: number;
  passed?: boolean;
  submittedAt?: any;
};

export default function PassedExamsRealtime({ userId, initial = [] }: { userId: string; initial?: Attempt[] }) {
  const [items, setItems] = useState<Attempt[]>(initial || []);

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, 'exam_attempts'),
      where('userId', '==', userId),
      where('passed', '==', true),
      limit(10)
    );

    const unsub = onSnapshot(q, async (snap) => {
      const raw = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Attempt[];
      // sort by submittedAt if available
      raw.sort((a, b) => {
        const ta = a.submittedAt ? (a.submittedAt.toDate ? a.submittedAt.toDate().getTime() : new Date(a.submittedAt).getTime()) : 0;
        const tb = b.submittedAt ? (b.submittedAt.toDate ? b.submittedAt.toDate().getTime() : new Date(b.submittedAt).getTime()) : 0;
        return tb - ta;
      });

      // fetch exam titles for any attempts missing examTitle
    //   const missingExamIds = Array.from(new Set(raw.filter(r => !r.examTitle && r.examId).map(r => r.examId))).filter(Boolean) as string[];
    //   const examTitleMap: Record<string, { title: string; exists: boolean }> = {};
    //   await Promise.all(missingExamIds.map(async (examId) => {
    //     try {
    //       const examDoc = await getDoc(doc(db, 'exams', examId));
    //       if (examDoc.exists()) {
    //         const data = examDoc.data() as any;
    //         examTitleMap[examId] = { title: data.title || data.name || examId, exists: true };
    //       } else {
    //         examTitleMap[examId] = { title: `Deleted exam`, exists: false };
    //       }
    //     } catch (e) {
    //       examTitleMap[examId] = { title: `Exam (${examId})`, exists: false };
    //     }
    //   }));

      const merged = raw.map(r => ({ ...r, examTitle: r.examTitle }));
      // Exclude attempts whose exam document was deleted
      const visible = merged;
      setItems(visible.slice(0, 5));
    });

    return () => unsub();
  }, [userId]);

  return (
    <div>
      {items.length > 0 ? (
        items.map((attempt) => (
          <div key={attempt.id} className="rounded-2xl border border-border/60 bg-card/70 p-4 mb-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-medium">{attempt.examTitle || "Old Exam"}</div>
                {/* <div className="mt-1 text-xs text-muted-foreground">{attempt.submittedAt ? (attempt.submittedAt.toDate ? attempt.submittedAt.toDate().toLocaleDateString() : new Date(attempt.submittedAt).toLocaleDateString()) : 'Recently'}</div> */}
                <div className="mt-1 text-xs text-muted-foreground">
                    {attempt.submittedAt? (() => {
                     const d = attempt.submittedAt?.toDate? attempt.submittedAt.toDate(): new Date(attempt.submittedAt);

                        return new Intl.DateTimeFormat("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                        }).format(d);
                    })()
                    : "Recently"}
                </div>
                {/* {!attempt.examTitle && attempt.examId ? (
                  <div className="text-xs text-muted-foreground">ID: {attempt.examId}</div>
                ) : null} */}
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-300/60">Passed</Badge>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div><div className="text-muted-foreground">Score</div><div className="font-semibold">{attempt.score ?? 0}</div></div>
              <div><div className="text-muted-foreground">Percent</div><div className="font-semibold">{Number(attempt.percentage || 0).toFixed(1)}%</div></div>
              <div className="flex items-center justify-end">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/exam/result?attemptId=${encodeURIComponent(attempt.id)}`}>View Result</Link>
                </Button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="rounded-2xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">No passed exams yet.</div>
      )}
    </div>
  );
}
