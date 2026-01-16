// src/app/api/redirect/route.ts

import { NextResponse } from 'next/server';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Assuming your firebase admin/client init is here
import type { DsaQuestion, CsTopic } from '@/lib/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secureId = searchParams.get('id');

  if (!secureId) {
    return NextResponse.json({ error: 'Link ID is required' }, { status: 400 });
  }

  // Example secureId: "dsa-arrays-q1-leetcode" or "cs-os-t1-article"
  // We need to parse this to find the document and the resource
  const parts = secureId.split('-');
  const resourceName = parts.pop(); // "leetcode" or "article"
  const docId = parts.join('-'); // "dsa-arrays-q1" or "cs-os-t1"
  
  if (!docId || !resourceName) {
     return NextResponse.json({ error: 'Invalid link ID format' }, { status: 400 });
  }

  try {
    let destinationUrl: string | undefined;

    // Search in dsa_questions
    const dsaQuery = query(collection(db, "dsa_questions"), where("id", "==", docId), limit(1));
    const dsaSnap = await getDocs(dsaQuery);
    
    if (!dsaSnap.empty) {
        const question = dsaSnap.docs[0].data() as DsaQuestion;
        const resource = question.resources.find(r => r.name.toLowerCase() === resourceName);
        destinationUrl = resource?.url;
    } else {
        // If not found in DSA, search in cs_topics
        const csQuery = query(collection(db, "cs_topics"), where("id", "==", docId), limit(1));
        const csSnap = await getDocs(csQuery);

        if (!csSnap.empty) {
            const topic = csSnap.docs[0].data() as CsTopic;
            const resource = topic.resources.find(r => r.name.toLowerCase() === resourceName);
            destinationUrl = resource?.url;
        }
    }

    if (destinationUrl) {
      // Redirect to the found URL
      return NextResponse.redirect(destinationUrl);
    } else {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

  } catch (error) {
    console.error("Redirect API error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}