import { NextResponse } from 'next/server'
import { adminAuth, adminDB } from '@/lib/firebase/firebase-admin'
import { z } from 'zod'

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { idToken } = z.object({
      idToken: z.string().min(1),
    }).parse(body);

    // Verify token and get user info
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const uid = decodedToken.uid

    // Sync user profile to Firestore
    const userRef = adminDB.collection('users').doc(uid)
    const userSnap = await userRef.get()
    
    let profileData: Record<string, any> = {
      uid,
      email: decodedToken.email || null,
      displayName: (decodedToken as any).name || 'Student',
      photoURL: (decodedToken as any).picture || null,
      // Preserve existing fields if doc exists
      ...(userSnap.exists ? userSnap.data() : {})
    }

    // Add timestamps if creating new user
    if (!userSnap.exists) {
      profileData.createdAt = new Date()
      profileData.isPremium = false
      profileData.streakCount = 0
    }

    profileData.lastLoginAt = new Date()

    await userRef.set(profileData, { merge: true })
    console.log(`Session API: User profile synced for ${uid}`)

    const expiresIn = 14 * 24 * 60 * 60 * 1000 // 14 days (ms)
    
    console.log('Session API: Creating session cookie...')
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn })
    console.log('Session API: Session cookie created successfully')

    const res = NextResponse.json({ ok: true })
    res.cookies.set('session', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: expiresIn / 1000,
    })
    return res
  } catch (error) {
    console.error('Session API: Error creating session:', error)
    return NextResponse.json({ 
      error: 'Failed to create session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  })
  return res
}