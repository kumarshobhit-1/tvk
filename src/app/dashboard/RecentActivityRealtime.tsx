"use client";

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Code, Clock, Database } from 'lucide-react';

type Activity = { id: string; title: string; type: 'dsa' | 'cs'; timestamp: any };

export default function RecentActivityRealtime({ initial = [] }: { userId: string; initial?: Activity[] }) {
  const items = initial || [];

  return (
    <ScrollArea className="max-h-80">
      <div className="space-y-3">
        {items.length > 0 ? (
          items.map((activity) => (
            <div key={activity.id + activity.timestamp} className="flex items-start gap-3 p-3 rounded-lg border bg-card/70">
              {activity.type === 'dsa' ? (
                <Database className="h-5 w-5 text-green-500 mt-0.5" />
              ) : (
                <Code className="h-5 w-5 text-blue-500 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">{activity.title}</p>
                <p className="text-xs text-muted-foreground">{activity.timestamp ? (activity.timestamp.toDate ? activity.timestamp.toDate().toLocaleString() : new Date(activity.timestamp).toLocaleString()) : ''}</p>
              </div>
              <Badge variant={activity.type === 'dsa' ? 'default' : 'secondary'} className="text-xs">{activity.type.toUpperCase()}</Badge>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No recent activity yet.</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
