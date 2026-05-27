# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**LeioApp** is a React Native reading companion app for Portuguese-speaking readers. Users manage their reading habits, track sessions, highlight passages, build vocabulary, and participate in reading groups. The app includes gamification via badges and missions, Spotify integration for ambient music during reading, and a focus-mode that tracks uninterrupted reading sessions.

- **Frontend**: React Native + Expo (cross-platform iOS/Android/web)
- **Backend**: Express.js + PostgreSQL (schema via Drizzle ORM)
- **State**: React Context (AppContext) + AsyncStorage for persistence
- **Monorepo**: pnpm workspaces (frontend, backend, shared libs)

## Common Development Commands

```bash
# Install dependencies
pnpm install

# Run React Native dev server (Expo)
pnpm --filter @workspace/leio run dev

# Run backend API server (port 5000)
pnpm --filter @workspace/api-server run dev

# Full typecheck across all packages
pnpm run typecheck

# Build all packages
pnpm run build

# Regenerate API client hooks from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# Push database schema changes (dev only)
pnpm --filter @workspace/db run push

# Single package typecheck
pnpm --filter @workspace/leio run typecheck
```

**Required environment variables**:
- `DATABASE_URL` — PostgreSQL connection string
- `EXPO_PUBLIC_SPOTIFY_CLIENT_ID` — Spotify app client ID (optional; if missing, Spotify features disabled)

## Code Architecture

### Frontend (`artifacts/leio`)

**Navigation** (Expo Router):
- `app/(tabs)` — main tab-based UI: biblioteca (library), sessão (sessions), badges, perfil (profile)
- `app/sessao-ativa.tsx` — active reading session screen (timer, Spotify, vocab)
- `app/leitor/[id].tsx` — book excerpt viewer with highlights
- `app/conclusao.tsx` — session summary and stats
- Modals: onboarding, adicionar-livro (add book), escanear-livro (scan via camera)

**State Management** (`contexts/AppContext.tsx`):
- Central React Context providing: books, sessions, badges, missions, vocabulary entries, settings, Spotify state
- Persisted to AsyncStorage; loaded on app start
- Methods: `addSession()`, `addVocabularyEntry()`, `addHighlight()`, `checkAndUnlockBadges()`, etc.
- Key exported types: `Book`, `Session`, `Highlight`, `VocabularyEntry`, `Badge`, `Mission`, `AppSettings`

**Key Components**:
- `CapiMascot` — animated mascot character (states: reading, sad, celebrating, sleeping, etc.)
- `VocabularyModal` — word lookup + save flow (uses `translation.ts` service)
- `ShareCard` — template-based social sharing of reading stats
- Color system via `useColors()` hook (theme-aware: light/dark)

**Services**:
- `spotify.ts` — OAuth flow, token refresh, fetch now-playing track with audio features (energy, valence)
- `translation.ts` — English word lookup (dictionaryapi.dev) + Portuguese translation (MyMemory API)
- `ambientAudio.ts` — ambient soundscapes (rain, forest, cafe) during reading
- `notifications.ts` — daily reminders, focus-mode break notifications
- `bookSearch.ts` — Google Books API integration

### Backend (`artifacts/api-server`)

Currently a minimal Express skeleton with:
- CORS-enabled, logging via Pino
- Health check endpoint
- Database connected via Drizzle ORM (no tables defined yet)

**Database** (`lib/db`):
- PostgreSQL + Drizzle ORM
- Config: `drizzle.config.ts`
- Schema location: `src/schema/index.ts` (currently empty; to be populated)

### Shared Libraries

- **`lib/api-spec`** — OpenAPI spec (`openapi.yaml`) + Orval codegen config. Regenerates `lib/api-client-react` hooks and `lib/api-zod` validators
- **`lib/api-zod`** — Zod schemas + TypeScript types from API spec
- **`lib/api-client-react`** — React Query hooks + TanStack Query client integration

## Key Patterns & Conventions

### Data Persistence

- **Client-side**: AsyncStorage (simple key-value) + React Context. No offline-first sync yet.
- **Server-side**: Not yet integrated. Current implementation is client-only with seed data in AppContext.
- **Vocabulary entries** stored locally; structure: `{ id, bookId, word, definition, phonetic?, savedAt }`

### Styling & Colors

- No traditional CSS/Tailwind; uses React Native `StyleSheet` + color context
- `useColors()` hook provides: `background`, `foreground`, `card`, `border`, `volt` (accent), `coral`, `mutedForeground`, etc.
- Themes: "dark" | "light" (configurable in settings)

### Spotify Integration

- OAuth flow initialized on settings screen; tokens stored in SecureStore (mobile) or localStorage (web)
- Fetches now-playing track every ~2–3 seconds in AppContext
- `deriveGradient(energy, valence)` maps Spotify audio features to a 2-stop dark gradient overlay on the session screen
- Currently read-only (fetch now-playing); pause/play/skip not yet implemented

### Vocabulary & Dictionary

- Single lookup service integrates English definitions + Portuguese translation
- Word stored with optional phonetic + definition
- **To expand**: Add Spanish, improve phonetic parsing, support language selection per word

### Focus Mode

- Tracks time spent outside app while in focus mode; user warned on return
- Unlocks badges if no exits during target duration (e.g., 30 min uninterrupted)
- Ambient audio paused if user leaves app in focus mode

### Badges & Missions

- Pre-defined badge list in AppContext (`ALL_BADGES`)
- Missions auto-generated daily; progress tracked per session type (pages, pace, vocabulary, shares)
- `progressShareMission()` and `checkAndUnlockBadges()` called after session end

## File Structure Summary

```
artifacts/leio/
  app/
    (tabs)/         — main tab screens
    sessao-ativa.tsx    — active session UI
    leitor/[id].tsx     — book reader
    conclusao.tsx       — session summary
    onboarding.tsx      — first-run flow
    +[many more screens]
  components/
    CapiMascot, VocabularyModal, ShareCard, HighlightShareCard, etc.
  contexts/
    AppContext.tsx      — state + persistence logic
  services/
    spotify.ts, translation.ts, ambientAudio.ts, notifications.ts, bookSearch.ts
  hooks/
    useColors.ts, etc.
  utils/
    formatting, calculations
  constants/
    hardcoded genres, book data

artifacts/api-server/
  src/
    app.ts          — Express app setup
    routes/         — API endpoints
    lib/            — utilities

lib/
  db/              — Drizzle config + schema (empty, to populate)
  api-spec/        — OpenAPI spec + Orval config
  api-zod/         — generated validators
  api-client-react/ — generated TanStack Query hooks
```

## Important Implementation Details

### Reading Sessions

A **session** records:
```ts
{ bookId, startPage, endPage, durationSeconds, pace (pages/min), date, isFocusMode?, focusExitSeconds? }
```
- Created when user ends a reading session (confirms end page)
- Pace calculated: `(endPage - startPage) / (durationSeconds / 60)`
- Badge unlocks triggered: speed reader (>2 ppm), marathon (100 pages/day), etc.

### Vocabulary Entries

Structure:
```ts
{ id, bookId, word, definition, phonetic?, savedAt }
```
- Currently English words only; lookup via dictionaryapi.dev + MyMemory translation
- Portuguese translation stored in `definition` field
- Phonetic from English API (IPA notation)

### Highlights

Simple text highlights on book excerpts:
```ts
{ id, bookId, text, bgVariant ("volt"|"noir"|"cream"|"coral"), createdAt }
```
- Stored per book; shareable as cards (3 templates: storiesPhoto, framed, classic)

## Critical Notes

1. **Database not yet integrated**: AppContext uses in-memory state + AsyncStorage. Server schema is empty. Before server integration, define Drizzle schema for books, sessions, vocabulary, users, reading groups.

2. **Spotify read-only**: Can fetch now-playing and show track info. Play/pause/skip requires additional Spotify scopes and implementation (not yet done).

3. **Multi-language dictionary**: Currently English↔Portuguese only. Expanding to Spanish requires: (a) alternative lookup API or local data, (b) language selection UI, (c) phonetic parsing for Spanish.

4. **Focus mode**: Uses App.addEventListener("change") for background/foreground transitions. Works on native; web behavior untested.

5. **Shared reading groups ("Book Addictive")**: Not yet implemented. Requires user accounts, group membership, shared sessions, daily check-ins—backend and data model needed.

6. **PDF/ePub reader**: Currently shows book excerpts only. Full PDF/ePub parsing/rendering requires third-party library (e.g., react-native-pdf, epub reader) + file handling.

## When Adding New Features

- **New data type**: Add to AppContext interface + add `get*`, `add*` methods
- **Persistence**: Update AsyncStorage keys in AppContext `useEffect` cleanup
- **UI theme color**: Add to `useColors()` hook (colors.ts)
- **New screen**: Create in `app/` with Expo Router conventions; add to Stack in `_layout.tsx`
- **API endpoint**: Add to Express routes, regenerate client via `pnpm --filter @workspace/api-spec run codegen`
- **Database table**: Define in `lib/db/src/schema/index.ts`, run `pnpm --filter @workspace/db run push`
