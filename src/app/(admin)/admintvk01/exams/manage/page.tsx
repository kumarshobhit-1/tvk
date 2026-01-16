"use client";

import { authenticatedFetch } from "@/lib/api-client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/components/ui/loading";
import { Clock, Users, Trophy, StopCircle, Trash2, RefreshCw, AlertTriangle, Shield, User, Calendar } from "lucide-react";
import type { ExamAttempt } from "@/lib/exam-types";

interface ActiveAttempt extends ExamAttempt {
  id: string;
  examTitle?: string;
  examId: string;
}

interface PublishedExam {
  id: string;
  title: string;
  description: string;
  category: string;
  durationMinutes: number;
  totalMarks: number;
  isPublished: boolean;
  isActive?: boolean;
  emergencyStopped?: boolean;
  activeAttempts: ActiveAttempt[];
  activeCount: number;
  totalAttempts: number; // Total number of attempts
  uniqueStudents: number; // Unique students who attempted
}

export default function ManageExamsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useRequireAuth();
  const { toast } = useToast();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [publishedExams, setPublishedExams] = useState<PublishedExam[]>([]);
  const [selectedAttempt, setSelectedAttempt] = useState<ActiveAttempt | null>(null);
  const [selectedExam, setSelectedExam] = useState<PublishedExam | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false);
  const [emergencyAction, setEmergencyAction] = useState<'stop' | 'delete' | 'restart' | 'cleanup' | null>(null);
  const [ending, setEnding] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    document.title = "Manage Active Exams - Admin | The Victory Key";
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;

    const checkAdmin = async () => {
      try {
        const response = await fetch("/api/exam/admintvk01?examId=test");
        if (response.status === 403) {
          router.push("/");
          return;
        }
        setIsAdmin(true);
        loadAttempts();
      } catch (error) {
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [user, authLoading, router]);

  // Auto-refresh with dynamic intervals
  useEffect(() => {
    if (!isAdmin) return;

    const scheduleRefresh = () => {
      // Check current state for active students
      const hasActiveStudents = publishedExams.some(exam => exam.activeCount > 0);
      const refreshInterval = hasActiveStudents ? 10000 : 30000; // 10s if active, 30s if none

      const timeout = setTimeout(() => {
        loadAttempts();
        scheduleRefresh(); // Schedule next refresh
      }, refreshInterval);

      return timeout;
    };

    const timeout = scheduleRefresh();

    return () => clearTimeout(timeout);
  }, [isAdmin]); // Only depend on isAdmin

  // Real-time clock for time elapsed updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  const loadAttempts = async () => {
    setIsRefreshing(true);
    try {
      const response = await authenticatedFetch("/api/exam/manage");
      if (!response.ok) throw new Error("Failed to load exams");
      
      const data = await response.json();
      setPublishedExams(data.exams || []);
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Error loading exams:", error);
      toast({
        title: "Error",
        description: "Failed to load published exams",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    loadAttempts();
    toast({
      title: "Refreshed",
      description: "Exam data updated successfully",
    });
  };

  const handleEndExam = async () => {
    if (!selectedAttempt) return;

    setEnding(true);
    try {
      const response = await authenticatedFetch("/api/exam/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: selectedAttempt.id,
          action: "end",
        }),
      });

      if (!response.ok) throw new Error("Failed to end exam");

      const result = await response.json();
      
      toast({
        title: "Success",
        description: `Exam ended for ${selectedAttempt.userName}`,
      });

      setShowConfirm(false);
      setSelectedAttempt(null);
      // Auto-refresh to show updated counts
      setTimeout(() => loadAttempts(), 1000);
    } catch (error: any) {
      console.error("Error ending exam:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to end exam",
        variant: "destructive",
      });
    } finally {
      setEnding(false);
    }
  };

  const handleEmergencyAction = async () => {
    if (!selectedExam || !emergencyAction) return;

    setEnding(true);
    try {
      const response = await authenticatedFetch("/api/exam/manage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: selectedExam.id,
          action: emergencyAction === 'stop' ? 'emergency_stop_all' : 
                 emergencyAction === 'delete' ? 'emergency_delete_all' :
                 emergencyAction === 'cleanup' ? 'cleanup_stale_attempts' :
                 'emergency_restart',
          userId: user?.uid
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Emergency action failed");
      }

      const result = await response.json();
      
      toast({
        title: "Success",
        description: result.message,
      });

      setShowEmergencyConfirm(false);
      setSelectedExam(null);
      setEmergencyAction(null);
      // Auto-refresh to show updated state
      setTimeout(() => loadAttempts(), 1500);
    } catch (error: any) {
      console.error("Error in emergency action:", error);
      toast({
        title: "Error",
        description: error.message || "Emergency action failed",
        variant: "destructive",
      });
    } finally {
      setEnding(false);
    }
  };

  const getTimeElapsed = (startedAt: any) => {
    try {
      let start: number;
      
      if (!startedAt) {
        return "00:00:00";
      }
      
      // Handle different timestamp formats
      if (startedAt?.toMillis && typeof startedAt.toMillis === 'function') {
        start = startedAt.toMillis();
      } else if (startedAt?.seconds && typeof startedAt.seconds === 'number') {
        start = startedAt.seconds * 1000;
      } else if (startedAt?._seconds && typeof startedAt._seconds === 'number') {
        start = startedAt._seconds * 1000;
      } else if (typeof startedAt === 'number') {
        start = startedAt;
      } else if (typeof startedAt === 'string') {
        start = new Date(startedAt).getTime();
      } else if (startedAt instanceof Date) {
        start = startedAt.getTime();
      } else {
        console.log('Unknown timestamp format:', startedAt);
        return "00:00:00";
      }
      
      // Validate the start time
      if (isNaN(start) || start <= 0) {
        console.log('Invalid start time:', start);
        return "00:00:00";
      }
      
      const elapsed = Math.max(0, Math.floor((currentTime - start) / 1000));
      const hours = Math.floor(elapsed / 3600);
      const minutes = Math.floor((elapsed % 3600) / 60);
      const seconds = elapsed % 60;
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } catch (error) {
      console.error('Error calculating time elapsed:', error, 'StartedAt:', startedAt);
      return "00:00:00";
    }
  };

  if (authLoading || loading) {
    return <Loading />;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Manage Active Exams</h1>
              <p className="text-muted-foreground">Monitor and control ongoing exam attempts</p>
              {lastRefresh && (
                <p className="text-xs text-muted-foreground mt-1">
                  Last updated: {lastRefresh.toLocaleTimeString()} 
                  {isRefreshing && <span className="text-primary"> • Refreshing...</span>}
                  <span className="text-green-600"> • Auto-refresh: {publishedExams.some(exam => exam.activeCount > 0) ? '10s' : '30s'}</span>
                </p>
              )}
            </div>
            <Button 
              variant="outline" 
              onClick={handleManualRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>        {publishedExams.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No published exams available</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {publishedExams.map((exam) => (
              <Card key={exam.id} className="border-l-4 border-l-primary">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        {exam.title}
                        {exam.emergencyStopped && (
                          <Badge variant="destructive" className="ml-2">
                            Emergency Stopped
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        <span className={`font-medium ${exam.activeCount > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                          {exam.activeCount}
                        </span> student{exam.activeCount !== 1 ? 's' : ''} currently taking this exam
                        {exam.activeCount === 0 && <span className="text-orange-500"> • No active attempts</span>}
                        {exam.activeCount > 0 && <span className="text-green-600"> • Live session</span>}
                      </p>
                      <div className="flex items-center gap-4 text-xs">
                        <p className="text-blue-600">
                          👥 <span className="font-semibold">{exam.uniqueStudents || 0}</span> unique students attempted
                        </p>
                        <p className="text-purple-600">
                          📝 <span className="font-semibold">{exam.totalAttempts || 0}</span> total attempts
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Duration: {exam.durationMinutes} min</span>
                        <span>Total Marks: {exam.totalMarks}</span>
                        <span>Category: {exam.category}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedExam(exam);
                          setEmergencyAction('stop');
                          setShowEmergencyConfirm(true);
                        }}
                        className="bg-orange-600 hover:bg-orange-700"
                        disabled={exam.emergencyStopped}
                      >
                        <StopCircle className="h-4 w-4 mr-2" />
                        Emergency Stop
                      </Button>
                      {exam.emergencyStopped && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedExam(exam);
                            setEmergencyAction('restart');
                            setShowEmergencyConfirm(true);
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white border-green-600"
                        >
                          <StopCircle className="h-4 w-4 mr-2 rotate-180" />
                          Restart Exam
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedExam(exam);
                          setEmergencyAction('delete');
                          setShowEmergencyConfirm(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Emergency Delete
                      </Button>
                      {exam.activeCount > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedExam(exam);
                            setEmergencyAction('cleanup');
                            setShowEmergencyConfirm(true);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Cleanup Stale
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                {exam.activeAttempts.length > 0 && (
                  <CardContent>
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">Active Student Attempts:</h4>
                      {exam.activeAttempts.map((attempt) => (
                        <div key={attempt.id} className="border rounded-lg p-4 bg-muted/30">
                              <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  <span className="font-medium">{attempt.userName}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {new Date(
                                    attempt.startedAt?.seconds 
                                      ? attempt.startedAt.seconds * 1000 
                                      : (typeof attempt.startedAt === 'number' ? attempt.startedAt : Date.now())
                                  ).toLocaleString()}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="flex items-center gap-2 text-lg font-mono">
                                  <Clock className="h-5 w-5" />
                                  {getTimeElapsed(attempt.startedAt)}
                                </div>
                                <p className="text-xs text-muted-foreground">Time Elapsed</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}

        <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>End Exam for Student?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-2">
                  <p>
                    Are you sure you want to end the exam for <strong>{selectedAttempt?.userName}</strong>?
                  </p>
                  <p>This will:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Immediately submit their current answers</li>
                    <li>Calculate their final score</li>
                    <li>Prevent them from making any further changes</li>
                  </ul>
                  <p className="text-sm text-amber-600 mt-2">
                    This action cannot be undone.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={ending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleEndExam();
                }}
                disabled={ending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {ending ? "Ending..." : "End Exam"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Emergency Action Confirmation Dialog */}
        <AlertDialog open={showEmergencyConfirm} onOpenChange={setShowEmergencyConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                {emergencyAction === 'stop' ? 'Emergency Stop All Students' : 
                 emergencyAction === 'delete' ? 'Emergency Delete Exam' :
                 emergencyAction === 'cleanup' ? 'Cleanup Stale Attempts' :
                 'Restart Emergency Stopped Exam'}
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  <p>
                    <strong>Exam:</strong> {selectedExam?.title}
                  </p>
                  <p>
                    <strong>Active Students:</strong> {selectedExam?.activeCount || 0}
                  </p>
                  
                  {emergencyAction === 'stop' ? (
                    <div>
                      <p className="font-medium text-orange-600">This will immediately:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                        <li>Stop the exam for ALL {selectedExam?.activeCount || 0} students</li>
                        <li>Force submit all their current answers</li>
                        <li>Calculate and save their final scores</li>
                        <li>Mark the exam as emergency stopped</li>
                      </ul>
                    </div>
                  ) : emergencyAction === 'delete' ? (
                    <div>
                      <p className="font-medium text-red-600">This will permanently:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                        <li>DELETE the entire exam and all questions</li>
                        <li>DELETE ALL student attempts (active + completed)</li>
                        <li>DELETE ALL results and historical data</li>
                        <li>This action is IRREVERSIBLE!</li>
                      </ul>
                    </div>
                  ) : emergencyAction === 'cleanup' ? (
                    <div>
                      <p className="font-medium text-blue-600">This will:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                        <li>Mark stale "in-progress" attempts as abandoned</li>
                        <li>Clean up sessions where students closed browser/left</li>
                        <li>Remove students who aren't actually taking the exam</li>
                        <li>Update the live student count to show accurate data</li>
                      </ul>
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium text-green-600">This will:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                        <li>Reactivate the emergency stopped exam</li>
                        <li>Allow new students to start taking the exam</li>
                        <li>Remove the emergency stopped status</li>
                        <li>Restore normal exam operations</li>
                      </ul>
                    </div>
                  )}
                  
                  <p className="text-sm font-medium text-destructive mt-3">
                    ⚠️ This action cannot be undone.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={ending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleEmergencyAction();
                }}
                disabled={ending}
                className={emergencyAction === 'stop' ? "bg-orange-600 hover:bg-orange-700" : 
                          emergencyAction === 'delete' ? "bg-destructive hover:bg-destructive/90" :
                          emergencyAction === 'cleanup' ? "bg-blue-600 hover:bg-blue-700" :
                          "bg-green-600 hover:bg-green-700"}
              >
                {ending ? "Processing..." : 
                 (emergencyAction === 'stop' ? 'Emergency Stop All' : 
                  emergencyAction === 'delete' ? 'Permanent Delete' :
                  emergencyAction === 'cleanup' ? 'Cleanup Stale Attempts' :
                  'Restart Exam')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
