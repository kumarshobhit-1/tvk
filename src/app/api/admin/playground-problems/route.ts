import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/firebase-admin";
import { verifyAdminPermission } from "@/lib/auth-helpers";
import { invalidatePlaygroundCache } from "@/lib/cache-strategy";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminPermission(request, "canManagePlayground");
    if (!auth.isValid) {
      return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 403 });
    }

    const snapshot = await adminDB.collection("playground_problems").get();
    const items = snapshot.docs.map(doc => ({ 
      ...doc.data(), 
      firebaseDocId: doc.id 
    }));
    
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching playground problems:", error);
    return NextResponse.json(
      { error: "Failed to fetch playground problems", items: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminPermission(request, "canManagePlayground");
    if (!auth.isValid) {
      return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 403 });
    }

    const rawBody = await request.json();
    const data = z.object({
      title: z.string().min(1),
      description: z.string().min(1),
      difficulty: z.enum(["Easy", "Medium", "Hard"]),
      starterCode: z.any().optional(),
      testCases: z.any().optional(),
    }).parse(rawBody);

    (data as any).createdAt = new Date();
    
    const docRef = await adminDB.collection("playground_problems").add(data);
    
    invalidatePlaygroundCache();
    
    return NextResponse.json({ 
      success: true, 
      id: docRef.id,
      message: "Playground problem created successfully" 
    });
  } catch (error) {
    console.error("Error creating playground problem:", error);
    return NextResponse.json(
      { error: "Failed to create playground problem" },
      { status: 500 }
    );
  }
}