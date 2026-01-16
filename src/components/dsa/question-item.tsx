// src/components/dsa/question-item.tsx

"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ExternalLink, CheckCircle2 } from "lucide-react";
import type { DsaQuestion } from "@/lib/types";
import ProtectedLink from "@/components/ui/protected-link";

interface QuestionItemProps {
  question: DsaQuestion;
  isDone: boolean;
  onToggle: (questionId: string, done: boolean) => void;
}

export function QuestionItem({ question, isDone, onToggle }: QuestionItemProps) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg transition-colors hover:bg-secondary/50">
      <div className="flex items-center gap-4">
        <CheckCircle2 className={`h-6 w-6 transition-colors ${isDone ? 'text-green-500' : 'text-muted-foreground/50'}`} />
        <div>
          <h3 className="font-medium text-base">{question.title}</h3>
          <div className="flex items-center gap-4 mt-1">
            {question.resources.map(link => {
              // --- बदलाव यहाँ है: Secure ID बनाएँ ---
              const secureId = `${question.id}-${link.name.toLowerCase().replace(/\s/g, '-')}`;
              return (
                <ProtectedLink
                  key={link.name}
                  // --- और href को API रूट पर पॉइंट करें ---
                  href={`/api/redirect?id=${secureId}`}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  {link.name}
                  <ExternalLink className="h-3 w-3" />
                </ProtectedLink>
              );
            })}
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id={`switch-${question.id}`}
          checked={isDone}
          onCheckedChange={(checked) => onToggle(question.id, checked)}
          aria-label={`Mark ${question.title} as done`}
        />
        <Label htmlFor={`switch-${question.id}`} className="hidden sm:inline">{isDone ? "Done" : "Todo"}</Label>
      </div>
    </div>
  );
}