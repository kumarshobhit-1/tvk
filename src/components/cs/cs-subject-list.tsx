// src/components/cs/cs-subject-list.tsx

"use client";

import { useEffect, useState } from 'react';
import { TopicCard } from '@/components/topic-card';
import { useAuth } from '@/hooks/use-auth';
import { getProgress } from '@/lib/db';
import type { CsSubject, CsTopic, Progress as ProgressType } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface CsSubjectListProps {
  subjects: CsSubject[];
  allTopics: CsTopic[];
}

export function CsSubjectList({ subjects, allTopics }: CsSubjectListProps) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<ProgressType>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProgress() {
      if (user) {
        setLoading(true);
        const userProgress = await getProgress(user.uid);
        setProgress(userProgress);
        setLoading(false);
      } else {
        setProgress({});
        setLoading(false);
      }
    }
    fetchProgress();
  }, [user]);

  const calculateProgress = (subject: CsSubject) => {
    if (!user) return 0;

    const topicsForSubject = allTopics.filter(t => t.csSubjectId === subject.id);
    const totalTopics = topicsForSubject.length;

    if (totalTopics === 0) return 0;

    const completedCount = topicsForSubject.filter(t => progress[t.id]).length;
    return (completedCount / totalTopics) * 100;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col space-y-3">
            <Skeleton className="h-[200px] w-full rounded-xl" />
            <div className="space-y-2 pt-2"><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-1/2" /></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {subjects.map(subject => (
        <TopicCard
          key={subject.id}
          title={subject.name}
          description={subject.description}
          href={`/cs/${subject.slug}`}
          progress={user ? calculateProgress(subject) : undefined}
          imageUrl={subject.imageUrl}
        />
      ))}
    </div>
  );
}