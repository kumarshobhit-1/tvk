# The Victory Key 🔑

**The Victory Key (TVK)** is a high-performance, enterprise-grade Online Examination and Competitive Exam Preparation Platform. Built using **Next.js 15 (App Router)**, **React 18**, **TypeScript**, **Tailwind CSS**, **Shadcn UI / Radix UI**, and **Firebase (Auth, Firestore, Admin SDK)**, TVK provides a robust test-delivery system for competitive exams such as **SEBI Grade A**, **IBPS SO IT Officer**, **Coal India Limited (CIL)**, **HPCL IS**, **RBI Grade B**, **AD IT**, **JEE**, **SSC**, **UPSC**, and custom competitive exam streams.

It features multi-section test engines, real-time timer controls, progress auto-saving, anti-duplicate attempt enforcement, instant automated grading, detailed analytics breakdown, live leaderboards, cloud PDF libraries, an integrated k6 load-testing suite (supporting 500+ concurrent Virtual Users), and an extensive **Role-Based Admin Management Portal (`/admintvk01`)**.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
  - [Student & Test-Taker Portal](#student--test-taker-portal)
  - [Admin Management Portal (`/admintvk01`)](#admin-management-portal-admintvk01)
- [Tech Stack & Architecture](#tech-stack--architecture)
- [Getting Started (Local Development)](#getting-started-local-development)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running Locally](#running-locally)
  - [Type Checking & Linting](#type-checking--linting)
- [Firebase & Server Setup](#firebase--server-setup)
  - [Service Account Setup](#service-account-setup)
  - [Firebase Admin Initialization](#firebase-admin-initialization)
- [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
  - [Admin Roles & Permissions](#admin-roles--permissions)
  - [Permission Matrix](#permission-matrix)
- [Admin Portal Workflows (`/admintvk01`)](#admin-portal-workflows-admintvk01)
  - [1. Exam Creation & Editing](#1-exam-creation--editing)
  - [2. Multi-Section Exam Editor](#2-multi-section-exam-editor)
  - [3. Bulk Question Importer (JSON & Excel)](#3-bulk-question-importer-json--excel)
  - [4. Active Exam Monitor & Emergency Controls](#4-active-exam-monitor--emergency-controls)
  - [5. Result & Leaderboard Recalculation Engine](#5-result--leaderboard-recalculation-engine)
  - [6. PDF Resource Library Management](#6-pdf-resource-library-management)
  - [7. Admin & Premium User Management](#7-admin--premium-user-management)
- [Load Testing & Performance Benchmarks](#load-testing--performance-benchmarks)
- [Firestore Collections & Security Rules](#firestore-collections--security-rules)
- [API Routes Reference](#api-routes-reference)
  - [Public & Student Endpoints](#public--student-endpoints)
  - [Admin Endpoints](#admin-endpoints)
- [Project Structure](#project-structure)
- [Deployment (Vercel)](#deployment-vercel)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Project Overview

**The Victory Key** is engineered for high-concurrency competitive examination environments. It enables educational institutions, academies, and administrators to author, manage, and conduct timed mock tests, practice exams, and sectional assessments with precision.

### Key Highlights:
- **Multi-Format Examinations**: Supports **Practice**, **Timed**, and full **Mock** exam types.
- **Sectional Exam Engine**: Multi-section exams with section-specific durations, custom mark weightings, passing thresholds, negative marking rules, and separate question pools.
- **Real-Time Test Delivery**: Responsive exam runner with interactive question palettes, marking for review, option shuffling, question diagram rendering, auto-save timers, and duplicate submission prevention.
- **Instant Automated Evaluation**: Automatic score computation, accuracy percentage, time-taken metrics, and detailed question-by-question explanations.
- **Live Real-Time Leaderboards**: Dynamic student rankings calculated using scores, accuracy rates, and time taken, optimized with denormalized counters to prevent high database read costs.
- **Comprehensive Admin Portal (`/admintvk01`)**: RBAC-protected administrative hub for exam creation, section editing, bulk question uploading (Excel/JSON), active exam monitoring, emergency stop/restart, leaderboard recalculations, PDF library uploads, and user permission management.
- **Tested for High Scale**: Integrated k6 load test suite designed to validate server performance under 100, 200, 300, and 500 concurrent Virtual Users (VUs).

---

## Key Features

### Student & Test-Taker Portal

- **Exam Catalog & Categories**: Browse exams organized by categories such as **SEBI**, **IBPS SO IT**, **CIL**, **HPCL IS**, **RBI**, **JEE**, **SSC**, **UPSC**, and custom categories.
- **Multi-Section Exam Interface (`ExamRunnerWithSections`)**:
  - Live sectional countdown timers with auto-submission triggers.
  - Interactive Question Palette with status indicators:
    - 🟢 *Answered*
    - ⚪ *Unanswered*
    - 🟣 *Marked for Review*
    - 🔵 *Current Question*
  - Section-to-section navigation with custom section instructions.
  - Single-choice and multiple-choice options with support for diagram images.
  - Option and question order randomization (shuffling) when enabled.
- **Real-Time Progress Auto-Saving**: Periodically syncs attempt progress to Firestore (`/api/exam/save-progress`), safeguarding candidate responses against power outages or network disconnections.
- **Instant Detailed Result Summary (`ResultSummary`)**:
  - Score card featuring total score, percentage, correct/wrong/unanswered count, pass/fail status, and time taken.
  - Comprehensive question review table displaying correct answers, candidate selections, explanation texts, and reference diagrams.
  - Sectional performance breakdowns.
- **Real-Time Exam Leaderboard (`/exam/leaderboard`)**:
  - Public and exam-specific leaderboards ranking top performers by score, accuracy, and attempt speed.
- **PDF Study Library (`/library`)**:
  - Access study materials, previous year papers (PYQs), syllabus copies, and reference documents powered by Cloudinary CDN storage.
- **Google OAuth Authentication & HTTP-Only Session Management**:
  - Firebase Authentication with Google Sign-In and secure server-managed HTTP-only session cookies (`/api/session`).

---

### Admin Management Portal (`/admintvk01`)

- **Role-Based Access Control (RBAC)**: Enforces access restrictions based on 5 admin roles (`super_admin`, `isAdmin`, `exam_admin`, `content_admin`, `qa_admin`).
- **Exam Management Engine (`/admintvk01/exams`)**:
  - Create and update exams with customized title, description, category, total marks, passing marks, duration, and negative marking rates (e.g., `-0.25`).
  - Toggle options for **Is Published**, **Is Locked**, **Is Premium**, **Shuffle Questions**, and **Shuffle Options**.
  - Attach custom test instructions.
- **Multi-Section Editor (`SectionEditor`)**:
  - Add, reorder, or delete exam sections (e.g., *Quantitative Aptitude*, *Reasoning*, *Professional Knowledge*).
  - Assign custom section durations and question pools.
- **Bulk Question Importer (`BulkQuestionImportDialog`)**:
  - Import hundreds of questions in seconds using **JSON** or **Excel (`.xlsx`)** files.
  - Includes real-time schema validation, option formatting check, correct option mapping, and error reporting.
- **Active Exam Monitor & Emergency Controls (`/admintvk01/exams/manage`)**:
  - Live monitoring of currently active test attempts across the platform.
  - **Emergency Stop Toggle**: Immediately halt an ongoing exam system-wide during unexpected technical incidents or question leaks.
  - **Emergency Restart Toggle**: Resume halted exams seamlessly.
- **Result & Leaderboard Recalculation Engine (`/admintvk01/exams/recalculate`)**:
  - Re-evaluate all candidate attempt scores and refresh leaderboard rankings if answer keys or question marks are modified after an exam has commenced.
- **PDF Library Admin (`/admintvk01/pdfs`)**:
  - Upload study PDFs directly to Cloudinary storage.
  - Tag documents by category, subject, description, and free/premium visibility.
- **Admin User Management (`/admintvk01/admin-users`)**:
  - Assign or revoke admin roles (`super_admin`, `isAdmin`, `exam_admin`, `content_admin`, `qa_admin`) for registered platform users (Super Admin only).
- **Premium User Access Management (`/admintvk01/premium-users`)**:
  - Grant or revoke premium subscription status to enable access to locked mock tests and exclusive PDF resources.

---

## Tech Stack & Architecture

| Layer | Technology / Library | Description |
| :--- | :--- | :--- |
| **Framework** | Next.js 15 (App Router) | Server Components, Route Handlers, Turbopack support |
| **UI Library** | React 18 | Declarative UI, Context API, dynamic client state |
| **Styling** | Tailwind CSS 3 + Shadcn UI | Responsive design system, CSS variables, dark mode |
| **Icons** | Lucide Icons & React Icons | Modern SVG icon sets |
| **Authentication** | Firebase Auth | Google OAuth 2.0 with custom HTTP-Only session cookies |
| **Database** | Firebase Firestore | NoSQL database with Security Rules and composite indexes |
| **Admin SDK** | Firebase Admin SDK | Server-side elevated database & auth operations |
| **Media Storage** | Cloudinary API | Cloud storage CDN for question diagrams & PDF files |
| **Data Import** | SheetJS (`xlsx`) & Zod | Parsing & validating Excel/JSON bulk question files |
| **Data Viz** | Recharts | Analytics graphs and score distribution charts |
| **Load Testing** | k6 (Grafana Labs) | Custom JS scenarios simulating high VU concurrency |

---

## Getting Started (Local Development)

### Prerequisites

Ensure you have the following installed on your development machine:
- **Node.js**: `v18.x` or higher (v20+ recommended)
- **npm** (v9+) or **pnpm** / **yarn**
- **Firebase Account**: Access to a Firebase project with Authentication (Google Provider) and Cloud Firestore enabled.
- **Cloudinary Account** *(Optional, for image/PDF uploads)*

---

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-org/tvk.git
   cd tvk
   ```

2. **Install project dependencies**:
   ```bash
   npm install
   ```

---

### Environment Variables

Create a `.env.local` file in the project root directory and configure the following environment variables:

```env
# Client-Side Configuration (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# Server-Side Configuration (Firebase Admin - Secret)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project_id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Cloudinary Storage Configuration (Secret)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

> **Note on Private Key**: Make sure `FIREBASE_PRIVATE_KEY` retains its newline character format (`\n`). The backend initialization automatically converts escaped `\\n` to literal newlines.

---

### Running Locally

Start the Next.js development server with Turbopack enabled:

```bash
npm run dev
```

Open your browser and navigate to:
```
http://localhost:9002
```

---

### Type Checking & Linting

Run static code verification before committing code:

```bash
# Execute TypeScript type checking
npm run typecheck

# Run Next.js ESLint checks
npm run lint
```

---

## Firebase & Server Setup

### Service Account Setup

To enable server-side database access (using Firebase Admin SDK for user role verification, score recalculations, and server components):

1. Go to **Firebase Console** -> **Project Settings** -> **Service Accounts**.
2. Click **Generate New Private Key**.
3. Copy `client_email` to `FIREBASE_CLIENT_EMAIL`.
4. Copy `private_key` to `FIREBASE_PRIVATE_KEY` in `.env.local`.

---

### Firebase Admin Initialization

Server-side Firebase operations use [`src/lib/firebase/firebase-admin.ts`](file:///d:/programming/tvk/src/lib/firebase/firebase-admin.ts). It exports authenticated instances of `auth` and `db` (Firestore Admin) with automatic singleton initialization.

---

## Role-Based Access Control (RBAC)

The Victory Key implements a 5-tier role hierarchy managed in [`src/lib/role-types.ts`](file:///d:/programming/tvk/src/lib/role-types.ts) and enforced in [`firestore.rules`](file:///d:/programming/tvk/firestore.rules).

### Admin Roles & Permissions

| Role | Name | Description & Capabilities |
| :--- | :--- | :--- |
| `super_admin` | Super Administrator | Complete access. Manage admin roles, grant premium status, emergency stop exams, recalculate results, publish exams, upload PDFs, and view analytics. |
| `isAdmin` | Platform Admin | Full operational site access. Manages exams, PDFs, active test sessions, and premium users (cannot assign `super_admin` roles). |
| `exam_admin` | Exam Administrator | Dedicated control over the exam subsystem. Create, edit, delete, publish exams, manage sections, monitor active attempts, and trigger score recalculations. |
| `content_admin` | Content Administrator | Dedicated access to the PDF Library (`/admintvk01/pdfs`). Upload, update, categorize, and delete reference documents. |
| `qa_admin` | QA Content Admin | Manage questions, subject definitions, and test questions. |

---

### Permission Matrix

```typescript
export interface AdminPermissions {
  // Super Admin Controls
  canManageAdmins?: boolean;
  canManagePremiumUsers?: boolean;
  canManageRoles?: boolean;
  canViewAnalytics?: boolean;
  canEmergencyStop?: boolean;
  
  // PDF / Content Admin
  canManagePDFs?: boolean;
  canUploadPDF?: boolean;
  canDeletePDF?: boolean;
  canViewPDFLibrary?: boolean;
  
  // Exam Admin
  canCreateExam?: boolean;
  canEditExam?: boolean;
  canDeleteExam?: boolean;
  canPublishExam?: boolean;
  canManageExamAttempts?: boolean;
  canViewExamAnalytics?: boolean;
}
```

---

## Admin Portal Workflows (`/admintvk01`)

Access the Admin Portal by visiting `/admintvk01` while logged in with an account assigned an administrative role.

---

### 1. Exam Creation & Editing

Navigate to `/admintvk01/exams` to build a new exam.

- **Exam Parameters**:
  - `Title`: Exam name (e.g., *IBPS SO IT Officer Mock Test 1*)
  - `Category`: Choose or create a category (*SEBI*, *IBPS*, *CIL*, *HPCL*, etc.)
  - `Passing Marks`: Target passing mark threshold
  - `Negative Marking`: Penalty per incorrect response (e.g., `0.25`)
  - `Shuffling`: Checkbox to randomize question order and option order per candidate
  - `Is Premium` / `Is Locked`: Controls candidate access restrictions

---

### 2. Multi-Section Exam Editor

Using the integrated **Section Editor**, administrators can structure tests into distinct sections:

- Add custom sections (e.g., *Section A: General Awareness*, *Section B: Financial Management*).
- Define section-specific timer limits in minutes.
- Assign specific question pools to each section.
- Calculate section-level passing requirements and negative marking rules.

---

### 3. Bulk Question Importer (JSON & Excel)

Save hours of manual data entry by using the **Bulk Importer**:

1. Click **Bulk Import Questions** inside the exam builder.
2. Select your file format (**Excel `.xlsx`** or **JSON**).
3. **Excel Format Example**:

| Question Text | Option A | Option B | Option C | Option D | Correct Option | Marks | Difficulty | Explanation | Section |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| What is the primary key in SQL? | Unique ID | Foreign Key | Index | Table | Option A | 1 | Easy | A primary key uniquely identifies each record. | Database |

4. **JSON Schema Example**:
```json
[
  {
    "text": "What is the capital of India?",
    "options": [
      { "id": "opt1", "text": "Mumbai" },
      { "id": "opt2", "text": "New Delhi" },
      { "id": "opt3", "text": "Bengaluru" },
      { "id": "opt4", "text": "Kolkata" }
    ],
    "correctOptionId": "opt2",
    "explanation": "New Delhi is the official capital of India.",
    "marks": 1,
    "difficulty": "Easy",
    "subject": "General Awareness"
  }
]
```

---

### 4. Active Exam Monitor & Emergency Controls

Navigate to `/admintvk01/exams/manage` to track live test-taking activity:

- **Live Activity Stats**: View the count of ongoing, submitted, and expired exam attempts.
- **Emergency Stop Button**: In the event of a paper leak, server issue, or emergency, click **Emergency Stop**. This halts all in-progress candidate test sessions instantly.
- **Emergency Restart Button**: Restores exam access after resolving issues.

---

### 5. Result & Leaderboard Recalculation Engine

Navigate to `/admintvk01/exams/recalculate`:

- If an answer key error is corrected post-exam, select the exam and click **Recalculate Results**.
- The system batch-processes all stored candidate attempt records (`exam_attempts`), re-evaluates marks awarded, updates pass/fail statuses, and regenerates the real-time leaderboard rankings.

---

### 6. PDF Resource Library Management

Navigate to `/admintvk01/pdfs`:

- Drag and drop reference PDFs or Previous Year Questions (PYQs).
- Uploads are sent securely to Cloudinary storage.
- Set title, subject tags, exam category, and mark documents as **Free** or **Premium Only**.

---

### 7. Admin & Premium User Management

- **`/admintvk01/admin-users`**: Assign administrative roles (`super_admin`, `isAdmin`, `exam_admin`, `content_admin`, `qa_admin`) to registered user emails.
- **`/admintvk01/premium-users`**: Search user profiles and grant/revoke premium access passes with custom expiration dates.

---

## Load Testing & Performance Benchmarks

The project includes an automated **k6 load testing suite** located in `load-tests/` to simulate realistic exam candidate behavior at scale (ramp-up, reading questions, submitting answers, leaderboard polling).

### Load Test Scripts

```bash
# Run 100 Virtual Users (VU) load test
npm run loadtest:100

# Run 200 Virtual Users (VU) load test
npm run loadtest:200

# Run 300 Virtual Users (VU) load test
npm run loadtest:300

# Run 500 Virtual Users (VU) peak load test (12m hold duration)
npm run loadtest:500

# Run 500 VU dedicated exam runner load test
npm run loadtest:500:exam

# Generate HTML / Markdown summary report of k6 metrics
npm run loadtest:report
```

---

## Firestore Collections & Security Rules

Database access rules are enforced strictly in [`firestore.rules`](file:///d:/programming/tvk/firestore.rules).

### Top-Level Collections Schema

| Collection | Key Fields | Read Access | Write Access |
| :--- | :--- | :--- | :--- |
| `users` | `uid`, `email`, `displayName`, `adminRole`, `isPremium` | Profile Owner or Admin | Owner (excluding role fields) / Super Admin |
| `exams` | `id`, `title`, `category`, `questions`, `sections`, `isPublished`, `emergencyStopped` | Public (if Published) / Exam Admin | Exam Admin |
| `exam_attempts` | `id`, `examId`, `userId`, `answers`, `score`, `percentage`, `status` | Attempt Owner / Exam Admin | Student (Create/Update in-progress) / Exam Admin |
| `pdfs` | `id`, `title`, `category`, `cloudinaryUrl`, `isPremium`, `uploaded` | Public (if Published) / Content Admin | Content Admin |
| `activity` | `id`, `userId`, `type`, `timestamp` | Owner / Admin | Authenticated User (Create only) |
| `notifications` | `id`, `userId`, `title`, `message`, `read` | Notification Owner | System / Owner |

---

## API Routes Reference

### Public & Student Endpoints

- `POST /api/session`: Creates secure HTTP-only session cookie from Firebase ID token.
- `DELETE /api/session`: Clears session cookie on sign-out.
- `GET /api/exam/list`: Fetches published exams with category filtering.
- `GET /api/exam/start?id={examId}`: Initializes a new candidate exam attempt.
- `POST /api/exam/save-progress`: Auto-saves answers during test execution.
- `POST /api/exam/submit`: Submits exam, evaluates responses, and records score.
- `GET /api/exam/result?attemptId={id}`: Retrieves comprehensive attempt result breakdown.
- `GET /api/exam/leaderboard?examId={id}`: Returns top student rankings for an exam.
- `GET /api/exam/categories`: Lists available exam categories.

---

### Admin Endpoints

- `GET /api/admintvk01/exams`: Lists all exams (published and draft).
- `POST /api/admintvk01/exams`: Creates a new exam document with sections.
- `PUT /api/admintvk01/exams/{id}`: Updates an existing exam.
- `DELETE /api/admintvk01/exams/{id}`: Deletes an exam document.
- `POST /api/exam/recalculate`: Triggers batch recalculation of exam attempt scores.
- `GET /api/admintvk01/admin-users`: Lists platform administrators and roles.
- `POST /api/admintvk01/admin-users`: Assigns or updates user admin roles.
- `POST /api/upload`: Handles file uploads to Cloudinary.

---

## Project Structure

```
tvk/
├── .github/                       # GitHub Actions workflows & CI/CD
├── load-tests/                    # k6 Load testing scripts & analyzers
│   ├── k6/exam-load.js            # k6 test scenario script
│   ├── run-k6.mjs                 # Runner script
│   └── analyze-k6.mjs             # Report generator
├── scripts/                       # Database migration & admin utility scripts
│   ├── grant_access.js            # Script to assign admin roles
│   ├── migrate-exams-to-sections.js # Migration script for exam sections
│   └── reset-active-users-count.js  # Script to reset active counters
├── src/
│   ├── app/                       # Next.js 15 App Router pages & API routes
│   │   ├── (admin)/admintvk01/    # Admin Management Portal pages
│   │   │   ├── admin-users/       # Admin role management
│   │   │   ├── exams/             # Exam creation, list, active monitor, recalculate
│   │   │   ├── pdfs/              # PDF library management
│   │   │   └── premium-users/     # Premium membership management
│   │   ├── api/                   # Server API route handlers
│   │   ├── exam/                  # Student exam runner & result pages
│   │   │   ├── [slug]/            # Live test runner interface
│   │   │   ├── leaderboard/       # Real-time leaderboard view
│   │   │   └── result/            # Result summary view
│   │   ├── library/               # PDF resource library
│   │   ├── dashboard/             # Student dashboard
│   │   ├── layout.tsx             # Root application layout
│   │   └── page.tsx               # TVK Homepage
│   ├── components/                # React Components
│   │   ├── admin/                 # Section editor, bulk importer dialogs
│   │   ├── exam/                  # ExamRunner, QuestionCard, Timer, ResultSummary
│   │   ├── ui/                    # Shadcn UI primitives
│   │   └── header.tsx             # Top navigation header & user menu
│   ├── context/                   # Auth Context provider
│   ├── hooks/                     # Custom React hooks (useAuth, useToast)
│   └── lib/                       # Utility functions & backend SDKs
│       ├── firebase/              # Firebase Client & Admin SDK initializers
│       ├── exam-types.ts          # Exam, Question, Attempt, Result interfaces
│       ├── role-types.ts          # RBAC roles & permissions matrix
│       ├── pdf-types.ts           # PDF document interfaces
│       ├── rate-limiter.ts        # API rate-limiting utilities
│       └── cloudinary.ts          # Cloudinary upload helpers
├── firestore.rules                # Firestore security rules definition
├── next.config.ts                 # Next.js configuration
├── tailwind.config.ts             # Tailwind CSS configuration
├── tsconfig.json                  # TypeScript compiler settings
└── package.json                   # Dependencies & npm scripts
```

---

## Deployment (Vercel)

The Victory Key is optimized for seamless deployment on **Vercel**:

1. Push your code to GitHub / GitLab.
2. Import the repository into your **Vercel Dashboard**.
3. Add all environment variables from `.env.local` to **Vercel Project Settings** -> **Environment Variables**.
4. Set the build command to `npm run build`.
5. Deploy! Vercel will automatically build and deploy the Next.js App Router application.

> **Production Tip**: Ensure `FIREBASE_PRIVATE_KEY` handles newlines properly in Vercel environment variables.

---

## Troubleshooting

- **Firestore Permission Errors**: Verify that your account has been granted an administrative role (`super_admin`, `isAdmin`, `exam_admin`) in the `users` collection or via `/admintvk01/admin-users`.
- **Firebase Private Key Newline Error**: Ensure `FIREBASE_PRIVATE_KEY` in `.env.local` contains `\n` or literal line breaks. `firebase-admin.ts` automatically replaces `\\n` with `\n`.
- **Session Cookie Expiry**: If getting redirected to login on protected routes, sign out and sign back in to refresh the HTTP-only session cookie.
- **k6 Executable Not Found**: Ensure k6 is installed globally or use `npx k6` when running load test scripts.

---

## License

Copyright © 2026 **The Victory Key (TVK)**. All Rights Reserved.
