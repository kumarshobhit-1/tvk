"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, BookOpen, Trophy, Users } from "lucide-react";
import Loading from "@/components/ui/loading";

interface ExamListItem {
  id: string;
  title: string;
  description: string;
  type: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  category: string;
  questionCount: number;
}

interface ExamStatus {
  hasPassed: boolean;
  attemptCount: number;
  maxAttempts: number;
  canRetake: boolean;
  lastAttemptId: string | null;
}

export default function ExamsPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const [exams, setExams] = useState<ExamListItem[]>([]);
  const [examStatuses, setExamStatuses] = useState<Record<string, ExamStatus>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showLoading, setShowLoading] = useState(true);

  // Add minimum delay to show loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 500); // Show loading for at least 500ms
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.title = "Available Exams | The Victory Key";
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    const fetchExams = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/exam/list");
        const data = await response.json();
        
        // Handle both success and error cases
        if (data.exams) {
          setExams(data.exams);
          
          // Fetch status for each exam
          const statuses: Record<string, ExamStatus> = {};
          for (const exam of data.exams) {
            try {
              const statusRes = await fetch(`/api/exam/status?examId=${exam.id}`);
              if (statusRes.ok) {
                statuses[exam.id] = await statusRes.json();
              }
            } catch (err) {
              console.error(`Error fetching status for exam ${exam.id}:`, err);
            }
          }
          setExamStatuses(statuses);
        } else {
          setExams([]);
        }
        
        setError("");
      } catch (err) {
        console.error("Error fetching exams:", err);
        setError("");
        setExams([]); // Show empty state instead of error
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, [user, authLoading]);

  if (authLoading || loading || showLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Available Exams</h1>
        <p className="text-muted-foreground">
          Choose an exam to test your knowledge and skills
        </p>
      </div>

      {exams.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No exams available at the moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <Card key={exam.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="outline">{exam.category}</Badge>
                  <Badge variant={exam.type === "practice" ? "secondary" : "default"}>
                    {exam.type}
                  </Badge>
                </div>
                <CardTitle className="line-clamp-2">{exam.title}</CardTitle>
                <CardDescription className="line-clamp-3">
                  {exam.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{exam.durationMinutes} minutes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span>{exam.questionCount} questions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                    <span>{exam.totalMarks} marks (Pass: {exam.passingMarks})</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                {(() => {
                  const status = examStatuses[exam.id];
                  
                  if (!status) {
                    // Loading or no status yet
                    return (
                      <>
                        <Button asChild className="flex-1">
                          <Link href={`/exam/${exam.id}`}>Start Exam</Link>
                        </Button>
                        <Button asChild variant="outline">
                          <Link href={`/exam/leaderboard/${exam.id}`}>
                            <Users className="h-4 w-4" />
                          </Link>
                        </Button>
                      </>
                    );
                  }

                  if (status.hasPassed) {
                    // Student passed - only show view result
                    return (
                      <>
                        <Button asChild className="flex-1" variant="outline">
                          <Link href={`/exam/result?attemptId=${status.lastAttemptId}`}>
                            View Result
                          </Link>
                        </Button>
                        <Button asChild variant="outline">
                          <Link href={`/exam/leaderboard/${exam.id}`}>
                            <Users className="h-4 w-4" />
                          </Link>
                        </Button>
                      </>
                    );
                  }

                  if (status.attemptCount >= status.maxAttempts) {
                    // Max attempts reached - only show last attempt
                    return (
                      <>
                        <Button asChild className="flex-1" variant="outline">
                          <Link href={`/exam/result?attemptId=${status.lastAttemptId}`}>
                            View Last Attempt
                          </Link>
                        </Button>
                        <Button asChild variant="outline">
                          <Link href={`/exam/leaderboard/${exam.id}`}>
                            <Users className="h-4 w-4" />
                          </Link>
                        </Button>
                      </>
                    );
                  }

                  if (status.attemptCount > 0) {
                    // Has attempts but can retry
                    return (
                      <>
                        <Button asChild className="flex-1">
                          <Link href={`/exam/${exam.id}`}>
                            Retry
                          </Link>
                        </Button>
                        <Button asChild variant="outline">
                          <Link href={`/exam/leaderboard/${exam.id}`}>
                            <Users className="h-4 w-4" />
                          </Link>
                        </Button>
                      </>
                    );
                  }

                  // First attempt
                  return (
                    <>
                      <Button asChild className="flex-1">
                        <Link href={`/exam/${exam.id}`}>Start Exam</Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link href={`/exam/leaderboard/${exam.id}`}>
                          <Users className="h-4 w-4" />
                        </Link>
                      </Button>
                    </>
                  );
                })()}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
