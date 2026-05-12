"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { AlertCircle, FileJson2, FileSpreadsheet, Upload } from "lucide-react";

import type { DifficultyLevel, ExamQuestion, ExamSection } from "@/lib/exam-types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ImportMode = "append" | "replace";

interface BulkQuestionImportDialogProps {
  onImport: (questions: ExamQuestion[], mode: ImportMode, sectionId?: string) => void;
  existingCount?: number;
  triggerLabel?: string;
  sections?: ExamSection[];
  initialSectionId?: string;
  disabled?: boolean;
}

const OPTION_IDS = ["a", "b", "c", "d", "e"];

function normalizeDifficulty(value: unknown): DifficultyLevel {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "easy") return "Easy";
  if (normalized === "hard") return "Hard";
  return "Medium";
}

function normalizeObjectKeys(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entryValue]) => [
      key.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_"),
      entryValue,
    ])
  );
}

function getFirstValue(source: Record<string, unknown>, aliases: string[]) {
  for (const alias of aliases) {
    if (source[alias] !== undefined && source[alias] !== null && String(source[alias]).trim() !== "") {
      return source[alias];
    }
  }
  return undefined;
}

function toTextArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (entry && typeof entry === "object") {
          const normalized = normalizeObjectKeys(entry);
          const text = getFirstValue(normalized, ["text", "label", "value", "option", "content"]);
          return text == null ? "" : String(text).trim();
        }

        return String(entry ?? "").trim();
      })
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n|\s*\|\s*|\s*;\s*/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function resolveCorrectOptionId(source: Record<string, unknown>, options: string[]): string | null {
  const optionIds = OPTION_IDS.slice(0, options.length);
  const rawValue = getFirstValue(source, [
    "correctoptionid",
    "correct_option_id",
    "correctoption",
    "correct_option",
    "answer",
    "correctanswer",
    "correct_answer",
    "correctindex",
    "correct_option_index",
  ]);

  if (rawValue === undefined || rawValue === null || String(rawValue).trim() === "") {
    return null;
  }

  const normalized = String(rawValue).trim().toLowerCase();
  if (optionIds.includes(normalized)) {
    return normalized;
  }

  const numericValue = Number(normalized);
  if (!Number.isNaN(numericValue)) {
    if (numericValue >= 1 && numericValue <= optionIds.length) {
      return optionIds[numericValue - 1] || null;
    }

    if (numericValue >= 0 && numericValue < optionIds.length) {
      return optionIds[numericValue] || null;
    }
  }

  const matchedByText = options.findIndex((option) => option.trim().toLowerCase() === normalized);
  if (matchedByText >= 0) {
    return optionIds[matchedByText] || null;
  }

  return null;
}

function parseQuestionRows(rows: unknown[]): { questions: ExamQuestion[]; errors: string[] } {
  const questions: ExamQuestion[] = [];
  const errors: string[] = [];

  rows.forEach((row, index) => {
    const normalized = normalizeObjectKeys(row);
    const questionText = String(
      getFirstValue(normalized, ["question", "question_text", "text", "prompt", "statement"]) || ""
    ).trim();

    const optionsSource = getFirstValue(normalized, ["options", "choices", "answers", "answer_options"]) ?? normalized;
    const options = toTextArray(optionsSource);

    if (options.length === 0) {
      const optionValues = OPTION_IDS.map((optionId) =>
        getFirstValue(normalized, [
          `option_${optionId}`,
          `option${optionId}`,
          `opt_${optionId}`,
          `choice_${optionId}`,
          optionId,
        ])
      )
        .map((value) => String(value ?? "").trim())
        .filter(Boolean);

      options.push(...optionValues);
    }

    if (!questionText) {
      errors.push(`Row ${index + 1}: question text is missing`);
      return;
    }

    if (options.length < 2 || options.length > 5) {
      errors.push(`Row ${index + 1}: question must have between 2 and 5 options`);
      return;
    }

    const correctOptionId = resolveCorrectOptionId(normalized, options);
    if (!correctOptionId) {
      errors.push(`Row ${index + 1}: correct option is missing or invalid`);
      return;
    }

    const marksValue = Number(getFirstValue(normalized, ["marks", "score"])) || 1;
    const difficulty = normalizeDifficulty(getFirstValue(normalized, ["difficulty", "level"]));
    const explanationValue = getFirstValue(normalized, ["explanation", "reason", "solution"]);
    const subjectValue = getFirstValue(normalized, ["subject", "topic", "chapter"]);
    const imageUrlValue = getFirstValue(normalized, ["imageurl", "image_url", "photo", "photo_url", "question_image", "question_image_url"]);

    questions.push({
      id: `q_${Date.now()}_${index + 1}`,
      text: questionText,
      imageUrl: imageUrlValue == null ? "" : String(imageUrlValue).trim(),
      options: options.map((optionText, optionIndex) => ({
        id: OPTION_IDS[optionIndex] || `${optionIndex + 1}`,
        text: optionText,
      })),
      correctOptionId,
      explanation: explanationValue == null ? "" : String(explanationValue),
      marks: Number.isFinite(marksValue) && marksValue > 0 ? marksValue : 1,
      difficulty,
      subject: subjectValue == null ? "" : String(subjectValue),
    });
  });

  return { questions, errors };
}

async function parseFile(file: File) {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return { questions: [], errors: ["The Excel file does not contain any sheets."] };
    }

    const sheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    return parseQuestionRows(rows);
  }

  const text = await file.text();
  return parseText(text);
}

function parseText(text: string) {
  const trimmed = text.trim();

  if (!trimmed) {
    return { questions: [], errors: ["Paste data or choose a file before importing."] };
  }

  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      const rows = Array.isArray(parsed)
        ? parsed
        : Array.isArray((parsed as { questions?: unknown[] })?.questions)
          ? (parsed as { questions: unknown[] }).questions
          : [];

      if (!rows.length) {
        return { questions: [], errors: ["JSON must be an array of questions or contain a questions array."] };
      }

      return parseQuestionRows(rows);
    } catch {
      return { questions: [], errors: ["Invalid JSON format."] };
    }
  }

  try {
    const workbook = XLSX.read(trimmed, { type: "string" });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return { questions: [], errors: ["Unable to read tabular data from the pasted text."] };
    }

    const sheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    return parseQuestionRows(rows);
  } catch {
    return { questions: [], errors: ["Paste JSON or CSV formatted data."] };
  }
}

export default function BulkQuestionImportDialog({
  onImport,
  existingCount = 0,
  triggerLabel = "Bulk Upload Questions",
  sections,
  initialSectionId,
  disabled,
}: BulkQuestionImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ImportMode>("append");
  const [textValue, setTextValue] = useState("");
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [source, setSource] = useState<"file" | "paste">("file");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const propsInitial = initialSectionId || (sections && sections[0]?.id) || "";
  const [targetSectionId, setTargetSectionId] = useState<string>(propsInitial);

  const resetForm = () => {
    setTextValue("");
    setFileName("");
    setSelectedFile(null);
    setErrorMessage("");
    setLoading(false);
    setMode("append");
    setSource("file");
    setTargetSectionId(propsInitial ?? "");
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      resetForm();
    }
  };

  const runImport = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const result =
        source === "file"
          ? selectedFile
            ? await parseFile(selectedFile)
            : { questions: [], errors: ["Choose a JSON, CSV, or Excel file first."] }
          : parseText(textValue);

      if (result.errors.length) {
        setErrorMessage(result.errors.join("\n"));
        return;
      }

      if (!result.questions.length) {
        setErrorMessage("No questions were detected in the import data.");
        return;
      }

      onImport(result.questions, mode, targetSectionId);
      handleOpenChange(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to import questions.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={!!disabled}>
          <Upload className="h-4 w-4 mr-2" />
          {triggerLabel}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Upload Questions</DialogTitle>
          <DialogDescription>
            Import questions from JSON, CSV, or Excel and choose whether to append them or replace the current set.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-y-auto">
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setMode("append")}
              className={`rounded-lg border p-4 text-left transition ${mode === "append" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/60"}`}
            >
              <div className="flex items-center gap-2 font-medium">
                <FileJson2 className="h-4 w-4" />
                Append
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Add imported questions after the existing {existingCount} question{existingCount === 1 ? "" : "s"}.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setMode("replace")}
              className={`rounded-lg border p-4 text-left transition ${mode === "replace" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/60"}`}
            >
              <div className="flex items-center gap-2 font-medium">
                <FileSpreadsheet className="h-4 w-4" />
                Replace all
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Clear the current question list and replace it with the imported file.
              </p>
            </button>
          </div>

          <div className="mb-4">
            <Label>Import Into Section</Label>
            <div className="mt-2">
              <Select value={targetSectionId} onValueChange={(v) => setTargetSectionId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder={sections && sections.length ? "Select section" : "No sections available"} />
                </SelectTrigger>
                <SelectContent>
                  {(sections || []).map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.title || s.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs value={source} onValueChange={(value) => setSource(value as "file" | "paste")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file">Upload File</TabsTrigger>
              <TabsTrigger value="paste">Paste Data</TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="space-y-3 pt-4">
              <div className="space-y-2">
                <Label htmlFor="bulk-file">Choose JSON, CSV, or Excel file</Label>
                <Input
                  id="bulk-file"
                  type="file"
                  accept=".json,.csv,.xlsx,.xls"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    setSelectedFile(file);
                    setFileName(file?.name || "");
                    setErrorMessage("");
                  }}
                />
                {fileName ? (
                  <p className="text-sm text-muted-foreground">
                    Selected file: <span className="font-medium text-foreground">{fileName}</span>
                  </p>
                ) : null}
              </div>
            </TabsContent>

            <TabsContent value="paste" className="space-y-3 pt-4">
              <div className="space-y-2">
                <Label htmlFor="bulk-paste">Paste JSON or CSV data</Label>
                <Textarea
                  id="bulk-paste"
                  value={textValue}
                  onChange={(event) => {
                    setTextValue(event.target.value);
                    setErrorMessage("");
                  }}
                  rows={6}
                  placeholder={`JSON example:\n[\n  {\n    "question": "What is SEBI?",\n    "options": ["Regulator", "Bank", "Exchange", "Broker"],\n    "correctOptionId": "a"\n  }\n]`}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <AlertCircle className="h-4 w-4" />
              Supported fields
            </div>
            <p className="mt-2">
              <span className="font-medium text-foreground">Required:</span> <span className="font-medium text-foreground">question</span>, <span className="font-medium text-foreground">options</span>, <span className="font-medium text-foreground">correctOptionId</span>
            </p>
            <p className="mt-2">
              <span className="font-medium text-foreground">Optional:</span> <span className="font-medium text-foreground">explanation</span>, <span className="font-medium text-foreground">marks</span>, <span className="font-medium text-foreground">difficulty</span> (defaults to Medium), <span className="font-medium text-foreground">subject</span>
            </p>
            <p className="mt-2">
              CSV and Excel sheets can also use columns like <span className="font-medium text-foreground">option_a</span> through <span className="font-medium text-foreground">option_e</span> and <span className="font-medium text-foreground">correct_option</span>.
            </p>
          </div>

          {errorMessage ? (
            <div className="whitespace-pre-line rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}
        </div>

        <DialogFooter className="flex-shrink-0 pt-4 border-t">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={runImport} disabled={loading || (!(sections && sections.length) || !targetSectionId)}>
            {loading ? "Importing..." : "Import Questions"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
