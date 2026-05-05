import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDB } from "@/lib/firebase/firebase-admin";
import { RateLimiter, RATE_LIMITS } from "@/lib/rate-limiter";
import type { Exam, ExamAttempt, ExamQuestion } from "@/lib/exam-types";
import { hasPremiumAccess } from "@/lib/premium-access";

const startExamLimiter = new RateLimiter(RATE_LIMITS.general);

export async function POST(request: NextRequest) {
  try {
    if (!startExamLimiter.isAllowed(request)) {
      return NextResponse.json({ error: RATE_LIMITS.general.message }, { status: 429 });
    }
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
    const userId = decodedToken.uid;

    const { examId } = await request.json();

    const userDoc = await adminDB.collection("users").doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : undefined;
    const userEmail = userData?.email || decodedToken.email || "";
    const userName = userData?.displayName || decodedToken.name || "User";

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
    const premiumUser = Boolean(userData?.isPremium === true || userData?.premium === true);
    const explicitExamIds: string[] = Array.isArray((userData as any)?.allowedExamIds)
      ? (userData as any).allowedExamIds.map((s: any) => String(s || "").trim()).filter(Boolean)
      : [];
    const explicitExamAccess = premiumUser && explicitExamIds.length > 0
      ? explicitExamIds.includes(examId)
      : null;
    const premiumAccessForExam = explicitExamAccess === null
      ? hasPremiumAccess(userData, exam.category)
      : explicitExamAccess;

    if (exam.isPremium && !premiumAccessForExam) {
      return NextResponse.json(
        {
          error: `Premium access required for ${exam.category || "this course"}`,
          code: "PREMIUM_REQUIRED",
        },
        { status: 403 }
      );
    }

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
      // Return the existing in-progress attempt (supporting sections)
      const existingAttempt = inProgressAttempts.docs[0];
      const attemptData = existingAttempt.data() as ExamAttempt;

      const startTime = attemptData.startedAt && typeof attemptData.startedAt === 'object' && 'toDate' in attemptData.startedAt
        ? attemptData.startedAt.toDate().getTime()
        : (typeof attemptData.startedAt === 'number' ? attemptData.startedAt : Date.now());

      // Build sections response for in-progress attempt (compatible with new sections schema)
      const sectionsData = (exam.sections && Array.isArray(exam.sections) && exam.sections.length > 0)
        ? exam.sections
        : [{ id: 's1', title: 'Section 1', durationMinutes: exam.durationMinutes, questionIds: exam.questions.map((q:any) => q.id) }];

      const sections = sectionsData.map((s: any) => {
        const qList = (s.questionIds || (s.questions && s.questions.map((q:any) => q.id)) || []);
        const questionsForSection = qList.map((qid: string) => {
          const q = exam.questions.find((qq: any) => qq.id === qid);
          if (!q) return null;
          return {
            id: q.id,
            text: q.text,
            options: q.options,
            marks: q.marks,
            difficulty: q.difficulty,
            subject: q.subject,
          };
        }).filter(Boolean);

        return {
          id: s.id || `s-${Math.random().toString(36).slice(2,8)}`,
          title: s.title || 'Section',
          durationMinutes: s.durationMinutes || 0,
          questions: questionsForSection,
        };
      });

      return NextResponse.json({
        attemptId: existingAttempt.id,
        startedAt: startTime,
        // client will manage per-section timers; provide section durations and grouped questions
        sections,
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

    // Prepare sections (either provided or single section fallback)
    const sectionsData = (exam.sections && Array.isArray(exam.sections) && exam.sections.length > 0)
      ? exam.sections
      : [{ id: 's1', title: 'Section 1', durationMinutes: exam.durationMinutes, questionIds: exam.questions.map((q:any) => q.id) }];

    // Build flattened ordered questions array preserving section grouping
    let questions: any[] = [];
    const sectionsSnapshot: any[] = [];

    for (const s of sectionsData) {
      const qIds = s.questionIds || (s.questions && s.questions.map((q:any) => q.id)) || [];
      const questionsForSection = qIds.map((qid: string) => exam.questions.find((qq: any) => qq.id === qid)).filter(Boolean);
      sectionsSnapshot.push({ id: s.id || `s-${Math.random().toString(36).slice(2,8)}`, title: s.title || 'Section', durationMinutes: s.durationMinutes || 0, questions: questionsForSection.map((q:any) => ({ id: q.id, marks: q.marks })) });
      questions = questions.concat(questionsForSection);
    }

    // Shuffle questions if required (within flattened order)
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

    // Create attempt with question snapshot for safety
    const currentTime = new Date();
    const questionsSnapshot = questions.map((q) => ({
      id: q.id,
      text: q.text,
      options: q.options,
      correctOptionId: q.correctOptionId,
      explanation: q.explanation,
      marks: q.marks,
      difficulty: q.difficulty,
      subject: q.subject,
    }));

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
    } as any;

    // Add questionsSnapshot for reference
    (attemptData as any).questionsSnapshot = questionsSnapshot;
    // Add sections snapshot so client can render per-section timers and grouped questions
    (attemptData as any).sectionsSnapshot = sectionsSnapshot;

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

    // Group questions per section for client consumption
    const sectionsForClient = sectionsSnapshot.map((s) => ({
      id: s.id,
      title: s.title,
      durationMinutes: s.durationMinutes,
      questions: s.questions.map((qs: any) => {
        const q = questionsWithoutAnswers.find((qq: any) => qq.id === qs.id);
        return q;
      }).filter(Boolean),
    }));

    const startTime = currentTime.getTime();

    return NextResponse.json({
      attemptId: attemptRef.id,
      startedAt: startTime,
      // client will manage per-section timers; provide grouped sections
      sections: sectionsForClient,
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
