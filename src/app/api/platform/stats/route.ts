import { NextRequest, NextResponse } from "next/server";
import { adminDB, adminAuth } from "@/lib/firebase/firebase-admin";
import { getCache, CacheKeys } from "@/lib/cache-strategy";

type PlatformStats = {
  activeUsersCount: number;
  premiumUsersCount: number;
  activeLearners: number;
  successRate: number;
  timestamp: string;
  queryTime: number;
};

const CACHE_TTL_MS = 30 * 1000; // 30 seconds memory cache for high traffic efficiency

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    const isExplicitRefresh = request.nextUrl.searchParams.get("refresh") === "true";
    const cache = getCache();

    // Serve the cached payload first when it is still fresh and no explicit refresh requested.
    if (!isExplicitRefresh) {
      const cached = cache.get<PlatformStats>(CacheKeys.platformStats());
      if (cached) {
        return NextResponse.json(
          {
            ...cached,
            queryTime: Date.now() - startTime,
          },
          {
            headers: {
              "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
              "Pragma": "no-cache",
              "Expires": "0",
            },
          }
        );
      }
    }

    const statsRef = adminDB.collection('system_config').doc('platform_stats');
    const statsDoc = await statsRef.get();

    let activeUsersCount = Number(statsDoc.data()?.activeUsersCount || 0);
    const activeUsersUpdatedAt = statsDoc.data()?.activeUsersUpdatedAt;

    // Convert Firestore Timestamp or Date representation to JS Date safely
    let lastUpdatedDate = new Date(0);
    if (activeUsersUpdatedAt) {
      if (typeof activeUsersUpdatedAt.toDate === "function") {
        lastUpdatedDate = activeUsersUpdatedAt.toDate();
      } else if (activeUsersUpdatedAt instanceof Date) {
        lastUpdatedDate = activeUsersUpdatedAt;
      } else if (typeof activeUsersUpdatedAt === "string" || typeof activeUsersUpdatedAt === "number") {
        lastUpdatedDate = new Date(activeUsersUpdatedAt);
      }
    }

    const shouldRefreshAuthCount =
      !statsDoc.exists ||
      !statsDoc.data()?.activeUsersInitialized ||
      (Date.now() - lastUpdatedDate.getTime() > 60 * 60 * 1000); // 1 hour threshold

    if (shouldRefreshAuthCount) {
      let totalAuthUsers = 0;
      let pageToken: string | undefined;
      
      try {
        do {
          const listUsersResult = await adminAuth.listUsers(1000, pageToken);
          totalAuthUsers += listUsersResult.users.length;
          pageToken = listUsersResult.pageToken;
        } while (pageToken);
        
        activeUsersCount = totalAuthUsers;
        
        // Update Firestore cache for fallback
        await statsRef.set(
          {
            activeUsersCount,
            activeUsersInitialized: true,
            activeUsersUpdatedAt: new Date(),
          },
          { merge: true }
        );
      } catch (authError) {
        console.error('Error counting Firebase Auth users:', authError);
        // Fallback to cached Firestore value if Auth listing fails
        activeUsersCount = Number(statsDoc.data()?.activeUsersCount || 0);
      }
    }

    // Periodic auto-refresh for premium users count (every 30 mins)
    let premiumUsersCount = Number(statsDoc.data()?.premiumUsersCount || 0);
    const premiumUsersUpdatedAt = statsDoc.data()?.premiumUsersUpdatedAt;
    let lastPremiumUpdatedDate = new Date(0);
    if (premiumUsersUpdatedAt) {
      if (typeof premiumUsersUpdatedAt.toDate === "function") {
        lastPremiumUpdatedDate = premiumUsersUpdatedAt.toDate();
      } else if (premiumUsersUpdatedAt instanceof Date) {
        lastPremiumUpdatedDate = premiumUsersUpdatedAt;
      } else if (typeof premiumUsersUpdatedAt === "string" || typeof premiumUsersUpdatedAt === "number") {
        lastPremiumUpdatedDate = new Date(premiumUsersUpdatedAt);
      }
    }

    const shouldRefreshPremiumCount =
      !statsDoc.exists ||
      !statsDoc.data()?.premiumUsersInitialized ||
      (Date.now() - lastPremiumUpdatedDate.getTime() > 30 * 60 * 1000);

    if (shouldRefreshPremiumCount) {
      try {
        const premiumSnap = await adminDB.collection("users").where("isPremium", "==", true).select("isPremium").get();
        premiumUsersCount = premiumSnap.size;
        await statsRef.set(
          {
            premiumUsersCount,
            premiumUsersInitialized: true,
            premiumUsersUpdatedAt: new Date(),
          },
          { merge: true }
        );
      } catch (err) {
        console.error("Error refreshing premium users count:", err);
      }
    }

    // Now proceed with other metrics
    let uniqueExamTakers = Number(statsDoc.data()?.uniqueExamTakers || 0);
    const statsInitialized = statsDoc.exists && statsDoc.data()?.initialized === true;
    let successRate = Number(statsDoc.data()?.successRate || 0);
    const successRateInitialized = statsDoc.exists && statsDoc.data()?.successRate !== undefined;

    // Avoid expensive collection scans here. Rely on `platform_stats` document values
    // which are incrementally maintained during normal operation (exam submits).
    // If the stats doc was never initialized, do NOT perform a full collection scan here;
    // instead return the stored values (or zeros) and allow an admin-triggered paginated
    // recalc to bootstrap historical numbers.
    uniqueExamTakers = Number(statsDoc.data()?.uniqueExamTakers || 0);
    premiumUsersCount = Number(statsDoc.data()?.premiumUsersCount || 0);
    successRate = Number(statsDoc.data()?.successRate || 0);

    const stats = {
      activeUsersCount,
      premiumUsersCount,
      activeLearners: uniqueExamTakers,
      successRate,
      timestamp: new Date().toISOString(),
      queryTime: Date.now() - startTime
    };

    cache.set(CacheKeys.platformStats(), stats, CACHE_TTL_MS);

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error: any) {
    console.error('Error fetching platform stats:', error.message);

    // Return a non-fake fallback shape if aggregation fails.
    return NextResponse.json({
      activeUsersCount: 0,
      premiumUsersCount: 0,
      activeLearners: 0,
      successRate: 0,
      error: true,
      errorMessage: error.message
    }, { status: 200 });
  }
}