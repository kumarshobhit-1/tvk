// src/app/dashboard/page.tsx

import { adminDB, adminAuth } from '@/lib/firebase/firebase-admin';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { DsaTopic, DsaQuestion, CsSubject, CsTopic } from '@/lib/types';
import { DashboardClient } from './dashboard-client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Dashboard | The Victory Key",
    description: "Track your learning progress for DSA and CS Subjects.",
};

export const dynamic = 'force-dynamic';

// Helper function to serialize Firestore data
const serialize = (data: any) => {
    for (const key in data) {
        if (data[key] && typeof data[key].toDate === 'function') {
            data[key] = data[key].toDate().toISOString();
        }
    }
    return data;
};

// Calculate streak from user activity data
function calculateStreak(lastActivityDate?: string, streakCount: number = 0): number {
    if (!lastActivityDate) return 0;
    
    const lastActivity = new Date(lastActivityDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    lastActivity.setHours(0, 0, 0, 0);
    
    const diffTime = today.getTime() - lastActivity.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // If last activity was today
    if (diffDays === 0) {
        // Return stored streak, or minimum 1 if this is first activity
        return streakCount > 0 ? streakCount : 1;
    }
    
    // If last activity was yesterday, continue streak
    if (diffDays === 1) {
        return streakCount;
    }
    
    // Streak broken (more than 1 day gap)
    return 0;
}


export default async function DashboardPage() {
    // console.log('Dashboard page accessed')
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    // console.log('Session cookie exists:', !!sessionCookie)
    
    if (!sessionCookie) {
        // console.log('No session cookie, redirecting to login')
        redirect('/login');
    }
    
    let decodedToken;
    try {
        decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
        // console.log('Session verified for user:', decodedToken.uid)
    } catch (error) {
        console.error('Session verification failed:', error)
        redirect('/login');
    }
    const userId = decodedToken.uid;

    const [
        userDoc,
        dsaTopicsSnap,
        dsaQuestionsSnap,
        csSubjectsSnap,
        csTopicsSnap,
        examAttemptsSnap,
        examsSnap
    ] = await Promise.all([
        adminDB.collection('users').doc(userId).get(),
        adminDB.collection("dsa_topics").get(),
        adminDB.collection("dsa_questions").get(),
        adminDB.collection("cs_subjects").get(),
        adminDB.collection("cs_topics").get(),
        adminDB.collection("exam_attempts").get(),
        adminDB.collection("exams").get(),
    ]);

    const userProgressData = userDoc.exists ? userDoc.data()?.progress || {} : {};
    const userData = userDoc.exists ? userDoc.data() : {};
    
    // Convert Firestore Timestamp to ISO string for streak calculation
    const lastActivityDateString = userData.lastActivityDate && userData.lastActivityDate.toDate
        ? userData.lastActivityDate.toDate().toISOString() 
        : undefined;
    
    // console.log('📊 Dashboard Data:');
    // console.log('  User ID:', userId);
    // console.log('  Last Activity Date:', lastActivityDateString);
    // console.log('  Stored Streak Count:', userData.streakCount);
    
    // Calculate streak
    const userStreak = calculateStreak(
        lastActivityDateString,
        userData.streakCount || 0
    );
    
    // console.log('  Calculated Streak:', userStreak);

    // Get recent activity
    const recentActivity: Array<{ id: string; title: string; type: 'dsa' | 'cs'; timestamp: string }> = 
        userData.recentActivity || [];
    
    // --- FIX IS HERE: Convert Timestamp objects before passing as props ---
    const allDsaTopics = dsaTopicsSnap.docs.map(d => serialize({ id: d.id, ...d.data() })) as DsaTopic[];
    const allDsaQuestions = dsaQuestionsSnap.docs.map(d => serialize({ id: d.id, ...d.data() })) as DsaQuestion[];
    const allCsSubjects = csSubjectsSnap.docs.map(d => serialize({ id: d.id, ...d.data() })) as CsSubject[];
    const allCsTopics = csTopicsSnap.docs.map(d => serialize({ id: d.id, ...d.data() })) as CsTopic[];

    // Get user's exam attempts
    const userExamAttempts = examAttemptsSnap.docs
        .filter(d => d.data().userId === userId)
        .map(d => serialize({ id: d.id, ...d.data() }));
    
    // Get all exams
    const allExams = examsSnap.docs.map(d => serialize({ id: d.id, ...d.data() }));
    
    // Get valid exam IDs (exams that exist)
    const validExamIds = new Set(allExams.map((e: any) => e.id));
    
    // Filter out attempts for deleted exams
    const validUserExamAttempts = userExamAttempts.filter((attempt: any) => 
        validExamIds.has(attempt.examId)
    );
    
    // Calculate exam stats with only valid attempts
    const examStats = {
        totalAttempts: validUserExamAttempts.length,
        passedExams: validUserExamAttempts.filter((a: any) => a.passed).length,
        averageScore: validUserExamAttempts.length > 0 
            ? validUserExamAttempts.reduce((sum: number, a: any) => sum + (a.percentage || 0), 0) / validUserExamAttempts.length 
            : 0,
        recentAttempts: validUserExamAttempts
            .sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
            .slice(0, 5)
            .map((attempt: any) => {
                const exam = allExams.find((e: any) => e.id === attempt.examId);
                return {
                    id: attempt.id,
                    examTitle: exam?.title || 'Exam Deleted',
                    examId: attempt.examId,
                    passed: attempt.passed,
                    percentage: attempt.percentage,
                    score: attempt.score,
                    totalMarks: exam?.totalMarks || 0,
                    submittedAt: attempt.submittedAt
                };
            })
    };

    return (
        <DashboardClient
            user={{ name: decodedToken.name || '', email: decodedToken.email || '', picture: decodedToken.picture || '' }}
            userProgress={userProgressData}
            allDsaTopics={allDsaTopics}
            allDsaQuestions={allDsaQuestions}
            allCsSubjects={allCsSubjects}
            allCsTopics={allCsTopics}
            userStreak={userStreak}
            recentActivity={recentActivity}
            examStats={examStats}
        />
    );
}