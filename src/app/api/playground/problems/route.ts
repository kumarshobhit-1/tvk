import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminDB } from "@/lib/firebase/firebase-admin";
import { adminAuth } from "@/lib/firebase/firebase-admin";
import { cacheAside, CacheKeys } from "@/lib/cache-strategy";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await adminAuth.verifySessionCookie(sessionCookie);

    const problems = await cacheAside(
      CacheKeys.playgroundProblems(),
      async () => {
        const snapshot = await adminDB.collection("playground_problems").get();
        return snapshot.docs.map(doc => ({ 
          ...doc.data(), 
          id: doc.id 
        }));
      }
    );
    
    return NextResponse.json({ problems });
  } catch (error) {
    console.error("Error fetching playground problems:", error);
    return NextResponse.json(
      { error: "Failed to fetch problems", problems: [] },
      { status: 500 }
    );
  }
}