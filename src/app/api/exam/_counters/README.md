# Exam counters backfill / maintenance

This folder contains endpoints used to backfill and maintain Firestore counters on `exams/{examId}`.

## Backfill endpoint
- `POST /api/exam/_counters/backfill-exam-counters`

### Body
- `examIds?: string[]`
  - If omitted, backfills all `exams` where `isPublished == true`.

### Writes to
- `exams/{examId}`
  - `totalAttempts`
  - `activeCount`
  - `uniqueStudents`
  - `countersBackfilledAt`

## Notes
- Backfilling scans `exam_attempts` and can be expensive. Use sparingly/off-peak.

