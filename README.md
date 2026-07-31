# Tigrigna Learning Portal

A web app for teaching and learning Tigrigna. Teachers manage classes and content; students and parents follow lessons, homework, and updates from their own dashboards.

---

## A. Who it’s for

| Role | What they do |
|------|----------------|
| **Teacher** | Lessons, materials, assignments, grades, announcements, live classes |
| **Student** | View content, submit work, track progress |
| **Parent** | See linked student activity and school updates |

---

## B. Tech stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend:** Supabase (auth, database, storage)
- **Email:** Resend (sign-up, password reset, notifications)

---

## C. Get started

### 1. Install

```bash
npm install
```

### 2. Environment

Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` — server-only (imports, notifications)
- `ADMIN_EMAIL` — teacher bootstrap account
- `NEXT_PUBLIC_SITE_URL` — your site URL (e.g. local or Vercel)
- `RESEND_API_KEY` + `EMAIL_FROM` — for email (optional in dev)

### 3. Database

In the Supabase SQL Editor, run scripts in this order:

1. `supabase/RUN_THIS_FIRST.sql`
2. `supabase/schema.sql`
3. Other `supabase/FIX_*.sql` files as needed for your setup

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## D. Main pages

- `/` — Home
- `/login` — Sign in / sign up
- `/teacher/dashboard` — Teacher tools
- `/student/dashboard` — Student view
- `/parent/dashboard` — Parent view
- `/settings` — Profile and account (logged-in users)
- `/help` — FAQ
- `/alphabet` — Tigrigna alphabet reference

---

## E. Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript check |

---

## F. Project layout

```
app/           Pages and API routes
components/    UI and dashboard components
lib/           Auth, Supabase, notifications, helpers
supabase/      SQL setup and migrations
middleware.ts  Route protection by role
```

---

## G. Deploy

1. Push to GitHub and connect to [Vercel](https://vercel.com) (or similar).
2. Add the same env vars from `.env.local` in the hosting dashboard.
3. Set `NEXT_PUBLIC_SITE_URL` to your production URL.
4. Configure Supabase auth redirect URLs for your domain.

---

**License:** Private project — all rights reserved.
