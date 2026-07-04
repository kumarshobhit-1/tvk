import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDB, FieldValue, increment } from "@/lib/firebase/firebase-admin";
import type { Exam, ExamAttempt, ExamAnswer } from "@/lib/exam-types";

function computePenalty(negativeMarking: number | undefined, questionMarks: number): number {
  const nm = typeof negativeMarking === 'number' ? negativeMarking : 0;
  // If admin supplied an absolute penalty (>=1), treat it as absolute marks to subtract.
  // Otherwise treat it as a fraction of question marks (e.g., 0.25 means 0.25 * marks).
  if (nm >= 1) return nm;
  return nm * questionMarks;
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);

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

    // Prevent IDOR: user can submit only own attempt
    if (attempt.userId !== decodedToken.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    
    // Get exam details
    const examSnap = await adminDB.collection("exams").doc(attempt.examId).get();

    if (!examSnap.exists) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    const exam = examSnap.data() as Exam;

    // If this attempt was already submitted, return the existing result instead of failing again.
    if (attempt.status === "submitted") {
      return NextResponse.json({
        success: true,
        attemptId,
        score: attempt.score ?? 0,
        totalMarks: exam.totalMarks,
        correctAnswers: attempt.correctAnswers ?? 0,
        wrongAnswers: attempt.wrongAnswers ?? 0,
        unanswered: attempt.unanswered ?? 0,
        percentage: attempt.percentage ?? 0,
        passed: attempt.passed ?? false,
        timeTaken: attempt.timeTaken ?? 0,
        alreadySubmitted: true,
      });
    }

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
        score -= computePenalty(exam.negativeMarking, question.marks);
      }

      return answer;
    });

    const percentage = (score / exam.totalMarks) * 100;
    const passingPercentage = (exam.passingMarks / exam.totalMarks) * 100;
    const passed = percentage >= passingPercentage;

    const userRef = adminDB.collection("users").doc(decodedToken.uid);
    const statsRef = adminDB.collection("system_config").doc("platform_stats");

    const transactionResult = await adminDB.runTransaction(async (transaction) => {
      const [latestAttemptSnap, userSnap, statsSnap] = await Promise.all([
        transaction.get(adminDB.collection("exam_attempts").doc(attemptId)),
        transaction.get(userRef),
        transaction.get(statsRef),
      ]);

      if (!latestAttemptSnap.exists) {
        throw new Error("Attempt not found");
      }

      const latestAttempt = latestAttemptSnap.data() as ExamAttempt;

      if (latestAttempt.userId !== decodedToken.uid) {
        throw new Error("Unauthorized");
      }

      if (latestAttempt.status === "submitted") {
        return {
          alreadySubmitted: true,
          attempt: latestAttempt,
        };
      }

      // Use per-user flags and atomic increments instead of scanning the entire collection.
      // This avoids large collection reads which were causing excessive Firestore charges.
      let uniqueExamTakers = Number(statsSnap.data()?.uniqueExamTakers || 0);
      let uniquePassedUsers = Number(statsSnap.data()?.uniquePassedUsers || 0);

      const userHasSubmittedBefore = Boolean(userSnap.exists && userSnap.data()?.hasSubmittedExam === true);
      const isFirstTimeExamTaker = !userHasSubmittedBefore;

      const userHasPassedBefore = Boolean(userSnap.exists && userSnap.data()?.hasPassed === true);
      const isFirstTimePassed = !userHasPassedBefore && passed;

      const nextUniqueExamTakers = uniqueExamTakers + (isFirstTimeExamTaker ? 1 : 0);
      const nextUniquePassedUsers = uniquePassedUsers + (isFirstTimePassed ? 1 : 0);
      const successRate = nextUniqueExamTakers > 0 ? Math.round((nextUniquePassedUsers / nextUniqueExamTakers) * 100) : 0;

      transaction.update(adminDB.collection("exam_attempts").doc(attemptId), {
        submittedAt,
        answers: updatedAnswers,
        examTitle: exam.title,        // ADD THIS
        examCategory: exam.category,  // ADD THIS
        examPremium: exam.isPremium,  // ADD THIS
        score,
        correctAnswers,
        wrongAnswers,
        unanswered,
        percentage,
        timeTaken,
        passed,
        status: "submitted",
      });

    // Update user flags and atomically increment counters in stats doc.
    transaction.set(
      userRef,
      {
        hasSubmittedExam: true,
        firstExamSubmittedAt: userSnap.exists && userSnap.data()?.firstExamSubmittedAt ? userSnap.data()?.firstExamSubmittedAt : submittedAt,
        hasPassed: passed || userSnap.data()?.hasPassed || false,
      },
      { merge: true }
    );

    // Update exam counters (denormalized) to avoid scanning exam_attempts.
    // This decrements ONLY activeCount (in-progress attempts) when a submission happens.
    const countersRef = adminDB.collection("exams").doc(attempt.examId);
    transaction.set(
      countersRef,
      {
        activeCount: FieldValue.increment(-1),
        countersUpdatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Prepare platform stats updates: keep existing global behavior unchanged.
    const statsUpdate: any = {
      updatedAt: submittedAt,
    };

    if (isFirstTimeExamTaker) {
      statsUpdate.uniqueExamTakers = FieldValue ? FieldValue.increment(1) : (increment ? increment(1) : 1);
    }

    if (isFirstTimePassed) {
      statsUpdate.uniquePassedUsers = FieldValue ? FieldValue.increment(1) : (increment ? increment(1) : 1);
    }

    transaction.set(statsRef, statsUpdate, { merge: true });


      return {
        alreadySubmitted: false,
        score,
        correctAnswers,
        wrongAnswers,
        unanswered,
        percentage,
        passed,
        timeTaken,
      };
    });

    if (transactionResult?.alreadySubmitted) {
      const existingAttempt = transactionResult.attempt as ExamAttempt;
      return NextResponse.json({
        success: true,
        attemptId,
        score: existingAttempt.score ?? 0,
        totalMarks: exam.totalMarks,
        correctAnswers: existingAttempt.correctAnswers ?? 0,
        wrongAnswers: existingAttempt.wrongAnswers ?? 0,
        unanswered: existingAttempt.unanswered ?? 0,
        percentage: existingAttempt.percentage ?? 0,
        passed: existingAttempt.passed ?? false,
        timeTaken: existingAttempt.timeTaken ?? 0,
        alreadySubmitted: true,
      });
    }

    return NextResponse.json({
      success: true,
      attemptId,
      score: transactionResult.score,
      totalMarks: exam.totalMarks,
      correctAnswers: transactionResult.correctAnswers,
      wrongAnswers: transactionResult.wrongAnswers,
      unanswered: transactionResult.unanswered,
      percentage: transactionResult.percentage,
      passed: transactionResult.passed,
      timeTaken: transactionResult.timeTaken,
    });
  } catch (error) {
    console.error("Error submitting exam:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to submit exam";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
