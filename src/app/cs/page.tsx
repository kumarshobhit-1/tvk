export const dynamic = 'force-dynamic';
import { CsSubjectList } from "@/components/cs/cs-subject-list";
import type { Metadata } from "next";
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { adminDB } from "@/lib/firebase/firebase-admin";
import type { CsSubject, CsTopic } from "@/lib/types";

export const metadata: Metadata = {
  title: "CS Subjects | The Victory Key",
  description: "Your guide to mastering core computer science subjects.",
};

import { cacheAside, CacheKeys } from "@/lib/cache-strategy";

export default async function CsPage() {
  const csSubjects = await cacheAside(
    CacheKeys.csSubjects(),
    async () => {
      const snap = await adminDB.collection("cs_subjects").orderBy("createdAt", "asc").get();
      return snap.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate?.().toISOString() || null,
        } as CsSubject;
      });
    }
  );

  const allCsTopics = await cacheAside(
    CacheKeys.csAllTopics(),
    async () => {
      const snap = await adminDB.collection("cs_topics").get();
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Home
        </Link>
      </div>
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tighter">CS Core Subjects</h1>
        <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">
          Strengthen your fundamentals with our curated list of core computer science topics.
        </p>
      </div>
      <CsSubjectList subjects={csSubjects} allTopics={allCsTopics} />
    </div>
  );
}