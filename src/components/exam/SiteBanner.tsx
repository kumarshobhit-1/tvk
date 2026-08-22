"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getUserDocCached } from "@/lib/user-cache";
import { Megaphone, X, ArrowRight } from "lucide-react";
import Link from "next/link";
import { hasPremiumAccess } from "@/lib/premium-access";

export default function SiteBanner() {
  const { user } = useAuth();
  const [latestExams, setLatestExams] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [visibleBanner, setVisibleBanner] = useState<any>(null);

  // Load latest exams config
  useEffect(() => {
    async function fetchLatest() {
      try {
        const res = await fetch("/api/exam/latest-release");
        if (res.ok) {
          const data = await res.json();
          setLatestExams(data?.categories || {});
        }
      } catch (err) {
        console.error("Failed to load latest release banner info:", err);
      }
    }
    fetchLatest();

    // Load dismissed list from localStorage
    try {
      const stored = localStorage.getItem("tvk_dismissed_latest_exams");
      if (stored) {
        setDismissed(JSON.parse(stored));
      }
    } catch {}
  }, []);

  // Load user data if logged in
  useEffect(() => {
    const uid = user?.uid;
    if (!uid) {
      setUserData(null);
      return;
    }
    async function fetchUser() {
      try {
        const data = await getUserDocCached(uid as string);
        setUserData(data);
      } catch (err) {
        console.error("Failed to load user cache for banner:", err);
      }
    }
    fetchUser();
  }, [user]);

  // Compute which banner to show
  useEffect(() => {
    if (!latestExams) return;

    const categories = Object.keys(latestExams);
    if (categories.length === 0) {
      setVisibleBanner(null);
      return;
    }

    // Find the latest globally published exam
    let globalLatest: any = null;
    let globalLatestTime = 0;

    for (const cat of categories) {
      const exam = latestExams[cat];
      const pubTime = new Date(exam.publishedAt).getTime();
      if (pubTime > globalLatestTime) {
        globalLatestTime = pubTime;
        globalLatest = exam;
      }
    }

    if (!globalLatest) {
      setVisibleBanner(null);
      return;
    }

    // Check if user already dismissed it
    if (dismissed.includes(globalLatest.examId)) {
      setVisibleBanner(null);
      return;
    }

    // Determine user status
    const hasCategoryPremium = hasPremiumAccess(userData, globalLatest.category);

    const isLocked = globalLatest.isLocked === true;
    const isPremium = globalLatest.isPremium === true;

    let bannerType = "free"; // Default if exam is unlocked
    let actionText = "Start Exam";
    let actionLink = `/exam/${globalLatest.examId}`;
    let message = `New exam "${globalLatest.title}" is live under ${globalLatest.category}!`;

    if (isLocked) {
      bannerType = "admin_locked";
      message = `New exam "${globalLatest.title}" under ${globalLatest.category} is locked by administrator.`;
      actionText = "Locked";
      actionLink = "#";
    } else if (isPremium) {
      if (user) {
        if (hasCategoryPremium) {
          bannerType = "premium_unlocked";
          message = `New Premium exam "${globalLatest.title}" is unlocked for your ${globalLatest.category} prep!`;
        } else {
          bannerType = "premium_locked";
          message = `New Premium exam "${globalLatest.title}" is live under ${globalLatest.category}. Upgrade to attempt.`;
          actionText = "Get Premium Access";
          actionLink = "/contact";
        }
      } else {
        bannerType = "visitor_locked";
        message = `New Premium exam "${globalLatest.title}" is live under ${globalLatest.category}! Log in to attempt.`;
        actionText = "Log In";
        actionLink = "/login";
      }
    } else {
      if (!user) {
        bannerType = "visitor_free";
        message = `New exam "${globalLatest.title}" is live under ${globalLatest.category}! Log in to attempt.`;
        actionText = "Log In";
        actionLink = "/login";
      }
    }

    setVisibleBanner({
      examId: globalLatest.examId,
      title: globalLatest.title,
      category: globalLatest.category,
      type: bannerType,
      message,
      actionText,
      actionLink,
    });
  }, [latestExams, userData, dismissed, user]);

  const handleDismiss = () => {
    if (!visibleBanner) return;
    const nextDismissed = [...dismissed, visibleBanner.examId];
    setDismissed(nextDismissed);
    try {
      localStorage.setItem("tvk_dismissed_latest_exams", JSON.stringify(nextDismissed));
    } catch {}
  };

  if (!visibleBanner) return null;

  const isPremiumUnlocked = visibleBanner.type === "premium_unlocked";
  const isPremiumLocked = visibleBanner.type === "premium_locked" || visibleBanner.type === "visitor_locked";
  const isAdminLocked = visibleBanner.type === "admin_locked";

  return (
    <div className="relative w-full bg-gradient-to-r from-violet-600/90 via-indigo-600/90 to-blue-600/90 dark:from-violet-950/80 dark:via-indigo-950/80 dark:to-blue-950/80 text-white border-b border-indigo-500/20 backdrop-blur-md">
      <div className="container mx-auto px-4 py-2.5 flex items-center justify-between gap-4 text-xs sm:text-sm font-medium">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="bg-white/20 p-1.5 rounded-md hidden sm:block shrink-0">
            <Megaphone className="h-4 w-4 text-white" />
          </div>
          <span className="truncate">
            {isAdminLocked && (
              <span className="bg-red-500 text-white px-1.5 py-0.5 rounded text-[10px] font-bold mr-2 uppercase shrink-0">
                Locked
              </span>
            )}
            {isPremiumLocked && !isAdminLocked && (
              <span className="bg-yellow-400 text-black px-1.5 py-0.5 rounded text-[10px] font-bold mr-2 uppercase shrink-0">
                Premium
              </span>
            )}
            {!isPremiumLocked && !isAdminLocked && (
              <span className="bg-green-500 text-white px-1.5 py-0.5 rounded text-[10px] font-bold mr-2 uppercase shrink-0 animate-pulse">
                New
              </span>
            )}
            {visibleBanner.message}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {isAdminLocked ? (
            <span className="bg-white/30 text-white/70 cursor-not-allowed px-3 py-1 rounded-md text-xs font-bold transition-all shadow-sm">
              {visibleBanner.actionText}
            </span>
          ) : (
            <Link
              href={visibleBanner.actionLink}
              onClick={() => {
                handleDismiss();
              }}
              className="bg-white text-indigo-900 hover:bg-white/90 px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
            >
              {visibleBanner.actionText}
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
          <button
            onClick={handleDismiss}
            className="hover:bg-white/20 p-1 rounded transition-colors text-white/80 hover:text-white"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
