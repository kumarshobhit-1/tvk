import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/firebase-admin";

export async function GET() {
  try {
    const snapshot = await adminDB.collection("cs_subjects").orderBy("createdAt", "asc").get();
    const items = snapshot.docs.map(doc => ({ 
      ...doc.data(), 
      id: doc.id, 
      firebaseDocId: doc.id 
    }));
    
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching CS subjects:", error);
    return NextResponse.json(
      { error: "Failed to fetch CS subjects", items: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    data.createdAt = new Date();
    
    const docRef = await adminDB.collection("cs_subjects").add(data);
    
    return NextResponse.json({ 
      success: true, 
      id: docRef.id,
      message: "CS subject created successfully" 
    });
  } catch (error) {
    console.error("Error creating CS subject:", error);
    return NextResponse.json(
      { error: "Failed to create CS subject" },
      { status: 500 }
    );
  }
}