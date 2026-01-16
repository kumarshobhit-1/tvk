// src/components/dsa/question-list.tsx

"use client";

import { useState, useEffect, useMemo } from 'react'; // useEffect is important
import { QuestionItem } from './question-item';
import { SearchBar } from '../search-bar';
import { ProgressBar } from '../progress-bar';
import { useAuth } from '@/hooks/use-auth';
import { getProgress, updateProgress } from '@/lib/db';
import type { DsaTopic, DsaQuestion, Progress } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface QuestionListProps {
  topic: DsaTopic;
  initialQuestions: DsaQuestion[];
  initialProgress: Progress;
}

export function QuestionList({ topic, initialQuestions, initialProgress }: QuestionListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [questions] = useState(initialQuestions);
  const [progress, setProgress] = useState<Progress>(initialProgress);

  // --- FIX IS HERE: Re-fetch progress on the client side ---
  useEffect(() => {
    // If the user is logged in, fetch their latest progress
    if (user) {
      getProgress(user.uid).then(freshProgress => {
        setProgress(freshProgress);
      });
    } else {
      // If user logs out, clear the progress
      setProgress({});
    }
  }, [user]); // This effect runs when the user's auth state changes

  const handleToggle = async (questionId: string, done: boolean) => {
    if (!user) { 
      toast({ title: "Login Required", description: "Please login to save progress.", variant: "destructive" });
      return; 
    }
    
    const newProgress = { ...progress, [questionId]: done };
    setProgress(newProgress); // Optimistic update
    
    try {
      // Find the question to get its title
      const question = questions.find(q => q.id === questionId);
      
      await updateProgress(user.uid, questionId, done, question?.title, 'dsa');
      
      toast({ 
        title: "Progress Saved", 
        description: `${question?.title} marked as ${done ? 'completed' : 'todo'}`,
        variant: "default"
      });
    } catch (error) {
      console.error('Failed to save progress:', error);
      setProgress(progress); // Revert on failure
      toast({ title: "Update Failed", description: "Could not save your progress.", variant: "destructive" });
    }
  };

  const filteredQuestions = useMemo(() =>
    questions.filter(q =>
      q.title.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [questions, searchQuery]
  );
  
  const completedCount = useMemo(() => 
    questions.filter(q => progress[q.id]).length,
    [progress, questions]
  );

  const progressPercentage = questions.length > 0 ? (completedCount / questions.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="p-6 border rounded-lg bg-card space-y-4">
        <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search questions..." />
        <ProgressBar value={progressPercentage} label={`${completedCount} / ${questions.length} completed`} />
      </div>

      <div className="space-y-4">
        {filteredQuestions.map(question => (
          <QuestionItem
            key={question.id}
            question={question}
            isDone={!!progress[question.id]}
            onToggle={handleToggle}
          />
        ))}
      </div>
    </div>
  );
}