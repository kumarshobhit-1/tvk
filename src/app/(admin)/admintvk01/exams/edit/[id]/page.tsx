"use client";

import { authenticatedFetch } from "@/lib/api-client";

import { useState, useEffect } from "react";
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

export default function EditExamPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;
  const { user, loading: authLoading } = useRequireAuth();
  const { toast } = useToast();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("SEBI");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [passingMarks, setPassingMarks] = useState(40);
  const [negativeMarking, setNegativeMarking] = useState(0.25);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [instructions, setInstructions] = useState<string[]>([]);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);

  useEffect(() => {
    document.title = "Edit Exam - Admin | The Victory Key";
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;

    const checkAdminAndLoad = async () => {
      try {
        const response = await fetch("/api/exam/admintvk01?examId=test");
        if (response.status === 403) {
          router.push("/");
          return;
        }
        setIsAdmin(true);
        await loadExam();
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
      setDurationMinutes(exam.durationMinutes);
      setPassingMarks(exam.passingMarks);
      setNegativeMarking(exam.negativeMarking);
      setShuffleQuestions(exam.shuffleQuestions);
      setShuffleOptions(exam.shuffleOptions);
      setIsPublished(exam.isPublished);
      setInstructions(exam.instructions || []);
      setQuestions(exam.questions || []);
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
    const newQuestion: ExamQuestion = {
      id: `q${questions.length + 1}_${Date.now()}`,
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
    setQuestions(questions.filter((_, i) => i !== index));
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

    if (questions.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one question is required",
        variant: "destructive",
      });
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
        durationMinutes,
        totalMarks,
        passingMarks,
        negativeMarking,
        shuffleQuestions,
        shuffleOptions,
        isPublished,
        instructions,
        questions,
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

  if (authLoading || loading) {
    return <Loading />;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
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
                        <SelectItem value="SEBI">SEBI</SelectItem>
                        <SelectItem value="Banking">Banking</SelectItem>
                        <SelectItem value="SSC">SSC</SelectItem>
                        <SelectItem value="UPSC">UPSC</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 60)}
                    />
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
          <TabsContent value="questions" className="space-y-4">
            {questions.map((question, qIndex) => (
              <Card key={question.id}>
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

            <Button onClick={addQuestion} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
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
                  <span className="font-medium">{durationMinutes} minutes</span>
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

