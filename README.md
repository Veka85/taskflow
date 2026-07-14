# TaskFlow (Next.js Rewrite)

TaskFlow has been redesigned to run as a single Next.js full-stack app.

This implementation replaces the Laravel API with Next.js App Router API routes while preserving the original React Kanban experience and route structure.

## Stack

- Next.js 16 (App Router)
- React 19
- Tailwind CSS 4
- Prisma 6 + SQLite
- Axios + React Router + @dnd-kit
- JWT auth (Bearer token)

## What Changed

- Laravel backend endpoints were rewritten as Next API routes under `src/app/api/**`.
- Existing React UI was migrated into `src/spa/**` and mounted through a catch-all route `src/app/[[...slug]]/page.jsx`.
- Database access is now via Prisma client (`src/lib/prisma.js`) using `prisma/dev.db`.
- Auth no longer depends on Sanctum; JWT is handled in `src/lib/auth.js`.

## Local Setup

1. Install dependencies

```bash
npm install
```

2. Configure environment

```bash
cp .env.example .env
```

3. Generate Prisma client

```bash
npm run prisma:generate
```

4. Start development server

```bash
npm run dev
```

App runs at: `http://localhost:3000`

## Demo Accounts

- Admin: `admin@taskflow.com` / `password`
- User: `demo@taskflow.com` / `password`

## API Coverage

Implemented routes cover auth, boards, lists, cards, comments, labels, admin stats/users, and search:

- `src/app/api/auth/**`
- `src/app/api/boards/**`
- `src/app/api/lists/**`
- `src/app/api/cards/**`
- `src/app/api/comments/**`
- `src/app/api/labels/**`
- `src/app/api/admin/**`
- `src/app/api/search/route.js`

## Notes

- The project currently has one non-blocking lint warning in `src/spa/context/AuthContext.jsx` (`react-hooks/exhaustive-deps`).
- Production build succeeds (`npm run build`).
