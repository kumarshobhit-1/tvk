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
const CACHE_TTL_MS = 5000;

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
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
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store'
          }
        }
      );
    }

    // Fetch exam attempts if needed for initialization
    const attemptsSnap = await adminDB.collection('exam_attempts').where('status', '==', 'submitted').select('userId', 'passed').get();

    if (!statsInitialized) {
      uniqueExamTakers = new Set(
        attemptsSnap.docs
          .map(doc => String(doc.data().userId || '').trim())
          .filter(Boolean)
      ).size;

      await statsRef.set(
        {
          uniqueExamTakers,
          initialized: true,
          updatedAt: new Date(),
        },
        { merge: true }
      );
    }

    if (!premiumUsersInitialized) {
      const premiumUsersSnap = await adminDB.collection('users').where('isPremium', '==', true).select('isPremium').get();
      premiumUsersCount = premiumUsersSnap.size;

      await statsRef.set(
        {
          premiumUsersCount,
          premiumUsersInitialized: true,
          premiumUsersUpdatedAt: new Date(),
        },
        { merge: true }
      );
    }

    if (!successRateInitialized) {
      const passedAttemptsSnap = await adminDB.collection('exam_attempts')
        .where('status', '==', 'submitted')
        .where('passed', '==', true)
        .select('userId')
        .get();

      const uniquePassedUsers = new Set(
        passedAttemptsSnap.docs
          .map(doc => String(doc.data()?.userId || '').trim())
          .filter(Boolean)
      ).size;

      successRate = uniqueExamTakers > 0 ? Math.round((uniquePassedUsers / uniqueExamTakers) * 100) : 0;

      await statsRef.set(
        {
          uniquePassedUsers,
          successRate,
          passedUsersInitialized: true,
          successRateUpdatedAt: new Date(),
        },
        { merge: true }
      );
    }

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
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
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