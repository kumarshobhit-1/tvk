import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/firebase-admin";
import type { Exam, ExamAttempt, ExamAnswer } from "@/lib/exam-types";

export async function POST(request: NextRequest) {
  try {
    const { attemptId, answers } = await request.json();

    if (!attemptId || !answers) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get attempt
    const attemptSnap = await adminDB.collection("exam_attempts").doc(attemptId).get();

    if (!attemptSnap.exists) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    const attempt = attemptSnap.data() as ExamAttempt;

    // Skip user verification for now - in production, verify userId from session
    
    // Check if already submitted
    if (attempt.status === "submitted") {
      return NextResponse.json({ error: "Already submitted" }, { status: 400 });
    }

    // Get exam details
    const examSnap = await adminDB.collection("exams").doc(attempt.examId).get();

    if (!examSnap.exists) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    const exam = examSnap.data() as Exam;
    const submittedAt = new Date();
    const startTime = attempt.startedAt && typeof attempt.startedAt === 'object' && 'toDate' in attempt.startedAt
      ? attempt.startedAt.toDate().getTime()
      : (typeof attempt.startedAt === 'number' ? attempt.startedAt : Date.now());
    const timeTaken = Math.floor((submittedAt.getTime() - startTime) / 1000);

    // Validate time limit
    const maxTime = exam.durationMinutes * 60;
    if (timeTaken > maxTime + 10) { // 10 seconds grace period
      return NextResponse.json({ error: "Time limit exceeded" }, { status: 400 });
    }

    // Use questionsSnapshot if available (for safety), otherwise fall back to current exam
    const questionsToScore = (attempt as any).questionsSnapshot || exam.questions;

    // Calculate score
    let score = 0;
    let correctAnswers = 0;
    let wrongAnswers = 0;
    let unanswered = 0;

    const updatedAnswers: ExamAnswer[] = answers.map((answer: ExamAnswer) => {
      const question = questionsToScore.find((q: any) => q.id === answer.questionId);
      if (!question) return answer;

      if (!answer.selectedOptionId) {
        unanswered++;
      } else if (answer.selectedOptionId === question.correctOptionId) {
        score += question.marks;
        correctAnswers++;
      } else {
        wrongAnswers++;
        score -= exam.negativeMarking * question.marks;
      }

      return answer;
    });

    const percentage = (score / exam.totalMarks) * 100;
    const passingPercentage = (exam.passingMarks / exam.totalMarks) * 100;
    const passed = percentage >= passingPercentage;

    // Update attempt
    await adminDB.collection("exam_attempts").doc(attemptId).update({
      submittedAt,
      answers: updatedAnswers,
      score,
      correctAnswers,
      wrongAnswers,
      unanswered,
      percentage,
      timeTaken,
      passed,
      status: "submitted",
    });

    return NextResponse.json({
      success: true,
      attemptId,
      score,
      totalMarks: exam.totalMarks,
      correctAnswers,
      wrongAnswers,
      unanswered,
      percentage,
      passed,
      timeTaken,
    });
  } catch (error) {
    console.error("Error submitting exam:", error);
    return NextResponse.json(
      { error: "Failed to submit exam" },
      { status: 500 }
    );
  }
}
