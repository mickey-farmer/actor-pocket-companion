# Backlog

Ideas raised during planning that are intentionally not in v1. Nothing here
is forgotten — just sequenced for later.

## Analysis add-ons
- **Objective & obstacle** — what the character wants from the other person
  in the scene, and what's blocking it. Would be its own field on the
  `analyses` table (`objective`, `obstacle`) and a new cheat-sheet section.
- **Relationship mapping** — how the character relates to each other person
  present in the scene (status, history, tension). Likely a `relationships`
  jsonb column keyed by character name.
- Once both exist, fold them into the Cheat Sheet view (there's already a
  placeholder note there pointing at this).

## Memorization
- Streaks / timers on the self-quiz mode to build a rehearsal habit.
- Audio: text-to-speech read-aloud of the *other* character's lines, so the
  cue-card and line-cover modes can be used fully hands-free.

## Library & sessions
- Multi-script library polish: search, tags/folders, archiving old scripts.
- Session history — a log of chat sessions over time per script/scene, so an
  actor can see how their read on a scene evolved across visits.

## Parsing / detection
- Scene and character detection (`lib/parsing/screenplayHeuristics.ts`) is
  heuristic, not a full screenplay parser. Known rough edges:
  - Action lines between two dialogue exchanges can occasionally get merged
    into the preceding character's turn.
  - Character names that don't render as a distinct all-caps cue line or a
    "Name:" prefix (unusual formatting, some translated plays, etc.) won't
    be picked up automatically — you can still type the name manually on the
    character-picker screen.
  - A manual "fix scene boundaries / re-tag a line's speaker" editing UI
    would resolve both, but wasn't in scope for v1.
- Image upload + OCR (e.g. a phone photo of sides handed to you at an
  audition) was discussed and explicitly deferred — text-file uploads
  (PDF/.txt/.docx/.fdx) cover the v1 need.
