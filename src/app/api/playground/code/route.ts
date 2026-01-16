import { NextRequest, NextResponse } from "next/server";
import { adminDB, adminAuth } from "@/lib/firebase/firebase-admin";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    // Verify user authentication
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
    const userId = decodedToken.uid;

    const { problemId, language, code } = await request.json();

    if (!problemId || !language || !code) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Save code to Firestore
    const docRef = adminDB.collection("savedCodes").doc(`${userId}_${problemId}_${language}`);
    await docRef.set({
      userId,
      problemId,
      language,
      code,
      lastSaved: new Date(),
    });

    return NextResponse.json({ success: true, message: "Code saved successfully" });
  } catch (error) {
    console.error("Error saving code:", error);
    return NextResponse.json(
      { error: "Failed to save code" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify user authentication
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
    const userId = decodedToken.uid;

    const searchParams = request.nextUrl.searchParams;
    const problemId = searchParams.get("problemId");
    const language = searchParams.get("language");

    if (!problemId || !language) {
      return NextResponse.json({ error: "Missing problemId or language" }, { status: 400 });
    }

    // Load code from Firestore
    const docRef = adminDB.collection("savedCodes").doc(`${userId}_${problemId}_${language}`);
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      const data = docSnap.data();
      return NextResponse.json({ code: data?.code || null });
    }

    return NextResponse.json({ code: null });
  } catch (error) {
    console.error("Error loading code:", error);
    return NextResponse.json(
      { error: "Failed to load code" },
      { status: 500 }
    );
  }
}