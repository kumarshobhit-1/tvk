// src/app/cs/[slug]/page.tsx

export const dynamic = 'force-dynamic';

import { notFound } from "next/navigation";
import { TopicList } from "@/components/cs/topic-list";
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getProgress } from "@/lib/db";
import { adminAuth, adminDB } from "@/lib/firebase/firebase-admin";
import { cookies } from 'next/headers';
import type { Metadata } from "next";
import type { CsSubject, CsTopic } from "@/lib/types";

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await props.params; // await params
  const subjectsSnapshot = await adminDB.collection("cs_subjects").where("slug", "==", slug).get();
  const subject = subjectsSnapshot.docs[0]?.data() as CsSubject;

  if (!subject) return { title: "Subject Not Found" };
  return { title: `${subject.name} | The Victory Key`, description: subject.description };
}

export async function generateStaticParams() {
  const subjectsSnapshot = await adminDB.collection("cs_subjects").get();
  return subjectsSnapshot.docs.map(doc => ({
    slug: doc.data().slug,
  })).filter(Boolean);
}

import { cacheAside, CacheKeys } from "@/lib/cache-strategy";

export default async function CsSubjectPage(
  props: { params: Promise<{ slug: string }> }
) {
  const { slug } = await props.params;

  // 1. Find the subject document based on the slug
  const subject = await cacheAside(
    CacheKeys.csSubjectBySlug(slug),
    async () => {
      const snap = await adminDB.collection("cs_subjects").where("slug", "==", slug).get();
      const subjectDoc = snap.docs[0];
      if (!subjectDoc) return null;
      const subjectData = subjectDoc.data();
      return { 
        ...subjectData,
        id: subjectDoc.id,
        createdAt: subjectData.createdAt?.toDate?.().toISOString() || null,
      } as CsSubject;
    }
  );
  
  if (!subject) {
    notFound();
  }

  // 2. Fetch all topics that belong to this subject
  const topics = await cacheAside(
    CacheKeys.csTopicList(subject.id),
    async () => {
      const snap = await adminDB.collection("cs_topics")
        .where("csSubjectId", "==", subject.id)
        .orderBy("createdAt", "asc")
        .get();
      return snap.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          firebaseDocId: doc.id,
          createdAt: data.createdAt?.toDate?.().toISOString() || null,
        } as CsTopic;
      });
    }
  );

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
        <Link href="/cs" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to CS Subjects
        </Link>
        <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tighter">{subject.name}</h1>
        <p className="text-lg text-muted-foreground mt-2 max-w-2xl">{subject.description}</p>
      </div>
      <TopicList subject={subject} initialTopics={topics} initialProgress={userProgress} />
    </div>
  );
}