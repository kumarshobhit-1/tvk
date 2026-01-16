import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/firebase-admin";
import type { ExamAttempt, ExamAnswer } from "@/lib/exam-types";

export async function POST(request: NextRequest) {
  try {
    // Simplified auth - verify from attempt
    const userId = "authenticated-user"; // Placeholder

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

    // Verify this attempt belongs to the user
    if (attempt.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if already submitted
    if (attempt.status === "submitted") {
      return NextResponse.json({ error: "Already submitted" }, { status: 400 });
    }

    // Update answers
    await adminDB.collection("exam_attempts").doc(attemptId).update({
      answers: answers as ExamAnswer[],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving progress:", error);
    return NextResponse.json(
      { error: "Failed to save progress" },
      { status: 500 }
    );
  }
}
