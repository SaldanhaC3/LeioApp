-- Profiles linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT,
  handle TEXT UNIQUE,
  avatar_url TEXT,
  xp INTEGER DEFAULT 0,
  folego INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  local_id TEXT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  genre TEXT,
  total_pages INTEGER DEFAULT 0,
  current_page INTEGER DEFAULT 0,
  status TEXT DEFAULT 'want',
  cover_color TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  isbn TEXT,
  description TEXT,
  cover_image TEXT,
  UNIQUE(user_id, local_id)
);

CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES public.books ON DELETE CASCADE NOT NULL,
  local_id TEXT,
  start_page INTEGER,
  end_page INTEGER,
  duration_seconds INTEGER,
  pace REAL,
  date DATE,
  is_focus_mode BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.highlights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES public.books ON DELETE CASCADE NOT NULL,
  local_id TEXT,
  text TEXT NOT NULL,
  bg_variant TEXT DEFAULT 'volt',
  photo_uri TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vocabulary_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES public.books ON DELETE CASCADE,
  local_id TEXT,
  word TEXT NOT NULL,
  definition TEXT,
  phonetic TEXT,
  language TEXT DEFAULT 'en',
  saved_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reading_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  local_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  emoji TEXT DEFAULT '📚',
  created_by UUID REFERENCES public.profiles ON DELETE SET NULL,
  invite_code TEXT UNIQUE NOT NULL,
  current_book TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.group_members (
  group_id UUID REFERENCES public.reading_groups ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.group_checkins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES public.reading_groups ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles ON DELETE CASCADE NOT NULL,
  pages_read INTEGER NOT NULL,
  mood TEXT,
  comment TEXT,
  book_title TEXT,
  photo_url TEXT,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE VIEW public.book_rankings AS
SELECT
  b.title,
  b.author,
  b.genre,
  COUNT(DISTINCT s.user_id) AS reader_count,
  SUM(s.end_page - s.start_page) AS total_pages_read,
  ROUND(AVG(s.pace)::numeric, 2) AS avg_pace
FROM public.sessions s
JOIN public.books b ON b.id = s.book_id
WHERE s.created_at > NOW() - INTERVAL '30 days'
  AND (s.end_page - s.start_page) > 0
GROUP BY b.title, b.author, b.genre
HAVING COUNT(DISTINCT s.user_id) >= 1
ORDER BY total_pages_read DESC;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();
