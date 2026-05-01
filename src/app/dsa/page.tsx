export const dynamic = 'force-dynamic';

import { DsaTopicList } from "@/components/dsa/dsa-topic-list";
import { CoreConceptsButton } from "@/components/dsa/core-concepts-button";
import type { Metadata } from "next";
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { adminDB } from "@/lib/firebase/firebase-admin";
import type { DsaTopic, DsaQuestion } from "@/lib/types";


export const metadata: Metadata = {
  title: "DSA Topics | The Victory Key",
  description: "Your guide to mastering DSA and CS fundamentals.",
};

export default async function DsaPage() {
  
  // Fetch both topics and questions on the server
  const [topicsSnapshot, questionsSnapshot] = await Promise.all([
    adminDB.collection("dsa_topics").orderBy("createdAt", "asc").get(),
    adminDB.collection("dsa_questions").get(),
  ]);

  const dsaTopics = topicsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toDate?.().toISOString() || null, // Convert Timestamp
    } as DsaTopic;
  });
  
  const allDsaQuestions = questionsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      firebaseDocId: doc.id,
      createdAt: data.createdAt?.toDate?.().toISOString() || null, // Convert Timestamp
    } as DsaQuestion;
  });
  return (
    <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
        <Link href="/" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Home
        </Link>
      </div>
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tighter">DSA Sheet</h1>
        <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">
          Curated topics and problems to sharpen your data structures and algorithms skills.
        </p>
      </div>

      <div className="mb-12 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Quick Navigation</p>
            <h2 className="mt-2 text-2xl font-bold font-headline">Open the full DSA core-concepts sheet</h2>
            <p className="mt-2 text-muted-foreground max-w-2xl">
              This sheet for Trees, Graphs, Hashing, Sorting, and algorithm design notes in one place.
            </p>
          </div>
          <CoreConceptsButton />
        </div>
      </div>

      {/* Pass both lists to the client component */}
      <DsaTopicList topics={dsaTopics} allQuestions={allDsaQuestions} />
    </div>
  );
}