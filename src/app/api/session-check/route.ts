import { NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase/firebase-admin'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'No session cookie' }, { status: 401 });
    }
    
    await adminAuth.verifySessionCookie(sessionCookie);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Session check failed:', error);
    return NextResponse.json({ 
      error: 'Invalid session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 401 });
  }
}