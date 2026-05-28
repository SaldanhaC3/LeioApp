ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users manage own books" ON public.books FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own sessions" ON public.sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own highlights" ON public.highlights FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own vocabulary" ON public.vocabulary_entries FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Auth users can find groups" ON public.reading_groups FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Auth users create groups" ON public.reading_groups FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creator updates group" ON public.reading_groups FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Members view group membership" ON public.group_members FOR SELECT USING (
  group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
);
CREATE POLICY "Users manage own membership" ON public.group_members FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Members view checkins" ON public.group_checkins FOR SELECT USING (
  group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
);
CREATE POLICY "Users create own checkins" ON public.group_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
