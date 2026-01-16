"use client";

import { authenticatedFetch } from "@/lib/api-client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/components/ui/loading";
import { Trash2, Plus, Clock, BookOpen, Award, Edit } from "lucide-react";
import type { Exam } from "@/lib/exam-types";

interface ExamWithId extends Exam {
  id: string;
}

export default function AllExamsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useRequireAuth();
  const { toast } = useToast();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<ExamWithId[]>([]);
  const [selectedExam, setSelectedExam] = useState<ExamWithId | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    document.title = "All Exams - Admin | The Victory Key";
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
        loadExams();
      } catch (error) {
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [user, authLoading, router]);

  const loadExams = async () => {
    try {
      const response = await authenticatedFetch("/api/exam/list-all");
      if (!response.ok) throw new Error("Failed to load exams");
      
      const data = await response.json();
      setExams(data.exams || []);
    } catch (error) {
      console.error("Error loading exams:", error);
      toast({
        title: "Error",
        description: "Failed to load exams",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedExam) return;

    setDeleting(true);
    try {
      const response = await authenticatedFetch("/api/exam/list-all", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId: selectedExam.id }),
      });

      if (!response.ok) throw new Error("Failed to delete exam");

      toast({
        title: "Success",
        description: "Exam deleted successfully",
      });

      setShowConfirm(false);
      setSelectedExam(null);
      loadExams();
    } catch (error: any) {
      console.error("Error deleting exam:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete exam",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
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
            <h1 className="text-3xl font-bold">All Exams</h1>
            <p className="text-muted-foreground">Manage all created exams</p>
          </div>
          <Button onClick={() => router.push("/admintvk01/exams")}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Exam
          </Button>
        </div>

        {exams.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No exams created yet</p>
              <Button onClick={() => router.push("/admintvk01/exams")}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Exam
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {exams.map((exam) => (
              <Card key={exam.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-xl">{exam.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {exam.description || "No description"}
                      </CardDescription>
                    </div>
                    <Badge variant={exam.isPublished ? "default" : "secondary"}>
                      {exam.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Category:</span>
                      <Badge variant="outline">{exam.category}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">{exam.durationMinutes} minutes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Total Marks:</span>
                      <span className="font-medium">{exam.totalMarks}</span>
                      <span className="text-muted-foreground">• Pass:</span>
                      <span className="font-medium">{exam.passingMarks}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Questions:</span>
                      <span className="font-medium">{exam.questions.length}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.push(`/exam?id=${exam.id}`)}
                  >
                    View Details
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => router.push(`/admintvk01/exams/edit/${exam.id}`)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => {
                      setSelectedExam(exam);
                      setShowConfirm(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Exam?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-2">
                  <p>
                    Are you sure you want to delete <strong>{selectedExam?.title}</strong>?
                  </p>
                  <p className="text-sm text-amber-600">
                    This will permanently delete the exam and all its questions. This action cannot be undone.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete();
                }}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? "Deleting..." : "Delete Exam"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
