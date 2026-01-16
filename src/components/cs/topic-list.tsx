// src/components/cs/topic-list.tsx

"use client";

import { useState, useEffect, useMemo } from 'react'; // useEffect
import { TopicItem } from './topic-item';
import { SearchBar } from '../search-bar';
import { ProgressBar } from '../progress-bar';
import { useAuth } from '@/hooks/use-auth';
import { getProgress, updateProgress } from '@/lib/db';
import type { CsSubject, CsTopic, Progress } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface TopicListProps {
  subject: CsSubject;
  initialTopics: CsTopic[];
  initialProgress: Progress;
}

export function TopicList({ subject, initialTopics, initialProgress }: TopicListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [topics] = useState(initialTopics);
  const [progress, setProgress] = useState<Progress>(initialProgress);

  // --- FIX IS HERE: Re-fetch progress on the client side ---
  useEffect(() => {
    if (user) {
      getProgress(user.uid).then(freshProgress => {
        setProgress(freshProgress);
      });
    } else {
      setProgress({});
    }
  }, [user]);

  const handleToggle = async (topicId: string, done: boolean) => {
    if (!user) { 
      toast({ title: "Login Required", description: "Please login to save progress.", variant: "destructive" });
      return; 
    }
    
    // Check if user is properly authenticated
    if (!user.uid || user.uid.trim() === '') {
      toast({ title: "Authentication Error", description: "Invalid user session. Please login again.", variant: "destructive" });
      return;
    }
    
    const newProgress = { ...progress, [topicId]: done };
    setProgress(newProgress);
    
    try {
      // Find the topic to get its title
      const topic = topics.find(t => t.id === topicId);
      
      await updateProgress(user.uid, topicId, done, topic?.title, 'cs');
      
      toast({ 
        title: "Progress Saved", 
        description: `${topic?.title} marked as ${done ? 'completed' : 'todo'}`,
        variant: "default"
      });
    } catch (error: any) {
      console.error('Failed to save progress:', error);
      setProgress(progress);
      
      let errorMessage = "Could not save progress.";
      if (error.message?.includes('Permission denied')) {
        errorMessage = "Permission error. Please refresh the page and try again.";
      }
      
      toast({ 
        title: "Update Failed", 
        description: errorMessage, 
        variant: "destructive" 
      });
    }
  };

  const filteredTopics = useMemo(() =>
    topics.filter(t =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [topics, searchQuery]
  );
  
  const completedCount = useMemo(() => 
    topics.filter(t => progress[t.id]).length,
    [progress, topics]
  );

  const progressPercentage = topics.length > 0 ? (completedCount / topics.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="p-6 border rounded-lg bg-card space-y-4">
        <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search topics..." />
        <ProgressBar value={progressPercentage} label={`${completedCount} / ${topics.length} completed`} />
      </div>

      <div className="space-y-4">
        {filteredTopics.map(topic => (
          <TopicItem
            key={topic.id}
            topic={topic}
            isDone={!!progress[topic.id]}
            onToggle={handleToggle}
          />
        ))}
      </div>
    </div>
  );
}