import { NextRequest, NextResponse } from "next/server";
import { adminDB, adminAuth } from "@/lib/firebase/firebase-admin";

type PlatformStats = {
  activeUsersCount: number;
  premiumUsersCount: number;
  activeLearners: number;
  successRate: number;
  timestamp: string;
  queryTime: number;
};

let cachedStats: PlatformStats | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 10 * 60 * 1000;

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();

    // Serve the cached payload first when it is still fresh.
    // This avoids repeatedly re-reading exam_attempts and re-listing Firebase Auth users on every poll.
    if (cachedStats && Date.now() - cachedAt < CACHE_TTL_MS) {
      return NextResponse.json(
        {
          ...cachedStats,
          queryTime: Date.now() - startTime,
        },
        {
          headers: {
            "Cache-Control": "private, max-age=300, stale-while-revalidate=60",
            "Pragma": "cache",
            "Expires": new Date(Date.now() + 5 * 60 * 1000).toUTCString(),
          },
        }
      );
    }

    const statsRef = adminDB.collection('system_config').doc('platform_stats');
    const statsDoc = await statsRef.get();

    let activeUsersCount = Number(statsDoc.data()?.activeUsersCount || 0);

    // ALWAYS fetch live active users count from Firebase Auth first
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

    // Now proceed with other metrics
    let uniqueExamTakers = Number(statsDoc.data()?.uniqueExamTakers || 0);
    const statsInitialized = statsDoc.exists && statsDoc.data()?.initialized === true;
    let premiumUsersCount = Number(statsDoc.data()?.premiumUsersCount || 0);
    const premiumUsersInitialized = statsDoc.exists && statsDoc.data()?.premiumUsersInitialized === true;
    let successRate = Number(statsDoc.data()?.successRate || 0);
    const successRateInitialized = statsDoc.exists && statsDoc.data()?.successRate !== undefined;

    if (cachedStats && Date.now() - cachedAt < CACHE_TTL_MS && statsInitialized && successRateInitialized) {
      return NextResponse.json(
        {
          ...cachedStats,
          activeLearners: uniqueExamTakers,
          premiumUsersCount,
          activeUsersCount,
          successRate,
          queryTime: Date.now() - startTime,
        },
        {
          headers: {
            'Cache-Control': 'private, max-age=300, stale-while-revalidate=60',
            'Pragma': 'cache',
            'Expires': new Date(Date.now() + 5 * 60 * 1000).toUTCString(),
            'Surrogate-Control': 'max-age=300'
          }
        }
      );
    }

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

    cachedStats = stats;
    cachedAt = Date.now();

    // Force no caching
    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'private, max-age=300, stale-while-revalidate=60',
        'Pragma': 'cache',
        'Expires': new Date(Date.now() + 5 * 60 * 1000).toUTCString(),
        'Surrogate-Control': 'max-age=300'
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