// src/lib/types.ts
import { Timestamp } from "firebase/firestore";

// A single link resource, used in multiple places
export interface Resource {
  name: string; // e.g., "LeetCode", "Article", "Video"
  url: string;
}

// Represents a top-level DSA category like "Arrays" or "Linked List"
// To be stored in the `dsa_topics` collection in Firestore
export interface DsaTopic {
  id: string; // This will be the Firestore Document ID
  name: string;
  slug: string;
  description: string;
  imageUrl?: string;
  createdAt?: Timestamp;
}

// Represents a single DSA question like "Two Sum"
// To be stored in the `dsa_questions` collection in Firestore
export interface DsaQuestion {
  firebaseDocId: string; // The actual Firestore document ID for internal use
  id: string; // The custom ID you want to assign, e.g., "dsa-arrays-q1"
  title: string;
  dsaTopicId: string; // Links to a document ID in the `dsa_topics` collection
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  examples?: Array<{ input: string; output: string; explanation?: string }>;
  constraints?: string[];
  resources: Resource[];
  createdAt?: Timestamp;
}

// Represents a top-level CS category like "Operating Systems"
// To be stored in the `cs_subjects` collection in Firestore
export interface CsSubject {
  id: string; // This will be the Firestore Document ID
  name: string;
  slug: string;
  description: string;
  imageUrl?: string;
  createdAt?: Timestamp;
}

// Represents a single CS topic like "Process Management"
// To be stored in the `cs_topics` collection in Firestore
export interface CsTopic {
  firebaseDocId: string; // The actual Firestore document ID for internal use
  id: string; // The custom ID you want to assign, e.g., "cs-os-t1"
  title: string;
  csSubjectId: string; // Links to a document ID in the `cs_subjects` collection
  resources: Resource[];
  createdAt?: Timestamp;
}

// Represents the user's progress data
export type Progress = Record<string, boolean>;