"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ExamExpiryChecker() {
  const pathname = usePathname();

  useEffect(() => {
    // Run only on active exam attempt pages, not globally on every route.
    const isActiveExamRoute =
      !!pathname &&
      pathname.startsWith("/exam/") &&
      !pathname.startsWith("/exam/result") &&
      !pathname.startsWith("/exam/leaderboard");

    if (!isActiveExamRoute) return;

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
  }, [pathname]);

  return null; // This component doesn't render anything
}
