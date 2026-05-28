-- Row Level Security Policies

-- Profiles: Users can read all profiles (public), but only update their own
CREATE POLICY "Profiles are publicly readable" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Books: Users can read all books, but only CRUD their own
CREATE POLICY "Books are readable by everyone" ON books
  FOR SELECT USING (true);

CREATE POLICY "Users can create books" ON books
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own books" ON books
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own books" ON books
  FOR DELETE USING (auth.uid() = user_id);

-- Sessions: Users can only manage their own sessions
CREATE POLICY "Users can read own sessions" ON sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions" ON sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON sessions
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Highlights: Users can only manage their own highlights
CREATE POLICY "Users can read own highlights" ON highlights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own highlights" ON highlights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own highlights" ON highlights
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own highlights" ON highlights
  FOR DELETE USING (auth.uid() = user_id);

-- Vocabulary entries: Users can only manage their own entries
CREATE POLICY "Users can read own vocabulary" ON vocabulary_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create vocabulary" ON vocabulary_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vocabulary" ON vocabulary_entries
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own vocabulary" ON vocabulary_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Reading groups: Members can read groups they're in, only owners can modify
CREATE POLICY "Group members can read their groups" ON reading_groups
  FOR SELECT USING (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = reading_groups.id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create groups" ON reading_groups
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Only group owners can update" ON reading_groups
  FOR UPDATE USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Only group owners can delete" ON reading_groups
  FOR DELETE USING (auth.uid() = owner_id);

-- Group members: Members can read their own memberships
CREATE POLICY "Users can read their group memberships" ON group_members
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Group owners can manage members" ON group_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM reading_groups
      WHERE reading_groups.id = group_members.group_id
      AND reading_groups.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update member roles" ON group_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM reading_groups
      WHERE reading_groups.id = group_members.group_id
      AND reading_groups.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM reading_groups
      WHERE reading_groups.id = group_members.group_id
      AND reading_groups.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can remove members" ON group_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM reading_groups
      WHERE reading_groups.id = group_members.group_id
      AND reading_groups.owner_id = auth.uid()
    ) OR auth.uid() = user_id
  );

-- Group check-ins: Members can read and create check-ins in their groups
CREATE POLICY "Group members can read check-ins" ON group_checkins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_checkins.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create check-ins in their groups" ON group_checkins
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_checkins.group_id
      AND group_members.user_id = auth.uid()
    )
  );
