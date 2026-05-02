"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
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
import { Plus, Trash2, Save, X, List } from "lucide-react";
import { authenticatedFetch } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/components/ui/loading";
import type { ExamQuestion, ExamOption, DifficultyLevel, ExamSection } from "@/lib/exam-types";
import BulkQuestionImportDialog from "@/components/admin/bulk-question-import-dialog";

const DEFAULT_CATEGORY_OPTIONS = ["SEBI", "JEE", "BANKING", "SSC", "UPSC"];

function normalizeCategory(value: string) {
  return value.trim().toUpperCase();
}

const SectionEditorWrapper = dynamic(
  () => import("@/components/admin/section-editor").then((mod) => ({ default: (props: any) => React.createElement(mod.default, props) })),
  { ssr: false }
);

export default function AdminExamsPage() {
  const router = useRouter();
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
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [instructions, setInstructions] = useState<string[]>([
    "Read each question carefully",
    "Select the best answer",
    "You can navigate between questions",
    "Negative marking applies for wrong answers",
  ]);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [sections, setSections] = useState<ExamSection[]>([]);
  const [selectedSectionIdForAdd, setSelectedSectionIdForAdd] = useState("");

  const totalSectionDuration = useMemo(
    () => sections.reduce((sum, s) => sum + (Number.isFinite(s.durationMinutes) ? s.durationMinutes : 0), 0),
    [sections]
  );

  const normalizeDurationMinutes = (value: unknown) => {
    const numeric = typeof value === "number" ? value : Number(String(value ?? "").trim());
    if (!Number.isFinite(numeric) || numeric < 0) return 0;
    return Math.round(numeric);
  };

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

  useEffect(() => {
    if (sections.length === 0) {
      setSelectedSectionIdForAdd("");
      return;
    }

    const stillExists = sections.some((s) => s.id === selectedSectionIdForAdd);
    if (!stillExists) {
      setSelectedSectionIdForAdd(sections[0]?.id || "");
    }
  }, [sections, selectedSectionIdForAdd]);

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
    document.title = "Create Exam - Admin | The Victory Key";
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;

    const checkAdmin = async () => {
      try {
        const response = await authenticatedFetch("/api/exam/admintvk01?examId=test");
        if (response.status === 403) {
          router.push("/");
          return;
        }
        setIsAdmin(true);
        await loadCategoryOptions();
      } catch (error) {
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [user, authLoading, router]);

  const addQuestion = () => {
    if (!selectedSectionIdForAdd) {
      toast({
        title: "Section Required",
        description: "Please create/select a section first, then add questions.",
        variant: "destructive",
      });
      return;
    }

    const newQuestionId = `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newQuestion: ExamQuestion = {
      id: newQuestionId,
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
    setQuestions([...questions, newQuestion]);
    setSections((prev) =>
      prev.map((s) =>
        s.id === selectedSectionIdForAdd
          ? { ...s, questionIds: Array.from(new Set([...(s.questionIds || []), newQuestionId])) }
          : s
      )
    );
    
    // Scroll to the newly added question
    setTimeout(() => {
      const questionsContainer = questionsContainerRef.current;
      if (questionsContainer) {
        // Find the last question card and scroll to it
        const lastQuestionCard = questionsContainer.querySelector(".question-card:last-child");
        if (lastQuestionCard) {
          lastQuestionCard.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    }, 100);
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
      setSections((prev) => prev.map((s) => ({ ...s, questionIds: (s.questionIds || []).filter((id) => id !== removed.id) })));
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

  const handleSave = async () => {
    // Validation
    if (!title.trim()) {
      toast({
        title: "Validation Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    if (!category.trim()) {
      toast({
        title: "Validation Error",
        description: "Category is required",
        variant: "destructive",
      });
      return;
    }

    if (questions.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one question is required",
        variant: "destructive",
      });
      return;
    }

    // Validate all questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        toast({
          title: "Validation Error",
          description: `Question ${i + 1} text is required`,
          variant: "destructive",
        });
        return;
      }
      if (q.options.some((opt) => !opt.text.trim())) {
        toast({
          title: "Validation Error",
          description: `All options for Question ${i + 1} must be filled`,
          variant: "destructive",
        });
        return;
      }
    }

    setSaving(true);

    try {
      // Sections validation: require at least one section and ensure each has questions
      if (!Array.isArray(sections) || sections.length === 0) {
        toast({ title: "Validation Error", description: "At least one section is required", variant: "destructive" });
        setSaving(false);
        return;
      }

      const normalizedSections = sections.map((section, index) => ({
        ...section,
        durationMinutes: normalizeDurationMinutes(section.durationMinutes),
        questionIds: Array.isArray(section.questionIds) ? section.questionIds.filter(Boolean) : [],
      }));

      for (let si = 0; si < normalizedSections.length; si++) {
        const s = normalizedSections[si] as any;
        if (!Array.isArray(s.questionIds) || s.questionIds.length === 0) {
          toast({ title: "Validation Error", description: `Section ${si + 1} must have at least one question`, variant: "destructive" });
          setSaving(false);
          return;
        }
        if (s.durationMinutes <= 0) {
          toast({ title: "Validation Error", description: `Section ${si + 1} must have a valid duration`, variant: "destructive" });
          setSaving(false);
          return;
        }
      }
      const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

      const examData = {
        title,
        description,
        category,
        isPremium,
        type: "timed",
        durationMinutes: normalizedSections.reduce((sum, s) => sum + s.durationMinutes, 0),
        totalMarks,
        passingMarks,
        negativeMarking,
        shuffleQuestions,
        shuffleOptions,
        instructions,
        questions,
        sections: normalizedSections,
        isPublished,
      };

      const response = await authenticatedFetch("/api/exam/admintvk01", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(examData),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("API Error:", result);
        throw new Error(result.error || "Failed to create exam");
      }

      toast({
        title: "Success",
        description: "Exam created successfully!",
      });

      router.push("/exam");
    } catch (error: any) {
      console.error("Error saving exam:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create exam",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
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
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Create New Exam</h1>
            <p className="text-muted-foreground">Build a new exam for students</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/admintvk01/exams/list")}>
              <List className="h-4 w-4 mr-2" />
              View All Exams
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Exam"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="sections">Sections</TabsTrigger>
            <TabsTrigger value="questions">
              Questions ({questions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Exam Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., SEBI Grade A Mock Test 2025"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of the exam"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
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
                      Set time in the Sections tab. This total updates automatically.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Exam Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="passing">Passing Marks</Label>
                    <Input
                      id="passing"
                      type="number"
                      value={passingMarks}
                      onChange={(e) => setPassingMarks(parseInt(e.target.value) || 0)}
                      min={0}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="negative">Negative Marking (per mark)</Label>
                    <Input
                      id="negative"
                      type="number"
                      step="0.25"
                      value={negativeMarking}
                      onChange={(e) => setNegativeMarking(parseFloat(e.target.value) || 0)}
                      min={0}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="shuffle-q">Shuffle Questions</Label>
                      <p className="text-sm text-muted-foreground">
                        Randomize question order for each attempt
                      </p>
                    </div>
                    <Switch
                      id="shuffle-q"
                      checked={shuffleQuestions}
                      onCheckedChange={setShuffleQuestions}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="shuffle-o">Shuffle Options</Label>
                      <p className="text-sm text-muted-foreground">
                        Randomize option order for each question
                      </p>
                    </div>
                    <Switch
                      id="shuffle-o"
                      checked={shuffleOptions}
                      onCheckedChange={setShuffleOptions}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="premium">Premium Exam</Label>
                      <p className="text-sm text-muted-foreground">
                        Visible to everyone, but only premium users can attempt
                      </p>
                    </div>
                    <Switch
                      id="premium"
                      checked={isPremium}
                      onCheckedChange={setIsPremium}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="published">Publish Exam</Label>
                      <p className="text-sm text-muted-foreground">
                        Make exam visible to students
                      </p>
                    </div>
                    <Switch
                      id="published"
                      checked={isPublished}
                      onCheckedChange={setIsPublished}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Instructions</Label>
                  <div className="space-y-2">
                    {instructions.map((inst, i) => (
                      <div key={i} className="flex gap-2">
                        <Input
                          value={inst}
                          onChange={(e) => {
                            const newInst = [...instructions];
                            newInst[i] = e.target.value;
                            setInstructions(newInst);
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setInstructions(instructions.filter((_, idx) => idx !== i));
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={() => setInstructions([...instructions, ""])}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Instruction
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sections" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sections</CardTitle>
                <CardDescription>Define exam sections, per-section durations and assign questions.</CardDescription>
              </CardHeader>
              <CardContent>
                <SectionEditorWrapper sections={sections} questions={questions} onChange={setSections} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questions" className="space-y-4" ref={questionsContainerRef}>
            <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">Question Bank</p>
                <p className="text-sm text-muted-foreground">
                  Add questions manually or import them in bulk from JSON, CSV, or Excel.
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
                        <SelectItem key={section.id} value={section.id}>
                          {section.title || section.id}
                        </SelectItem>
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
                    const targetSection = sectionId || selectedSectionIdForAdd;
                    if (!targetSection) {
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
                    setSections((prevSections) => {
                      if (mode === "replace") {
                        return prevSections.map((s) => ({
                          ...s,
                          questionIds: s.id === targetSection ? importedIds : (s.questionIds || []),
                        }));
                      }

                      return prevSections.map((s) =>
                        s.id === targetSection
                          ? { ...s, questionIds: Array.from(new Set([...(s.questionIds || []), ...importedIds])) }
                          : s
                      );
                    });
                  }}
                />
                <Button onClick={addQuestion} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>
            </div>

            {questions.map((question, qIndex) => (
              <Card key={qIndex} className="question-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Question {qIndex + 1}</CardTitle>
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
                      value={question.text}
                      onChange={(e) =>
                        updateQuestion(qIndex, { text: e.target.value })
                      }
                      placeholder="Enter question text"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Marks</Label>
                      <Input
                        type="number"
                        value={question.marks}
                        onChange={(e) =>
                          updateQuestion(qIndex, { marks: parseInt(e.target.value) || 1 })
                        }
                        min={1}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Difficulty</Label>
                      <Select
                        value={question.difficulty}
                        onValueChange={(value: DifficultyLevel) =>
                          updateQuestion(qIndex, { difficulty: value })
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
                        value={question.subject || ""}
                        onChange={(e) =>
                          updateQuestion(qIndex, { subject: e.target.value })
                        }
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Options *</Label>
                    <div className="space-y-2">
                      {question.options.map((option) => (
                        <div key={option.id} className="flex gap-2 items-start">
                          <Textarea
                            value={option.text}
                            onChange={(e) =>
                              updateOption(qIndex, option.id, e.target.value)
                            }
                            placeholder={`Option ${option.id.toUpperCase()}`}
                            rows={2}
                            className="flex-1 min-h-[60px]"
                          />
                          <Button
                            variant={
                              question.correctOptionId === option.id
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() =>
                              updateQuestion(qIndex, { correctOptionId: option.id })
                            }
                          >
                            {question.correctOptionId === option.id ? "✓ Correct" : "Mark Correct"}
                          </Button>
                          {question.options.length > 2 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeOption(qIndex, option.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                              title="Remove option"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
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
                  </div>

                  <div className="space-y-2">
                    <Label>Explanation (Optional)</Label>
                    <Textarea
                      value={question.explanation || ""}
                      onChange={(e) =>
                        updateQuestion(qIndex, { explanation: e.target.value })
                      }
                      placeholder="Explain the correct answer"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}

          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
