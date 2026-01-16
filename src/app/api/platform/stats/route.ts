import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();

    // Get all stats in parallel
    const [dsaSnap, csSnap, usersSnap, attemptsSnap] = await Promise.all([
      adminDB.collection('dsa_questions').get(),
      adminDB.collection('cs_topics').get(), 
      adminDB.collection('users').get(),
      adminDB.collection('exam_attempts').where('status', '==', 'submitted').get(),
    ]);

    const dsaCount = dsaSnap.size;
    const csCount = csSnap.size;
    const activeLearners = usersSnap.size;

    // Calculate actual success rate based on exam attempts
    const successfulAttempts = attemptsSnap.docs.filter(doc => doc.data().passed).length;
    const totalAttempts = attemptsSnap.size;
    const successRate = totalAttempts > 0 ? Math.round((successfulAttempts / totalAttempts) * 100) : 95;

    const stats = {
      dsaCount,
      csCount,
      activeLearners,
      successRate,
      timestamp: new Date().toISOString(),
      queryTime: Date.now() - startTime
    };

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
    
    // Return fallback stats in case of error
    return NextResponse.json({
      dsaCount: '500+',
      csCount: '50+', 
      activeLearners: '1000+',
      successRate: 95,
      error: true,
      errorMessage: error.message
    }, { status: 200 });
  }
}