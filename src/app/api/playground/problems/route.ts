import { NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/firebase-admin";

export async function GET() {
  try {
    const snapshot = await adminDB.collection("playground_problems").get();
    const problems = snapshot.docs.map(doc => ({ 
      ...doc.data(), 
      id: doc.id 
    }));
    
    return NextResponse.json({ problems });
  } catch (error) {
    console.error("Error fetching playground problems:", error);
    return NextResponse.json(
      { error: "Failed to fetch problems", problems: [] },
      { status: 500 }
    );
  }
}