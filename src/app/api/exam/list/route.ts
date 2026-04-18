import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/firebase-admin";
import { cacheAside, CacheKeys } from "@/lib/cache-strategy";

const EXAM_LIST_TTL_MS = 5 * 60 * 1000;

function toPublicExamSummary(id: string, examData: any) {
  return {
    id,
    title: examData.title,
    description: examData.description,
    isPremium: examData.isPremium === true,
    type: examData.type,
    durationMinutes: examData.durationMinutes,
    totalMarks: examData.totalMarks,
    passingMarks: examData.passingMarks,
    category: examData.category,
    questionCount: examData.questions?.length || 0,
    negativeMarking: examData.negativeMarking,
    instructions: examData.instructions,
    isPublished: examData.isPublished,
    isActive: examData.isActive,
    emergencyStopped: examData.emergencyStopped,
    emergencyStoppedAt: examData.emergencyStoppedAt,
    createdAt: examData.createdAt,
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const examId = searchParams.get("examId");

    // If examId is provided, fetch public-safe single exam summary
    if (examId) {
      const exam = await cacheAside(
        CacheKeys.exam(examId),
        async () => {
          const examSnap = await adminDB.collection("exams").doc(examId).get();
          if (!examSnap.exists) return null;

          const examData = examSnap.data();
          if (!examData?.isPublished) return null;

          return toPublicExamSummary(examSnap.id, examData);
        },
        EXAM_LIST_TTL_MS
      );

      if (!exam) {
        return NextResponse.json({ error: "Exam not found" }, { status: 404 });
      }

      return NextResponse.json({ exams: [exam] });
    }

    const exams = await cacheAside(
      CacheKeys.examList(category || "all"),
      async () => {
        let examsQuery = adminDB.collection("exams").where("isPublished", "==", true);

        if (category) {
          examsQuery = examsQuery.where("category", "==", category);
        }

        const querySnapshot = await examsQuery.get();
        const list = querySnapshot.docs.map((doc) => toPublicExamSummary(doc.id, doc.data()));

        // Sort by createdAt in JavaScript instead of Firestore
        list.sort((a: any, b: any) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });

        return list;
      },
      EXAM_LIST_TTL_MS
    );

    return NextResponse.json({ exams });
  } catch (error: any) {
    console.error("Error fetching exams:", error);
    
    // Return empty array if collection doesn't exist or no exams yet
    if (error.code === 'permission-denied' || error.message?.includes('index')) {
      return NextResponse.json({ exams: [] });
    }
    
    return NextResponse.json(
      { error: "Failed to fetch exams", exams: [] },
      { status: 500 }
    );
  }
}
