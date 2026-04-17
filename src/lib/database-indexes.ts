// FIRESTORE INDEXES REQUIRED FOR SCALABILITY
// For 1000+ concurrent users and 100+ daily active students

/**
 * Copy and paste these indexes in Firestore Console:
 * Project Settings > Indexes > Create Index
 * 
 * Or use Firebase Cloud CLI:
 * firebase firestore:indexes:create firestore.indexes.json
 */

export const REQUIRED_INDEXES = [
  {
    collectionGroup: 'exam_attempts',
    indexes: [
      {
        fields: [
          { fieldPath: 'examId', order: 'ASCENDING' },
          { fieldPath: 'status', order: 'ASCENDING' },
          { fieldPath: 'submittedAt', order: 'DESCENDING' },
        ],
        description: 'For fetching exam results sorted by submission time',
      },
      {
        fields: [
          { fieldPath: 'userId', order: 'ASCENDING' },
          { fieldPath: 'status', order: 'ASCENDING' },
        ],
        description: 'For fetching user attempts by status',
      },
      {
        fields: [
          { fieldPath: 'examId', order: 'ASCENDING' },
          { fieldPath: 'userId', order: 'ASCENDING' },
          { fieldPath: 'status', order: 'ASCENDING' },
        ],
        description: 'For checking user attempt status for specific exam',
      },
    ],
  },
  {
    collectionGroup: 'exams',
    indexes: [
      {
        fields: [
          { fieldPath: 'isPublished', order: 'ASCENDING' },
          { fieldPath: 'category', order: 'ASCENDING' },
          { fieldPath: 'createdAt', order: 'DESCENDING' },
        ],
        description: 'For listing published exams by category',
      },
      {
        fields: [
          { fieldPath: 'isActive', order: 'ASCENDING' },
          { fieldPath: 'isPublished', order: 'ASCENDING' },
        ],
        description: 'For checking active and published exams',
      },
    ],
  },
  {
    collectionGroup: 'dsa_topics',
    indexes: [
      {
        fields: [
          { fieldPath: 'published', order: 'ASCENDING' },
          { fieldPath: 'difficulty', order: 'ASCENDING' },
        ],
        description: 'For filtering DSA topics by difficulty',
      },
    ],
  },
  {
    collectionGroup: 'cs_topics',
    indexes: [
      {
        fields: [
          { fieldPath: 'published', order: 'ASCENDING' },
          { fieldPath: 'difficulty', order: 'ASCENDING' },
        ],
        description: 'For filtering CS topics by difficulty',
      },
    ],
  },
];

export const INDEX_CREATION_COMMAND = `
firebase firestore:indexes:create firestore.indexes.json
`;

/**
 * FIRESTORE OPTIMIZATION TIPS FOR HIGH CONCURRENCY
 */
export const OPTIMIZATION_TIPS = [
  {
    title: 'Database Sharding for Exam Attempts',
    description: 'Distribute exam attempts across multiple documents using shard counter pattern',
    example: `
      Instead of: exam_stats/{examId}
      Use: exam_stats/{examId}/shards/{shardId}
      
      Benefits: Prevents contention when many users submit exams simultaneously
    `,
  },
  {
    title: 'Batch Reads',
    description: 'Use batch reads to fetch multiple documents in single request',
    code: `
      // Bad - Multiple requests
      const exam = await db.collection('exams').doc(examId).get();
      const attempts = await db.collection('exam_attempts').where('examId', '==', examId).get();
      
      // Good - Single batch request
      const batch = db.batch();
      const examRef = db.collection('exams').doc(examId);
      const attemptsQuery = db.collection('exam_attempts').where('examId', '==', examId);
      // Use Promise.all for parallel reads
    `,
  },
  {
    title: 'Pagination',
    description: 'Always paginate large result sets',
    tip: 'Limit each query to 100-500 documents, use cursor pagination',
  },
  {
    title: 'Denormalization Strategy',
    description: 'Denormalize frequently accessed data to reduce reads',
    example: `
      Store: user.recentExamScores instead of fetching from exam_attempts every time
      Update on exam completion, not on every view
    `,
  },
  {
    title: 'Read Replicas',
    description: 'For analytics/reporting, create read replicas of hot data',
    tip: 'Use Firestore exports to BigQuery for analytics',
  },
];

/**
 * RECOMMENDED QUERY PATTERNS
 */
export const QUERY_PATTERNS = {
  // ❌ AVOID - Full collection scan
  bad_exam_results: `
    db.collection('exam_attempts')
      .where('percentage', '>', 80)
      .get();
  `,
  
  // ✅ GOOD - Use indexed fields
  good_exam_results: `
    db.collection('exam_attempts')
      .where('examId', '==', examId)
      .where('status', '==', 'submitted')
      .orderBy('submittedAt', 'desc')
      .limit(50)
      .get();
  `,

  // ❌ AVOID - Multiple range queries
  bad_complex_query: `
    db.collection('exams')
      .where('totalMarks', '>', 50)
      .where('duration', '<', 180)
      .get();
  `,

  // ✅ GOOD - Reduced to single query with post-filtering
  good_complex_query: `
    db.collection('exams')
      .where('isPublished', '==', true)
      .get()
      .then(docs => {
        return docs
          .filter(doc => doc.data().totalMarks > 50 && doc.data().duration < 180)
          .docs;
      });
  `,
};

/**
 * DOCUMENT SIZE LIMITS
 * Firestore: 1MB per document
 */
export const SIZE_OPTIMIZATION = {
  issue: 'Large documents cause slow reads/writes',
  solution: 'Split into subcollections',
  example: `
    exams/{examId} - metadata
    exams/{examId}/questions/{questionId} - questions (use subcollections if > 100 questions)
    exams/{examId}/questionsSnapshot/{snapshotId} - snapshots
  `,
};
