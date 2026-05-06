"use client";

import { authenticatedFetch } from "@/lib/api-client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Save, X, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/components/ui/loading";
import type { ExamQuestion, ExamOption, DifficultyLevel, Exam } from "@/lib/exam-types";
import BulkQuestionImportDialog from "@/components/admin/bulk-question-import-dialog";
import dynamic from "next/dynamic";

const SectionEditorWrapper = dynamic(
  () => import("@/components/admin/section-editor").then((mod) => ({ default: (props: any) => React.createElement(mod.default, props) })),
  { ssr: false }
);

const DEFAULT_CATEGORY_OPTIONS = ["SEBI", "JEE", "BANKING", "SSC", "UPSC"];

function normalizeCategory(value: string) {
  return value.trim().toUpperCase();
}

function ensureQuestionIds(items: ExamQuestion[] = []): ExamQuestion[] {
  return items.map((q, idx) => ({
    ...q,
    id: q?.id && String(q.id).trim() ? String(q.id) : `legacy_q_${idx + 1}_${Date.now()}`,
  }));
}

function ensureSectionsForLegacyExam(existingSections: any[] = [], examQuestions: ExamQuestion[] = [], fallbackDuration = 60) {
  if (Array.isArray(existingSections) && existingSections.length > 0) return existingSections;

  const questionIds = examQuestions.map((q) => q.id).filter(Boolean);
  if (questionIds.length === 0) return [];

  return [
    {
      id: "default-section",
      title: "General",
      durationMinutes: fallbackDuration,
      questionIds,
    },
  ];
}

export default function EditExamPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;
  const { user, loading: authLoading } = useRequireAuth();
  const { toast } = useToast();
  const questionsContainerRef = useRef<HTMLDivElement>(null);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<string[]>(DEFAULT_CATEGORY_OPTIONS);
  const [newCategoryInput, setNewCategoryInput] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("SEBI");
  const [passingMarks, setPassingMarks] = useState(40);
  const [negativeMarking, setNegativeMarking] = useState(0.25);
  const [isPremium, setIsPremium] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [instructions, setInstructions] = useState<string[]>([]);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSectionIdForAdd, setSelectedSectionIdForAdd] = useState("");
  const [lastAddedQuestionId, setLastAddedQuestionId] = useState<string | null>(null);

  const totalSectionDuration = useMemo(
    () => sections.reduce((sum, s) => sum + (Number.isFinite(s?.durationMinutes) ? s.durationMinutes : 0), 0),
    [sections]
  );

  useEffect(() => {
    if (!lastAddedQuestionId) return;

    const scrollToAddedQuestion = () => {
      const card = document.getElementById(`question-card-${lastAddedQuestionId}`);
      if (card) {
        const y = Math.max(0, window.scrollY + card.getBoundingClientRect().top - 140);
        window.scrollTo({ top: y, behavior: "smooth" });
        const firstInput = card.querySelector("textarea") as HTMLTextAreaElement | null;
        window.setTimeout(() => firstInput?.focus({ preventScroll: true }), 280);
      }
      setLastAddedQuestionId(null);
    };

    const timer = window.setTimeout(scrollToAddedQuestion, 0);
    return () => window.clearTimeout(timer);
  }, [questions, lastAddedQuestionId]);

  const loadCategoryOptions = async () => {
    try {
      const res = await authenticatedFetch("/api/exam/categories");
      if (!res.ok) return;

      const payload = await res.json();
      const nextCategories = Array.isArray(payload.categories)
        ? payload.categories.map((item: string) => normalizeCategory(item)).filter(Boolean)
        : [];

      setCategoryOptions(Array.from(new Set([...DEFAULT_CATEGORY_OPTIONS, ...nextCategories])));
    } catch {
      setCategoryOptions(DEFAULT_CATEGORY_OPTIONS);
    }
  };

  const persistCategoryOption = async (rawCategory: string) => {
    const normalized = normalizeCategory(rawCategory);
    if (!normalized) return null;

    const res = await authenticatedFetch("/api/exam/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: normalized }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || "Failed to save category");
    }

    const data = await res.json();
    const nextCategories = Array.isArray(data.categories)
      ? data.categories.map((item: string) => normalizeCategory(item)).filter(Boolean)
      : [];

    setCategoryOptions(Array.from(new Set([...DEFAULT_CATEGORY_OPTIONS, ...nextCategories])));
    return normalized;
  };

  useEffect(() => {
    document.title = "Edit Exam - Admin | The Victory Key";
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;

    const checkAdminAndLoad = async () => {
      try {
        const response = await authenticatedFetch("/api/exam/admintvk01?examId=test");
        if (response.status === 403) {
          router.push("/");
          return;
        }
        setIsAdmin(true);
        await Promise.all([loadExam(), loadCategoryOptions()]);
      } catch (error) {
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    checkAdminAndLoad();
  }, [user, authLoading, router, examId]);

  const loadExam = async () => {
    try {
      const response = await authenticatedFetch(`/api/exam/admintvk01?examId=${examId}`);
      if (!response.ok) throw new Error("Failed to load exam");
      
      const data = await response.json();
      const exam = data.exam as Exam;

      setTitle(exam.title);
      setDescription(exam.description || "");
      setCategory(exam.category);
      setCategoryOptions((prev) =>
        prev.includes(exam.category) ? prev : [...prev, exam.category]
      );
      setPassingMarks(exam.passingMarks);
      setNegativeMarking(exam.negativeMarking);
      setIsPremium(exam.isPremium === true);
      setIsLocked(exam.isLocked === true);
      setShuffleQuestions(exam.shuffleQuestions);
      setShuffleOptions(exam.shuffleOptions);
      setIsPublished(exam.isPublished);
      setInstructions(exam.instructions || []);

      const normalizedQuestions = ensureQuestionIds(exam.questions || []);
      const normalizedSections = ensureSectionsForLegacyExam(
        exam.sections || [],
        normalizedQuestions,
        typeof exam.durationMinutes === "number" && exam.durationMinutes > 0 ? exam.durationMinutes : 60
      );

      setQuestions(normalizedQuestions);
      setSections(normalizedSections);
      setSelectedSectionIdForAdd(normalizedSections[0]?.id || "");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load exam",
        variant: "destructive",
      });
      router.push("/admintvk01/exams/list");
    }
  };

  const addQuestion = () => {
    if (!selectedSectionIdForAdd) {
      toast({ title: "Section Required", description: "Please create/select a section first, then add questions.", variant: "destructive" });
      return;
    }

    const newId = `q${questions.length + 1}_${Date.now()}`;
    const newQuestion: ExamQuestion = {
      id: newId,
      text: "",
      options: [
        { id: "a", text: "" },
        { id: "b", text: "" },
        { id: "c", text: "" },
        { id: "d", text: "" },
      ],
      correctOptionId: "a",
      explanation: "",
      marks: 1,
      difficulty: "Medium",
      subject: "",
    };
    setLastAddedQuestionId(newId);
    setQuestions((prev) => [...prev, newQuestion]);
    setSections((prev) => prev.map((s) => s.id === selectedSectionIdForAdd ? { ...s, questionIds: Array.from(new Set([...(s.questionIds||[]), newId])) } : s));
  };

  const addOption = (questionIndex: number) => {
    const optionIds = ["a", "b", "c", "d", "e"];
    setQuestions(
      questions.map((q, i) => {
        if (i === questionIndex && q.options.length < 5) {
          const nextId = optionIds[q.options.length];
          return {
            ...q,
            options: [...q.options, { id: nextId, text: "" }],
          };
        }
        return q;
      })
    );
  };

  const removeOption = (questionIndex: number, optionId: string) => {
    setQuestions(
      questions.map((q, i) => {
        if (i === questionIndex && q.options.length > 2) {
          const filteredOptions = q.options.filter((opt) => opt.id !== optionId);
          // Adjust correctOptionId if removing the correct option
          let correctOptionId = q.correctOptionId;
          if (correctOptionId === optionId) {
            correctOptionId = filteredOptions[0]?.id || "a";
          }
          return {
            ...q,
            options: filteredOptions,
            correctOptionId,
          };
        }
        return q;
      })
    );
  };

  const removeQuestion = (index: number) => {
    const removed = questions[index];
    setQuestions(questions.filter((_, i) => i !== index));
    if (removed?.id) {
      setSections((prev) =>
        prev.map((s) => ({
          ...s,
          questionIds: (s.questionIds || []).filter((id: string) => id !== removed.id),
        }))
      );
    }
  };

  const updateQuestion = (index: number, updates: Partial<ExamQuestion>) => {
    setQuestions(
      questions.map((q, i) => (i === index ? { ...q, ...updates } : q))
    );
  };

  const updateOption = (questionIndex: number, optionId: string, text: string) => {
    setQuestions(
      questions.map((q, i) =>
        i === questionIndex
          ? {
              ...q,
              options: q.options.map((opt) =>
                opt.id === optionId ? { ...opt, text } : opt
              ),
            }
          : q
      )
    );
  };

  const addInstruction = () => {
    setInstructions([...instructions, ""]);
  };

  const updateInstruction = (index: number, text: string) => {
    setInstructions(instructions.map((inst, i) => (i === index ? text : inst)));
  };

  const removeInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!title.trim()) {
      toast({
        title: "Validation Error",
        description: "Exam title is required",
        variant: "destructive",
      });
      return false;
    }

    if (!category.trim()) {
      toast({
        title: "Validation Error",
        description: "Category is required",
        variant: "destructive",
      });
      return false;
    }

    if (questions.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one question is required",
        variant: "destructive",
      });
      return false;
    }

    // Sections must be present and cover at least one question
    if (!sections || sections.length === 0) {
      toast({ title: "Validation Error", description: "At least one section is required", variant: "destructive" });
      return false;
    }

    const allSectionQIds = sections.flatMap((s: any) => s.questionIds || []);
    if (allSectionQIds.length === 0) {
      toast({ title: "Validation Error", description: "Sections must include question assignments", variant: "destructive" });
      return false;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        toast({
          title: "Validation Error",
          description: `Question ${i + 1} text is required`,
          variant: "destructive",
        });
        return false;
      }

      const hasEmptyOption = q.options.some((opt) => !opt.text.trim());
      if (hasEmptyOption) {
        toast({
          title: "Validation Error",
          description: `Question ${i + 1} has empty options`,
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

      const examData = {
        examId,
        title,
        description,
        category,
        isPremium,
        isLocked,
        durationMinutes: totalSectionDuration,
        totalMarks,
        passingMarks,
        negativeMarking,
        shuffleQuestions,
        shuffleOptions,
        isPublished,
        instructions,
        questions,
        sections,
      };

      const response = await authenticatedFetch("/api/exam/admintvk01", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(examData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update exam");
      }

      toast({
        title: "Success",
        description: "Exam updated successfully",
      });

      router.push("/admintvk01/exams/list");
    } catch (error: any) {
      console.error("Error updating exam:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update exam",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const downloadExamJSON = () => {
    const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);
    const examData = {
      examId,
      title,
      description,
      category,
      isPremium,
      isLocked,
      durationMinutes: totalSectionDuration,
      totalMarks,
      passingMarks,
      negativeMarking,
      shuffleQuestions,
      shuffleOptions,
      isPublished,
      instructions,
      questions,
      sections,
    };

    const blob = new Blob([JSON.stringify(examData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9-_]/gi, "_") || "exam"}-${examId}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const copyExam = async () => {
    try {
      // Create fresh IDs for questions and sections
      const idMap: Record<string, string> = {};
      const newQuestions = questions.map((q) => {
        const newId = `copy_q_${Math.random().toString(36).slice(2,9)}_${Date.now()}`;
        idMap[q.id] = newId;
        return { ...q, id: newId };
      });

      const newSections = sections.map((s) => ({
        ...s,
        id: `copy_s_${Math.random().toString(36).slice(2,9)}_${Date.now()}`,
        questionIds: (s.questionIds || []).map((qid: string) => idMap[qid] || qid),
      }));

      const totalMarks = newQuestions.reduce((sum, q) => sum + (q.marks || 0), 0);

      const payload = {
        title: `Copy of ${title}`,
        description,
        category,
        isPremium,
        durationMinutes: totalSectionDuration,
        totalMarks,
        passingMarks,
        negativeMarking,
        shuffleQuestions,
        shuffleOptions,
        instructions,
        questions: newQuestions,
        sections: newSections,
        isPublished: false,
      };

      const res = await authenticatedFetch(`/api/exam/admintvk01`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to copy exam");
      }

      const data = await res.json();
      const newExamId = data.examId;
      toast({ title: "Success", description: "Exam copied. Opening new exam..." });
      router.push(`/admintvk01/exams/edit/${newExamId}`);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Could not copy exam", variant: "destructive" });
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
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/admintvk01/exams/list")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Edit Exam</h1>
              <p className="text-muted-foreground">Update exam details and questions</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={downloadExamJSON} size="sm">
              Download JSON
            </Button>
            <Button onClick={copyExam} size="sm">
              Copy Exam
            </Button>
          </div>
        </div>

        <Tabs defaultValue="details" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Exam Details</TabsTrigger>
            <TabsTrigger value="questions">
              Questions
              <Badge variant="secondary" className="ml-2">
                {questions.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Exam Details Tab */}
          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Enter the exam title, description, and category
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Exam Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., SEBI Grade A - General Awareness"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the exam"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger id="category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Input
                        value={newCategoryInput}
                        onChange={(e) => setNewCategoryInput(e.target.value)}
                        placeholder="Add new category"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={async () => {
                          try {
                            const normalized = await persistCategoryOption(newCategoryInput);
                            if (!normalized) return;
                            setCategory(normalized);
                            setNewCategoryInput("");
                            toast({ title: "Category Added", description: `${normalized} saved successfully` });
                          } catch (error: any) {
                            toast({
                              title: "Error",
                              description: error.message || "Could not add category",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Total Duration (auto from sections)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={totalSectionDuration}
                      readOnly
                    />
                    <p className="text-xs text-muted-foreground">
                      Set time in the Sections card below. This total updates automatically.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="passing">Passing Marks</Label>
                    <Input
                      id="passing"
                      type="number"
                      min="0"
                      value={passingMarks}
                      onChange={(e) => setPassingMarks(parseInt(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="negative">Negative Marking</Label>
                    <Input
                      id="negative"
                      type="number"
                      min="0"
                      step="0.25"
                      value={negativeMarking}
                      onChange={(e) => setNegativeMarking(parseFloat(e.target.value) || 0)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Fraction of marks deducted for wrong answers
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sections</CardTitle>
                <CardDescription>Define per-section duration and assign questions to each section</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Lazy-load SectionEditor to avoid increasing initial bundle size in other admin pages */}
                <React.Suspense fallback={<div>Loading sections editor...</div>}>
                  {/* @ts-ignore - dynamic import for client component */}
                  <SectionEditorWrapper sections={sections} questions={questions} onChange={setSections} />
                </React.Suspense>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Instructions</CardTitle>
                <CardDescription>
                  Add instructions for students taking the exam
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {instructions.map((instruction, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Instruction ${index + 1}`}
                      value={instruction}
                      onChange={(e) => updateInstruction(index, e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeInstruction(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={addInstruction}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Instruction
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Questions Tab */}
          <TabsContent value="questions" className="space-y-4" ref={questionsContainerRef}>
            <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">Question Bank</p>
                <p className="text-sm text-muted-foreground">
                  Add more questions manually or import from JSON, CSV, or Excel.
                </p>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-[220px]">
                  <Label className="text-xs text-muted-foreground">Add/Import Into Section</Label>
                  <Select value={selectedSectionIdForAdd} onValueChange={setSelectedSectionIdForAdd}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map((section) => (
                        <SelectItem key={section.id} value={section.id}>{section.title || section.id}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <BulkQuestionImportDialog
                  existingCount={questions.length}
                  sections={sections}
                  initialSectionId={selectedSectionIdForAdd}
                  disabled={!selectedSectionIdForAdd}
                  onImport={(importedQuestions, mode, sectionId) => {
                    const target = sectionId || selectedSectionIdForAdd;
                    if (!target) {
                      toast({ title: "Section Required", description: "Please create/select a section first, then import questions.", variant: "destructive" });
                      return;
                    }

                    setQuestions((currentQuestions) => {
                      const newQuestions = mode === "replace"
                        ? importedQuestions
                        : [...currentQuestions, ...importedQuestions];
                      setTimeout(() => {
                        questionsContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }, 100);
                      return newQuestions;
                    });

                    const importedIds = importedQuestions.map((q) => q.id).filter(Boolean);
                    setSections((prev) => {
                      if (mode === "replace") {
                        return prev.map((s) => ({ ...s, questionIds: s.id === target ? importedIds : (s.questionIds || []) }));
                      }
                      return prev.map((s) => s.id === target ? { ...s, questionIds: Array.from(new Set([...(s.questionIds||[]), ...importedIds])) } : s);
                    });
                  }}
                />

                <Button onClick={addQuestion} variant="outline" disabled={!selectedSectionIdForAdd}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>
            </div>

            {questions.map((question, qIndex) => (
              <Card id={`question-card-${question.id}`} key={question.id} className="question-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Question {qIndex + 1}</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeQuestion(qIndex)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Question Text *</Label>
                    <Textarea
                      placeholder="Enter question..."
                      value={question.text}
                      onChange={(e) =>
                        updateQuestion(qIndex, { text: e.target.value })
                      }
                      rows={2}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Options *</Label>
                    {question.options.map((option) => (
                      <div key={option.id} className="flex items-start gap-2">
                        <input
                          type="radio"
                          name={`correct-${question.id}`}
                          checked={question.correctOptionId === option.id}
                          onChange={() =>
                            updateQuestion(qIndex, { correctOptionId: option.id })
                          }
                          className="cursor-pointer mt-3"
                        />
                        <Badge variant="outline" className="min-w-[24px] justify-center mt-2">
                          {option.id.toUpperCase()}
                        </Badge>
                        <Textarea
                          placeholder={`Option ${option.id.toUpperCase()}`}
                          value={option.text}
                          onChange={(e) =>
                            updateOption(qIndex, option.id, e.target.value)
                          }
                          rows={2}
                          className="flex-1 min-h-[60px]"
                        />
                        {question.options.length > 2 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOption(qIndex, option.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 mt-2"
                            title="Remove option"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {question.options.length < 5 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addOption(qIndex)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Option
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Select the correct answer using the radio button (2-5 options allowed)
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Marks</Label>
                      <Input
                        type="number"
                        min="1"
                        value={question.marks}
                        onChange={(e) =>
                          updateQuestion(qIndex, { marks: parseInt(e.target.value) || 1 })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Difficulty</Label>
                      <Select
                        value={question.difficulty}
                        onValueChange={(value) =>
                          updateQuestion(qIndex, { difficulty: value as DifficultyLevel })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Easy">Easy</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Subject/Topic</Label>
                      <Input
                        placeholder="e.g., Economics"
                        value={question.subject}
                        onChange={(e) =>
                          updateQuestion(qIndex, { subject: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Explanation (Optional)</Label>
                    <Textarea
                      placeholder="Explain the correct answer..."
                      value={question.explanation}
                      onChange={(e) =>
                        updateQuestion(qIndex, { explanation: e.target.value })
                      }
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}

            {questions.length > 0 && (
              <div className="sticky bottom-4 z-10 mt-4 flex justify-end">
                <Button onClick={addQuestion} variant="default" disabled={!selectedSectionIdForAdd} className="rounded-full shadow-md">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Next Question
                </Button>
              </div>
            )}

          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Exam Settings</CardTitle>
                <CardDescription>
                  Configure exam behavior and visibility
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Shuffle Questions</Label>
                    <p className="text-sm text-muted-foreground">
                      Randomize question order for each attempt
                    </p>
                  </div>
                  <Switch
                    checked={shuffleQuestions}
                    onCheckedChange={setShuffleQuestions}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Shuffle Options</Label>
                    <p className="text-sm text-muted-foreground">
                      Randomize option order within questions
                    </p>
                  </div>
                  <Switch
                    checked={shuffleOptions}
                    onCheckedChange={setShuffleOptions}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Premium Exam</Label>
                    <p className="text-sm text-muted-foreground">
                      Show exam to all users but allow attempt only for premium users
                    </p>
                  </div>
                  <Switch
                    checked={isPremium}
                    onCheckedChange={setIsPremium}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Locked Exam</Label>
                    <p className="text-sm text-muted-foreground">
                      Show exam to all users but block attempts until unlocked
                    </p>
                  </div>
                  <Switch
                    checked={isLocked}
                    onCheckedChange={setIsLocked}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Publish Exam</Label>
                    <p className="text-sm text-muted-foreground">
                      Make exam visible to students
                    </p>
                  </div>
                  <Switch
                    checked={isPublished}
                    onCheckedChange={setIsPublished}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Questions:</span>
                  <span className="font-medium">{questions.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Marks:</span>
                  <span className="font-medium">
                    {questions.reduce((sum, q) => sum + q.marks, 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Passing Marks:</span>
                  <span className="font-medium">{passingMarks}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium">{totalSectionDuration} minutes</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Access:</span>
                  <Badge variant={isPremium ? "secondary" : "outline"}>
                    {isPremium ? "Premium Only Attempt" : "Open to All"}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Lock:</span>
                  <Badge variant={isLocked ? "secondary" : "outline"}>
                    {isLocked ? "Locked" : "Unlocked"}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={isPublished ? "default" : "secondary"}>
                    {isPublished ? "Published" : "Draft"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex gap-4 mt-6">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.push("/admintvk01/exams/list")}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Updating..." : "Update Exam"}
          </Button>
        </div>
      </div>
    </div>
  );
}

