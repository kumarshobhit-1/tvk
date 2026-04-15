import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/firebase-admin";
import type { Exam, ExamAttempt, ExamResult } from "@/lib/exam-types";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const attemptId = searchParams.get("attemptId");

    if (!attemptId) {
      return NextResponse.json({ error: "Attempt ID required" }, { status: 400 });
    }

    // Use admin SDK to bypass security rules
    const attemptRef = adminDB.collection("exam_attempts").doc(attemptId);
    const attemptSnap = await attemptRef.get();

    if (!attemptSnap.exists) {
      return NextResponse.json({ 
        error: "Result not found", 
        message: "This exam result no longer exists or has been deleted.",
        type: "NOT_FOUND"
      }, { status: 404 });
    }

    const attempt = { id: attemptSnap.id, ...attemptSnap.data() } as ExamAttempt & { id: string };

    // Check if submitted
    if (attempt.status !== "submitted") {
      return NextResponse.json({ error: "Exam not submitted yet" }, { status: 400 });
    }

    // Get exam details using admin SDK
    const examRef = adminDB.collection("exams").doc(attempt.examId);
    const examSnap = await examRef.get();

    if (!examSnap.exists) {
      return NextResponse.json({ 
        error: "Exam not found", 
        message: "The exam for this result has been deleted by the administrator.",
        type: "EXAM_DELETED"
      }, { status: 404 });
    }

    const exam = { id: examSnap.id, ...examSnap.data() } as Exam & { id: string };

    // Build detailed result
    const result: ExamResult = {
      attemptId: attempt.id,
      examId: exam.id,
      examTitle: exam.title,
      userId: attempt.userId,
      userName: attempt.userName,
      score: attempt.score || 0,
      totalMarks: exam.totalMarks,
      correctAnswers: attempt.correctAnswers || 0,
      wrongAnswers: attempt.wrongAnswers || 0,
      unanswered: attempt.unanswered || 0,
      percentage: attempt.percentage || 0,
      passed: attempt.passed || false,
      timeTaken: attempt.timeTaken || 0,
      submittedAt: attempt.submittedAt!,
      answers: attempt.answers.map((answer) => {
        // Use questionsSnapshot if available (for safety), otherwise fall back to current exam
        const questionsToUse = (attempt as any).questionsSnapshot || exam.questions;
        const question = questionsToUse?.find((q: any) => q.id === answer.questionId);
        
        if (!question) {
          // Fallback if question not found
          return {
            questionId: answer.questionId || "",
            questionText: "Question not found",
            selectedOptionId: answer.selectedOptionId,
            correctOptionId: "",
            isCorrect: false,
            marksAwarded: 0,
            explanation: "",
            options: [],
          };
        }

        const isCorrect = answer.selectedOptionId === question.correctOptionId;
        const marksAwarded = !answer.selectedOptionId
          ? 0
          : isCorrect
          ? question.marks
          : -exam.negativeMarking * question.marks;

        return {
          questionId: question.id,
          questionText: question.text,
          selectedOptionId: answer.selectedOptionId,
          correctOptionId: question.correctOptionId,
          isCorrect,
          marksAwarded,
          explanation: question.explanation || "",
          options: question.options,
        };
      }),
    };

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error("Error fetching result:", error);
    return NextResponse.json(
      { 
        error: "Server error",
        message: "Unable to load exam result. Please try again later.",
        type: "SERVER_ERROR"
      },
      { status: 500 }
    );
  }
}
