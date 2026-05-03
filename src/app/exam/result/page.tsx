"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { ResultSummary } from "@/components/exam/ResultSummary";
import { QuestionCard } from "@/components/exam/QuestionCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Loading from "@/components/ui/loading";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, Clock, CheckCircle, XCircle, Calendar, Trophy, FileText } from "lucide-react";
import Link from "next/link";
import type { ExamResult } from "@/lib/exam-types";

interface UserExamResult {
  id: string;
  examId: string;
  examTitle: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  submittedAt: string;
  timeTaken: number;
}

export default function ResultPage() {
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attemptId");
  const { user, loading: authLoading } = useRequireAuth();
  
  const [result, setResult] = useState<ExamResult | null>(null);
  const [allResults, setAllResults] = useState<UserExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{message: string, type?: string} | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);

  useEffect(() => {
    if (attemptId) {
      document.title = "Exam Result | The Victory Key";
    } else {
      document.title = "My Exam Results | The Victory Key";
    }
  }, [attemptId]);

  useEffect(() => {
    if (!showReview) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [showReview, reviewIndex]);

  useEffect(() => {
    if (authLoading || !user) return;

    if (attemptId) {
      // Fetch single result
      fetchSingleResult(attemptId);
    } else {
      // Fetch all user results
      fetchAllResults();
    }
  }, [user, authLoading, attemptId]);

  const fetchSingleResult = async (attemptId: string) => {
    try {
      const response = await fetch(`/api/exam/result?attemptId=${attemptId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        setError({
          message: errorData.message || "Failed to load result",
          type: errorData.type
        });
        return;
      }
      
      const data = await response.json();
      setResult(data.result);
    } catch (err) {
      console.error("Error fetching result:", err);
      setError({
        message: "Unable to connect to server. Please check your internet connection.",
        type: "NETWORK_ERROR"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllResults = async () => {
    try {
      const response = await fetch(`/api/exam/my-results`);
      
      if (!response.ok) {
        const errorData = await response.json();
        setError({
          message: errorData.message || "Failed to load results",
          type: errorData.type
        });
        return;
      }
      
      const data = await response.json();
      setAllResults(data.results || []);
    } catch (err) {
      console.error("Error fetching all results:", err);
      setError({
        message: "Unable to connect to server. Please check your internet connection.",
        type: "NETWORK_ERROR"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (authLoading || loading) {
    return <Loading />;
  }

  // Show all results view (when no attemptId is provided)
  if (!attemptId) {
    if (error) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-red-600 flex items-center gap-2 justify-center">
                <XCircle className="w-6 h-6" />
                Error
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">{error.message}</p>
              <div className="flex gap-2 justify-center">
                <Button asChild variant="outline">
                  <Link href="/dashboard">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                  </Link>
                </Button>
                <Button onClick={() => window.location.reload()} variant="default">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost">
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">My Exam Results</h1>
          </div>

          {allResults.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Exam Results Found</h3>
                <p className="text-muted-foreground mb-6">You haven't completed any exams yet.</p>
                <Button asChild>
                  <Link href="/dashboard">Start Learning</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="text-muted-foreground">
                Showing {allResults.length} exam result{allResults.length !== 1 ? 's' : ''}
              </div>
              
              {allResults.map((examResult) => (
                <Card key={examResult.id} className="transition-shadow hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2">{examResult.examTitle}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(examResult.submittedAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatTime(examResult.timeTaken)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{examResult.score}/{examResult.totalMarks}</div>
                          <div className="text-sm text-muted-foreground">Score</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-2xl font-bold">{examResult.percentage}%</div>
                          <div className="text-sm text-muted-foreground">Percentage</div>
                        </div>
                        
                        <Badge variant={examResult.passed ? "default" : "destructive"}>
                          {examResult.passed ? (
                            <><CheckCircle className="w-4 h-4 mr-1" />Passed</>
                          ) : (
                            <><XCircle className="w-4 h-4 mr-1" />Failed</>
                          )}
                        </Badge>
                        
                        <Button asChild size="sm">
                          <Link href={`/exam/result?attemptId=${examResult.id}`}>
                            View Details
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show single result view (when attemptId is provided)

  if (error || !result) {
    const getErrorContent = () => {
      if (!error) {
        return {
          title: "Result Not Found",
          description: "The requested exam result could not be found.",
          action: null
        };
      }

      switch (error.type) {
        case "NOT_FOUND":
          return {
            title: "Result Not Available",
            description: error.message,
            action: (
              <div className="mt-4">
                <Button onClick={() => window.location.href = '/dashboard'} variant="outline">
                  Go to Dashboard
                </Button>
              </div>
            )
          };
        case "EXAM_DELETED":
          return {
            title: "Exam No Longer Available",
            description: error.message + " Your result data may no longer be accessible.",
            action: (
              <div className="mt-4 space-x-2">
                <Button onClick={() => window.location.href = '/dashboard'} variant="outline">
                  Go to Dashboard
                </Button>
                <Button onClick={() => window.location.href = '/exam'} variant="default">
                  Browse Exams
                </Button>
              </div>
            )
          };
        case "NETWORK_ERROR":
          return {
            title: "Connection Error",
            description: error.message,
            action: (
              <div className="mt-4">
                <Button onClick={() => window.location.reload()} variant="outline">
                  Try Again
                </Button>
              </div>
            )
          };
        default:
          return {
            title: "Error Loading Result",
            description: error.message || "An unexpected error occurred.",
            action: (
              <div className="mt-4 space-x-2">
                <Button onClick={() => window.location.reload()} variant="outline">
                  Refresh Page
                </Button>
                <Button onClick={() => window.location.href = '/dashboard'} variant="default">
                  Go to Dashboard
                </Button>
              </div>
            )
          };
      }
    };

    const errorContent = getErrorContent();

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Alert variant="destructive" className="text-center">
            <AlertCircle className="h-4 w-4 mx-auto" />
            <AlertTitle className="mt-2">{errorContent.title}</AlertTitle>
            <AlertDescription className="mt-2">
              {errorContent.description}
            </AlertDescription>
            {errorContent.action}
          </Alert>
        </div>
      </div>
    );
  }

  if (showReview) {
    const currentAnswer = result.answers[reviewIndex];
    const totalReviewQuestions = result.answers.length;

    const goPrev = () => setReviewIndex((prev) => Math.max(0, prev - 1));
    const goNext = () => setReviewIndex((prev) => Math.min(totalReviewQuestions - 1, prev + 1));

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="outline"
            onClick={() => {
              setShowReview(false);
              setReviewIndex(0);
            }}
            className="mb-4"
          >
            ← Back to Summary
          </Button>

          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Answer Review</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Review questions one by one.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="px-3 py-1">
                {reviewIndex + 1} / {totalReviewQuestions}
              </Badge>
              <Button variant="outline" size="sm" onClick={goPrev} disabled={reviewIndex === 0}>
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={goNext} disabled={reviewIndex === totalReviewQuestions - 1}>
                Next
              </Button>
            </div>
          </div>

          <div className="mb-6 rounded-lg border bg-muted/30 p-4">
            <p className="text-sm font-semibold mb-2">Color Guide</p>
            <div className="grid gap-2 sm:grid-cols-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 rounded bg-red-500 border border-red-600" />
                <span className="text-muted-foreground">Red means the option you selected was wrong.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 rounded bg-green-500 border border-green-600" />
                <span className="text-muted-foreground">Green means the correct answer.</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              If your selected answer is correct, it will also stay green.
            </p>
          </div>

          {currentAnswer && (
            <QuestionCard
              key={currentAnswer.questionId}
              question={{
                id: currentAnswer.questionId,
                text: currentAnswer.questionText,
                options: currentAnswer.options,
                correctOptionId: currentAnswer.correctOptionId,
                explanation: currentAnswer.explanation,
                marks: currentAnswer.marksAwarded,
                difficulty: "Medium",
              }}
              questionNumber={reviewIndex + 1}
              totalQuestions={totalReviewQuestions}
              selectedOptionId={currentAnswer.selectedOptionId}
              isFlagged={false}
              onSelectOption={() => {}}
              onToggleFlag={() => {}}
              showCorrectAnswer={true}
              correctOptionId={currentAnswer.correctOptionId}
            />
          )}

          <div className="mt-6 flex items-center justify-between gap-3">
            <Button variant="outline" onClick={goPrev} disabled={reviewIndex === 0}>
              Previous Question
            </Button>
            <Button variant="outline" onClick={goNext} disabled={reviewIndex === totalReviewQuestions - 1}>
              Next Question
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ResultSummary
        result={result}
        onReviewAnswers={() => setShowReview(true)}
        studentName={user?.displayName || user?.email || "Student"}
        studentEmail={user?.email || "N/A"}
      />
    </div>
  );
}
