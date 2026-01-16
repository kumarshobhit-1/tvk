"use client";

import { useEffect, useState } from "react";
import { Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimerProps {
  startedAt: number; // timestamp in milliseconds
  durationMinutes: number;
  onExpire: () => void;
  className?: string;
}

export function Timer({ startedAt, durationMinutes, onExpire, className }: TimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [hasExpired, setHasExpired] = useState(false);

  useEffect(() => {
    const calculateRemaining = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - startedAt) / 1000);
      const total = durationMinutes * 60;
      const remaining = Math.max(0, total - elapsed);
      return remaining;
    };

    // Initial calculation
    const remaining = calculateRemaining();
    setRemainingSeconds(remaining);

    if (remaining === 0 && !hasExpired) {
      setHasExpired(true);
      onExpire();
      return;
    }

    // Update every second
    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setRemainingSeconds(remaining);

      if (remaining === 0 && !hasExpired) {
        setHasExpired(true);
        onExpire();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt, durationMinutes, onExpire, hasExpired]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isWarning = remainingSeconds <= 60 && remainingSeconds > 0;
  const isCritical = remainingSeconds <= 10 && remainingSeconds > 0;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-semibold transition-colors",
        isCritical
          ? "bg-red-500 text-white animate-pulse"
          : isWarning
          ? "bg-yellow-500 text-black"
          : "bg-primary text-primary-foreground",
        className
      )}
    >
      {isWarning ? <AlertCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
      <span>{formatTime(remainingSeconds)}</span>
    </div>
  );
}
