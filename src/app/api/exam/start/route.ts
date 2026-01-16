import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/firebase-admin";
import type { Exam, ExamAttempt, ExamQuestion } from "@/lib/exam-types";

export async function POST(request: NextRequest) {
  try {
    const { examId, userId, userEmail, userName } = await request.json();

    if (!userId || !userEmail || !userName) {
      return NextResponse.json({ error: "User information required" }, { status: 400 });
    }

    if (!examId) {
      return NextResponse.json({ error: "Exam ID required" }, { status: 400 });
    }

    // Get exam details
    const examSnap = await adminDB.collection("exams").doc(examId).get();

    if (!examSnap.exists) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    const exam = examSnap.data() as Exam;

    if (!exam.isPublished) {
      return NextResponse.json({ error: "Exam not available" }, { status: 403 });
    }

    // Check if exam is emergency stopped
    if (exam.emergencyStopped || !exam.isActive) {
      return NextResponse.json({ 
        error: "Exam is currently stopped by admin", 
        emergencyStopped: true 
      }, { status: 403 });
    }

    // Check if user already has submitted attempts for this exam
    const existingAttempts = await adminDB.collection("exam_attempts")
      .where("examId", "==", examId)
      .where("userId", "==", userId)
      .where("status", "==", "submitted")
      .get();

    // Count total attempts and check pass status
    const attemptsList = existingAttempts.docs.map(doc => doc.data() as ExamAttempt);
    const passedAttempt = attemptsList.find(a => a.passed);
    
    // If user has passed, don't allow retake
    if (passedAttempt) {
      return NextResponse.json(
        { 
          error: "You have already passed this exam",
          passed: true,
          attemptId: existingAttempts.docs.find(doc => doc.data().passed)?.id
        },
        { status: 403 }
      );
    }

    // Check attempt limit (max 3 attempts)
    if (attemptsList.length >= 3) {
      return NextResponse.json(
        { 
          error: "Maximum attempt limit reached (3 attempts)",
          attempts: attemptsList.length,
          maxAttempts: 3
        },
        { status: 403 }
      );
    }

    // Check if user has an in-progress attempt
    const inProgressAttempts = await adminDB.collection("exam_attempts")
      .where("examId", "==", examId)
      .where("userId", "==", userId)
      .where("status", "==", "in-progress")
      .get();

    if (!inProgressAttempts.empty) {
      // Return the existing in-progress attempt
      const existingAttempt = inProgressAttempts.docs[0];
      const attemptData = existingAttempt.data() as ExamAttempt;
      
      const startTime = attemptData.startedAt && typeof attemptData.startedAt === 'object' && 'toDate' in attemptData.startedAt
        ? attemptData.startedAt.toDate().getTime()
        : (typeof attemptData.startedAt === 'number' ? attemptData.startedAt : Date.now());
      
      const questionsWithoutAnswers = exam.questions.map((q) => ({
        id: q.id,
        text: q.text,
        options: q.options,
        marks: q.marks,
        difficulty: q.difficulty,
        subject: q.subject,
      }));

      return NextResponse.json({
        attemptId: existingAttempt.id,
        startedAt: startTime,
        expiresAt: startTime + exam.durationMinutes * 60 * 1000,
        questions: questionsWithoutAnswers,
        exam: {
          id: examId,
          title: exam.title,
          description: exam.description,
          durationMinutes: exam.durationMinutes,
          totalMarks: exam.totalMarks,
          passingMarks: exam.passingMarks,
          negativeMarking: exam.negativeMarking,
          instructions: exam.instructions,
        },
      });
    }

    // Shuffle questions if required
    let questions = [...exam.questions];
    if (exam.shuffleQuestions) {
      questions = shuffleArray(questions);
    }

    // Shuffle options if required
    if (exam.shuffleOptions) {
      questions = questions.map((q) => ({
        ...q,
        options: shuffleArray([...q.options]),
      }));
    }

    // Create attempt
    const currentTime = new Date();
    const attemptData: Omit<ExamAttempt, "id"> = {
      examId,
      userId,
      userName,
      userEmail,
      startedAt: currentTime as any,
      answers: questions.map((q) => ({
        questionId: q.id,
        selectedOptionId: null,
        isFlagged: false,
      })),
      status: "in-progress",
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    };

    const attemptRef = await adminDB.collection("exam_attempts").add(attemptData);

    // Return attempt ID, start time, and questions (without correct answers)
    const questionsWithoutAnswers = questions.map((q) => ({
      id: q.id,
      text: q.text,
      options: q.options,
      marks: q.marks,
      difficulty: q.difficulty,
      subject: q.subject,
      // Don't send correctOptionId or explanation
    }));

    const startTime = currentTime.getTime();
    
    return NextResponse.json({
      attemptId: attemptRef.id,
      startedAt: startTime,
      expiresAt: startTime + exam.durationMinutes * 60 * 1000,
      questions: questionsWithoutAnswers,
      exam: {
        id: examId,
        title: exam.title,
        description: exam.description,
        durationMinutes: exam.durationMinutes,
        totalMarks: exam.totalMarks,
        passingMarks: exam.passingMarks,
        negativeMarking: exam.negativeMarking,
        instructions: exam.instructions,
      },
    });
  } catch (error) {
    console.error("Error starting exam:", error);
    return NextResponse.json(
      { error: "Failed to start exam" },
      { status: 500 }
    );
  }
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
