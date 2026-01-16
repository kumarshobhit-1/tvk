"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flag, CheckCircle2, BookmarkCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExamQuestion, ExamOption } from "@/lib/exam-types";

interface QuestionCardProps {
  question: ExamQuestion & { options: ExamOption[] };
  questionNumber: number;
  totalQuestions: number;
  selectedOptionId: string | null;
  isFlagged: boolean;
  isMarkedForReview?: boolean;
  onSelectOption: (optionId: string) => void;
  onToggleFlag: () => void;
  onClearAnswer?: () => void;
  onToggleReview?: () => void;
  showCorrectAnswer?: boolean;
  correctOptionId?: string;
}

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedOptionId,
  isFlagged,
  isMarkedForReview = false,
  onSelectOption,
  onToggleFlag,
  onClearAnswer,
  onToggleReview,
  showCorrectAnswer = false,
  correctOptionId,
}: QuestionCardProps) {
  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">
              Question {questionNumber} / {totalQuestions}
            </Badge>
            <Badge variant={question.difficulty === "Easy" ? "default" : question.difficulty === "Medium" ? "secondary" : "destructive"}>
              {question.difficulty}
            </Badge>
            {question.subject && (
              <Badge variant="outline">{question.subject}</Badge>
            )}
            {isMarkedForReview && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
                <BookmarkCheck className="h-3 w-3 mr-1" />
                Marked for Review
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleFlag}
              className={cn(isFlagged && "text-yellow-500")}
              title="Flag this question"
            >
              <Flag className={cn("h-4 w-4", isFlagged && "fill-current")} />
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-lg font-medium leading-relaxed">{question.text}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Marks: {question.marks}
          </p>
        </div>

        {/* Action Buttons */}
        {!showCorrectAnswer && onClearAnswer && onToggleReview && (
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleReview}
              className={cn(
                "flex items-center gap-2",
                isMarkedForReview && "bg-purple-100 border-purple-500 dark:bg-purple-900"
              )}
            >
              <BookmarkCheck className="h-4 w-4" />
              {isMarkedForReview ? "Unmark Review" : "Mark for Review"}
            </Button>
            {selectedOptionId && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearAnswer}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <X className="h-4 w-4" />
                Clear Answer
              </Button>
            )}
          </div>
        )}

        <div className="space-y-3">
          {question.options.map((option, index) => {
            const isSelected = selectedOptionId === option.id;
            const isCorrect = showCorrectAnswer && option.id === correctOptionId;
            const isWrong = showCorrectAnswer && isSelected && option.id !== correctOptionId;

            return (
              <button
                key={option.id}
                onClick={() => !showCorrectAnswer && onSelectOption(option.id)}
                disabled={showCorrectAnswer}
                className={cn(
                  "w-full text-left p-4 rounded-lg border-2 transition-all",
                  "hover:border-primary hover:bg-accent",
                  isSelected && !showCorrectAnswer && "border-primary bg-accent",
                  isCorrect && "border-green-500 bg-green-50 dark:bg-green-950",
                  isWrong && "border-red-500 bg-red-50 dark:bg-red-950",
                  !isSelected && !isCorrect && !isWrong && "border-border"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full border-2 flex-shrink-0",
                      isSelected && !showCorrectAnswer && "border-primary bg-primary text-primary-foreground",
                      isCorrect && "border-green-500 bg-green-500 text-white",
                      isWrong && "border-red-500 bg-red-500 text-white",
                      !isSelected && !isCorrect && !isWrong && "border-muted-foreground"
                    )}
                  >
                    {isCorrect ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <span className="font-semibold">
                        {String.fromCharCode(65 + index)}
                      </span>
                    )}
                  </div>
                  <span className="flex-1">{option.text}</span>
                </div>
              </button>
            );
          })}
        </div>

        {showCorrectAnswer && question.explanation && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Explanation:
            </p>
            <p className="text-blue-800 dark:text-blue-200">{question.explanation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
