"use client";

import React from 'react';
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
  // Presentational only: render server-provided `initial`.
  const items = initial || [];

  return (
    <div>
      {items.length > 0 ? (
        items.map((attempt) => (
          <div key={attempt.id} className="rounded-2xl border border-border/60 bg-card/70 p-4 mb-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-medium">{attempt.examTitle || "Old Exam"}</div>
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

