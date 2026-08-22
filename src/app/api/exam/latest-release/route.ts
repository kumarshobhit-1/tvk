import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/firebase-admin";
import { cacheAside, CacheKeys, CACHE_TTL } from "@/lib/cache-strategy";

export async function GET(request: NextRequest) {
  try {
    const data = await cacheAside(
      CacheKeys.latestExams(),
      async () => {
        const configSnap = await adminDB.collection("system_config").doc("latest_exams").get();
        if (configSnap.exists) {
          return configSnap.data() || { categories: {} };
        }
        return { categories: {} };
      },
      CACHE_TTL.MEDIUM // 30 minutes
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching latest exams:", error);
    return NextResponse.json({ categories: {} });
  }
}
