import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/firebase-admin";
import { verifyAdminPermission } from "@/lib/auth-helpers";
import { invalidateDsaQuestions } from "@/lib/cache-strategy";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminPermission(request, "canCreateQAQuestion");
    if (!auth.isValid) {
      return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 403 });
    }

    const snapshot = await adminDB.collection("dsa_questions").get();
    const items = snapshot.docs.map(doc => ({ 
      ...doc.data(), 
      firebaseDocId: doc.id 
    }));
    
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching DSA questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch DSA questions", items: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminPermission(request, "canCreateQAQuestion");
    if (!auth.isValid) {
      return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: 403 });
    }

    const rawBody = await request.json();
    const data = z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      dsaTopicId: z.string().min(1),
      difficulty: z.enum(["Easy", "Medium", "Hard"]),
      description: z.string().min(1),
      examples: z.array(z.object({
        input: z.string(),
        output: z.string(),
        explanation: z.string().optional().nullable(),
      })).optional(),
      constraints: z.array(z.string()).optional(),
      resources: z.array(z.object({
        name: z.string(),
        url: z.string(),
      })).optional(),
    }).parse(rawBody);

    (data as any).createdAt = new Date();
    
    const docRef = await adminDB.collection("dsa_questions").add(data);
    
    invalidateDsaQuestions(data.dsaTopicId);
    
    return NextResponse.json({ 
      success: true, 
      id: docRef.id,
      message: "DSA question created successfully" 
    });
  } catch (error) {
    console.error("Error creating DSA question:", error);
    return NextResponse.json(
      { error: "Failed to create DSA question" },
      { status: 500 }
    );
  }
}