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

  useEffect(() => {
    if (attemptId) {
      document.title = "Exam Result | The Victory Key";
    } else {
      document.title = "My Exam Results | The Victory Key";
    }
  }, [attemptId]);

  useEffect(() => {
    if (authLoading || !user) return;

    if (attemptId) {
      // Fetch single result
      fetchSingleResult(attemptId);
    } else {
      // Fetch all user results
      fetchAllResults(user.uid);
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

  const fetchAllResults = async (userId: string) => {
    try {
      const response = await fetch(`/api/exam/my-results?userId=${userId}`);
      
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
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="outline"
            onClick={() => setShowReview(false)}
            className="mb-4"
          >
            ← Back to Summary
          </Button>

          <h2 className="text-2xl font-bold mb-6">Answer Review</h2>

          <div className="space-y-6">
            {result.answers.map((answer, index) => (
              <QuestionCard
                key={answer.questionId}
                question={{
                  id: answer.questionId,
                  text: answer.questionText,
                  options: answer.options,
                  correctOptionId: answer.correctOptionId,
                  explanation: answer.explanation,
                  marks: answer.marksAwarded,
                  difficulty: "Medium",
                }}
                questionNumber={index + 1}
                totalQuestions={result.answers.length}
                selectedOptionId={answer.selectedOptionId}
                isFlagged={false}
                onSelectOption={() => {}}
                onToggleFlag={() => {}}
                showCorrectAnswer={true}
                correctOptionId={answer.correctOptionId}
              />
            ))}
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
