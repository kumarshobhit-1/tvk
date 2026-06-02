"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { authenticatedFetch } from "@/lib/api-client";
import { Timer } from "./Timer";
import { QuestionCard } from "./QuestionCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ChevronLeft, ChevronRight, Send, Flag, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ExamAnswer, ExamQuestion } from "@/lib/exam-types";

interface Section {
  id: string;
  title: string;
  durationMinutes: number;
  questions: ExamQuestion[];
}

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
  questions?: ExamQuestion[];
  sections?: Section[];
  startedAt: number;
}

export function ExamRunnerWithSections({
  attemptId,
  exam,
  questions: initialQuestions = [],
  sections: initialSections,
  startedAt,
}: ExamRunnerProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Handle sections
  const hasSections = initialSections && initialSections.length > 0;
  const sections = hasSections ? initialSections : (initialQuestions.length > 0 ? [{ id: 's1', title: 'Section 1', durationMinutes: exam.durationMinutes, questions: initialQuestions }] : []);
  const questions = hasSections ? sections.flatMap(s => s.questions) : initialQuestions;

  // Section-based state
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [sectionStartTimes, setSectionStartTimes] = useState<Record<string, number>>({ [sections[0]?.id || 's1']: startedAt });
  const [sectionTimerExpired, setSectionTimerExpired] = useState<string | null>(null);
  const [sectionsCompleted, setSectionsCompleted] = useState<Set<string>>(new Set());
  const [showSectionSummary, setShowSectionSummary] = useState(false);
  const [isAutoAdvancingSection, setIsAutoAdvancingSection] = useState(false);
  const [examCompleted, setExamCompleted] = useState(false);

  // Question state
  const [currentQuestionInSection, setCurrentQuestionInSection] = useState(0);
  const [visitedQuestionIds, setVisitedQuestionIds] = useState<Set<string>>(new Set());
  const [answers, setAnswers] = useState<ExamAnswer[]>(
    questions.map((q) => ({
      questionId: q.id,
      selectedOptionId: null,
      isFlagged: false,
      isMarkedForReview: false,
    }))
  );

  // UI state
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const MAX_TAB_SWITCHES = 3;
  const isProcessingTabSwitch = useRef(false);
  const hasSubmittedExam = useRef(false);
  const answersRef = useRef<ExamAnswer[]>([]);
  const lastSavedSerializedRef = useRef<string>("");

  const updateAnswers = useCallback(
    (updater: ExamAnswer[] | ((prev: ExamAnswer[]) => ExamAnswer[])) => {
      const next = typeof updater === "function" ? updater(answersRef.current) : updater;
      answersRef.current = next;
      setAnswers(next);
    },
    []
  );

  const currentSection = sections[currentSectionIndex];
  const currentSectionQuestions = currentSection?.questions || [];

  // Load saved answers from localStorage
  useEffect(() => {
    const savedAnswers = localStorage.getItem(`exam_${attemptId}`);
    if (savedAnswers) {
      try {
        const parsedAnswers = JSON.parse(savedAnswers);
        answersRef.current = parsedAnswers;
        setAnswers(parsedAnswers);
        lastSavedSerializedRef.current = JSON.stringify(parsedAnswers);
      } catch (error) {
        console.error("Error loading saved answers:", error);
      }
    }
  }, [attemptId]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // Save answers to localStorage
  useEffect(() => {
    localStorage.setItem(`exam_${attemptId}`, JSON.stringify(answers));
  }, [answers, attemptId]);

  // Auto-save to server only when answers changed (every 60 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const currentSerialized = JSON.stringify(answersRef.current || []);
        if (currentSerialized !== lastSavedSerializedRef.current) {
          saveProgressToServer(answersRef.current);
        }
      } catch (e) {
        saveProgressToServer(answersRef.current);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const saveProgressToServer = async (answersToSave: ExamAnswer[] = answersRef.current) => {
    try {
      const res = await fetch("/api/exam/save-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, answers: answersToSave }),
      });

      if (res.ok) {
        try {
          lastSavedSerializedRef.current = JSON.stringify(answersToSave || []);
        } catch (e) {
          // ignore
        }
      }
      return res.ok;
    } catch (error) {
      console.error("Error saving progress:", error);
      return false;
    }
  };


  // Handle section timer expiry
  const handleSectionTimerExpire = useCallback(() => {
    const sectionId = currentSection?.id || 's1';
    setSectionTimerExpired(sectionId);
    toast({
      title: "Section Time Expired",
      description: `Time for "${currentSection?.title || 'Section'}" has ended. Moving to next section...`,
      variant: "destructive",
    });

    setSectionsCompleted(prev => new Set([...prev, sectionId]));
    setShowSectionSummary(true);
    setIsAutoAdvancingSection(true);

    // Auto-advance to next section after 2 seconds
    setTimeout(() => {
      setShowSectionSummary(false);
      setIsAutoAdvancingSection(false);
      if (currentSectionIndex < sections.length - 1) {
        setCurrentSectionIndex(currentSectionIndex + 1);
        const nextSection = sections[currentSectionIndex + 1];
        setSectionStartTimes(prev => ({ ...prev, [nextSection?.id || `s${currentSectionIndex + 2}`]: Date.now() }));
        setCurrentQuestionInSection(0);
        setSectionTimerExpired(null);
      } else {
        // Last section expired: auto-submit
        setExamCompleted(true);
        setTimeout(() => {
          handleSubmit();
        }, 500);
      }
    }, 2000);
  }, [currentSection, currentSectionIndex, sections, toast]);

  const handleSelectOption = (optionId: string) => {
    const activeQuestionId = currentSectionQuestions[currentQuestionInSection]?.id;
    if (!activeQuestionId) return;
    updateAnswers((prev) =>
      prev.map((answer) =>
        answer.questionId === activeQuestionId
          ? { ...answer, selectedOptionId: optionId }
          : answer
      )
    );
  };

  const handleClearAnswer = () => {
    const activeQuestionId = currentSectionQuestions[currentQuestionInSection]?.id;
    if (!activeQuestionId) return;
    updateAnswers((prev) =>
      prev.map((answer) =>
        answer.questionId === activeQuestionId
          ? { ...answer, selectedOptionId: null }
          : answer
      )
    );
  };

  const handleToggleReview = () => {
    const activeQuestionId = currentSectionQuestions[currentQuestionInSection]?.id;
    if (!activeQuestionId) return;
    updateAnswers((prev) =>
      prev.map((answer) =>
        answer.questionId === activeQuestionId
          ? { ...answer, isMarkedForReview: !answer.isMarkedForReview }
          : answer
      )
    );
  };

  const handleToggleFlag = () => {
    const activeQuestionId = currentSectionQuestions[currentQuestionInSection]?.id;
    if (!activeQuestionId) return;
    updateAnswers((prev) =>
      prev.map((answer) =>
        answer.questionId === activeQuestionId
          ? { ...answer, isFlagged: !answer.isFlagged }
          : answer
      )
    );
  };

  const handleSaveAndNext = () => {
    if (currentQuestionInSection < currentSectionQuestions.length - 1) {
      setCurrentQuestionInSection(currentQuestionInSection + 1);
    } else {
      // Last question in section - show summary
      setShowSectionSummary(true);
    }
  };

  const handleNextSection = () => {
    const sectionId = currentSection?.id || 's1';
    setSectionsCompleted(prev => new Set([...prev, sectionId]));

    if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
      const nextSection = sections[currentSectionIndex + 1];
      setSectionStartTimes(prev => ({ ...prev, [nextSection?.id || `s${currentSectionIndex + 2}`]: Date.now() }));
      setShowSectionSummary(false);
      // Reset to first question of next section
      setCurrentQuestionInSection(0);
    } else {
      // All sections complete
      setExamCompleted(true);
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionInSection > 0) {
      setCurrentQuestionInSection(currentQuestionInSection - 1);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || hasSubmittedExam.current) return;
    hasSubmittedExam.current = true;
    setIsSubmitting(true);

    try {
      const latestAnswers = answersRef.current.length > 0 ? answersRef.current : answers;
      const response = await fetch("/api/exam/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, answers: latestAnswers }),
      });

      const responseText = await response.text();
      let result: any = {};
      if (responseText) {
        try {
          result = JSON.parse(responseText);
        } catch {
          result = { error: responseText };
        }
      }

      if (!response.ok) {
        console.error("Submit error:", result);
        
        // Handle rate limit errors specially - don't allow retries
        if (response.status === 429) {
          toast({
            title: "Rate Limit Exceeded",
            description: "Too many submission attempts. Please wait before retrying.",
            variant: "destructive",
          });
          // Keep hasSubmittedExam flag set to prevent more attempts
          setIsSubmitting(false);
          return;
        }

        throw new Error(result.error || `Submit failed with status ${response.status}`);
      }

      localStorage.removeItem(`exam_${attemptId}`);
      router.push(`/exam/result?attemptId=${attemptId}`);
    } catch (error: any) {
      console.error("Error submitting exam:", error);
      toast({
        title: "Submission Error",
        description: error.message || "Failed to submit exam. Please try again.",
        variant: "destructive",
      });
      hasSubmittedExam.current = false;
      setIsSubmitting(false);
    }
  }, [attemptId, answers, router, toast, isSubmitting]);

  // Tab switch detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !isProcessingTabSwitch.current) {
        isProcessingTabSwitch.current = true;
        setTabSwitchCount((prev) => {
          const newCount = prev + 1;
          if (newCount >= MAX_TAB_SWITCHES) {
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
            setTimeout(() => {
              setShowTabWarning(true);
              isProcessingTabSwitch.current = false;
            }, 0);
          }
          return newCount;
        });
      }
    };

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

    const handleKeyDown = (e: KeyboardEvent) => {
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
  }, [handleSubmit, toast]);

  // Check exam status periodically
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const resultResponse = await fetch(`/api/exam/result?attemptId=${attemptId}`);
        if (resultResponse.ok) {
          const data = await resultResponse.json();
          toast({
            title: "Exam Ended",
            description: "Your exam has been submitted",
          });
          router.push(`/exam/result?attemptId=${attemptId}`);
          return;
        }

        const examResponse = await authenticatedFetch(`/api/exam/list?examId=${exam.id}`);
        if (examResponse.ok) {
          const examData = await examResponse.json();
          const currentExam = examData.exams?.[0];
          if (currentExam && (currentExam.emergencyStopped || !currentExam.isActive)) {
            toast({
              title: "Exam Emergency Stopped",
              description: "This exam has been stopped by the administrator. Your progress has been saved.",
              variant: "destructive",
            });
            await saveProgressToServer();
            router.push(`/exam/${exam.id}`);
            return;
          }
        }
      } catch (error) {
        // Ignore errors
      }
    };

    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [attemptId, router, exam.id, toast, saveProgressToServer]);

  // Don't render until we have questions
  if (!currentSection || currentSectionQuestions.length === 0) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading exam...</div>;
  }

  const currentSectionQuestionIds = new Set(currentSectionQuestions.map((q) => q.id));
  const currentSectionAnswers = answers.filter((a) => currentSectionQuestionIds.has(a.questionId));
  const answeredCount = currentSectionAnswers.filter((a) => a.selectedOptionId !== null).length;
  const flaggedCount = currentSectionAnswers.filter((a) => a.isFlagged).length;
  const reviewCount = currentSectionAnswers.filter((a) => a.isMarkedForReview).length;
  
  // Exam-wide counts for submit dialog
  const totalExamAnsweredCount = answers.filter((a) => a.selectedOptionId !== null).length;
  const totalExamFlaggedCount = answers.filter((a) => a.isFlagged).length;
  const totalExamReviewCount = answers.filter((a) => a.isMarkedForReview).length;
  
  const progressPercentage = currentSectionQuestions.length > 0
    ? (answeredCount / currentSectionQuestions.length) * 100
    : 0;

  const currentQuestion = currentSectionQuestions[currentQuestionInSection];
  const currentAnswer = answers.find((a) => a.questionId === currentQuestion?.id);
  const isLastQuestionInSection = currentQuestionInSection === currentSectionQuestions.length - 1;
  const isLastSection = currentSectionIndex === sections.length - 1;

  useEffect(() => {
    const activeQuestionId = currentSectionQuestions[currentQuestionInSection]?.id;
    if (!activeQuestionId) return;
    setVisitedQuestionIds((prev) => {
      if (prev.has(activeQuestionId)) return prev;
      return new Set([...prev, activeQuestionId]);
    });
  }, [currentSectionQuestions, currentQuestionInSection]);

  // Section Summary Modal
  if (showSectionSummary && !examCompleted) {
    const sectionTotalCount = currentSectionQuestions.length;
    const sectionAnsweredCount = currentSectionAnswers.filter((a) => a.selectedOptionId !== null).length;
    const sectionReviewCount = currentSectionAnswers.filter((a) => a.isMarkedForReview).length;
    const sectionVisitedCount = currentSectionQuestions.filter((q) => visitedQuestionIds.has(q.id)).length;
    const sectionNotVisitedCount = Math.max(0, sectionTotalCount - sectionVisitedCount);

    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Section Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-lg font-semibold mb-4">{currentSection?.title}</p>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Answered:</span>
                  <span className="font-semibold">{sectionAnsweredCount}/{sectionTotalCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Not Answered:</span>
                  <span className="font-semibold">{sectionTotalCount - sectionAnsweredCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Marked for Review:</span>
                  <span className="font-semibold">{sectionReviewCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Not Visited:</span>
                  <span className="font-semibold">{sectionNotVisitedCount}</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground mb-4">
                {isLastSection
                  ? "This is the last section. Your exam will be submitted after this."
                  : `Click "Next Section" to continue to ${sections[currentSectionIndex + 1]?.title}`}
              </p>
            </div>
          </CardContent>
          <div className="flex gap-2 p-6 border-t">
            <Button variant="outline" onClick={() => setShowSectionSummary(false)} className="flex-1" disabled={isAutoAdvancingSection}>
              Back
            </Button>
            <Button onClick={handleNextSection} className="flex-1" disabled={isAutoAdvancingSection}>
              {isAutoAdvancingSection ? "Moving..." : (isLastSection ? "Submit Exam" : "Next Section")}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{hasSections ? currentSection?.title : exam.title}</h1>
                {hasSections && <Badge variant="secondary">Section {currentSectionIndex + 1}/{sections.length}</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">
                {answeredCount} / {currentSectionQuestions.length} answered in this section
                {flaggedCount > 0 && ` • ${flaggedCount} flagged`}
                {reviewCount > 0 && ` • ${reviewCount} marked for review`}
              </p>
              {tabSwitchCount > 0 && (
                <Badge variant="destructive" className="mt-2">
                  ⚠️ Tab Switch Warnings: {tabSwitchCount}/{MAX_TAB_SWITCHES}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4">
              {hasSections && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-4 w-4" /> Section Time
                  </p>
                  <Timer
                    startedAt={sectionStartTimes[currentSection?.id || 's1'] || startedAt}
                    durationMinutes={currentSection?.durationMinutes || exam.durationMinutes}
                    onExpire={handleSectionTimerExpire}
                  />
                </div>
              )}
            </div>
          </div>
          <Progress value={progressPercentage} className="mt-4" />
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Question Section */}
          <div className="flex-1 max-w-4xl">
            {currentQuestion && (
              <QuestionCard
                question={currentQuestion}
                questionNumber={currentQuestionInSection + 1}
                totalQuestions={currentSectionQuestions.length}
                selectedOptionId={currentAnswer?.selectedOptionId || null}
                isFlagged={currentAnswer?.isFlagged || false}
                isMarkedForReview={currentAnswer?.isMarkedForReview || false}
                onSelectOption={handleSelectOption}
                onToggleFlag={handleToggleFlag}
                onClearAnswer={handleClearAnswer}
                onToggleReview={handleToggleReview}
              />
            )}

            {/* Navigation */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
              <Button
                onClick={handlePrevious}
                disabled={currentQuestionInSection === 0}
                variant="outline"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {currentQuestionInSection + 1} of {currentSectionQuestions.length}
                </Badge>
              </div>

              {isLastQuestionInSection && isLastSection ? (
                <Button onClick={() => setShowSubmitDialog(true)}>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Exam
                </Button>
              ) : isLastQuestionInSection ? (
                <Button onClick={handleSaveAndNext}>
                  <ChevronRight className="h-4 w-4 mr-2" />
                  Next Section
                </Button>
              ) : (
                <Button onClick={handleSaveAndNext}>
                  Save & Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>

          {/* Question Navigation Grid */}
          <div className="w-72 sticky top-24 h-[calc(100vh-12rem)]">
            <div className="question-nav-scrollbar p-4 bg-white dark:bg-slate-900 border-2 border-gray-300 dark:border-gray-700 rounded-lg h-full overflow-y-auto">
              <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-4 text-lg">Question Navigation</h3>

              {/* Legend with colored boxes and descriptions */}
              <div className="mb-6 space-y-2 text-sm">
                <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="w-6 h-6 rounded border-2 border-gray-400 dark:border-gray-500 flex items-center justify-center text-xs font-bold">1</div>
                  <span className="text-gray-700 dark:text-gray-300"><strong>Not Visited:</strong> Not visited</span>
                </div>
                
                <div className="flex items-center gap-3 p-2 bg-red-50 dark:bg-red-950 rounded">
                  <div className="w-6 h-6 rounded bg-red-500 flex items-center justify-center text-xs font-bold text-white">3</div>
                  <span className="text-gray-700 dark:text-gray-300"><strong>Not Answered (Red):</strong> Visited</span>
                </div>
                
                <div className="flex items-center gap-3 p-2 bg-green-50 dark:bg-green-950 rounded">
                  <div className="w-6 h-6 rounded bg-green-500 flex items-center justify-center text-xs font-bold text-white">5</div>
                  <span className="text-gray-700 dark:text-gray-300"><strong>Answered (Green):</strong> Answered</span>
                </div>
                
                <div className="flex items-center gap-3 p-2 bg-purple-50 dark:bg-purple-950 rounded">
                  <div className="w-6 h-6 rounded bg-purple-500 flex items-center justify-center text-xs font-bold text-white">7</div>
                  <span className="text-gray-700 dark:text-gray-300"><strong>Marked for Review (Purple):</strong> Marked</span>
                </div>
              </div>

              {/* Grid */}
              <div className="mb-4">
                <div className="grid grid-cols-5 gap-2">
                  {currentSectionQuestions.map((q, idx) => {
                    const answer = answers.find((a) => a.questionId === q.id);
                    const isAnswered = !!answer?.selectedOptionId;
                    const isFlagged = !!answer?.isFlagged;
                    const isMarkedForReview = !!answer?.isMarkedForReview;
                    const isCurrent = idx === currentQuestionInSection;

                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentQuestionInSection(idx)}
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
              </div>

              {/* Summary */}
              <div className="mt-4 pt-4 border-t space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Answered:</span>
                  <span className="font-semibold">{answeredCount}/{currentSectionQuestions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Not Answered:</span>
                  <span className="font-semibold">{currentSectionQuestions.length - answeredCount}</span>
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

      {/* Submit Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Exam?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>Are you sure you want to submit your exam?</p>
                <div className="space-y-1 text-sm">
                  <p>• Answered: {totalExamAnsweredCount} / {questions.length}</p>
                  <p>• Unanswered: {questions.length - totalExamAnsweredCount}</p>
                  {totalExamReviewCount > 0 && <p>• Marked for review: {totalExamReviewCount}</p>}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
