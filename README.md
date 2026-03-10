# FitTrack — Fitness Goal Tracker

A full-stack fitness tracking web application built with **Next.js 16**, **TypeScript**, **Tailwind CSS v4**, **shadcn/ui**, **Prisma v7**, and **NextAuth.js v5**.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)](https://prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://postgresql.org)

---

## Features

- **Authentication** — Email/password registration + login, Google OAuth, JWT sessions, protected routes
- **Dashboard** — Live stats (active goals, weekly workouts, calories, day streak), weekly bar chart, progress overview
- **Goals** — Full CRUD: create, edit, delete, mark complete; 6 goal types (weight loss, muscle gain, cardio, flexibility, nutrition, custom)
- **Workouts** — Log exercises with sets / reps / weight / duration / calories, optionally linked to a goal
- **Progress** — Line/bar chart history per goal, progress logging with notes
- **User Profile** — Avatar dropdown with profile modal and sign-out
- **Dark / Light mode** — Theme toggle, respects system preference
- **Mobile-first** — Responsive layout with sidebar on desktop, sheet navigation on mobile

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Server Components) |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS v4 + CSS custom properties |
| UI Components | shadcn/ui (Radix UI primitives) |
| Charts | Recharts |
| Auth | NextAuth.js v5 beta (JWT sessions) |
| ORM | Prisma v7 (client engine + driver adapter) |
| Database | PostgreSQL 16 |
| DB Driver | `@prisma/adapter-pg` + `pg` |
| Forms | React Hook Form v7 + `standardSchemaResolver` |
| Validation | Zod v4 |
| Deployment | Vercel (app) + Railway or Supabase (DB) |

---

## Prerequisites

Before you begin, make sure you have:

- **Node.js** v20 or later — [nodejs.org](https://nodejs.org)
- **PostgreSQL** v14 or later running locally — [postgresql.org](https://www.postgresql.org/download/)
- **npm** v10+ (comes with Node.js)
- **Git** installed

Check versions:
```bash
node -v     # v20+
npm -v      # v10+
psql --version
```

---

## Local Development Setup

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/fittrack.git
cd fittrack
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create the PostgreSQL database

```bash
# Connect to PostgreSQL as your user
psql -d postgres

# Inside psql, create the database
CREATE DATABASE fittrack;
\q
```

Or in one line:
```bash
psql -d postgres -c "CREATE DATABASE fittrack;"
```

### 4. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in the values:

```env
# Database — PostgreSQL connection string
DATABASE_URL="postgresql://YOUR_USER@localhost:5432/fittrack"

# Auth secret — generate with: openssl rand -base64 32
AUTH_SECRET="your-random-secret-here"

# App URL
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (optional — see OAuth Setup section below)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

**Generate `AUTH_SECRET`:**
```bash
openssl rand -base64 32
```

### 5. Run database migrations

```bash
npx prisma migrate dev --name init
```

This creates all tables in your `fittrack` database.

### 6. (Optional) Seed demo data

```bash
npm run db:seed
```

Creates a demo account with realistic goals, workouts, and progress history based on a vegetarian IBS fat-loss plan.

**Demo credentials:**
```
Email:    demo@fittrack.app
Password: password123
```

### 7. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/login`.

---

## Running the App

### Development

```bash
npm run dev       # Start Next.js dev server on http://localhost:3000
npm run build     # Build for production
npm run start     # Start production server (after build)
npm run lint      # Run ESLint
```

> **Note:** This project is a full-stack Next.js app — there is no separate backend server. The API routes (`/app/api/...`) run as Next.js Route Handlers in the same process.

### Database GUI

```bash
npm run db:studio   # Opens Prisma Studio at http://localhost:5555
```

Prisma Studio lets you browse and edit all database tables with a visual interface — no SQL needed.

---

## Database

### How It Works

FitTrack uses **Prisma v7** as the ORM with **PostgreSQL** as the database. Prisma v7 uses a "client engine" which requires a **driver adapter** at runtime — this is handled in `src/lib/db.ts` using `@prisma/adapter-pg`.

```
src/lib/db.ts
  └── PrismaPg adapter (pg driver)
        └── PrismaClient
              └── PostgreSQL database
```

The database connection string is read from `DATABASE_URL` in `.env.local` at runtime. For Prisma CLI commands (migrate, generate, studio), it's configured via `prisma.config.ts`.

### Schema

Located at `prisma/schema.prisma`. Key models:

| Model | Table | Description |
|---|---|---|
| `User` | `users` | Auth users (email + optional password) |
| `Account` | `accounts` | OAuth provider accounts (NextAuth) |
| `Session` | `sessions` | Database sessions (NextAuth) |
| `Goal` | `goals` | Fitness goals with type, status, target/current value |
| `WorkoutLog` | `workout_logs` | Individual exercise logs linked to optional goal |
| `ProgressEntry` | `progress_entries` | Time-series progress snapshots for a goal |

### Goal Types (enum)

```
WEIGHT_LOSS | MUSCLE_GAIN | CARDIO | FLEXIBILITY | NUTRITION | CUSTOM
```

### Goal Statuses (enum)

```
ACTIVE | COMPLETED | PAUSED | ABANDONED
```

### Database Commands

```bash
# Create and apply a new migration
npx prisma migrate dev --name <migration-name>

# Apply migrations in production (no prompt)
npx prisma migrate deploy

# Regenerate Prisma client after schema changes
npm run db:generate

# Open Prisma Studio (visual DB browser)
npm run db:studio

# Seed demo data
npm run db:seed

# Reset database (drops all data + re-runs migrations)
npx prisma migrate reset
```

### Connecting to the Database Directly

**Via psql:**
```bash
psql postgresql://YOUR_USER@localhost:5432/fittrack
```

**List all tables:**
```sql
\dt
```

**Inspect users:**
```sql
SELECT id, name, email, "createdAt" FROM users;
```

**Inspect goals:**
```sql
SELECT title, type, status, "currentValue", "targetValue", unit FROM goals;
```

### Connection String Format

```
postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]

Examples:
  postgresql://uday@localhost:5432/fittrack           -- local, no password
  postgresql://uday:secret@localhost:5432/fittrack    -- local, with password
  postgresql://user:pass@db.railway.app:5432/railway  -- Railway
  postgresql://...@db.supabase.co:5432/postgres       -- Supabase
```

---

## Google OAuth Setup

Google OAuth lets users sign in with their Google account. Follow these steps:

### Step 1 — Create a Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click **"Select a project"** → **"New Project"**
3. Name it (e.g. `FitTrack`) → **Create**

### Step 2 — Enable the Google Identity API

1. In the left sidebar → **"APIs & Services"** → **"Library"**
2. Search for **"Google Identity"** or **"OAuth"**
3. Click **"Google Identity Toolkit API"** → **Enable**

### Step 3 — Configure the OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Choose **External** → **Create**
3. Fill in:
   - **App name:** FitTrack
   - **User support email:** your email
   - **Developer contact email:** your email
4. Click **Save and Continue** through the remaining steps
5. Under **"Test users"**, add your Gmail address

### Step 4 — Create OAuth Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ Create Credentials"** → **"OAuth Client ID"**
3. Application type: **Web application**
4. Name: `FitTrack Web`
5. Add **Authorized Redirect URIs:**
   ```
   http://localhost:3000/api/auth/callback/google   ← development
   https://your-app.vercel.app/api/auth/callback/google   ← production
   ```
6. Click **Create**
7. Copy the **Client ID** and **Client Secret**

### Step 5 — Add to `.env.local`

```env
GOOGLE_CLIENT_ID="123456789-abc.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-secret"
```

Restart the dev server — the **"Continue with Google"** button will now work.

> **Note:** While in "Testing" mode on Google Cloud, only test users you added can sign in. To allow anyone to sign in, publish the app under OAuth consent screen settings.

---

## Project Structure

```
fittrack/
├── prisma/
│   ├── schema.prisma          # Database models and enums
│   ├── seed.ts                # Demo data seeder
│   └── migrations/            # SQL migration history
├── prisma.config.ts           # Prisma v7 datasource config (CLI)
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx   # Login page (email + Google)
│   │   │   └── register/
│   │   │       └── page.tsx   # Registration page
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx     # Sidebar + header + auth guard
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx   # Stats overview + charts
│   │   │   ├── goals/
│   │   │   │   ├── page.tsx   # Goals list
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx   # Goal detail + progress chart
│   │   │   ├── workouts/
│   │   │   │   └── page.tsx   # Workout log
│   │   │   └── progress/
│   │   │       └── page.tsx   # Progress charts
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts   # NextAuth handler
│   │   │   ├── register/
│   │   │   │   └── route.ts   # POST /api/register
│   │   │   ├── goals/
│   │   │   │   ├── route.ts   # GET, POST /api/goals
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts   # GET, PATCH, DELETE /api/goals/:id
│   │   │   ├── workouts/
│   │   │   │   ├── route.ts   # GET, POST /api/workouts
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts   # PATCH, DELETE /api/workouts/:id
│   │   │   ├── progress/
│   │   │   │   └── route.ts   # POST /api/progress
│   │   │   └── dashboard/
│   │   │       └── route.ts   # GET /api/dashboard (aggregated stats)
│   │   ├── globals.css        # Tailwind + CSS variables (theming)
│   │   └── layout.tsx         # Root layout + ThemeProvider
│   ├── components/
│   │   ├── ui/                # shadcn/ui components (Button, Card, etc.)
│   │   └── shared/
│   │       ├── sidebar.tsx         # Desktop navigation sidebar
│   │       ├── mobile-nav.tsx      # Mobile sheet navigation
│   │       ├── user-menu.tsx       # Avatar dropdown + profile dialog
│   │       ├── theme-toggle.tsx    # Light/dark mode toggle
│   │       ├── dashboard-client.tsx
│   │       ├── goals-client.tsx
│   │       ├── goal-form.tsx
│   │       ├── goal-detail-client.tsx
│   │       ├── workouts-client.tsx
│   │       └── progress-client.tsx
│   ├── lib/
│   │   ├── auth.config.ts     # Edge-safe NextAuth config (used in proxy.ts)
│   │   ├── auth.ts            # Full NextAuth config (Node.js, Prisma, bcrypt)
│   │   ├── db.ts              # Prisma client singleton (PrismaPg adapter)
│   │   └── utils.ts           # cn(), formatDate(), constants
│   └── proxy.ts               # Route protection middleware (Next.js 16)
├── .env.example               # Environment variable template
├── .env.local                 # Your local secrets (gitignored)
├── components.json            # shadcn/ui config
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## API Reference

All API routes require authentication (JWT session cookie) except `/api/register` and `/api/auth/*`.

### Auth

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/register` | Register new user `{ name, email, password }` |
| `GET` | `/api/auth/session` | Get current session |
| `POST` | `/api/auth/callback/credentials` | Email/password sign in |
| `GET` | `/api/auth/callback/google` | Google OAuth callback |
| `POST` | `/api/auth/signout` | Sign out |

### Goals

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/goals` | List all goals for current user |
| `POST` | `/api/goals` | Create a new goal |
| `GET` | `/api/goals/:id` | Get a single goal with progress entries |
| `PATCH` | `/api/goals/:id` | Update goal fields |
| `DELETE` | `/api/goals/:id` | Delete goal and all related data |

### Workouts

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/workouts` | List workout logs (optionally `?goalId=`) |
| `POST` | `/api/workouts` | Log a new workout |
| `PATCH` | `/api/workouts/:id` | Update a workout log |
| `DELETE` | `/api/workouts/:id` | Delete a workout log |

### Progress

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/progress` | Log progress entry + updates `goal.currentValue` |

### Dashboard

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/dashboard` | Aggregated stats: goals, workouts this week, calories, streak, chart data |

---

## Authentication Architecture

NextAuth v5 is split into two files to handle **Edge Runtime** constraints:

```
src/lib/auth.config.ts   ← Edge-safe (no Node.js APIs)
  └── Used by proxy.ts (middleware) for lightweight session checks

src/lib/auth.ts          ← Full Node.js (Prisma + bcrypt)
  └── Used by API routes and Server Components
```

**Why the split?** Next.js middleware runs in the Edge Runtime which cannot use Node.js APIs (`crypto`, native modules). Prisma and bcrypt require Node.js, so they must not be imported in the middleware.

### JWT Session Flow

```
1. User submits credentials
2. NextAuth calls authorize() in auth.ts
3. Prisma queries the user by email
4. bcrypt compares the password
5. On success, NextAuth issues a JWT stored as a cookie
6. Subsequent requests: middleware reads JWT from cookie (Edge-safe)
7. Server components call auth() from auth.ts to get session
```

---

## Deployment

### Vercel + Railway (Recommended)

#### 1. Set up the database on Railway

1. Go to [railway.app](https://railway.app) → **New Project** → **PostgreSQL**
2. Copy the `DATABASE_URL` from the **Connect** tab
3. Run migrations against the Railway database:
   ```bash
   DATABASE_URL="postgresql://..." npx prisma migrate deploy
   ```

#### 2. Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → **Import** → select your repo
3. Set environment variables in Vercel dashboard:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Your Railway PostgreSQL URL |
   | `AUTH_SECRET` | `openssl rand -base64 32` output |
   | `NEXTAUTH_URL` | `https://your-app.vercel.app` |
   | `GOOGLE_CLIENT_ID` | From Google Cloud Console |
   | `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |

4. Add your Vercel domain to Google OAuth redirect URIs:
   ```
   https://your-app.vercel.app/api/auth/callback/google
   ```

5. Click **Deploy**

#### 3. Seed production data (optional)

```bash
DATABASE_URL="postgresql://..." npm run db:seed
```

### Alternative: Supabase

Supabase provides a free managed PostgreSQL. Get the connection string from **Project Settings → Database → Connection String** (use the "Transaction" pooler URL for serverless).

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `AUTH_SECRET` | ✅ | Random secret for signing JWTs (min 32 chars) |
| `NEXTAUTH_URL` | ✅ | Full URL of the app (`http://localhost:3000` in dev) |
| `GOOGLE_CLIENT_ID` | ☑️ Optional | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | ☑️ Optional | Google OAuth client secret |

---

## Known Gotchas

### Prisma v7 requires a driver adapter
`new PrismaClient()` without a driver adapter throws at runtime. The app uses `@prisma/adapter-pg` in `src/lib/db.ts`.

### NextAuth v5 + Edge Runtime
Middleware cannot import Prisma or bcrypt. The auth config is split into `auth.config.ts` (Edge) and `auth.ts` (Node.js).

### Zod v4 + `@hookform/resolvers` v5
`zodResolver` was dropped in v5. Use `standardSchemaResolver` from `@hookform/resolvers/standard-schema` instead.

### Next.js 16 middleware
The middleware file is named `proxy.ts` (not `middleware.ts`) per the Next.js 16 convention.

---

## License

MIT
