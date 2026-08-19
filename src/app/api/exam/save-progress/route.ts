import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDB } from "@/lib/firebase/firebase-admin";
import { RateLimiter, RATE_LIMITS } from "@/lib/rate-limiter";
import type { ExamAttempt, ExamAnswer } from "@/lib/exam-types";
import { z } from "zod";

const saveProgressLimiter = new RateLimiter(RATE_LIMITS.general);

export async function POST(request: NextRequest) {
  try {
    if (!saveProgressLimiter.isAllowed(request)) {
      return NextResponse.json({ error: RATE_LIMITS.general.message }, { status: 429 });
    }

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
    const userId = decodedToken.uid;

    const body = await request.json();
    const { attemptId, answers } = z.object({
      attemptId: z.string().min(1),
      answers: z.array(z.object({
        questionId: z.string().min(1),
        selectedOptionId: z.string().nullable(),
        isFlagged: z.boolean().optional(),
      })),
    }).parse(body);

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
