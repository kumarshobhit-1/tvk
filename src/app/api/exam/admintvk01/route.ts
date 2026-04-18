import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/firebase-admin";
import type { Exam } from "@/lib/exam-types";
import { verifyAdminPermission } from "@/lib/auth-helpers";
import { CacheKeys, getCache } from "@/lib/cache-strategy";

function invalidateExamCaches(examId?: string) {
  const cache = getCache();
  if (examId) {
    cache.invalidate(CacheKeys.exam(examId));
  }
  cache.invalidatePattern(/^exams:list:/);
}

export async function POST(request: NextRequest) {
  // Exam create permission
  const auth = await verifyAdminPermission(request, "canCreateExam");
  if (!auth.isValid) {
    return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });
  }

  try {
    const examData = await request.json();

    // Validate required fields
    if (!examData.title || !examData.questions || examData.questions.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate questions and options
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

    // Use authenticated user ID
    const userId = auth.userId!;

    // Create exam
    const newExam: Omit<Exam, "id"> = {
      title: examData.title,
      description: examData.description || "",
      isPremium: examData.isPremium === true,
      type: examData.type || "timed",
      durationMinutes: examData.durationMinutes || 60,
      totalMarks: examData.totalMarks || examData.questions.reduce((sum: number, q: any) => sum + (q.marks || 1), 0),
      passingMarks: examData.passingMarks || 0,
      negativeMarking: examData.negativeMarking || 0,
      shuffleQuestions: examData.shuffleQuestions || false,
      shuffleOptions: examData.shuffleOptions || false,
      instructions: examData.instructions || [],
      questions: examData.questions,
      isPublished: examData.isPublished ?? true,
      isActive: true, // New exams are active by default
      category: examData.category || "SEBI",
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
    
    // Return detailed error for debugging
    return NextResponse.json(
      { 
        error: error.message || "Failed to create exam", 
        code: error.code,
        details: error.toString()
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  // Exam edit permission
  const auth = await verifyAdminPermission(request, "canEditExam");
  if (!auth.isValid) {
    return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });
  }

  try {
    const { examId, ...examData } = await request.json();

    if (!examId) {
      return NextResponse.json({ error: "Exam ID required" }, { status: 400 });
    }

    const examSnap = await adminDB.collection("exams").doc(examId).get();

    if (!examSnap.exists) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Validate questions and options
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

    // Keep premium flag explicit so false updates are always persisted.
    const normalizedIsPremium = examData.isPremium === true;

    // Update exam
    await adminDB.collection("exams").doc(examId).update({
      ...examData,
      isPremium: normalizedIsPremium,
      updatedAt: new Date(),
    });

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
  // Exam read for admin edit/view
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
