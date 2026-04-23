"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { ExamRunner } from "@/components/exam/ExamRunner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Clock, BookOpen, Trophy, Info } from "lucide-react";
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
        const infoResponse = await fetch(`/api/exam/list?examId=${examId}`);
        if (infoResponse.ok) {
          const data = await infoResponse.json();
          setExamInfo(data.exams?.[0]);
        }

        // Fetch exam status
        const statusResponse = await fetch(`/api/exam/status?examId=${examId}`);
        if (statusResponse.ok) {
          const status = await statusResponse.json();
          setExamStatus(status);
        }
      } catch (err) {
        console.error("Error fetching exam data:", err);
      }
    };

    fetchExamData();
    
    // Refresh exam data every 30 seconds to check for admin updates
    const interval = setInterval(fetchExamData, 30000);
    
    return () => clearInterval(interval);
  }, [examId, user]);

  const handleStartExam = async () => {
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
          const infoResponse = await fetch(`/api/exam/list?examId=${examId}`);
          if (infoResponse.ok) {
            const refreshedData = await infoResponse.json();
            setExamInfo(refreshedData.exams?.[0]);
          }
          return;
        }
        throw new Error(data.error || "Failed to start exam");
      }

      setExamData(data);
      setHasStarted(true);
    } catch (err: any) {
      console.error("Error starting exam:", err);
      if (err.message && (err.message.includes("emergency") || err.message.includes("stopped"))) {
        setError("This exam has been temporarily stopped by the administrator. Please try again later.");
        // Refresh exam info to show the latest status
        try {
          const infoResponse = await fetch(`/api/exam/list?examId=${examId}`);
          if (infoResponse.ok) {
            const refreshedData = await infoResponse.json();
            setExamInfo(refreshedData.exams?.[0]);
          }
        } catch (refreshError) {
          console.error("Error refreshing exam info:", refreshError);
        }
      } else {
        setError(err.message || "Failed to start exam");
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || showLoading) {
    return <Loading />;
  }

  if (!user) {
    return null;
  }

  if (hasStarted && examData) {
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
          onClick={() => router.push("/exam")}
          className="mb-4"
        >
          ← Back to Exams
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <Badge>Course: {examInfo?.category || "Exam"}</Badge>
              {examInfo?.isPremium && <Badge variant="secondary">Premium</Badge>}
            </div>
            <CardTitle className="text-3xl">Ready to Start?</CardTitle>
            <CardDescription>
              Please read the instructions carefully before starting the exam
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Important Instructions</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>This is a timed exam - once started, the timer cannot be paused</li>
                  <li>You can navigate between questions freely</li>
                  <li>Flag questions for review if needed</li>
                  <li>Your progress is auto-saved every 30 seconds</li>
                  <li>Negative marking applies for wrong answers</li>
                  <li>Submit before time expires or it will auto-submit</li>
                </ul>
              </AlertDescription>
            </Alert>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {examInfo && (examInfo.emergencyStopped || !examInfo.isActive) && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Exam Emergency Stopped</AlertTitle>
                <AlertDescription>
                  This exam has been temporarily stopped by the administrator. 
                  Please wait for further instructions or contact support.
                  <p className="mt-2 text-sm">
                    Stopped at: {(() => {
                      try {
                        const timestamp = examInfo.emergencyStoppedAt;
                        console.log('Emergency stopped timestamp:', timestamp, typeof timestamp);
                        
                        if (!timestamp) {
                          // If no timestamp, show current time as fallback
                          return new Date().toLocaleString('en-IN', {
                            timeZone: 'Asia/Kolkata',
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short', 
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          });
                        }
                        
                        let date;
                        if (typeof timestamp === 'object' && timestamp !== null) {
                          if ('seconds' in timestamp && typeof timestamp.seconds === 'number') {
                            // Firestore timestamp format { seconds: number, nanoseconds: number }
                            date = new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
                          } else if ('toDate' in timestamp && typeof timestamp.toDate === 'function') {
                            // Firestore timestamp with toDate method
                            date = timestamp.toDate();
                          } else if (timestamp._seconds) {
                            // Alternative Firestore format
                            date = new Date(timestamp._seconds * 1000);
                          } else {
                            // Regular Date object or ISO string
                            date = new Date(timestamp);
                          }
                        } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
                          // String or number timestamp
                          date = new Date(timestamp);
                        } else {
                          throw new Error('Unknown timestamp format');
                        }
                        
                        if (!date || isNaN(date.getTime())) {
                          return 'Recently';
                        }
                        
                        return date.toLocaleString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: '2-digit', 
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        });
                      } catch (error) {
                        console.log('Date parsing error:', error, 'Original timestamp:', examInfo.emergencyStoppedAt);
                        return 'Recently';
                      }
                    })()}
                  </p>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-muted rounded-lg text-center">
                <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-semibold">
                  {examInfo ? `${examInfo.durationMinutes} minutes` : "Loading..."}
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <BookOpen className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">Questions</p>
                <p className="font-semibold">
                  {examInfo ? examInfo.questions?.length || 0 : "Loading..."}
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg text-center">
                <Trophy className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">Total Marks</p>
                <p className="font-semibold">
                  {examInfo ? examInfo.totalMarks : "Loading..."}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex-col space-y-2">
            {examStatus?.hasPassed ? (
              <>
                <div className="w-full p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md text-center mb-2">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    ✅ You have already passed this exam!
                  </p>
                </div>
                <Button
                  onClick={() => router.push(`/exam/result?attemptId=${examStatus.lastAttemptId}`)}
                  className="w-full"
                  size="lg"
                  variant="outline"
                >
                  View Result
                </Button>
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
            ) : examInfo?.isPremium && examStatus && examStatus.canAttemptPremium === false ? (
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
            ) : examStatus && examStatus.attemptCount >= 3 ? (
              <>
                <div className="w-full p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md text-center mb-2">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    ❌ Maximum attempt limit reached (3/3)
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
            ) : examStatus && examStatus.attemptCount > 0 ? (
              <>
                <div className="w-full p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md text-center mb-2">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    📝 Attempt {examStatus.attemptCount + 1} of 3
                  </p>
                </div>
                <div className="flex items-start space-x-3 p-4 border rounded-lg bg-muted/50 mb-4">
                  <Checkbox 
                    id="instructions-agreement" 
                    checked={agreedToInstructions}
                    onCheckedChange={(checked) => setAgreedToInstructions(checked as boolean)}
                  />
                  <label 
                    htmlFor="instructions-agreement"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    I have read and understood all the instructions above
                  </label>
                </div>
                <Button
                  onClick={handleStartExam}
                  disabled={loading || !agreedToInstructions || (examInfo && (examInfo.emergencyStopped || !examInfo.isActive)) || examStatus?.canAttemptPremium === false}
                  className="w-full"
                  size="lg"
                >
                  {loading ? "Starting..." : "Retry Exam"}
                </Button>
                <Button
                  onClick={() => router.push(`/exam/result?attemptId=${examStatus.lastAttemptId}`)}
                  variant="outline"
                  className="w-full"
                >
                  View Previous Attempt
                </Button>
              </>
            ) : (
              <>
                <div className="flex items-start space-x-3 p-4 border rounded-lg bg-muted/50 mb-4">
                  <Checkbox 
                    id="instructions-agreement" 
                    checked={agreedToInstructions}
                    onCheckedChange={(checked) => setAgreedToInstructions(checked as boolean)}
                  />
                  <label 
                    htmlFor="instructions-agreement"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    I have read and understood all the instructions above
                  </label>
                </div>
                <Button
                  onClick={handleStartExam}
                  disabled={loading || !agreedToInstructions || (examInfo && (examInfo.emergencyStopped || !examInfo.isActive)) || examStatus?.canAttemptPremium === false}
                  className="w-full"
                  size="lg"
                >
                  {loading ? "Starting..." : "Start Exam Now"}
                </Button>
              </>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
