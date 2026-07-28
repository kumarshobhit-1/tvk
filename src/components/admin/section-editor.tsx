"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus } from "lucide-react";

export type Section = {
  id: string;
  title: string;
  durationMinutes: number;
  questionIds: string[];
  correctMarks?: number;
  negativeMarking?: number;
  passingMarks?: number;
};

interface Props {
  sections: Section[];
  questions: { id: string; text?: string }[];
  onChange: (next: Section[]) => void;
}

export default function SectionEditor({ sections, questions, onChange }: Props) {
  const normalizeMinutes = (value: string | number) => {
    const numeric = typeof value === "number" ? value : Number(String(value).trim());
    if (!Number.isFinite(numeric) || numeric < 0) return 0;
    return Math.round(numeric);
  };

  const updateSection = (index: number, patch: Partial<Section>) => {
    const next = sections.map((s, i) => (i === index ? { ...s, ...patch } : s));
    onChange(next);
  };

  const [localState, setLocalState] = useState<Record<string, { title: string; duration: string }>>({});

  useEffect(() => {
    const next: Record<string, { title: string; duration: string }> = {};
    for (const s of sections) {
      next[s.id] = { title: s.title ?? "", duration: String(normalizeMinutes(s.durationMinutes ?? 0)) };
    }
    setLocalState(next);
  }, [sections]);

  const addSection = () => {
    const id = `s${sections.length + 1}_${Date.now().toString(36).slice(2,8)}`;
    onChange([...sections, { id, title: `Section ${sections.length + 1}`, durationMinutes: 0, questionIds: [] }]);
  };

  const removeSection = (index: number) => {
    const next = sections.filter((_, i) => i !== index);
    onChange(next);
  };

  const toggleQuestionInSection = (sectionIndex: number, qid: string) => {
    const s = sections[sectionIndex];
    if (!s) return;
    const has = s.questionIds.includes(qid);
    const nextQIds = has ? s.questionIds.filter(id => id !== qid) : [...s.questionIds, qid];
    updateSection(sectionIndex, { questionIds: nextQIds });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Sections</h3>
        <Button variant="outline" size="sm" onClick={addSection}>
          <Plus className="h-4 w-4 mr-2" /> Add Section
        </Button>
      </div>

      {sections.map((s, i) => (
        <div key={s.id} className="rounded border p-4 space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="space-y-1">
              <Label>Title <span className="text-red-500">*</span></Label>
              <Input
                value={localState[s.id]?.title ?? ""}
                onChange={(e) => setLocalState((prev) => ({ ...prev, [s.id]: { ...(prev[s.id] || {}), title: e.target.value } }))}
                onBlur={() => updateSection(i, { title: localState[s.id]?.title ?? "" })}
              />
            </div>
            <div className="space-y-1">
              <Label>Duration (mins) <span className="text-red-500">*</span></Label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={localState[s.id]?.duration ?? "0"}
                onChange={(e) => {
                  const digitsOnly = e.target.value.replace(/[^0-9]/g, "");
                  const nextDuration = digitsOnly === "" ? 0 : normalizeMinutes(digitsOnly);
                  setLocalState((prev) => ({ ...prev, [s.id]: { ...(prev[s.id] || {}), duration: digitsOnly } }));
                  updateSection(i, { durationMinutes: nextDuration });
                }}
                onBlur={() => {
                  const raw = localState[s.id]?.duration ?? "0";
                  const num = normalizeMinutes(raw);
                  updateSection(i, { durationMinutes: num });
                }}
              />
            </div>
            <div className="space-y-1">
              <Label>Correct Marks <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                value={s.correctMarks !== undefined && s.correctMarks !== null ? s.correctMarks : ""}
                onChange={(e) => {
                  const val = e.target.value === "" ? undefined : (parseFloat(e.target.value) || 0);
                  updateSection(i, { correctMarks: val });
                }}
                placeholder="e.g. 1"
              />
            </div>
            <div className="space-y-1">
              <Label>Neg Marking <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                type="number"
                step="0.05"
                value={s.negativeMarking !== undefined && s.negativeMarking !== null ? s.negativeMarking : ""}
                onChange={(e) => {
                  const val = e.target.value === "" ? undefined : (parseFloat(e.target.value) || 0);
                  updateSection(i, { negativeMarking: val });
                }}
                placeholder="e.g. 0.25"
              />
            </div>
            <div className="space-y-1">
              <Label>Passing Marks <span className="text-red-500">*</span></Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={s.passingMarks !== undefined && s.passingMarks !== null ? s.passingMarks : ""}
                  onChange={(e) => {
                    const val = e.target.value === "" ? undefined : (parseFloat(e.target.value) || 0);
                    updateSection(i, { passingMarks: val });
                  }}
                  placeholder="e.g. 15"
                  className="flex-1"
                />
                <Button variant="ghost" size="icon" onClick={() => removeSection(i)} title="Remove section" className="mb-0.5 shrink-0">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div>
            <Label>Assign Questions</Label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-auto border rounded p-2">
              {questions
                .filter((q) => {
                  const isAssignedToOther = sections.some(
                    (otherSec, otherIdx) => otherIdx !== i && (otherSec.questionIds || []).includes(q.id)
                  );
                  return !isAssignedToOther;
                })
                .map((q) => (
                  <label key={q.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={(s.questionIds || []).includes(q.id)}
                      onChange={() => toggleQuestionInSection(i, q.id)}
                      className="cursor-pointer"
                    />
                    <span className="text-sm truncate">{q.text ? q.text.slice(0,80) : q.id}</span>
                  </label>
                ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
