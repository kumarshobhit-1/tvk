"use client";

import { useState, useEffect } from "react";
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
import type { ExamQuestion, ExamOption, DifficultyLevel } from "@/lib/exam-types";

export default function AdminExamsPage() {
  const router = useRouter();
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
  const [instructions, setInstructions] = useState<string[]>([
    "Read each question carefully",
    "Select the best answer",
    "You can navigate between questions",
    "Negative marking applies for wrong answers",
  ]);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);

  useEffect(() => {
    document.title = "Create Exam - Admin | The Victory Key";
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
      } catch (error) {
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [user, authLoading, router]);

  const addQuestion = () => {
    const newQuestion: ExamQuestion = {
      id: `q${questions.length + 1}`,
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
      const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

      const examData = {
        title,
        description,
        category,
        type: "timed",
        durationMinutes,
        totalMarks,
        passingMarks,
        negativeMarking,
        shuffleQuestions,
        shuffleOptions,
        instructions,
        questions,
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
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
                    <Input
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="SEBI, Stock Market, etc."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
                      min={1}
                    />
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

          <TabsContent value="questions" className="space-y-4">
            {questions.map((question, qIndex) => (
              <Card key={qIndex}>
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
                        <div key={option.id} className="flex gap-2 items-center">
                          <Input
                            value={option.text}
                            onChange={(e) =>
                              updateOption(qIndex, option.id, e.target.value)
                            }
                            placeholder={`Option ${option.id.toUpperCase()}`}
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
                        </div>
                      ))}
                    </div>
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

            <Button onClick={addQuestion} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
