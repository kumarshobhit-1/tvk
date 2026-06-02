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

  // Add minimum delay to show loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 500); // Show loading for at least 500ms
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.title = "Start Exam | The Victory Key";
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

    // Delegate to the real starter
    handleStartExam();
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
      <div className="max-w-3xl mx-auto">
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
    </div>
  );
}
