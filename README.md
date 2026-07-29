# Actor Pocket Companion

A private, password-protected rehearsal companion. Upload a script, pick your
character, and get a Meisner-style scene partner that only ever talks about
that script — plus tools to memorize your lines.

## What it does

- Upload a script (`.pdf`, `.txt`, `.docx`, or `.fdx`)
- The app splits it into scenes and asks **"What is your character?"**
- Per scene, it generates: a story summary, how your character fits into the
  story, the **moment before** (what just happened right before this scene —
  invented and clearly offered as a starting point if it's the opening
  scene), the **given circumstances** (who/what/where/when/why), and a
  **beat breakdown**
- A **Cheat Sheet** view collects the above into one glanceable, printable
  page
- A **Chat** tab: a Meisner-trained coach/scene-partner, strictly scoped to
  that scene and character — it won't help with unrelated requests (e.g.
  "write me a script for X")
- **Memorize** tools: line-cover mode, cue-card drill, a typed self-quiz that
  scores your recall accuracy, and a highlighted read-through

See `BACKLOG.md` for what's deliberately deferred to later (objective &
obstacle, relationship mapping, audio read-aloud, etc.)

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind, deployed on Vercel
- Postgres (Vercel Postgres / Neon) via `@vercel/postgres`
- AI via [OpenRouter](https://openrouter.ai) (model configurable)
- A single shared password gates the whole app (no per-user accounts) via a
  signed cookie set in `middleware.ts`

## Local setup

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

- `APP_PASSWORD` — whatever password you want to use to unlock the app
- `SESSION_SECRET` — a long random string (`openssl rand -hex 32`)
- `OPENROUTER_API_KEY` — from https://openrouter.ai/keys
- `OPENROUTER_MODEL` — optional, defaults to `anthropic/claude-sonnet-5`
- `POSTGRES_URL` — a Postgres connection string (see below for how to get
  one without running your own database)

**Never paste your real API key or password into a chat with an AI
assistant, or commit `.env.local`.** It's already gitignored.

Then:

```bash
npm run dev
```

The database tables are created automatically the first time the app talks
to Postgres (see `lib/db.ts` → `ensureSchema`) — no manual migration step.

## Deploying (Vercel)

1. Push this repo to GitHub.
2. In Vercel: **Add New Project** → import the repo.
3. **Storage** tab → **Create Database** → Postgres (this is Neon under the
   hood). Connecting it to the project auto-populates `POSTGRES_URL` and
   friends as environment variables.
4. **Settings → Environment Variables** → add `APP_PASSWORD`,
   `SESSION_SECRET`, `OPENROUTER_API_KEY`, and optionally `OPENROUTER_MODEL`.
   Do this directly in the Vercel dashboard, not in code.
5. Deploy. Visit the URL, enter your password, and you're in.

### A couple of things worth knowing

- This is a shared-password gate, not real multi-user auth — fine for
  "not open to the whole world" but not bank-grade. If you ever want
  per-person logins, that's a bigger addition.
- Vercel's default request body limit (a few MB on the free/Hobby tier) caps
  how large an uploaded file can be. Very long PDFs with embedded images
  could bump into this — plain text-heavy scripts should be fine.
- Scene and character detection is heuristic (regex-based), not a full
  screenplay parser. It works well on standard formatting; see
  `BACKLOG.md` for known edge cases and the manual character-name fallback
  already built into the character picker.
