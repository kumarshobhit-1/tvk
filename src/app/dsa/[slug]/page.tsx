// src/app/dsa/[slug]/page.tsx

export const dynamic = 'force-dynamic';

import { notFound } from "next/navigation";
import { QuestionList } from "@/components/dsa/question-list";
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getProgress } from "@/lib/db";
import { adminAuth, adminDB } from "@/lib/firebase/firebase-admin";
import { cookies } from 'next/headers';
import type { Metadata } from "next";
import type { DsaTopic, DsaQuestion } from "@/lib/types";

// --- बदलाव यहाँ है: params की टाइप परिभाषा को सरल बनाया गया है ---
export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await props.params; ; // अब आप सीधे slug का उपयोग कर सकते हैं
  
  const topicsSnapshot = await adminDB.collection("dsa_topics").where("slug", "==", slug).get();
  const topic = topicsSnapshot.docs[0]?.data() as DsaTopic;

  if (!topic) {
    return {
      title: "Topic Not Found | The Victory Key",
    };
  }
  return {
    title: `${topic.name} | The Victory Key`,
    description: topic.description,
  };
}

export async function generateStaticParams() {
  const topicsSnapshot = await adminDB.collection("dsa_topics").get();
  
  const paths = topicsSnapshot.docs.map(doc => {
    const data = doc.data();
    if (data.slug && typeof data.slug === 'string') {
      return {
        slug: data.slug,
      };
    }
    return null;
  }).filter(Boolean);

  return paths;
}

// --- बदलाव यहाँ है: params की टाइप परिभाषा को सरल बनाया गया है ---
export default async function DsaTopicPage(
  props: { params: Promise<{ slug: string }> }
) {
  const { slug } = await props.params; // await params

  // 1. Find the topic document based on the slug
  const topicsSnapshot = await adminDB.collection("dsa_topics").where("slug", "==", slug).get();
  const topicDoc = topicsSnapshot.docs[0];
  
  if (!topicDoc) {
    notFound();
  }
  const topicData = topicDoc.data();
  const topic = { 
    ...topicData,
    id: topicDoc.id,
    createdAt: topicData.createdAt?.toDate?.().toISOString() || null,
  } as DsaTopic;

  // 2. Fetch all questions that belong to this topic
  const questionsSnapshot = await adminDB.collection("dsa_questions")
    .where("dsaTopicId", "==", topic.id)
    .orderBy("createdAt", "asc")
    .get();
  
  const questions = questionsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      firebaseDocId: doc.id,
      createdAt: data.createdAt?.toDate?.().toISOString() || null,
    } as DsaQuestion;
  });

  // 3. Get user progress on the server
  let userProgress: Record<string, boolean> = {};
  const cookiesStore = await cookies();
  const sessionCookie = cookiesStore.get('session')?.value;
  if (sessionCookie) {
    try {
      const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
      userProgress = await getProgress(decodedToken.uid);
    } catch (error) { /* User not logged in */ }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/dsa" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to DSA Topics
        </Link>
        <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tighter">{topic.name}</h1>
        <p className="text-lg text-muted-foreground mt-2 max-w-2xl">{topic.description}</p>
      </div>
      <QuestionList topic={topic} initialQuestions={questions} initialProgress={userProgress} />
    </div>
  );
}