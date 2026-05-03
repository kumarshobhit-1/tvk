import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/firebase-admin";
import { cacheAside, CacheKeys } from "@/lib/cache-strategy";

const EXAM_LIST_TTL_MS = 5 * 60 * 1000;

function shouldBypassCache(request: NextRequest) {
  const value = (request.nextUrl.searchParams.get("noCache") || request.nextUrl.searchParams.get("fresh") || "").toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

function jsonNoStore(body: any, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
      ...(init?.headers || {}),
    },
  });
}

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
    // Sections summary: if exam has sections, expose section-level summary; else derive single section
    sections: (examData.sections && Array.isArray(examData.sections) && examData.sections.length > 0)
      ? examData.sections.map((s: any, idx: number) => ({
          id: s.id || `s${idx+1}`,
          title: s.title || `Section ${idx+1}`,
          durationMinutes: s.durationMinutes || Math.round((examData.durationMinutes || 0) / (examData.sections.length || 1)),
          questionCount: s.questionIds ? s.questionIds.length : (s.questions ? s.questions.length : 0)
        }))
      : [{ id: 's1', title: 'Section 1', durationMinutes: examData.durationMinutes || 0, questionCount: examData.questions?.length || 0 }],
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
    const bypassCache = shouldBypassCache(request);

    // If examId is provided, fetch public-safe single exam summary
    if (examId) {
      const loadSingleExam = async () => {
        const examSnap = await adminDB.collection("exams").doc(examId).get();
        if (!examSnap.exists) return null;

        const examData = examSnap.data();
        if (!examData?.isPublished) return null;

        return toPublicExamSummary(examSnap.id, examData);
      };

      const exam = bypassCache
        ? await loadSingleExam()
        : await cacheAside(
            CacheKeys.exam(examId),
            loadSingleExam,
            EXAM_LIST_TTL_MS
          );

      if (!exam) {
        return jsonNoStore({ error: "Exam not found" }, { status: 404 });
      }

      return jsonNoStore({ exams: [exam] });
    }

    const loadExamList = async () => {
        let examsQuery = adminDB.collection("exams").where("isPublished", "==", true);

        if (category && category !== "other") {
          // Filter by specific category (case-insensitive - convert to uppercase)
          const normalizedCategory = category.toUpperCase();
          examsQuery = examsQuery.where("category", "==", normalizedCategory);
        } else if (category === "other") {
          // For "other" category, fetch all and filter those without a category or with "OTHER"
          const querySnapshot = await adminDB.collection("exams").where("isPublished", "==", true).get();
          const list = querySnapshot.docs
            .filter(doc => {
              const docCategory = doc.data()?.category;
              return !docCategory || docCategory === "" || docCategory?.toUpperCase() === "OTHER";
            })
            .map((doc) => toPublicExamSummary(doc.id, doc.data()));

          list.sort((a: any, b: any) => {
            const aTime = a.createdAt?.toMillis?.() || 0;
            const bTime = b.createdAt?.toMillis?.() || 0;
            return bTime - aTime;
          });

          return list;
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
      };

    const exams = bypassCache
      ? await loadExamList()
      : await cacheAside(
          CacheKeys.examList((category?.toUpperCase()) || "all"),
          loadExamList,
          EXAM_LIST_TTL_MS
        );

    return jsonNoStore({ exams });
  } catch (error: any) {
    console.error("Error fetching exams:", error);
    
    // Return empty array if collection doesn't exist or no exams yet
    if (error.code === 'permission-denied' || error.message?.includes('index')) {
      return jsonNoStore({ exams: [] });
    }
    
    return jsonNoStore(
      { error: "Failed to fetch exams", exams: [] },
      { status: 500 }
    );
  }
}
