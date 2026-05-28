-- Leio — Schema real (criado via Supabase dashboard)
-- Execute no SQL Editor do Supabase caso precise recriar do zero.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid NOT NULL REFERENCES auth.users(id),
  username    text,
  handle      text UNIQUE,
  avatar_url  text,
  xp          integer DEFAULT 0,
  folego      integer DEFAULT 0,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id)
);

-- Books
CREATE TABLE IF NOT EXISTS public.books (
  id           uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.profiles(id),
  local_id     text,
  title        text NOT NULL,
  author       text NOT NULL,
  genre        text,
  total_pages  integer DEFAULT 0,
  current_page integer DEFAULT 0,
  status       text DEFAULT 'want',
  cover_color  text,
  added_at     timestamptz DEFAULT now(),
  finished_at  timestamptz,
  isbn         text,
  description  text,
  cover_image  text,
  CONSTRAINT books_pkey PRIMARY KEY (id),
  UNIQUE (user_id, local_id)
);

-- Sessions
CREATE TABLE IF NOT EXISTS public.sessions (
  id               uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES public.profiles(id),
  book_id          uuid NOT NULL REFERENCES public.books(id),
  local_id         text,
  start_page       integer,
  end_page         integer,
  duration_seconds integer,
  pace             real,
  date             date,
  is_focus_mode    boolean DEFAULT false,
  created_at       timestamptz DEFAULT now(),
  CONSTRAINT sessions_pkey PRIMARY KEY (id),
  UNIQUE (user_id, local_id)
);

-- Highlights
CREATE TABLE IF NOT EXISTS public.highlights (
  id         uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.profiles(id),
  book_id    uuid NOT NULL REFERENCES public.books(id),
  local_id   text,
  text       text NOT NULL,
  bg_variant text DEFAULT 'volt',
  photo_uri  text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT highlights_pkey PRIMARY KEY (id),
  UNIQUE (user_id, local_id)
);

-- Vocabulary
CREATE TABLE IF NOT EXISTS public.vocabulary_entries (
  id         uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.profiles(id),
  book_id    uuid REFERENCES public.books(id),
  local_id   text,
  word       text NOT NULL,
  definition text,
  phonetic   text,
  language   text DEFAULT 'en',
  saved_at   timestamptz DEFAULT now(),
  CONSTRAINT vocabulary_entries_pkey PRIMARY KEY (id),
  UNIQUE (user_id, local_id)
);

-- Reading groups
CREATE TABLE IF NOT EXISTS public.reading_groups (
  id           uuid NOT NULL DEFAULT gen_random_uuid(),
  local_id     text,
  name         text NOT NULL,
  description  text,
  emoji        text DEFAULT '📚',
  created_by   uuid REFERENCES public.profiles(id),
  invite_code  text NOT NULL UNIQUE,
  current_book text,
  created_at   timestamptz DEFAULT now(),
  CONSTRAINT reading_groups_pkey PRIMARY KEY (id)
);

-- Group members
CREATE TABLE IF NOT EXISTS public.group_members (
  group_id  uuid NOT NULL REFERENCES public.reading_groups(id),
  user_id   uuid NOT NULL REFERENCES public.profiles(id),
  joined_at timestamptz DEFAULT now(),
  CONSTRAINT group_members_pkey PRIMARY KEY (group_id, user_id)
);

-- Group check-ins
CREATE TABLE IF NOT EXISTS public.group_checkins (
  id          uuid NOT NULL DEFAULT gen_random_uuid(),
  group_id    uuid NOT NULL REFERENCES public.reading_groups(id),
  user_id     uuid NOT NULL REFERENCES public.profiles(id),
  pages_read  integer NOT NULL,
  mood        text,
  comment     text,
  book_title  text,
  photo_url   text,
  date        date DEFAULT CURRENT_DATE,
  created_at  timestamptz DEFAULT now(),
  CONSTRAINT group_checkins_pkey PRIMARY KEY (id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_books_user_local ON public.books(user_id, local_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_local ON public.sessions(user_id, local_id);
CREATE INDEX IF NOT EXISTS idx_highlights_user_local ON public.highlights(user_id, local_id);
CREATE INDEX IF NOT EXISTS idx_vocab_user_local ON public.vocabulary_entries(user_id, local_id);
