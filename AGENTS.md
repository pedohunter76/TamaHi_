<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md

**TamaHi!** (formerly "FEU Group Chat") — ephemeral randomized group chats for FEU students (`@feu.edu.ph` only). Freshies get matched into 4-person rooms by vibe similarity; rooms self-destruct after 24 hours.

**Stack:** Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS v4 + shadcn/ui (radix primitives, nova style, neutral/zinc palette) · lucide-react icons · Supabase (Postgres/Auth/Realtime) on the **free tier** · Zustand (planned).

## Commands

All verified against `package.json`. Use `npm.cmd`/`npx.cmd` in PowerShell — execution policy blocks `npm.ps1`.

- Dev: `npm run dev`
- Build (includes type checking): `npm run build`
- Type check only: `npx tsc --noEmit`
- Lint: `npm run lint` (bare `eslint`, flat config — lints the whole project)
- Tests: Vitest + Playwright are planned but **not installed yet** — do not assume test scripts exist.

## Strict rules

- **Supabase FREE tier only — always.** Never propose or implement anything requiring a paid plan (Pro, custom SMTP, compute add-ons, PITR). Notably: auth email templates are NOT editable on free tier; design auth flows accordingly.
- **CRITICAL: Always unsubscribe from Supabase Realtime WebSocket connections inside the React useEffect cleanup function to prevent free-tier connection leaks.**
- **Always utilize a minimalistic user interface design for new components, prioritizing clear typography and whitespace over heavy visual assets.**

## Supabase free tier — hard rules

- Free tier caps **200 concurrent real-time connections**; see unsubscribe rule above.
- Server-side auth (middleware, server components, route handlers) must use **`@supabase/ssr`**, never a bare `@supabase/supabase-js` client — cookies must be handled securely.
- The database **pauses after 7 days without API traffic**. If the app fails locally after a break, unpause it in the Supabase dashboard before debugging anything else.

## Architecture conventions

- **State lives in Zustand stores** (`/store`, never embedded in UI components — queue joins/drops, match transitions, timers, and chat messages (`store/chat-store.ts`).
- **Server Components by default.** Add `"use client"` only to genuinely interactive components (chat input, matchmaking button).
- **Layout wrapper:** pages render inside `components/layout/page-shell.tsx` (mobile-first max-width container), mounted globally in `app/layout.tsx`.
- shadcn components live in `components/ui`; add them via `npx shadcn@latest add <component>`.

## Domain rules

- Entry gate is a two-step Profile Maker, freshies-only and honor-system: free-typed student number (no format verification) + nickname/age/institute/course saved to `profiles` (visible to other authenticated users). Institutes/courses come from the official FEU catalog (`lib/profile/constants.ts`); the course select is locked to the chosen institute's offerings. Then one-time vibe setup (`lib/vibes/questions.ts`, 5 campus-life questions in Taglish, stored in `profiles.vibes`). Sessions are anonymous Supabase guests; there is no email auth anywhere. Spec: `docs/superpowers/specs/2026-08-22-quiz-auth-design.md` (amended: knowledge quiz removed).
- Matchmaking: batches of 4 seeded by the longest-waiting queuer, seats filled by vibe similarity out of 5 answers (`lib/vibes/questions.ts`, campus-life questions in Taglish, stored in `profiles.vibes`). Seating is atomic via the `open_batch_room()` security-definer RPC — never seat batches client-side. Queue state lives in the Zustand store (`store/queue-store.ts`). Ghost rows: waiting lobbies heartbeat `joined_at` on every poll and any entry idle >3 minutes is purged by `purge_stale_queue()`; closing the tab also fires a `sendBeacon` to `/api/queue/leave`. Spec: `docs/superpowers/specs/2026-08-22-matchmaking-vibes-design.md`.
- Chat room expiry is **virtual deletion**: no cron jobs or delete scripts (paid compute). Enforce with RLS hiding rows where `created_at + interval '24 hours' < now()`.

## Scaffold quirk

The folder ("TEST FEU APP", formerly "Default Project") contains spaces/capitals and is not npm-safe, so the package is named `test-feu-app`; the project was scaffolded in a temp dir and moved here. `AGENTS.md`/`CLAUDE.md` agent-rules blocks are auto-written by Next.js tooling — leave them intact.
