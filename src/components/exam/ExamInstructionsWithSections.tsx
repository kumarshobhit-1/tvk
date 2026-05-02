"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Info, Clock, BookOpen, Trophy, CheckCircle2 } from "lucide-react";

interface Section {
  id: string;
  title: string;
  durationMinutes: number;
  questionCount?: number;
  questionIds?: string[];
  questions?: Array<{ id: string; marks: number }>;
}

interface ExamInfo {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  negativeMarking: number;
  instructions: string[];
  questionCount?: number;
  category?: string;
  isPremium?: boolean;
}

interface ExamInstructionsWithSectionsProps {
  examInfo: ExamInfo;
  sections?: Section[];
  onStart: () => void;
  loading?: boolean;
  agreedToInstructions?: boolean;
  onAgreedChange?: (agreed: boolean) => void;
  showReadyButton?: boolean;
  showAgreementCheckbox?: boolean;
  disabled?: boolean;
}

export function ExamInstructionsWithSections({
  examInfo,
  sections = [],
  onStart,
  loading = false,
  agreedToInstructions = false,
  onAgreedChange,
  showReadyButton = true,
  showAgreementCheckbox = true,
  disabled = false,
}: ExamInstructionsWithSectionsProps) {
  const hasSections = sections && sections.length > 0;
  const safeExam: ExamInfo = examInfo || {
    id: "",
    title: "",
    description: "",
    durationMinutes: 0,
    totalMarks: 0,
    passingMarks: 0,
    negativeMarking: 0,
    instructions: [],
    questionCount: 0,
    category: "",
    isPremium: false,
  };

  const totalQuestions = hasSections
    ? sections.reduce((sum, s) => sum + (s.questionCount || s.questionIds?.length || s.questions?.length || 0), 0)
    : (safeExam.questionCount || 0);

  const getMaxScoreForSection = (section: Section) => {
    if (section.questions) {
      return section.questions.reduce((sum, q) => sum + q.marks, 0);
    }
    const questionCount = section.questionCount ?? section.questionIds?.length ?? 0;
    if (questionCount === 0) return 0;
    return Math.round(((questionCount) / (totalQuestions || 1)) * safeExam.totalMarks);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Official Header */}
      <div className="border-b-4 border-blue-800 pb-4 text-center">
        <h1 className="text-2xl font-bold text-blue-900 dark:text-blue-100">THE VICTORY KEY</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Online Examination System</p>
      </div>

      {/* Important Notice */}
      <Alert className="border-2 border-red-500 bg-red-50 dark:bg-red-950">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertTitle className="text-red-800 dark:text-red-200 font-bold">IMPORTANT NOTICE</AlertTitle>
        <AlertDescription className="text-red-900 dark:text-red-100 mt-2">
          <ul className="list-disc list-inside space-y-1">
            <li>Please read all instructions carefully before starting the exam</li>
            <li>Once you click "I AM READY TO BEGIN", the exam will start and the timer will begin</li>
            <li>Do NOT close or refresh your browser window during the exam</li>
            <li>Closing the tab/window may result in exam termination</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Exam Details Card */}
      <Card className="border-2 border-gray-300">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-b-2 border-gray-300">
          <div className="space-y-2">
            <CardTitle className="text-2xl text-blue-900 dark:text-blue-100">{safeExam.title || examInfo?.title || 'Exam'}</CardTitle>
            <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="text-sm">{safeExam.category || "Exam"}</Badge>
                {safeExam.isPremium && <Badge variant="secondary">Premium</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          
          {/* Exam Overview Grid */}
          <div>
            <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-4 text-lg underline">EXAMINATION DETAILS</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border-2 border-gray-300 p-4 rounded bg-gray-50 dark:bg-gray-800">
                <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Total Questions</div>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{totalQuestions}</div>
              </div>
              <div className="border-2 border-gray-300 p-4 rounded bg-gray-50 dark:bg-gray-800">
                <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Total Marks</div>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{safeExam.totalMarks}</div>
              </div>
              <div className="border-2 border-gray-300 p-4 rounded bg-gray-50 dark:bg-gray-800">
                <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Duration</div>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{safeExam.durationMinutes} min</div>
              </div>
              <div className="border-2 border-gray-300 p-4 rounded bg-gray-50 dark:bg-gray-800">
                <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Passing Marks</div>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{safeExam.passingMarks}</div>
              </div>
            </div>
          </div>
              <li>Total of {safeExam.durationMinutes} minutes ({Math.floor(safeExam.durationMinutes / 60)} hour) duration will be given to attempt all the questions</li>

          {/* Sections Table (if sections exist) */}
          {hasSections && (
            <div>
              <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-4 text-lg underline">SECTION-WISE DETAILS</h3>
              <div className="overflow-x-auto border-2 border-gray-300 rounded">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-blue-900 dark:bg-blue-800 text-white">
                      <th className="border border-gray-300 px-4 py-3 text-left font-bold">S. No.</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-bold">Section Name</th>
                      <th className="border border-gray-300 px-4 py-3 text-center font-bold">No. of Questions</th>
                      <th className="border border-gray-300 px-4 py-3 text-center font-bold">Max Marks</th>
                      <th className="border border-gray-300 px-4 py-3 text-center font-bold">Duration (min)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sections.map((section, idx) => {
                      const sectionQCount = section.questionCount ?? section.questionIds?.length ?? section.questions?.length ?? 0;
                      const maxScore = getMaxScoreForSection(section);
                      return (
                        <tr key={section.id} className={idx % 2 === 0 ? "bg-gray-50 dark:bg-gray-800" : ""}>
                          <td className="border border-gray-300 px-4 py-3 font-semibold">{idx + 1}</td>
                          <td className="border border-gray-300 px-4 py-3 font-medium">{section.title}</td>
                          <td className="border border-gray-300 px-4 py-3 text-center">{sectionQCount}</td>
                          <td className="border border-gray-300 px-4 py-3 text-center">{maxScore}</td>
                          <td className="border border-gray-300 px-4 py-3 text-center font-semibold">{section.durationMinutes}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* General Instructions */}
          <div>
            <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-4 text-lg underline">GENERAL INSTRUCTIONS</h3>
            <ol className="list-decimal space-y-3 text-sm text-gray-800 dark:text-gray-200 ml-5">
              <li>The clock will be set at the server. The countdown timer in the top right corner of the screen will display the remaining time available for you to complete the examination.</li>
              
              <li>When the timer reaches zero, the examination will end automatically. You will NOT be required to end or submit your examination manually.</li>
              
              {hasSections && (
                <li>
                  <strong>SECTION-WISE TIMERS:</strong>
                  <ul className="list-disc space-y-1 mt-2 ml-4">
                    <li>Each section has a separate timer as mentioned above</li>
                    <li>When a section timer expires, you will automatically be moved to the next section</li>
                    <li>You CANNOT go back to previous sections once they are completed</li>
                    <li>Ensure you answer all questions in a section before the timer expires</li>
                  </ul>
                </li>
              )}

              <li>The Question Palette displayed on the right side of the screen shows the status of each question using the following indicators:
                <div className="mt-3 space-y-2 ml-4">
                  <div className="flex items-center gap-3 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                    <div className="w-8 h-8 border-2 border-gray-400 rounded flex items-center justify-center text-xs font-bold">1</div>
                    <span><strong>Not Visited:</strong> You have not visited this question yet</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-red-100 dark:bg-red-900 rounded">
                    <div className="w-8 h-8 rounded bg-red-500 flex items-center justify-center text-xs font-bold text-white">3</div>
                    <span><strong>Not Answered (Red):</strong> You have visited but not answered</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-green-100 dark:bg-green-900 rounded">
                    <div className="w-8 h-8 rounded bg-green-500 flex items-center justify-center text-xs font-bold text-white">5</div>
                    <span><strong>Answered (Green):</strong> You have answered this question</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-purple-100 dark:bg-purple-900 rounded">
                    <div className="w-8 h-8 rounded bg-purple-500 flex items-center justify-center text-xs font-bold text-white">7</div>
                    <span><strong>Marked for Review (Purple):</strong> Question flagged for later review</span>
                  </div>
                </div>
              </li>

              <li><strong>Marking Scheme:</strong>
                <ul className="list-disc space-y-1 mt-2 ml-4">
                    <li>Correct Answer: +{totalQuestions > 0 ? (safeExam.totalMarks / totalQuestions).toFixed(2) : 0} marks</li>
                    <li>Wrong Answer: -{totalQuestions > 0 ? (safeExam.negativeMarking * (safeExam.totalMarks / totalQuestions)).toFixed(2) : 0} marks</li>
                  <li>Unanswered: 0 marks</li>
                </ul>
              </li>

              <li>The 'Marked for Review' status indicates you wish to review that question later. If a question is answered and marked for review, your answer will be considered for evaluation.</li>

              <li><strong>Navigation and Selection:</strong>
                <ul className="list-decimal space-y-1 mt-2 ml-4">
                  <li>Click on any question number in the Question Palette to navigate directly to that question</li>
                  <li>To select an answer, click on the option button</li>
                  <li>To deselect an answer, click on the selected option again or click <strong>CLEAR RESPONSE</strong></li>
                  <li>To change an answer, click on a different option</li>
                  <li>Click <strong>SAVE & NEXT</strong> to save your answer and move to the next question</li>
                  <li>Click <strong>MARK FOR REVIEW & NEXT</strong> to mark a question for review</li>
                </ul>
              </li>

              <li>You can collapse the Question Palette by clicking the collapse icon to get more screen space for the question.</li>

              <li><strong>IMPORTANT:</strong> Do NOT use your browser's back button, refresh button, or close the window. This may cause loss of data or exam termination.</li>
            </ol>
          </div>

          {/* Agreement Checkbox */}
          {showAgreementCheckbox && typeof onAgreedChange === "function" && (
            <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-950 border-2 border-yellow-300 dark:border-yellow-700 rounded">
              <input
                type="checkbox"
                id="agree"
                checked={agreedToInstructions}
                onChange={(e) => onAgreedChange(e.target.checked)}
                className="mt-1 cursor-pointer w-5 h-5"
              />
              <label htmlFor="agree" className="text-sm text-gray-800 dark:text-gray-200 cursor-pointer leading-relaxed">
                <strong>I have read and understood all the instructions above.</strong> I understand the exam format, marking scheme, section-wise timers, and navigation rules. I am aware that closing or refreshing the browser may terminate my exam.
              </label>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ready Button */}
      {showReadyButton && (
        <div className="flex justify-center py-4">
          <Button
            onClick={onStart}
            disabled={disabled || loading || (typeof agreedToInstructions !== "undefined" && !agreedToInstructions)}
            size="lg"
            className="px-16 py-6 text-lg font-bold bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
          >
            {loading ? "Starting Exam..." : "I AM READY TO BEGIN"}
          </Button>
        </div>
      )}
    </div>
  );
}
