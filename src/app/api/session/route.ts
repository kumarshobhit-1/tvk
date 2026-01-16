import { NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase/firebase-admin'

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json()
    if (!idToken) {
      console.error('Session API: Missing idToken')
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 })
    }

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