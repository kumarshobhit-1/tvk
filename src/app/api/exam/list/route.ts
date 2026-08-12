import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminDB, adminAuth as firebaseAdminAuth } from "@/lib/firebase/firebase-admin";
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
  const hasSections = examData.sections && Array.isArray(examData.sections) && examData.sections.length > 0;
  const totalAssignedQuestions = hasSections
    ? examData.sections.reduce((sum: number, s: any) => sum + (s.questionIds?.length || s.questions?.length || 0), 0)
    : (examData.questions?.length || 0);

  return {
    id,
    title: examData.title,
    description: examData.description,
    isPremium: examData.isPremium === true,
    isLocked: examData.isLocked === true,
    type: examData.type,
    durationMinutes: examData.durationMinutes,
    totalMarks: examData.totalMarks,
    passingMarks: examData.passingMarks,
    category: examData.category,
    questionCount: totalAssignedQuestions,
    // Sections summary: if exam has sections, expose section-level summary; else derive single section
    sections: (examData.sections && Array.isArray(examData.sections) && examData.sections.length > 0)
      ? examData.sections.map((s: any, idx: number) => {
          const sQIds = s.questionIds || [];
          const sectionQuestions = (examData.questions || []).filter((q: any) => sQIds.includes(q.id));
          const fallbackCorrectMarks = sectionQuestions.length > 0
            ? (typeof sectionQuestions[0].marks === 'number' ? sectionQuestions[0].marks : 1)
            : 1;

          const fallbackPassingMarks = (function() {
            const sectionsCount = examData.sections.length;
            const totalPassingMarks = typeof examData.passingMarks === 'number' ? examData.passingMarks : 40;
            return Math.round(totalPassingMarks / sectionsCount);
          })();

          return {
            id: s.id || `s${idx+1}`,
            title: s.title || `Section ${idx+1}`,
            durationMinutes: s.durationMinutes || Math.round((examData.durationMinutes || 0) / (examData.sections.length || 1)),
            questionCount: sQIds.length ? sQIds.length : (s.questions ? s.questions.length : 0),
            correctMarks: (s.correctMarks !== undefined && s.correctMarks !== null) ? s.correctMarks : fallbackCorrectMarks,
            negativeMarking: (s.negativeMarking !== undefined && s.negativeMarking !== null) ? s.negativeMarking : (examData.negativeMarking !== undefined ? examData.negativeMarking : 0.25),
            passingMarks: (s.passingMarks !== undefined && s.passingMarks !== null) ? s.passingMarks : fallbackPassingMarks,
          };
        })
      : [{
          id: 's1',
          title: 'Section 1',
          durationMinutes: examData.durationMinutes || 0,
          questionCount: examData.questions?.length || 0,
          correctMarks: examData.questions?.[0]?.marks !== undefined ? examData.questions[0].marks : 1,
          negativeMarking: examData.negativeMarking !== undefined ? examData.negativeMarking : 0.25,
          passingMarks: examData.passingMarks !== undefined ? examData.passingMarks : 40
        }],
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

    // Attempt to resolve authenticated user (optional) so we can apply per-user allowed lists
    let userData: any | undefined;
    let userId: string | undefined;
    try {
      const authHeader = request.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split("Bearer ")[1];
        const decoded = await firebaseAdminAuth.verifyIdToken(token);
        userId = decoded.uid;
        const userSnap = await adminDB.collection("users").doc(decoded.uid).get();
        userData = userSnap.exists ? userSnap.data() : undefined;
      }
    } catch (e) {
      userData = undefined;
    }

    if (!userData) {
      try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("session")?.value;
        if (sessionCookie) {
          const decodedToken = await firebaseAdminAuth.verifySessionCookie(sessionCookie);
          userId = decodedToken.uid;
          const userSnap = await adminDB.collection("users").doc(decodedToken.uid).get();
          userData = userSnap.exists ? userSnap.data() : undefined;
        }
      } catch {
        userData = undefined;
      }
    }

    // If examId is provided, fetch public-safe single exam summary
    if (examId) {
      const loadSingleExam = async () => {
        const examSnap = await adminDB.collection("exams").doc(examId).get();
        if (!examSnap.exists) return null;

        const examData = examSnap.data();
        if (!examData?.isPublished) return null;

        if (userData) {
          const isPremiumUser = userData.isPremium === true || userData.premium === true;
          const allowedExamIds: string[] = Array.isArray((userData as any).allowedExamIds)
            ? (userData as any).allowedExamIds.map((s: any) => String(s || "").trim()).filter(Boolean)
            : [];

          if (isPremiumUser && allowedExamIds.length > 0 && !allowedExamIds.includes(examSnap.id)) {
            return null;
          }

          if (!isPremiumUser && allowedExamIds.length > 0) {
            return null;
          }
        }

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
        let list = querySnapshot.docs.map((doc) => toPublicExamSummary(doc.id, doc.data()));

        // If explicit per-user allowed IDs exist, they override category-wide access.
        // This prevents one granted exam from unlocking the whole category.
        if (category && userData) {
          const { allowedExamIds } = userData as any;
          const normalizedCategory = category.toUpperCase();
          const isPremiumUser = userData.isPremium === true || userData.premium === true;
          const explicitIds: string[] = Array.isArray(allowedExamIds)
            ? allowedExamIds.map((s: any) => String(s || "").trim()).filter(Boolean)
            : [];
          const explicitAllowedSet = new Set(explicitIds);

          if (isPremiumUser && explicitIds.length > 0) {
            list = list.filter((e: any) => explicitAllowedSet.has(e.id));
          } else {
            const userHasCategory = (function () {
              try {
                const premiumCats = (userData.premiumCategories || userData.premiumAccessCategories || userData.allowedCategories || []);
                if (Array.isArray(premiumCats) && premiumCats.map((c: any) => String(c || "").trim().toUpperCase()).includes("ALL")) return true;
                if (Array.isArray(premiumCats) && premiumCats.map((c: any) => String(c || "").trim().toUpperCase()).includes(normalizedCategory)) return true;
                if (userData.isPremium === true || userData.premium === true) return true;
              } catch (e) {
                // ignore and treat as no category access
              }
              return false;
            })();

          }
        }

        // Sort by createdAt in JavaScript instead of Firestore
        list.sort((a: any, b: any) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });

        return list;
      };

    const exams = (bypassCache || (userData && category))
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
