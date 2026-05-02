// src/app/(admin)/admintvk01/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { DsaTopic, DsaQuestion, CsSubject, CsTopic } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, PlusCircle, Trash2, Edit, FileText, ListChecks, Calculator, ClipboardList, Activity, RefreshCw, Shield, Crown } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { authenticatedFetch } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { AdminRole } from "@/lib/role-types";

// Helper types to add firebaseDocId for state management
type DsaQuestionWithId = DsaQuestion & { firebaseDocId: string };
type CsTopicWithId = CsTopic & { firebaseDocId: string };
type DsaTopicWithId = DsaTopic & { id: string; firebaseDocId: string };
type CsSubjectWithId = CsSubject & { id: string; firebaseDocId: string };
type Resource = { name: string; url: string };

// Playground DSA Problem type
type PlaygroundProblem = {
  firebaseDocId: string;
  id: string;
  title: string;
  category: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  examples: Array<{ input: string; output: string; explanation: string }>;
  constraints: string[];
  templates: {
    javascript: string;
    python: string;
    java?: string;
    cpp?: string;
    c?: string;
  };
  createdAt?: any;
};

type DeletionInfo = {
  id: string;
  collectionName: string;
  title: string;
} | null;

export default function AdminHomePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [dsaTopics, setDsaTopics] = useState<DsaTopicWithId[]>([]);
  const [dsaQuestions, setDsaQuestions] = useState<DsaQuestionWithId[]>([]);
  const [csSubjects, setCsSubjects] = useState<CsSubjectWithId[]>([]);
  const [csTopics, setCsTopics] = useState<CsTopicWithId[]>([]);
  const [playgroundProblems, setPlaygroundProblems] = useState<PlaygroundProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<DeletionInfo>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [currentForm, setCurrentForm] = useState<string | null>(null);
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const { toast } = useToast();

  const canManageExams = adminRole === "super_admin" || adminRole === "isAdmin" || adminRole === "exam_admin";
  const canManageQA = adminRole === "super_admin" || adminRole === "isAdmin" || adminRole === "qa_admin";
  const canManagePDFs = adminRole === "super_admin" || adminRole === "isAdmin" || adminRole === "content_admin";
  const canManageAdmins = adminRole === "super_admin";
  const canManagePremiumUsers = adminRole === "super_admin" || adminRole === "isAdmin";

  const fetchAllContent = async () => {
    setLoading(true);
    try {
      // Fetch from API routes with authentication
      const [dsaTopicsRes, dsaQuestionsRes, csSubjectsRes, csTopicsRes, playgroundProblemsRes] = await Promise.all([
        authenticatedFetch('/api/admintvk01/dsa-topics'),
        authenticatedFetch('/api/admintvk01/dsa-questions'),
        authenticatedFetch('/api/admintvk01/cs-subjects'),
        authenticatedFetch('/api/admintvk01/cs-topics'),
        authenticatedFetch('/api/admintvk01/playground-problems')
      ]);

      if (!dsaTopicsRes.ok || !dsaQuestionsRes.ok || !csSubjectsRes.ok || !csTopicsRes.ok || !playgroundProblemsRes.ok) {
        throw new Error('Failed to fetch content');
      }

      const [dsaTopicsData, dsaQuestionsData, csSubjectsData, csTopicsData, playgroundProblemsData] = await Promise.all([
        dsaTopicsRes.json(),
        dsaQuestionsRes.json(),
        csSubjectsRes.json(),
        csTopicsRes.json(),
        playgroundProblemsRes.json()
      ]);

      setDsaTopics(dsaTopicsData.items || []);
      setDsaQuestions(dsaQuestionsData.items || []);
      setCsSubjects(csSubjectsData.items || []);
      setCsTopics(csTopicsData.items || []);
      setPlaygroundProblems(playgroundProblemsData.items || []);
    } catch (error) {
      toast({ title: "Error", description: "Could not fetch content.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  useEffect(() => {
    const loadAdminRole = async () => {
      if (authLoading) return;
      if (!user) {
        router.push("/");
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const role = userDoc.exists()
          ? ((userDoc.data().adminRole as AdminRole | undefined) || (userDoc.data().isAdmin ? "isAdmin" : undefined))
          : undefined;
        if (!role) {
          router.push("/");
          return;
        }
        setAdminRole(role);
      } catch (error) {
        console.error("Failed to load admin role", error);
        router.push("/");
      } finally {
        setRoleLoading(false);
      }
    };

    loadAdminRole();
  }, [user, authLoading, router]);

  useEffect(() => {
    if (roleLoading) return;
    if (canManageQA) {
      fetchAllContent();
      return;
    }
    setLoading(false);
  }, [roleLoading, canManageQA]);

  const openDialog = (form: string, data: any | null = null) => {
    setCurrentForm(form);
    setEditingItem(data);
  };

  const closeDialog = () => {
    setCurrentForm(null);
    setEditingItem(null);
  };

  const generateSlug = (title: string) => title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  
  const handleSave = async (event: React.FormEvent<HTMLFormElement>, collectionName: string) => {
    event.preventDefault(); setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const data: { [key: string]: any } = Object.fromEntries(formData.entries());
    if (collectionName === 'dsa_topics' || collectionName === 'cs_subjects') {
      if (data.name) {
        data.slug = generateSlug(data.name);
      }
    }
    if (data.examples) data.examples = JSON.parse(data.examples || "[]");
    if (data.constraints) data.constraints = JSON.parse(data.constraints || "[]");
    if (data.resources) data.resources = JSON.parse(data.resources || "[]");
    if (collectionName === 'dsa_questions') {
      data.resources = [
        { name: "LeetCode", url: data.leetcodeUrl || "" },
        { name: "GfG", url: data.gfgUrl || "" },
        { name: "Video", url: data.videoUrl || "" },
      ].filter((r: Resource) => r.url);
      delete data.leetcodeUrl; delete data.gfgUrl; delete data.videoUrl;
    } else if (collectionName === 'cs_topics') {
        const resourceUrl = data.resourceUrl || "";
        data.resources = resourceUrl ? [{ name: "Article", url: resourceUrl }] : [];
        delete data.resourceUrl;
    } else if (collectionName === 'playground_problems') {
      // Handle playground problem templates
      data.templates = {
        javascript: data.template_javascript || "",
        python: data.template_python || "",
        java: data.template_java || "",
        cpp: data.template_cpp || "",
        c: data.template_c || "",
      };
      delete data.template_javascript;
      delete data.template_python;
      delete data.template_java;
      delete data.template_cpp;
      delete data.template_c;
    }

    // Determine API route based on collection name
    let apiRoute = '';
    switch (collectionName) {
      case 'dsa_topics':
        apiRoute = '/api/admintvk01/dsa-topics';
        break;
      case 'dsa_questions':
        apiRoute = '/api/admintvk01/dsa-questions';
        break;
      case 'cs_subjects':
        apiRoute = '/api/admintvk01/cs-subjects';
        break;
      case 'cs_topics':
        apiRoute = '/api/admintvk01/cs-topics';
        break;
      case 'playground_problems':
        apiRoute = '/api/admintvk01/playground-problems';
        break;
    }

    try {
      const method = editingItem ? 'PUT' : 'POST';
      const url = editingItem ? `${apiRoute}/${editingItem.firebaseDocId}` : apiRoute;
      
      const res = await authenticatedFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Failed to save');

      toast({ title: "Success", description: `Item ${editingItem ? "updated" : "created"} successfully.` });
      fetchAllContent();
      closeDialog();
    } catch (error) {
      toast({ title: "Error", description: "Could not save item.", variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    
    let apiRoute = '';
    switch (itemToDelete.collectionName) {
      case 'dsa_topics':
        apiRoute = '/api/admintvk01/dsa-topics';
        break;
      case 'dsa_questions':
        apiRoute = '/api/admintvk01/dsa-questions';
        break;
      case 'cs_subjects':
        apiRoute = '/api/admintvk01/cs-subjects';
        break;
      case 'cs_topics':
        apiRoute = '/api/admintvk01/cs-topics';
        break;
      case 'playground_problems':
        apiRoute = '/api/admintvk01/playground-problems';
        break;
    }

    try {
      const res = await authenticatedFetch(`${apiRoute}/${itemToDelete.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast({ title: "Deleted", description: "Item deleted successfully." });
      fetchAllContent();
      setItemToDelete(null);
    } catch (error) {
      toast({ title: "Error", description: "Could not delete item.", variant: "destructive" });
    }
  };

  if (authLoading || roleLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin h-12 w-12" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8">Content Management</h1>
      <p className="text-muted-foreground mb-8">Manage all content</p>

      {/* Role-based Management Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {canManageAdmins && (
        <Link href="/admintvk01/admin-users">
          <Card className="hover:bg-amber-300 hover:border-amber-300 transition-all cursor-pointer border-border bg-background dark:bg-slate-950 group dark:hover:bg-amber-900/30 dark:hover:border-amber-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 rounded-full transition-colors dark:bg-amber-950/40 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/60">
                  <Shield className="h-5 w-5 text-amber-600 dark:text-amber-300 group-hover:text-gray-900 dark:group-hover:text-amber-100" />
                </div>
                <div>
                  <CardTitle className="text-base mb-0 group-hover:text-gray-900 dark:text-slate-100 dark:group-hover:text-white">Manage Admins</CardTitle>
                  <CardDescription className="text-sm group-hover:text-gray-700 dark:text-slate-400 dark:group-hover:text-slate-200">Control admin roles</CardDescription>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        )}

        {canManagePremiumUsers && (
        <Link href="/admintvk01/premium-users">
          <Card className="hover:bg-yellow-300 hover:border-yellow-300 transition-all cursor-pointer border-border bg-background dark:bg-slate-950 group dark:hover:bg-yellow-900/30 dark:hover:border-yellow-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-50 rounded-full transition-colors dark:bg-yellow-950/40 group-hover:bg-yellow-100 dark:group-hover:bg-yellow-900/60">
                  <Crown className="h-5 w-5 text-yellow-600 dark:text-yellow-300 group-hover:text-gray-900 dark:group-hover:text-yellow-100" />
                </div>
                <div>
                  <CardTitle className="text-base mb-0 group-hover:text-gray-900 dark:text-slate-100 dark:group-hover:text-white">Premium Users</CardTitle>
                  <CardDescription className="text-sm group-hover:text-gray-700 dark:text-slate-400 dark:group-hover:text-slate-200">Grant premium access</CardDescription>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        )}

        {canManageExams && (
        <Link href="/admintvk01/exams">
          <Card className="hover:bg-teal-400 hover:border-teal-400 transition-all cursor-pointer border-border bg-background dark:bg-slate-950 group dark:hover:bg-teal-900/30 dark:hover:border-teal-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-full transition-colors dark:bg-slate-800 group-hover:bg-gray-200 dark:group-hover:bg-slate-700">
                  <PlusCircle className="h-5 w-5 text-gray-700 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-white" />
                </div>
                <div>
                  <CardTitle className="text-base mb-0 group-hover:text-gray-900 dark:text-slate-100 dark:group-hover:text-white">Create Exam</CardTitle>
                  <CardDescription className="text-sm group-hover:text-gray-700 dark:text-slate-400 dark:group-hover:text-slate-200">Add new exam</CardDescription>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        )}

        {canManageExams && (
        <Link href="/admintvk01/exams/list">
          <Card className="hover:bg-teal-400 hover:border-teal-400 transition-all cursor-pointer border-border bg-background dark:bg-slate-950 group dark:hover:bg-teal-900/30 dark:hover:border-teal-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-full transition-colors dark:bg-blue-950/40 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/60">
                  <ClipboardList className="h-5 w-5 text-blue-500 dark:text-blue-300 group-hover:text-gray-900 dark:group-hover:text-blue-100" />
                </div>
                <div>
                  <CardTitle className="text-base mb-0 group-hover:text-gray-900 dark:text-slate-100 dark:group-hover:text-white">Manage Exams</CardTitle>
                  <CardDescription className="text-sm group-hover:text-gray-700 dark:text-slate-400 dark:group-hover:text-slate-200">Edit or delete exams</CardDescription>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        )}

        {canManageExams && (
        <Link href="/admintvk01/exams/manage">
          <Card className="hover:bg-teal-400 hover:border-teal-400 transition-all cursor-pointer border-border bg-background dark:bg-slate-950 group dark:hover:bg-teal-900/30 dark:hover:border-teal-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 rounded-full transition-colors dark:bg-orange-950/40 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/60">
                  <Activity className="h-5 w-5 text-orange-500 dark:text-orange-300 group-hover:text-gray-900 dark:group-hover:text-orange-100" />
                </div>
                <div>
                  <CardTitle className="text-base mb-0 group-hover:text-gray-900 dark:text-slate-100 dark:group-hover:text-white">Active Exams</CardTitle>
                  <CardDescription className="text-sm group-hover:text-gray-700 dark:text-slate-400 dark:group-hover:text-slate-200">Monitor ongoing exams</CardDescription>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        )}

        {canManageExams && (
        <Link href="/admintvk01/exams/recalculate">
          <Card className="hover:bg-teal-400 hover:border-teal-400 transition-all cursor-pointer border-border bg-background dark:bg-slate-950 group dark:hover:bg-teal-900/30 dark:hover:border-teal-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-full transition-colors dark:bg-blue-950/40 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/60">
                  <RefreshCw className="h-5 w-5 text-blue-500 dark:text-blue-300 group-hover:text-gray-900 dark:group-hover:text-blue-100" />
                </div>
                <div>
                  <CardTitle className="text-base mb-0 group-hover:text-gray-900 dark:text-slate-100 dark:group-hover:text-white">Recalculate Result</CardTitle>
                  <CardDescription className="text-sm group-hover:text-gray-700 dark:text-slate-400 dark:group-hover:text-slate-200">Refresh Exam Result</CardDescription>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        )}

        {canManagePDFs && (
        <Link href="/admintvk01/pdfs">
          <Card className="hover:bg-purple-400 hover:border-purple-400 transition-all cursor-pointer border-border bg-background dark:bg-slate-950 group dark:hover:bg-purple-900/30 dark:hover:border-purple-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-full transition-colors dark:bg-purple-950/40 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/60">
                  <FileText className="h-5 w-5 text-purple-500 dark:text-purple-300 group-hover:text-gray-900 dark:group-hover:text-purple-100" />
                </div>
                <div>
                  <CardTitle className="text-base mb-0 group-hover:text-gray-900 dark:text-slate-100 dark:group-hover:text-white">PDF Library</CardTitle>
                  <CardDescription className="text-sm group-hover:text-gray-700 dark:text-slate-400 dark:group-hover:text-slate-200">Upload & manage PDFs</CardDescription>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        )}
      </div>

      {canManageQA ? (
      <Tabs defaultValue="dsa-topics" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dsa-topics"><FileText className="mr-2 h-4 w-4" />DSA Topics</TabsTrigger>
          <TabsTrigger value="dsa-questions"><ListChecks className="mr-2 h-4 w-4" />DSA Questions</TabsTrigger>
          <TabsTrigger value="cs-subjects"><Calculator className="mr-2 h-4 w-4" />CS Subjects</TabsTrigger>
          <TabsTrigger value="cs-topics"><FileText className="mr-2 h-4 w-4" />CS Topics</TabsTrigger>
          <TabsTrigger value="playground"><FileText className="mr-2 h-4 w-4" />Playground</TabsTrigger>
        </TabsList>

        {/* DSA Topics Tab */}
        <TabsContent value="dsa-topics">
          <Button className="mb-4" onClick={() => openDialog('dsa_topics')}>
            <PlusCircle className="mr-2 h-4 w-4" />Add DSA Topic
          </Button>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dsaTopics.map((topic) => (
                <TableRow key={topic.firebaseDocId}>
                  <TableCell>{topic.name}</TableCell>
                  <TableCell>{topic.slug}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openDialog('dsa_topics', topic)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setItemToDelete({ id: topic.firebaseDocId, collectionName: 'dsa_topics', title: topic.name })}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        {/* DSA Questions Tab */}
        <TabsContent value="dsa-questions">
          <Button className="mb-4" onClick={() => openDialog('dsa_questions')}>
            <PlusCircle className="mr-2 h-4 w-4" />Add DSA Question
          </Button>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dsaQuestions.map((q) => (
                <TableRow key={q.firebaseDocId}>
                  <TableCell>{q.title}</TableCell>
                  <TableCell>{q.difficulty}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openDialog('dsa_questions', q)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setItemToDelete({ id: q.firebaseDocId, collectionName: 'dsa_questions', title: q.title })}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        {/* CS Subjects Tab */}
        <TabsContent value="cs-subjects">
          <Button className="mb-4" onClick={() => openDialog('cs_subjects')}>
            <PlusCircle className="mr-2 h-4 w-4" />Add CS Subject
          </Button>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {csSubjects.map((subject) => (
                <TableRow key={subject.firebaseDocId}>
                  <TableCell>{subject.name}</TableCell>
                  <TableCell>{subject.slug}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openDialog('cs_subjects', subject)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setItemToDelete({ id: subject.firebaseDocId, collectionName: 'cs_subjects', title: subject.name })}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        {/* CS Topics Tab */}
        <TabsContent value="cs-topics">
          <Button className="mb-4" onClick={() => openDialog('cs_topics')}>
            <PlusCircle className="mr-2 h-4 w-4" />Add CS Topic
          </Button>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {csTopics.map((topic) => (
                <TableRow key={topic.firebaseDocId}>
                  <TableCell>{topic.title}</TableCell>
                  <TableCell>{topic.csSubjectId}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openDialog('cs_topics', topic)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setItemToDelete({ id: topic.firebaseDocId, collectionName: 'cs_topics', title: topic.title })}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        {/* Playground Problems Tab */}
        <TabsContent value="playground">
          <Button className="mb-4" onClick={() => openDialog('playground_problems')}>
            <PlusCircle className="mr-2 h-4 w-4" />Add Playground Problem
          </Button>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {playgroundProblems.map((problem) => (
                <TableRow key={problem.firebaseDocId}>
                  <TableCell>{problem.title}</TableCell>
                  <TableCell>{problem.category}</TableCell>
                  <TableCell>{problem.difficulty}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openDialog('playground_problems', problem)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setItemToDelete({ id: problem.firebaseDocId, collectionName: 'playground_problems', title: problem.title })}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
      ) : (
        <div className="rounded-lg border p-4 text-sm text-muted-foreground">
          {canManagePDFs && !canManageExams
            ? "You have Content Admin access. Only PDF Library management is available."
            : canManageExams
            ? "You have Exam Admin access. Exam management cards are available above."
            : "No QA permissions assigned to this admin role."}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{itemToDelete?.title}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Form dialogs would go here - simplified for brevity */}
    </div>
  );
}
