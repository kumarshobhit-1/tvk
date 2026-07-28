import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDB } from "@/lib/firebase/firebase-admin";
import type { Exam, ExamAttempt, ExamResult } from "@/lib/exam-types";

function computePenalty(negativeMarking: number | undefined, questionMarks: number): number {
  return typeof negativeMarking === 'number' ? negativeMarking : 0;
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);

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

    // Prevent IDOR: user can fetch only own result
    if (attempt.userId !== decodedToken.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

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

    const sectionsSnapshot = (attempt as any).sectionsSnapshot || exam.sections || [];

    const getQuestionScoring = (questionId: string, q: any) => {
      let correctMarks = q.marks ?? 1;
      let negativeMarking = exam.negativeMarking ?? 0;

      const section = sectionsSnapshot.find((s: any) => {
        const qIds = s.questionIds || s.questions?.map((qi: any) => qi.id) || [];
        return qIds.includes(questionId);
      });

      if (section) {
        if (typeof section.correctMarks === 'number') {
          correctMarks = section.correctMarks;
        }
        if (typeof section.negativeMarking === 'number') {
          negativeMarking = section.negativeMarking;
        }
      }

      return { correctMarks, negativeMarking };
    };

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
      sections: sectionsSnapshot,
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

        const { correctMarks, negativeMarking } = getQuestionScoring(answer.questionId, question);

        const isCorrect = answer.selectedOptionId === question.correctOptionId;
        const marksAwarded = !answer.selectedOptionId
          ? 0
          : isCorrect
          ? correctMarks
          : -computePenalty(negativeMarking, correctMarks);

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
