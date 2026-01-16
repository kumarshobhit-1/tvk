// src/components/dsa/dsa-topic-list.tsx

"use client";

import { useEffect, useState } from 'react';
import { TopicCard } from '@/components/topic-card';
import { useAuth } from '@/hooks/use-auth';
import { getProgress } from '@/lib/db';
import type { DsaTopic, DsaQuestion, Progress as ProgressType } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

interface DsaTopicListProps {
  topics: DsaTopic[];
  allQuestions: DsaQuestion[];
}

export function DsaTopicList({ topics, allQuestions }: DsaTopicListProps) {
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

  const calculateProgress = (topic: DsaTopic) => {
    if (!user) return 0;
    const questionsForTopic = allQuestions.filter(q => q.dsaTopicId === topic.id);
    const totalQuestions = questionsForTopic.length;
    if (totalQuestions === 0) return 0;
    const completedCount = questionsForTopic.filter(q => progress[q.id]).length;
    return (completedCount / totalQuestions) * 100;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col space-y-3">
            <Skeleton className="h-[200px] w-full rounded-xl" />
            <div className="space-y-2 pt-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {topics.map(topic => (
        <TopicCard
          key={topic.id}
          title={topic.name}
          description={topic.description}
          href={`/dsa/${topic.slug}`}
          progress={user ? calculateProgress(topic) : undefined}
          // --- FIX IS HERE: Use the imageUrl from the topic data ---
          imageUrl={topic.imageUrl} 
        />
      ))}
    </div>
  );
}