import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/firebase-admin";
import { verifyAdminPermission } from "@/lib/auth-helpers";
import { invalidateCsContent } from "@/lib/cache-strategy";
import { z } from "zod";

export async function GET(request: NextRequest) {
  const auth = await verifyAdminPermission(request, "canManageTopics");
  if (!auth.isValid) {
    return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });
  }

  try {
    const snapshot = await adminDB.collection("cs_topics").get();
    const items = snapshot.docs.map(doc => ({ 
      ...doc.data(), 
      firebaseDocId: doc.id 
    }));
    
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching CS topics:", error);
    return NextResponse.json(
      { error: "Failed to fetch CS topics", items: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdminPermission(request, "canManageTopics");
  if (!auth.isValid) {
    return NextResponse.json({ error: auth.error || "Forbidden" }, { status: 403 });
  }

  try {
    const rawBody = await request.json();
    const data = z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      csSubjectId: z.string().min(1),
      resources: z.array(z.object({
        name: z.string(),
        url: z.string(),
      })).optional(),
    }).parse(rawBody);

    (data as any).createdAt = new Date();
    
    const docRef = await adminDB.collection("cs_topics").add(data);
    
    invalidateCsContent(undefined, data.csSubjectId);
    
    return NextResponse.json({ 
      success: true, 
      id: docRef.id,
      message: "CS topic created successfully" 
    });
  } catch (error) {
    console.error("Error creating CS topic:", error);
    return NextResponse.json(
      { error: "Failed to create CS topic" },
      { status: 500 }
    );
  }
}