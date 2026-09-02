'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface StatsData {
  activeUsersCount: number | string;
  premiumUsersCount: number | string;
  activeLearners: number | string;
  successRate: number;
  timestamp?: string;
  queryTime?: number;
}

export function RealtimeStats() {
  const getCached = (): StatsData | null => {
    try {
      const raw = localStorage.getItem('realtimeStats');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  };

  const cached = typeof window !== 'undefined' ? getCached() : null;

    const [stats, setStats] = useState<StatsData>(
      cached || { activeUsersCount: '-', premiumUsersCount: '-', activeLearners: '-', successRate: 0 }
    );
    // Always show the loading skeleton until the first live fetch completes
    const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const mountedRef = { current: true } as { current: boolean };

  const fetchStats = async (manual = false) => {
    if (manual) {
      setRefreshing(true);
      setError(null);
    }

    // Abort fetch after 5 seconds to avoid long hangs
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const url = manual ? `/api/platform/stats?refresh=true&t=${Date.now()}` : `/api/platform/stats?t=${Date.now()}`;

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        cache: 'no-store',
      });

      if (!response.ok) throw new Error(`Status ${response.status}`);

      const data = await response.json();
      if (mountedRef.current) {
        setStats(data);
        setLastUpdated(new Date().toISOString());
        setError(null);
      }

      // Cache latest successful result for quick fallback
      try {
        const toCache = { ...data, timestamp: new Date().toISOString() };
        localStorage.setItem('realtimeStats', JSON.stringify(toCache));
      } catch (e) {
        // ignore localStorage failures
      }
    } catch (err: any) {
      // If the request was aborted due to the short timeout, retry once with a longer timeout
      if (err && err.name === 'AbortError') {
        try {
          // second attempt with longer timeout
          const controller2 = new AbortController();
          const timeout2 = setTimeout(() => controller2.abort(), 10000);
          const resp2 = await fetch(url, {
            signal: controller2.signal,
            cache: 'no-store',
          });

          clearTimeout(timeout2);

          if (!resp2.ok) throw new Error(`Status ${resp2.status}`);

          const data2 = await resp2.json();
          if (mountedRef.current) {
            setStats(data2);
            setLastUpdated(new Date().toISOString());
            setError(null);
          }

          try { localStorage.setItem('realtimeStats', JSON.stringify({ ...data2, timestamp: new Date().toISOString() })); } catch(e){}
        } catch (err2: any) {
          if (mountedRef.current) setError('Live data timed out. Showing latest available numbers.');
          // don't re-log AbortError from retry to avoid dev overlay spam
          if (!(err2 && err2.name === 'AbortError')) console.error('Failed to fetch real-time stats (retry):', err2);
        }
      } else {
        if (mountedRef.current) setError('Unable to fetch live stats. Showing latest available numbers.');
        console.error('Failed to fetch real-time stats:', err);
      }
    } finally {
      clearTimeout(timeout);
      setLoading(false);
      if (manual) setRefreshing(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    // Initial fetch
    fetchStats();

    // Refresh less often because the API already has a 10 minute server cache.
    // Also avoid polling while the tab is hidden.
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchStats();
      }
    }, 5 * 60 * 1000);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
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
      {error && (
        <div className='text-center text-sm text-amber-700 mb-2'>
          {error} <button className='underline ml-2' onClick={() => fetchStats(true)}>Retry</button>
        </div>
      )}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
        <Card className='border-2 text-center p-6 hover:shadow-lg transition-shadow'>
          <CardContent className='p-0'>
            <div className='text-3xl font-bold text-primary mb-2'>{stats.activeUsersCount}</div>
            <div className='text-sm text-muted-foreground'>Active Users</div>
            <div className='text-xs text-muted-foreground mt-1'>Logged in & Visited</div>
          </CardContent>
        </Card>
        <Card className='border-2 text-center p-6 hover:shadow-lg transition-shadow'>
          <CardContent className='p-0'>
            <div className='text-3xl font-bold text-green-600 mb-2'>{stats.premiumUsersCount}</div>
            <div className='text-sm text-muted-foreground'>Premium Users</div>
            <div className='text-xs text-muted-foreground mt-1'>Live premium access</div>
          </CardContent>
        </Card>
        <Card className='border-2 text-center p-6 hover:shadow-lg transition-shadow'>
          <CardContent className='p-0'>
            <div className='text-3xl font-bold text-blue-600 mb-2'>{stats.activeLearners}</div>
            <div className='text-sm text-muted-foreground'>Unique Exam Takers</div>
            <div className='text-xs text-muted-foreground mt-1'>🔴 Live from submitted exams</div>
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
      <div className='flex items-center justify-between text-sm text-muted-foreground mt-2'>
        <div>
          {lastUpdated ? `Last updated: ${new Date(lastUpdated).toLocaleString()}` : ''}
        </div>
        <div>
          <button className='text-sm underline' onClick={() => fetchStats(true)} disabled={refreshing}>{refreshing ? 'Refreshing...' : 'Refresh'}</button>
        </div>
      </div>
    </div>
  );
}