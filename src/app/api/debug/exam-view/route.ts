import { NextRequest, NextResponse } from 'next/server';
import { adminDB } from '@/lib/firebase/firebase-admin';

// Temporary debug endpoint to inspect which exams are visible to a given user/email
// Usage: GET /api/debug/exam-view?email=foo@gmail.com&category=AD%20SYSTEMS%20IT

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email');
    const category = req.nextUrl.searchParams.get('category');

    if (!email) return NextResponse.json({ error: 'Missing email parameter' }, { status: 400 });

    // Normalize category slug (allow hyphen or space separators)
    let normalizedCategoryParam: string | undefined = undefined;
    if (category) {
      normalizedCategoryParam = category.replace(/-/g, ' ').toUpperCase();
    }

    // Find user doc by email
    const usersSnap = await adminDB.collection('users').where('email', '==', email).limit(1).get();
    const userDoc = usersSnap.docs[0];
    if (!userDoc) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const userData = userDoc.data();

    // Build base exams query (published)
    let examsQuery = adminDB.collection('exams').where('isPublished', '==', true);
    if (normalizedCategoryParam && normalizedCategoryParam !== 'OTHER') {
      examsQuery = examsQuery.where('category', '==', normalizedCategoryParam);
    }

    const examSnap = await examsQuery.get();
    const exams = examSnap.docs.map(d => ({ id: d.id, ...(d.data() || {}) }));

    // Now apply same per-user filtering as main listing
    let visible = exams;
    if (category && userData) {
      const allowedExamIds: string[] = Array.isArray(userData.allowedExamIds) ? userData.allowedExamIds.map((s: any) => String(s||'').trim()).filter(Boolean) : [];
      const isPremiumUser = userData.isPremium === true || userData.premium === true;

      if (isPremiumUser && allowedExamIds.length > 0) {
        const allowedSet = new Set(allowedExamIds);
        visible = visible.filter((e: any) => allowedSet.has(e.id));
      } else {
        const premiumCats = (userData.premiumCategories || userData.premiumAccessCategories || userData.allowedCategories || []);
        const normalized = Array.isArray(premiumCats) ? premiumCats.map((c: any) => String(c||'').trim().toUpperCase()) : [];
        const userHasCategory = normalized.includes('ALL') || normalized.includes((category||'').toUpperCase()) || isPremiumUser === true;
        if (!userHasCategory) visible = [];
      }
    }

    return NextResponse.json({ userId: userDoc.id, userData, examsCount: exams.length, visibleCount: visible.length, visible });
  } catch (err: any) {
    console.error('Debug exam-view error:', err);
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
