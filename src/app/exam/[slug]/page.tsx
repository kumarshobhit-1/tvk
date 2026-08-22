"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { authenticatedFetch } from "@/lib/api-client";
import { ExamRunner } from "@/components/exam/ExamRunner";
import { ExamRunnerWithSections } from "@/components/exam/ExamRunnerWithSections";
import { ExamInstructionsWithSections } from "@/components/exam/ExamInstructionsWithSections";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Loading from "@/components/ui/loading";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ExamPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.slug as string;
  const { user, loading: authLoading } = useRequireAuth();
  
  const [examData, setExamData] = useState<any>(null);
  const [examInfo, setExamInfo] = useState<any>(null);
  const [examStatus, setExamStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const [agreedToInstructions, setAgreedToInstructions] = useState(false);
  const [showLoading, setShowLoading] = useState(true);
  const [showFullscreenDialog, setShowFullscreenDialog] = useState(false);
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);

  // Add minimum delay to show loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 500); // Show loading for at least 500ms
    
    return () => clearTimeout(timer);
  }, []);

  // Dismiss site banner when accessing the exam page (instructions/runner)
  useEffect(() => {
    if (!examId) return;
    try {
      const stored = localStorage.getItem("tvk_dismissed_latest_exams");
      const dismissed = stored ? JSON.parse(stored) : [];
      if (!dismissed.includes(examId)) {
        dismissed.push(examId);
        localStorage.setItem("tvk_dismissed_latest_exams", JSON.stringify(dismissed));
      }
    } catch (err) {
      console.error("Failed to dismiss banner via localStorage:", err);
    }
  }, [examId]);

  useEffect(() => {
    document.title = "Start Exam | The Victory Key";
  }, []);

  // Disable right-click and developer tools shortcuts on instructions page
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'J') ||
        (e.ctrlKey && e.shiftKey && e.key === 'C') ||
        (e.ctrlKey && e.key === 'u') ||
        (e.ctrlKey && e.key === 's') ||
        e.key === 'F12'
      ) {
        e.preventDefault();
      }
    };

    // Periodically clear console to disable manual debugger scripting
    const consoleClearInterval = setInterval(() => {
      console.clear();
    }, 1000);

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      clearInterval(consoleClearInterval);
    };
  }, []);

  // Developer Tools detection hook (docked and undocked without pausing in debugger)
  // Developer Tools detection hook (highly secure, zoom-safe, and device-emulation compatible)
  // Developer Tools detection hook (highly secure, zoom-safe, and device-emulation compatible)
  useEffect(() => {
    const threshold = 160;

    const detectDevTools = () => {
      // 1. Check for Chrome Device Emulation (Mobile UserAgent on Desktop Platform)
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || "");
      const isDesktopPlatform = /Win32|Win64|MacIntel|Linux x86_64/i.test(navigator.platform || "");
      
      if (isMobileUA && isDesktopPlatform) {
        setIsDevToolsOpen(true);
        return;
      }

      // 2. Standard Dimension Check (Handles Docked DevTools at any zoom level on desktop)
      const zoomFactor = window.devicePixelRatio || 1;
      const correctedInnerWidth = window.innerWidth * zoomFactor;
      const correctedInnerHeight = window.innerHeight * zoomFactor;

      const widthDev = window.outerWidth - correctedInnerWidth > threshold;
      const heightDev = window.outerHeight - correctedInnerHeight > threshold;

      if (widthDev || heightDev) {
        setIsDevToolsOpen(true);
      } else {
        setIsDevToolsOpen(false);
      }
    };

    const detectorInterval = setInterval(detectDevTools, 1000);
    window.addEventListener("resize", detectDevTools);

    return () => {
      clearInterval(detectorInterval);
      window.removeEventListener("resize", detectDevTools);
    };
  }, []);

  useEffect(() => {
    if (!examId || !user) return;

    const fetchExamData = async () => {
      try {
        // Fetch exam info
        const infoResponse = await authenticatedFetch(`/api/exam/list?examId=${examId}&noCache=1`, { cache: "no-store" });
        if (infoResponse.ok) {
          const data = await infoResponse.json();
          setExamInfo(data.exams?.[0]);
        }

        // Fetch exam status
        const statusResponse = await fetch(`/api/exam/status?examId=${examId}`, { cache: "no-store" });
        if (statusResponse.ok) {
          const status = await statusResponse.json();
          setExamStatus(status);
        }
      } catch (err) {
        console.error("Error fetching exam data:", err);
      }
    };

    fetchExamData();
    
    // Refresh exam data less aggressively; the intro screen does not need 10-second updates.
    const interval = setInterval(fetchExamData, 30000);
    
    return () => clearInterval(interval);
  }, [examId, user]);

  const handleStartExam = async () => {
    // Check for blocking conditions before attempting to start
    // Priority 1: Premium requirement
    if (examInfo?.isPremium && examStatus && examStatus.canAttemptPremium === false) {
      setError("Premium access required to attempt this exam.");
      return;
    }

    // Priority 2: Lock state (after premium check)
    if (examInfo?.isLocked || examStatus?.isLocked) {
      setError("This exam is locked by the administrator.");
      return;
    }

    // Priority 3: Attempt limit
    if (examStatus && examStatus.attemptCount >= 5) {
      setError("You have exhausted all 5 attempts for this exam.");
      return;
    }

    // Priority 4: Emergency stop
    if (examInfo && (examInfo.emergencyStopped || !examInfo.isActive)) {
      setError("This exam has been temporarily stopped by the administrator. Please try again later.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/exam/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if it's an emergency stop error
        if (data.emergencyStopped) {
          setError("This exam has been temporarily stopped by the administrator. Please try again later.");
          // Refresh exam info to show the latest status
          const infoResponse = await authenticatedFetch(`/api/exam/list?examId=${examId}&noCache=1`, { cache: "no-store" });
          if (infoResponse.ok) {
            const refreshedData = await infoResponse.json();
            setExamInfo(refreshedData.exams?.[0]);
          }
          return;
        }
        setError(data.error || "Failed to start exam");
        return;
      }

      setExamData(data);
      setHasStarted(true);
    } catch (err: any) {
      console.error("Error starting exam:", err);
      setError(err.message || "Failed to start exam");
    } finally {
      setLoading(false);
    }
  };

  const attemptStartWithAgreement = () => {
    // Require the user to agree to instructions before starting via the extra "Attempt Again" buttons.
    if (!agreedToInstructions) {
      setError("Please agree to the exam instructions before starting the attempt. Tick the checkbox");
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    // Bypass fullscreen dialog check for real mobile devices (tablets and phones)
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || "");
    const isDesktopPlatform = /Win32|Win64|MacIntel|Linux x86_64/i.test(navigator.platform || "");
    const isIOSDesktopMode = typeof navigator !== "undefined" && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    const isSmallScreen = typeof window !== "undefined" && window.screen && window.screen.width < 1024 && window.screen.height < 1024;
    const isRealMobile = (isMobileUA && !isDesktopPlatform) || isIOSDesktopMode || isSmallScreen;

    if (isRealMobile) {
      handleStartExam();
    } else {
      setShowFullscreenDialog(true);
    }
  };

  if (authLoading || showLoading) {
    return <Loading />;
  }

  if (!user) {
    return null;
  }

  if (hasStarted && examData) {
    const hasSections = examData.sections && examData.sections.length > 0;
    
    if (hasSections) {
      return (
        <ExamRunnerWithSections
          attemptId={examData.attemptId}
          exam={examData.exam}
          sections={examData.sections}
          startedAt={examData.startedAt}
        />
      );
    }

    return (
      <ExamRunner
        attemptId={examData.attemptId}
        exam={examData.exam}
        questions={examData.questions}
        startedAt={examData.startedAt}
        expiresAt={examData.expiresAt}
      />
    );
  }

  // Show exam instructions before starting
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <Button
          variant="outline"
          onClick={() => {
            if (examInfo?.category) {
              router.push(`/exam/category/${String(examInfo.category || "").toLowerCase().replace(/\s+/g, "-")}`);
            } else {
              router.push("/exam");
            }
          }}
          className="mb-4"
        >
          ← Back to Exams
        </Button>

        <div className="bg-white dark:bg-slate-950 border-2 border-gray-300 rounded-lg">
          <div className="px-4 pt-4">
            <ExamInstructionsWithSections
              examInfo={examInfo}
              sections={examInfo?.sections}
              onStart={attemptStartWithAgreement}
              loading={loading}
              agreedToInstructions={agreedToInstructions}
              onAgreedChange={(v: boolean) => setAgreedToInstructions(v)}
              disabled={
                (examInfo?.isPremium && examStatus && examStatus.canAttemptPremium === false) ||
                examInfo?.isLocked ||
                examStatus?.isLocked ||
                (examStatus && examStatus.attemptCount >= 5) ||
                (examInfo && (examInfo.emergencyStopped || !examInfo.isActive))
              }
            />
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-50 dark:bg-red-950 border-t border-red-200 dark:border-red-800">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <div className="space-y-2 px-4 pb-4">
            {examInfo?.isPremium && examStatus && examStatus.canAttemptPremium === false ? (
              <>
                <div className="w-full p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md text-center mb-2">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Premium access required for {examInfo?.category || "this course"}
                  </p>
                </div>
                <Button
                  disabled
                  className="w-full"
                  size="lg"
                  variant="outline"
                >
                  Premium Only
                </Button>
              </>
            ) : examInfo?.isLocked || examStatus?.isLocked ? (
              <>
                <div className="w-full p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md text-center mb-2">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    🔒 Exam locked by administrator
                  </p>
                </div>
                <Button
                  disabled
                  className="w-full"
                  size="lg"
                  variant="outline"
                >
                  Locked
                </Button>
              </>
            ) : examStatus && examStatus.attemptCount >= 5 ? (
              <>
                <div className="w-full p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md text-center mb-2">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    ❌ Maximum attempt limit reached (5/5)
                  </p>
                </div>
                <Button
                  onClick={() => router.push(`/exam/result?attemptId=${examStatus.lastAttemptId}`)}
                  className="w-full"
                  size="lg"
                  variant="outline"
                >
                  View Last Attempt
                </Button>
              </>
            ) : examStatus?.hasPassed ? (
              <>
                <div className="w-full p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md text-center mb-2">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    ✅ You have already passed this exam! You can still attempt again until 5 total attempts.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    onClick={() => attemptStartWithAgreement()}
                    className="w-full"
                    size="lg"
                  >
                    Attempt Again
                  </Button>
                  <Button
                    onClick={() => router.push(`/exam/result?attemptId=${examStatus.lastAttemptId}`)}
                    className="w-full"
                    size="lg"
                    variant="outline"
                  >
                    Review Last Attempt
                  </Button>
                </div>
              </>
              ) : examInfo && (examInfo.emergencyStopped || !examInfo.isActive) ? (
              <>
                <div className="w-full p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md text-center mb-2">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    🛑 Exam temporarily stopped by administrator
                  </p>
                </div>
                <Button
                  disabled
                  className="w-full"
                  size="lg"
                  variant="outline"
                >
                  Exam Unavailable
                </Button>
              </>
            ) : examStatus && examStatus.attemptCount > 0 ? (
              <>
                <div className="w-full p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md text-center mb-2">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    📝 Attempt {examStatus.attemptCount + 1} of 5
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    onClick={() => attemptStartWithAgreement()}
                    className="w-full"
                    size="lg"
                  >
                    Attempt Again
                  </Button>
                  <Button
                    onClick={() => router.push(`/exam/result?attemptId=${examStatus.lastAttemptId}`)}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    Review Last Attempt
                  </Button>
                </div>
              </>
            ) : (
              <></>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showFullscreenDialog} onOpenChange={setShowFullscreenDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl border p-6 shadow-2xl">
          <DialogHeader className="space-y-3 text-left">
            <DialogTitle className="text-2xl font-bold tracking-tight">
              Full Screen Mode Required
            </DialogTitle>
            <DialogDescription asChild>
              <div className="text-sm leading-relaxed text-muted-foreground">
                To attempt this exam, the browser must enter full screen mode (F11 style). 
                <br /><br />
                <strong>Important Rules:</strong>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Back navigation is completely disabled during the exam.</li>
                  <li>Exiting full screen mode at any point during the exam will <strong>automatically submit</strong> your exam immediately.</li>
                </ul>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => setShowFullscreenDialog(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                setShowFullscreenDialog(false);
                try {
                  const element = document.documentElement;
                  if (element.requestFullscreen) {
                    await element.requestFullscreen();
                  } else if ((element as any).webkitRequestFullscreen) {
                    await (element as any).webkitRequestFullscreen();
                  } else if ((element as any).mozRequestFullScreen) {
                    await (element as any).mozRequestFullScreen();
                  } else if ((element as any).msRequestFullscreen) {
                    await (element as any).msRequestFullscreen();
                  }
                } catch (err) {
                  console.error("Fullscreen error:", err);
                }
                handleStartExam();
              }}
              className="w-full sm:w-auto font-bold bg-primary hover:bg-primary/95 text-white"
            >
              Enter Full Screen & Start
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isDevToolsOpen && (
        <div className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-background text-foreground p-6">
          <div className="text-center space-y-4 max-w-md">
            <h2 className="text-3xl font-extrabold text-red-600 dark:text-red-400">
              ⚠️ Developer Tools Detected
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              To start the exam, you must close all Developer Tools (Inspect, Console). 
              Please close them and reload the page or click focus to proceed.
            </p>
            <div className="pt-4">
              <Button onClick={() => window.location.reload()} size="lg" className="font-bold">
                Check Again (Reload)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
