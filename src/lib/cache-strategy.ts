// src/lib/cache-strategy.ts
/**
 * Caching Strategy for Database and API Calls
 * Helps handle 1000+ concurrent users efficiently
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  set<T>(key: string, value: T, ttl: number = 5 * 60 * 1000) {
    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    const age = now - entry.timestamp;

    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  invalidate(key: string) {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string | RegExp) {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

// Singleton instance
let cacheInstance: MemoryCache | null = null;
const inFlightFetches: Map<string, Promise<unknown>> = new Map();

export function getCache(): MemoryCache {
  if (!cacheInstance) {
    cacheInstance = new MemoryCache();
  }
  return cacheInstance;
}

// Cache key generators
export const CacheKeys = {
  // Exams
  exam: (examId: string) => `exam:${examId}`,
  examList: (category?: string) => `exams:list:${category || 'all'}`,
  examAttempts: (examId: string) => `exam:${examId}:attempts`,
  
  // Users
  user: (userId: string) => `user:${userId}`,
  userExams: (userId: string) => `user:${userId}:exams`,
  userResults: (userId: string) => `user:${userId}:results`,
  
  // QA Content
  qaQuestions: (topic: string) => `qa:questions:${topic}`,
  qaTopics: (subject: string) => `qa:topics:${subject}`,
  dsaTopics: () => 'qa:dsa:topics',
  dsaQuestions: () => 'qa:dsa:questions',
  dsaTopicQuestions: (topicId: string) => `qa:dsa:questions:${topicId}`,
  dsaTopicBySlug: (slug: string) => `qa:dsa:topic:slug:${slug}`,
  csTopics: () => 'qa:cs:topics',
  csSubjects: () => 'qa:cs:subjects',
  csSubjectBySlug: (slug: string) => `qa:cs:subject:slug:${slug}`,
  csTopicList: (subjectId: string) => `qa:cs:topics:${subjectId}`,
  csAllTopics: () => 'qa:cs:all_topics',
  
  // PDFs
  pdfList: () => 'pdfs:list',
  pdfFolders: () => 'pdfs:folders',
  pdfFolderFiles: (folderId: string) => `pdfs:files:${folderId}`,
  pdf: (pdfId: string) => `pdf:${pdfId}`,

  // Playground & CIL
  playgroundProblems: () => 'playground:problems',
  cilCounts: () => 'cil:counts',
  homeStats: () => 'home:stats',
} as const;

// Cache TTLs (Time To Live in milliseconds)
export const CACHE_TTL = {
  SHORT: 5 * 60 * 1000,        // 5 minutes
  MEDIUM: 30 * 60 * 1000,      // 30 minutes
  LONG: 2 * 60 * 60 * 1000,    // 2 hours
  VERY_LONG: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// Helper for cache-aside pattern
export async function cacheAside<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = CACHE_TTL.MEDIUM
): Promise<T> {
  const cache = getCache();
  
  // Try to get from cache
  const cached = cache.get<T>(key);
  if (cached) {
    return cached;
  }

  // Deduplicate concurrent misses for the same key.
  const inFlight = inFlightFetches.get(key) as Promise<T> | undefined;
  if (inFlight) {
    return inFlight;
  }

  const fetchPromise = (async () => {
    // Fetch if not cached
    const data = await fetcher();

    // Store in cache
    cache.set(key, data, ttl);

    return data;
  })();

  inFlightFetches.set(key, fetchPromise);

  try {
    return await fetchPromise;
  } finally {
    inFlightFetches.delete(key);
  }
}

export function invalidateDsaTopics(slug?: string) {
  const cache = getCache();
  cache.invalidate(CacheKeys.dsaTopics());
  if (slug) {
    cache.invalidate(CacheKeys.dsaTopicBySlug(slug));
  }
  cache.invalidatePattern(/^qa:dsa:topic:slug:/);
  cache.invalidate(CacheKeys.cilCounts());
}

export function invalidateDsaQuestions(topicId?: string) {
  const cache = getCache();
  cache.invalidate(CacheKeys.dsaQuestions());
  if (topicId) {
    cache.invalidate(CacheKeys.dsaTopicQuestions(topicId));
  }
}

export function invalidateCsContent(subjectSlug?: string, subjectId?: string) {
  const cache = getCache();
  cache.invalidate(CacheKeys.csSubjects());
  cache.invalidate(CacheKeys.csAllTopics());
  if (subjectSlug) {
    cache.invalidate(CacheKeys.csSubjectBySlug(subjectSlug));
  }
  if (subjectId) {
    cache.invalidate(CacheKeys.csTopicList(subjectId));
  }
  cache.invalidatePattern(/^qa:cs:subject:slug:/);
  cache.invalidatePattern(/^qa:cs:topics:/);
  cache.invalidate(CacheKeys.cilCounts());
}

export function invalidatePdfCaches(folderId?: string) {
  const cache = getCache();
  cache.invalidate(CacheKeys.pdfFolders());
  cache.invalidate(CacheKeys.pdfList());
  if (folderId) {
    cache.invalidate(CacheKeys.pdfFolderFiles(folderId));
  }
  cache.invalidatePattern(/^pdfs:files:/);
  cache.invalidate(CacheKeys.cilCounts());
}

export function invalidatePlaygroundCache() {
  const cache = getCache();
  cache.invalidate(CacheKeys.playgroundProblems());
}
