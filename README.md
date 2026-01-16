# The Victory Key 🔑

The Victory Key is an educational platform for learning Data Structures & Algorithms (DSA) and Computer Science (CS) fundamentals. Built with Next.js, React, TypeScript, Tailwind CSS, and Firebase, it offers a curated DSA sheet, CS subjects, a code playground powered by Monaco Editor and Piston API, progress tracking, gamification, and authentication via Google.

This README covers setup, development, deployment, project structure, Firebase admin setup, and helpful tips for contributors.

---

## Table of Contents

- Project Overview
- Key Features
- Tech Stack
- Getting Started (Local Development)
  - Prerequisites
  - Installation
  - Environment Variables
  - Run Locally
  - Type Checking and Linting
- Firebase Admin Setup
  - Service Account
  - Environment variables (server-side)
- Project Structure
- Firestore Collections
- Important Files to Know
- Deployment (Vercel)
- Troubleshooting
- Contributing
- License

---

## Project Overview

CodeMinted helps learners practice and master technical interview questions with:

- A curated DSA question sheet
- Organized CS topics and subjects
- Interactive code playground (multiple languages)
- Progress tracking, streaks, and achievements
- Google authentication and session management

It's built using modern React/Next.js patterns (App Router, server components) and Firebase for the backend.

---

## Key Features

- DSA problem list with categories and difficulty levels
- CS subject pages with topic breakdowns
- Monaco-based code playground with execution via server API (Piston)
- Progress tracking stored in Firestore
- Theme toggling (light/dark/system) with persistence
- Auth via Firebase (Google OAuth) and server-managed session cookies

---

## Tech Stack

- Next.js 15 (App Router, server components)
- React 18
- TypeScript 5
- Tailwind CSS 3
- Firebase (Authentication, Firestore, Admin SDK)
- Monaco Editor (@monaco-editor/react)
- Piston (code execution API)
- Shadcn / Radix UI primitives
- Lucide icons

---

## Getting Started (Local Development)

### Prerequisites

- Node.js (>=18 recommended)
- pnpm/npm/yarn
- Firebase project (for Authentication and Firestore)
- Firebase service account JSON for Admin operations (server-side)

### Installation

1. Clone the repository

```bash
git clone <your-repo-url> codeminted
cd codeminted
```

2. Install dependencies

```bash
npm install
# or
# pnpm install
```

### Environment Variables

Create a `.env.local` at the project root and add the following values (replace placeholders with your Firebase project values):

```env
# Client-side (prefix NEXT_PUBLIC_)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# Server-side (Admin SDK - keep secret)
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@your_project.iam.gserviceaccount.com
# Note: project ID may be used from NEXT_PUBLIC_FIREBASE_PROJECT_ID
```

Important: `FIREBASE_PRIVATE_KEY` must include newline characters. If your secret manager escapes newlines, make sure to replace `\n` with actual newlines or the code handles `\n` properly (this project replaces `\\n` to `\n` when initializing the admin SDK).

### Run Locally

```bash
npm run dev
# Open http://localhost:9002
```

### Type Checking and Linting

```bash
npm run typecheck
npm run lint
```

---

## Firebase Admin Setup

1. Create a service account in the Google Cloud Console for your Firebase project with the following roles: `Firebase Admin`, `Cloud Datastore Owner` (or Firestore owner), and `Service Account Token Creator`.
2. Download the service account JSON and extract `client_email` and `private_key`.
3. Add `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` to your environment (see above). For local development, paste the private key into your `.env.local` with `\n` replaced by `\\n` if necessary.

The project uses `src/lib/firebase/firebase-admin.ts` to initialize the Admin SDK and exports `auth` and `db` for server components and API routes.

---

## Project Structure (important folders)

- `src/app/` - Next.js app router pages and server components
- `src/components/` - Reusable React components (UI + domain components)
- `src/context/` - React Context providers (theme, auth, notifications)
- `src/hooks/` - Custom hooks
- `src/lib/` - Utilities and firebase client SDK (and admin SDK under `lib/firebase`)
- `src/components/playground/` - Code editor and playground

---

## Firestore Collections

The app uses the following collections (convention from codebase):

- `dsa_topics` - DSA categories (Arrays, Trees, Graphs, ...)
- `dsa_questions` - Individual DSA problems (documents contain `dsaTopicId` linking to `dsa_topics`)
- `cs_subjects` - High-level CS subjects (OS, DBMS, Networks)
- `cs_topics` - Topics under CS subjects
- `playground_problems` - Problems/templates shown in the code playground (includes `templates` object for language templates)
- `users` - User documents (profile, streaks, recent activity)
- `progress` or user progress tracked under `users.{uid}.progress` or a top-level `progress` collection depending on implementation

> Note: Confirm the exact schema in Firestore or admin UI. The repo includes `src/lib/types.ts` with interfaces and expected collection names.

---

## Important Files to Know

- `src/app/page.tsx` — Home page. Now fetches live counts using Admin SDK on the server.
- `src/app/about/page.tsx` — About page. Now fetches live counts using Admin SDK on the server.
- `src/app/api/execute/route.ts` — Code execution API (calls Piston)
- `src/lib/firebase.ts` — Firebase client initialization
- `src/lib/firebase/firebase-admin.ts` — Firebase Admin init (server-side), exports `auth` and `db`
- `src/lib/progress-tracker.ts` — Progress tracking helpers
- `src/lib/activity-tracker.ts` — Streak and activity tracking
- `src/components/playground/code-playground.tsx` — Monaco editor + playground UI
- `RESEARCH_PAPER.md` / `TECHNICAL_DOCUMENTATION.md` — Long-form documentation previously generated

---

## Deployment (Vercel)

1. Push to a Git repository (GitHub/GitLab).
2. Create a Vercel project and connect your repo.
3. Add all environment variables (client and server) to Vercel Project Settings.
4. Deploy — Vercel will build and deploy the app.

Notes:
- Ensure server-side `FIREBASE_PRIVATE_KEY` is added as a secret and the newline handling is addressed.
- For production, prefer using a pre-aggregated `site_stats` document for counts to reduce Firestore read costs.

---

## Troubleshooting

- Firestore permission errors: Check Firestore rules and ensure the Admin SDK is initialized with correct service account credentials.
- `auth/popup-closed-by-user` on login: The user closed the OAuth popup; try again.
- Slow page loads when counting collections: Consider storing pre-aggregated counts or using a background function.

---

## Contributing

1. Fork the repository and create a feature branch.
2. Write clear commit messages and include tests for new logic where applicable.
3. Open a pull request and describe the change.

Please follow the code style and run `npm run lint` and `npm run typecheck` before submitting.

---

## License

This repository doesn't include a license file by default. Add a `LICENSE` file if you plan to open-source it.

---

If you want, I can also:

- Add a `CONTRIBUTING.md` with contribution conventions and code review checklist
- Add a `site_stats` aggregator implementation and a Cloud Function to keep counts precomputed
- Add a `/api/stats` endpoint with caching and a small client hook to consume live stats

Tell me which of those you'd like next and I will implement it.
