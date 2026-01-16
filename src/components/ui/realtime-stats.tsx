'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface StatsData {
  dsaCount: number | string;
  csCount: number | string;
  activeLearners: number | string;
  successRate: number;
  timestamp?: string;
  queryTime?: number;
}

export function RealtimeStats() {
  const [stats, setStats] = useState<StatsData>({
    dsaCount: '500+',
    csCount: '50+',
    activeLearners: '1000+',
    successRate: 95
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      // Add random query param to prevent caching
      const randomParam = Math.random().toString(36).substring(7);
      const response = await fetch(`/api/platform/stats?_=${randomParam}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch real-time stats:', error);
    } finally {
      setLoading(false);
      if (manual) setRefreshing(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchStats();

    // Set up interval to fetch stats every 15 seconds for faster updates
    const interval = setInterval(() => fetchStats(), 15000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className='border-2 text-center p-6'>
            <CardContent className='p-0'>
              <div className='text-3xl font-bold text-muted-foreground mb-2 animate-pulse'>...</div>
              <div className='text-sm text-muted-foreground'>Loading...</div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
        <Card className='border-2 text-center p-6 hover:shadow-lg transition-shadow'>
          <CardContent className='p-0'>
            <div className='text-3xl font-bold text-primary mb-2'>{stats.dsaCount}</div>
            <div className='text-sm text-muted-foreground'>DSA Problems</div>
            <div className='text-xs text-muted-foreground mt-1'>Curated & Quality Checked</div>
          </CardContent>
        </Card>
        <Card className='border-2 text-center p-6 hover:shadow-lg transition-shadow'>
          <CardContent className='p-0'>
            <div className='text-3xl font-bold text-green-600 mb-2'>{stats.csCount}</div>
            <div className='text-sm text-muted-foreground'>CS Topics</div>
            <div className='text-xs text-muted-foreground mt-1'>Industry Relevant</div>
          </CardContent>
        </Card>
        <Card className='border-2 text-center p-6 hover:shadow-lg transition-shadow'>
          <CardContent className='p-0'>
            <div className='text-3xl font-bold text-blue-600 mb-2'>{stats.activeLearners}</div>
            <div className='text-sm text-muted-foreground'>Active Learners</div>
            <div className='text-xs text-muted-foreground mt-1'>🔴 Live Count</div>
          </CardContent>
        </Card>
        <Card className='border-2 text-center p-6 hover:shadow-lg transition-shadow'>
          <CardContent className='p-0'>
            <div className='text-3xl font-bold text-purple-600 mb-2'>{stats.successRate}%</div>
            <div className='text-sm text-muted-foreground'>Success Rate</div>
            <div className='text-xs text-muted-foreground mt-1'>Real Exam Results</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}