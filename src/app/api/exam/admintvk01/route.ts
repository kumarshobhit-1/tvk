import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/firebase-admin";
import type { Exam } from "@/lib/exam-types";
import { verifyAdminAuth } from "@/lib/auth-helpers";

export async function POST(request: NextRequest) {
  // Verify admin authentication
  const auth = await verifyAdminAuth(request);
  if (!auth.isValid) {
    return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 401 });
  }

  try {
    const examData = await request.json();

    // Validate required fields
    if (!examData.title || !examData.questions || examData.questions.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Use authenticated user ID
    const userId = auth.userId!;

    // Create exam
    const newExam: Omit<Exam, "id"> = {
      title: examData.title,
      description: examData.description || "",
      type: examData.type || "timed",
      durationMinutes: examData.durationMinutes || 60,
      totalMarks: examData.totalMarks || examData.questions.reduce((sum: number, q: any) => sum + (q.marks || 1), 0),
      passingMarks: examData.passingMarks || 0,
      negativeMarking: examData.negativeMarking || 0,
      shuffleQuestions: examData.shuffleQuestions || false,
      shuffleOptions: examData.shuffleOptions || false,
      instructions: examData.instructions || [],
      questions: examData.questions,
      isPublished: examData.isPublished || false,
      isActive: true, // New exams are active by default
      category: examData.category || "SEBI",
      createdBy: userId,
      createdAt: new Date() as any,
    };

    const examRef = await adminDB.collection("exams").add(newExam);

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
  // Verify admin authentication
  const auth = await verifyAdminAuth(request);
  if (!auth.isValid) {
    return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = auth.userId!;
    const { examId, ...examData } = await request.json();

    if (!examId) {
      return NextResponse.json({ error: "Exam ID required" }, { status: 400 });
    }

    const examSnap = await adminDB.collection("exams").doc(examId).get();

    if (!examSnap.exists) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Update exam
    await adminDB.collection("exams").doc(examId).update({
      ...examData,
      updatedAt: new Date(),
    });

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
  // Verify admin authentication
  const auth = await verifyAdminAuth(request);
  if (!auth.isValid) {
    return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = auth.userId!;
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
