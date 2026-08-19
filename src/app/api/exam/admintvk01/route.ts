import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/firebase-admin";
import type { Exam } from "@/lib/exam-types";
import { verifyAdminPermission } from "@/lib/auth-helpers";
import { CacheKeys, getCache } from "@/lib/cache-strategy";
import { z } from "zod";

function normalizeCategory(value: unknown) {
  return String(value || "").trim().toUpperCase();
}

function normalizeBoolean(value: unknown, defaultValue = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return ["true", "1", "yes", "on"].includes(value.trim().toLowerCase());
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  return defaultValue;
}

function deriveDurationFromSections(sections: any[] | undefined, fallback = 60) {
  if (!Array.isArray(sections) || sections.length === 0) return fallback;
  const total = sections.reduce((sum, s) => {
    const minutes = typeof s?.durationMinutes === "number" && Number.isFinite(s.durationMinutes)
      ? s.durationMinutes
      : 0;
    return sum + Math.max(0, minutes);
  }, 0);
  return total;
}

function ensureQuestionIdsForUpdate(questions: any[] = []) {
  return questions.map((q, idx) => ({
    ...q,
    id: q?.id && String(q.id).trim() ? String(q.id) : `legacy_q_${idx + 1}_${Date.now()}`,
  }));
}

function buildFallbackSections(questions: any[] = [], fallbackDuration = 60) {
  const ids = questions.map((q) => q?.id).filter(Boolean);
  if (ids.length === 0) return [];
  return [
    {
      id: "default-section",
      title: "General",
      durationMinutes: fallbackDuration,
      questionIds: ids,
    },
  ];
}

function invalidateExamCaches(examId?: string) {
  const cache = getCache();
  if (examId) {
    cache.invalidate(CacheKeys.exam(examId));
    cache.invalidate(CacheKeys.examSummary(examId));
  }
  cache.invalidatePattern(/^exams:list:/);
  cache.invalidate('cil:counts');
  cache.invalidate('home:stats');
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdminPermission(request, "canCreateExam");
  if (!auth.isValid) {
    return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });
  }

  try {
    const rawBody = await request.json();
    const examData = z.object({
      title: z.string().min(1),
      questions: z.array(z.any()),
      sections: z.array(z.any()),
      description: z.string().optional().nullable(),
      category: z.string().optional().nullable(),
      isPremium: z.boolean().optional(),
      isLocked: z.boolean().optional(),
      type: z.string().optional(),
      durationMinutes: z.number().optional(),
      totalMarks: z.number().optional(),
      passingMarks: z.number().optional(),
      negativeMarking: z.number().optional(),
      isPublished: z.boolean().optional(),
      isActive: z.boolean().optional(),
      shuffleQuestions: z.boolean().optional(),
      shuffleOptions: z.boolean().optional(),
      instructions: z.array(z.any()).optional(),
    }).parse(rawBody);

    if (!examData.title || !examData.questions || examData.questions.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Require sections for new exams
    if (!examData.sections || !Array.isArray(examData.sections) || examData.sections.length === 0) {
      return NextResponse.json({ error: "Exams must include at least one section with questionIds and durationMinutes" }, { status: 400 });
    }

    // Validate sections: must have id/title, durationMinutes (number) and questionIds array
    for (let si = 0; si < examData.sections.length; si++) {
      const s = examData.sections[si];
      if (!s || (!s.questionIds || !Array.isArray(s.questionIds) || s.questionIds.length === 0)) {
        return NextResponse.json({ error: `Section ${si + 1}: must have at least one questionId` }, { status: 400 });
      }
      if (typeof s.durationMinutes !== 'number' || Number.isNaN(s.durationMinutes) || s.durationMinutes < 0) {
        return NextResponse.json({ error: `Section ${si + 1}: durationMinutes must be a non-negative number` }, { status: 400 });
      }
    }

    for (let i = 0; i < examData.questions.length; i++) {
      const q = examData.questions[i];
      if (!q.options || q.options.length < 2 || q.options.length > 5) {
        return NextResponse.json(
          { error: `Question ${i + 1}: Must have between 2 and 5 options` },
          { status: 400 }
        );
      }
      if (!q.text || q.text.trim() === "") {
        return NextResponse.json(
          { error: `Question ${i + 1}: Question text is required` },
          { status: 400 }
        );
      }
      if (!q.correctOptionId) {
        return NextResponse.json(
          { error: `Question ${i + 1}: Correct option must be selected` },
          { status: 400 }
        );
      }
      if (q.options.some((opt: any) => !opt.text || opt.text.trim() === "")) {
        return NextResponse.json(
          { error: `Question ${i + 1}: All options must have text` },
          { status: 400 }
        );
      }
    }

    const userId = auth.userId!;
    const computedDuration = deriveDurationFromSections(examData.sections, examData.durationMinutes || 60);

    const newExam: Omit<Exam, "id"> = {
      title: examData.title,
      description: examData.description || "",
      isPremium: normalizeBoolean(examData.isPremium),
      isLocked: normalizeBoolean(examData.isLocked, false),
      type: (examData.type || "timed") as any,
      durationMinutes: computedDuration,
      totalMarks:
        examData.totalMarks ||
        examData.questions.reduce((sum: number, q: any) => sum + (q.marks || 1), 0),
      passingMarks: examData.passingMarks || 0,
      negativeMarking: examData.negativeMarking || 0,
      shuffleQuestions: examData.shuffleQuestions || false,
      shuffleOptions: examData.shuffleOptions || false,
      instructions: examData.instructions || [],
      questions: examData.questions,
      sections: examData.sections,
      isPublished: normalizeBoolean(examData.isPublished, true),
      isActive: true,
      category: normalizeCategory(examData.category) || "SEBI",
      createdBy: userId,
      createdAt: new Date() as any,
    };

    const examRef = await adminDB.collection("exams").add(newExam);
    invalidateExamCaches(examRef.id);

    return NextResponse.json({ success: true, examId: examRef.id });
  } catch (error: any) {
    console.error("Error creating exam:", error);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);

    return NextResponse.json(
      {
        error: error.message || "Failed to create exam",
        code: error.code,
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = await verifyAdminPermission(request, "canEditExam");
  if (!auth.isValid) {
    return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });
  }

  try {
    const rawBody = await request.json();
    const { examId, ...examData } = z.object({
      examId: z.string().min(1),
      title: z.string().optional(),
      questions: z.array(z.any()).optional(),
      sections: z.array(z.any()).optional(),
      description: z.string().optional().nullable(),
      category: z.string().optional().nullable(),
      isPremium: z.boolean().optional(),
      isLocked: z.boolean().optional(),
      type: z.string().optional(),
      durationMinutes: z.number().optional(),
      totalMarks: z.number().optional(),
      passingMarks: z.number().optional(),
      negativeMarking: z.number().optional(),
      isPublished: z.boolean().optional(),
      isActive: z.boolean().optional(),
      shuffleQuestions: z.boolean().optional(),
      shuffleOptions: z.boolean().optional(),
      instructions: z.array(z.any()).optional(),
    }).parse(rawBody);

    if (!examId) {
      return NextResponse.json({ error: "Exam ID required" }, { status: 400 });
    }

    const examSnap = await adminDB.collection("exams").doc(examId).get();
    if (!examSnap.exists) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    if (examData.questions && Array.isArray(examData.questions)) {
      for (let i = 0; i < examData.questions.length; i++) {
        const q = examData.questions[i];
        if (!q.options || q.options.length < 2 || q.options.length > 5) {
          return NextResponse.json(
            { error: `Question ${i + 1}: Must have between 2 and 5 options` },
            { status: 400 }
          );
        }
        if (!q.text || q.text.trim() === "") {
          return NextResponse.json(
            { error: `Question ${i + 1}: Question text is required` },
            { status: 400 }
          );
        }
        if (!q.correctOptionId) {
          return NextResponse.json(
            { error: `Question ${i + 1}: Correct option must be selected` },
            { status: 400 }
          );
        }
        if (q.options.some((opt: any) => !opt.text || opt.text.trim() === "")) {
          return NextResponse.json(
            { error: `Question ${i + 1}: All options must have text` },
            { status: 400 }
          );
        }
      }
    }

    const normalizedIsPremium = normalizeBoolean(examData.isPremium, examSnap.data()?.isPremium === true);
    const normalizedIsLocked = normalizeBoolean(examData.isLocked, examSnap.data()?.isLocked === true);
    const normalizedIsPublished = normalizeBoolean(examData.isPublished, examSnap.data()?.isPublished === true);
    const normalizedCategory = normalizeCategory(examData.category) || normalizeCategory(examSnap.data()?.category) || "SEBI";

    const existingExam = examSnap.data() as any;
    const normalizedQuestions = Array.isArray(examData.questions)
      ? ensureQuestionIdsForUpdate(examData.questions)
      : (existingExam.questions || []);

    let finalSections = Array.isArray(examData.sections) ? examData.sections : existingExam.sections;
    if (!Array.isArray(finalSections) || finalSections.length === 0) {
      finalSections = buildFallbackSections(
        normalizedQuestions,
        typeof examData.durationMinutes === "number" ? examData.durationMinutes : (existingExam.durationMinutes || 60)
      );
    }

    if (!Array.isArray(finalSections) || finalSections.length === 0) {
      return NextResponse.json({ error: "Exam must include sections with questionIds." }, { status: 400 });
    }

    // Validate normalized sections
    if (Array.isArray(finalSections)) {
      for (let si = 0; si < finalSections.length; si++) {
        const s = finalSections[si];
        if (!s || (!s.questionIds || !Array.isArray(s.questionIds) || s.questionIds.length === 0)) {
          return NextResponse.json({ error: `Section ${si + 1}: must have at least one questionId` }, { status: 400 });
        }
        if (typeof s.durationMinutes !== 'number' || Number.isNaN(s.durationMinutes) || s.durationMinutes < 0) {
          return NextResponse.json({ error: `Section ${si + 1}: durationMinutes must be a non-negative number` }, { status: 400 });
        }
      }
    }

    const sectionsForDuration = finalSections;
    const computedDuration = deriveDurationFromSections(
      sectionsForDuration,
      typeof examData.durationMinutes === "number" ? examData.durationMinutes : (existingExam.durationMinutes || 60)
    );

    const questionsForMarks = normalizedQuestions;
    const computedTotalMarks = questionsForMarks.reduce((sum: number, q: any) => sum + (q?.marks || 0), 0);

    const updateData: any = {
      title: examData.title,
      description: examData.description || "",
      category: normalizedCategory,
      isPremium: normalizedIsPremium,
      isLocked: normalizedIsLocked,
      isPublished: normalizedIsPublished,
      type: (examData.type || "timed") as any,
      durationMinutes: computedDuration,
      totalMarks: typeof examData.totalMarks === "number" ? examData.totalMarks : computedTotalMarks,
      passingMarks: examData.passingMarks || 0,
      negativeMarking: examData.negativeMarking || 0,
      shuffleQuestions: examData.shuffleQuestions || false,
      shuffleOptions: examData.shuffleOptions || false,
      instructions: examData.instructions || [],
      // Persist updated questions when editing existing exams.
      questions: normalizedQuestions,
      sections: finalSections,
      updatedAt: new Date(),
    };

    await adminDB.collection("exams").doc(examId).update(updateData);

    invalidateExamCaches(examId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating exam:", error);
    return NextResponse.json(
      { error: "Failed to update exam" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const auth = await verifyAdminPermission(request, "canEditExam");
  if (!auth.isValid) {
    return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const examId = searchParams.get("examId");

    if (!examId) {
      return NextResponse.json({ error: "Exam ID required" }, { status: 400 });
    }

    const examSnap = await adminDB.collection("exams").doc(examId).get();

    if (!examSnap.exists) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    return NextResponse.json({ exam: { id: examSnap.id, ...examSnap.data() } });
  } catch (error) {
    console.error("Error fetching exam:", error);
    return NextResponse.json(
      { error: "Failed to fetch exam" },
      { status: 500 }
    );
  }
}
