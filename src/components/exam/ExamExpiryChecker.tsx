"use client";

import { useEffect } from "react";

export function ExamExpiryChecker() {
  useEffect(() => {
    // Check for expired exams every 2 minutes
    const checkExpired = async () => {
      try {
        await fetch("/api/exam/check-expired", {
          method: "POST",
        });
      } catch (error) {
        console.error("Error checking expired exams:", error);
      }
    };

    // Run immediately on mount
    checkExpired();

    // Then run every 2 minutes
    const interval = setInterval(checkExpired, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return null; // This component doesn't render anything
}
