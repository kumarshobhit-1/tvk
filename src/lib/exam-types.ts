import { Timestamp } from "firebase/firestore";

export type ExamType = "practice" | "timed" | "mock";
export type DifficultyLevel = "Easy" | "Medium" | "Hard";

export interface ExamOption {
  id: string;
  text: string;
}

export interface ExamQuestion {
  id: string;
  text: string;
  imageUrl?: string;
  options: ExamOption[];
  correctOptionId: string;
  explanation?: string;
  marks: number;
  difficulty: DifficultyLevel;
  subject?: string; // e.g., "SEBI Regulations", "Securities Market"
}

export interface ExamSection {
  id: string;
  title: string;
  description?: string;
  durationMinutes: number;
  questionIds?: string[];
  questions?: ExamQuestion[];
  totalMarks?: number;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  isPremium?: boolean;
  isLocked?: boolean; // Whether the exam is locked until admin unlocks it
  type: ExamType;
  durationMinutes: number; // Total duration in minutes
  totalMarks: number;
  passingMarks: number;
  negativeMarking: number; // e.g., 0.25 means -0.25 for wrong answer
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  instructions: string[];
  questions: ExamQuestion[];
  sections?: ExamSection[];
  isPublished: boolean;
  isActive: boolean; // Whether exam is currently active
  emergencyStopped?: boolean; // Whether exam is emergency stopped
  emergencyStoppedAt?: Timestamp; // When it was stopped
  emergencyStoppedBy?: string; // Admin who stopped it
  emergencyRestartedAt?: Timestamp; // When it was restarted
  emergencyRestartedBy?: string; // Admin who restarted it
  category: string; // e.g., "SEBI", "Stock Market"
  createdBy: string; // User ID of admin who created it
  createdAt: Timestamp;
  updatedAt?: Timestamp;

  /**
   * Denormalized counters to avoid scanning exam_attempts.
   *
   * totalAttempts: total number of attempts ever created for this exam.
   * uniqueStudents: distinct userId who ever created an attempt for this exam.
   * activeCount: current number of attempts in status "in-progress".
   */
  totalAttempts?: number;
  uniqueStudents?: number;
  activeCount?: number;
}


export interface ExamAnswer {
  questionId: string;
  selectedOptionId: string | null;
  isFlagged: boolean;
  isMarkedForReview?: boolean;
  timeSpent?: number; // in seconds
}

export interface ExamAttempt {
  id: string;
  examId: string;
  userId: string;
  userName: string;
  userEmail: string;
  startedAt: Timestamp;
  submittedAt?: Timestamp;
  answers: ExamAnswer[];
  score?: number;
  correctAnswers?: number;
  wrongAnswers?: number;
  unanswered?: number;
  percentage?: number;
  timeTaken?: number; // in seconds
  passed?: boolean;
  ipAddress?: string;
  userAgent?: string;
  status: "in-progress" | "submitted" | "expired";
}

export interface ExamResult {
  attemptId: string;
  examId: string;
  examTitle: string;
  userId: string;
  userName: string;
  score: number;
  totalMarks: number;
  passingMarks?: number;
  passingPercentage?: number;
  correctAnswers: number;
  wrongAnswers: number;
  unanswered: number;
  percentage: number;
  passed: boolean;
  timeTaken: number; // in seconds
  submittedAt: Timestamp;
  answers: Array<{
    questionId: string;
    questionText: string;
    selectedOptionId: string | null;
    correctOptionId: string;
    isCorrect: boolean;
    marksAwarded: number;
    explanation?: string;
    options: ExamOption[];
  }>;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  userEmail: string;
  score: number;
  percentage: number;
  timeTaken: number;
  submittedAt: Timestamp;
  rank?: number;
}
