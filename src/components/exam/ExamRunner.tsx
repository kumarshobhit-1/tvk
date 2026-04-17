"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Timer } from "./Timer";
import { QuestionCard } from "./QuestionCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronLeft, ChevronRight, Send, Flag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ExamAnswer, ExamQuestion } from "@/lib/exam-types";

interface ExamRunnerProps {
  attemptId: string;
  exam: {
    id: string;
    title: string;
    description: string;
    durationMinutes: number;
    totalMarks: number;
    passingMarks: number;
    negativeMarking: number;
    instructions: string[];
  };
  questions: ExamQuestion[];
  startedAt: number;
  expiresAt: number;
}

export function ExamRunner({
  attemptId,
  exam,
  questions,
  startedAt,
  expiresAt,
}: ExamRunnerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<ExamAnswer[]>(
    questions.map((q) => ({
      questionId: q.id,
      selectedOptionId: null,
      isFlagged: false,
      isMarkedForReview: false,
    }))
  );
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const MAX_TAB_SWITCHES = 3;
  const isProcessingTabSwitch = useRef(false);

  // Load saved answers from localStorage
  useEffect(() => {
    const savedAnswers = localStorage.getItem(`exam_${attemptId}`);
    if (savedAnswers) {
      try {
        setAnswers(JSON.parse(savedAnswers));
      } catch (error) {
        console.error("Error loading saved answers:", error);
      }
    }
  }, [attemptId]);

  // Save answers to localStorage
  useEffect(() => {
    localStorage.setItem(`exam_${attemptId}`, JSON.stringify(answers));
  }, [answers, attemptId]);

  // Auto-save to server every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      saveProgressToServer();
    }, 30000);

    return () => clearInterval(interval);
  }, [answers]);

  const saveProgressToServer = async () => {
    try {
      await fetch("/api/exam/save-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, answers }),
      });
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  };

  const handleSelectOption = (optionId: string) => {
    setAnswers((prev) =>
      prev.map((answer, idx) =>
        idx === currentQuestionIndex
          ? { ...answer, selectedOptionId: optionId }
          : answer
      )
    );
  };

  const handleClearAnswer = () => {
    setAnswers((prev) =>
      prev.map((answer, idx) =>
        idx === currentQuestionIndex
          ? { ...answer, selectedOptionId: null }
          : answer
      )
    );
  };

  const handleToggleReview = () => {
    setAnswers((prev) =>
      prev.map((answer, idx) =>
        idx === currentQuestionIndex
          ? { ...answer, isMarkedForReview: !answer.isMarkedForReview }
          : answer
      )
    );
  };

  const handleToggleFlag = () => {
    setAnswers((prev) =>
      prev.map((answer, idx) =>
        idx === currentQuestionIndex
          ? { ...answer, isFlagged: !answer.isFlagged }
          : answer
      )
    );
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/exam/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, answers }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Submit error:", result);
        throw new Error(result.error || "Failed to submit exam");
      }
      
      // Clear localStorage
      localStorage.removeItem(`exam_${attemptId}`);

      // Redirect to result page
      router.push(`/exam/result?attemptId=${attemptId}`);
    } catch (error: any) {
      console.error("Error submitting exam:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit exam. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  }, [attemptId, answers, router, toast, isSubmitting]);

  // Check if exam has been expired/ended by admin every 10 seconds
  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Check if exam result exists (submitted)
        const resultResponse = await fetch(`/api/exam/result?attemptId=${attemptId}`);
        if (resultResponse.ok) {
          // Exam was submitted (either by admin or auto-expired)
          const data = await resultResponse.json();
          toast({
            title: "Exam Ended",
            description: "Your exam has been submitted",
          });
          router.push(`/exam/result?attemptId=${attemptId}`);
          return;
        }

        // Check if exam is emergency stopped
        const examResponse = await fetch(`/api/exam/list?examId=${exam.id}`);
        if (examResponse.ok) {
          const examData = await examResponse.json();
          const currentExam = examData.exams?.[0];
          if (currentExam && (currentExam.emergencyStopped || !currentExam.isActive)) {
            toast({
              title: "Exam Emergency Stopped",
              description: "This exam has been stopped by the administrator. Your progress has been saved.",
              variant: "destructive",
            });
            // Auto-save current progress before redirecting
            await saveProgressToServer();
            router.push(`/exam/${exam.id}`);
            return;
          }
        }
      } catch (error) {
        // Ignore errors - exam is still in progress
      }
    };

    const interval = setInterval(checkStatus, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [attemptId, router, exam.id, toast, saveProgressToServer]);

  // Tab switch detection and prevention
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !isProcessingTabSwitch.current) {
        isProcessingTabSwitch.current = true;
        
        // User switched away from tab
        setTabSwitchCount((prev) => {
          const newCount = prev + 1;
          
          if (newCount >= MAX_TAB_SWITCHES) {
            // Auto-submit exam after max violations
            setTimeout(() => {
              toast({
                title: "Exam Auto-Submitted",
                description: `You switched tabs ${MAX_TAB_SWITCHES} times. Your exam has been submitted automatically.`,
                variant: "destructive",
              });
              handleSubmit();
              isProcessingTabSwitch.current = false;
            }, 0);
          } else {
            // Show warning
            setTimeout(() => {
              setShowTabWarning(true);
              isProcessingTabSwitch.current = false;
            }, 0);
          }
          
          return newCount;
        });
      }
    };

    // Prevent right-click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      setTimeout(() => {
        toast({
          title: "Action Restricted",
          description: "Right-click is disabled during exam",
          variant: "destructive",
        });
      }, 0);
    };

    // Prevent common keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Ctrl+Shift+I (DevTools), Ctrl+U (View Source), F12 (DevTools)
      if (
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.key === 'u') ||
        e.key === 'F12'
      ) {
        e.preventDefault();
        setTimeout(() => {
          toast({
            title: "Action Restricted",
            description: "This action is disabled during exam",
            variant: "destructive",
          });
        }, 0);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleSubmit]);

  const handleTimeExpire = useCallback(() => {
    toast({
      title: "Time's Up!",
      description: "Your exam time has expired. Submitting automatically...",
      variant: "destructive",
    });
    handleSubmit();
  }, [handleSubmit, toast]);

  const answeredCount = answers.filter((a) => a.selectedOptionId !== null).length;
  const flaggedCount = answers.filter((a) => a.isFlagged).length;
  const reviewCount = answers.filter((a) => a.isMarkedForReview).length;
  const progressPercentage = (answeredCount / questions.length) * 100;

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{exam.title}</h1>
              <p className="text-sm text-muted-foreground">
                {answeredCount} / {questions.length} answered
                {flaggedCount > 0 && ` • ${flaggedCount} flagged`}
                {reviewCount > 0 && ` • ${reviewCount} marked for review`}
              </p>
              {tabSwitchCount > 0 && (
                <Badge variant="destructive" className="mt-2">
                  ⚠️ Tab Switch Warnings: {tabSwitchCount}/{MAX_TAB_SWITCHES}
                </Badge>
              )}
            </div>
            <Timer
              startedAt={startedAt}
              durationMinutes={exam.durationMinutes}
              onExpire={handleTimeExpire}
            />
          </div>
          <Progress value={progressPercentage} className="mt-4" />
        </div>
      </div>

      {/* Main Content - Side by Side Layout */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Question Section - Left Side */}
          <div className="flex-1 max-w-4xl">
            <QuestionCard
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={questions.length}
              selectedOptionId={currentAnswer.selectedOptionId}
              isFlagged={currentAnswer.isFlagged}
              isMarkedForReview={currentAnswer.isMarkedForReview}
              onSelectOption={handleSelectOption}
              onToggleFlag={handleToggleFlag}
              onClearAnswer={handleClearAnswer}
              onToggleReview={handleToggleReview}
            />

            {/* Navigation */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
              <Button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                variant="outline"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {currentQuestionIndex + 1} of {questions.length}
                </Badge>
              </div>

              {currentQuestionIndex < questions.length - 1 ? (
                <Button onClick={handleNext}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={() => setShowSubmitDialog(true)}>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Exam
                </Button>
              )}
            </div>
          </div>

          {/* Question Navigation Grid - Right Side */}
          <div className="lg:w-80 lg:sticky lg:top-24 h-fit">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-4">Question Navigation</h3>
              
              {/* Grid and Legend Side by Side */}
              <div className="flex gap-3 mb-4">
                {/* Grid */}
                <div className="grid grid-cols-5 gap-2 flex-1">
                  {questions.map((_, idx) => {
                    const answer = answers[idx];
                    const isAnswered = answer.selectedOptionId !== null;
                    const isFlagged = answer.isFlagged;
                    const isMarkedForReview = answer.isMarkedForReview;
                    const isCurrent = idx === currentQuestionIndex;

                    return (
                      <button
                        key={idx}
                        onClick={() => setCurrentQuestionIndex(idx)}
                        className={`
                          relative aspect-square rounded-lg border-2 font-semibold text-xs
                          transition-all hover:scale-105
                          ${isCurrent ? "border-primary bg-primary text-primary-foreground" : ""}
                          ${!isCurrent && isMarkedForReview ? "border-purple-500 bg-purple-50 dark:bg-purple-950" : ""}
                          ${!isCurrent && !isMarkedForReview && isAnswered ? "border-green-500 bg-green-50 dark:bg-green-950" : ""}
                          ${!isCurrent && !isMarkedForReview && !isAnswered ? "border-muted-foreground bg-background" : ""}
                        `}
                      >
                        {idx + 1}
                        {isFlagged && (
                          <Flag className="h-2.5 w-2.5 absolute -top-1 -right-1 fill-yellow-500 text-yellow-500" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Legend on Right */}
                <div className="flex flex-col justify-center gap-3 text-[10px] min-w-fit">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-5 h-5 rounded border-2 border-green-500 bg-green-50 dark:bg-green-950"></div>
                    <span className="text-center leading-tight">Answered</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-5 h-5 rounded border-2 border-purple-500 bg-purple-50 dark:bg-purple-950"></div>
                    <span className="text-center leading-tight">Marked</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-5 h-5 rounded border-2 border-muted-foreground bg-background"></div>
                    <span className="text-center leading-tight">Not Ans</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-5 h-5 rounded border-2 border-primary bg-primary"></div>
                    <span className="text-center leading-tight">Current</span>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="mt-4 pt-4 border-t space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Answered:</span>
                  <span className="font-semibold">{answeredCount}/{questions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Not Answered:</span>
                  <span className="font-semibold">{questions.length - answeredCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Marked for Review:</span>
                  <span className="font-semibold">{reviewCount}</span>
                </div>
                {flaggedCount > 0 && (
                  <div className="flex justify-between">
                    <span>Flagged:</span>
                    <span className="font-semibold">{flaggedCount}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Exam?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>Are you sure you want to submit your exam?</p>
                <div className="space-y-1 text-sm">
                  <p>• Answered: {answeredCount} / {questions.length}</p>
                  <p>• Unanswered: {questions.length - answeredCount}</p>
                  {reviewCount > 0 && <p>• Marked for review: {reviewCount}</p>}
                  {flaggedCount > 0 && <p>• Flagged: {flaggedCount}</p>}
                </div>
                <p className="font-semibold text-red-600 dark:text-red-400">
                  Once submitted, you cannot change your answers.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Review Again</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Exam"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Tab Switch Warning Dialog */}
      <AlertDialog open={showTabWarning} onOpenChange={setShowTabWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 dark:text-red-400">
              ⚠️ Tab Switch Detected!
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p className="font-semibold">
                  You have switched away from the exam tab.
                </p>
                <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    <strong>Warning {tabSwitchCount}/{MAX_TAB_SWITCHES}:</strong> Opening new tabs or switching windows is not allowed during the exam.
                  </p>
                </div>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Stay on this tab throughout the exam</li>
                  <li>Do not open any other tabs or windows</li>
                  <li>After {MAX_TAB_SWITCHES} violations, your exam will be auto-submitted</li>
                </ul>
                {tabSwitchCount === MAX_TAB_SWITCHES - 1 && (
                  <p className="font-bold text-red-600 dark:text-red-400">
                    🚨 FINAL WARNING: One more violation will submit your exam automatically!
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowTabWarning(false)} className="bg-red-600 hover:bg-red-700">
              I Understand, Continue Exam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
