-- Stream Pass initial schema
-- Project: kxijunwgbrlfzvgkhklo

-- Profiles
CREATE TABLE IF NOT EXISTS streampass_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE streampass_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON streampass_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON streampass_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON streampass_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- User streaming services
CREATE TABLE IF NOT EXISTS streampass_user_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  monthly_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ,
  UNIQUE (user_id, service_name)
);

ALTER TABLE streampass_user_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own services"
  ON streampass_user_services FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own services"
  ON streampass_user_services FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own services"
  ON streampass_user_services FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own services"
  ON streampass_user_services FOR DELETE
  USING (auth.uid() = user_id);

-- Universal watchlist
CREATE TABLE IF NOT EXISTS streampass_watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  platform TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'in_progress', 'watched', 'dropped')),
  priority_order INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  watched_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_watchlist_user_priority
  ON streampass_watchlist (user_id, priority_order);

ALTER TABLE streampass_watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own watchlist"
  ON streampass_watchlist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watchlist"
  ON streampass_watchlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watchlist"
  ON streampass_watchlist FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own watchlist"
  ON streampass_watchlist FOR DELETE
  USING (auth.uid() = user_id);

-- Content passport tracked titles
CREATE TABLE IF NOT EXISTS streampass_tracked_titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  current_platform TEXT NOT NULL,
  previous_platform TEXT,
  expires_at TIMESTAMPTZ,
  alert_triggered BOOLEAN NOT NULL DEFAULT FALSE,
  alert_reason TEXT,
  tracked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE streampass_tracked_titles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tracked titles"
  ON streampass_tracked_titles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tracked titles"
  ON streampass_tracked_titles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tracked titles"
  ON streampass_tracked_titles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tracked titles"
  ON streampass_tracked_titles FOR DELETE
  USING (auth.uid() = user_id);

-- Watch party rooms
CREATE TABLE IF NOT EXISTS streampass_watch_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  platform TEXT NOT NULL,
  scheduled_time TIMESTAMPTZ NOT NULL,
  share_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_watch_rooms_share_code
  ON streampass_watch_rooms (share_code);

ALTER TABLE streampass_watch_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view rooms"
  ON streampass_watch_rooms FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create rooms"
  ON streampass_watch_rooms FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update rooms"
  ON streampass_watch_rooms FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can delete rooms"
  ON streampass_watch_rooms FOR DELETE
  USING (auth.uid() = created_by);

-- Room members
CREATE TABLE IF NOT EXISTS streampass_room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES streampass_watch_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (room_id, user_id)
);

ALTER TABLE streampass_room_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view room membership"
  ON streampass_room_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join rooms"
  ON streampass_room_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms"
  ON streampass_room_members FOR DELETE
  USING (auth.uid() = user_id);

-- Room chat messages
CREATE TABLE IF NOT EXISTS streampass_room_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES streampass_watch_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_room_messages_room
  ON streampass_room_messages (room_id, sent_at);

ALTER TABLE streampass_room_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view room messages"
  ON streampass_room_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Members can send messages"
  ON streampass_room_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM streampass_room_members m
      WHERE m.room_id = streampass_room_messages.room_id
        AND m.user_id = auth.uid()
    )
  );

-- Realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE streampass_room_messages;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_streampass_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.streampass_profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), ''),
      SPLIT_PART(NEW.email, '@', '1')
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_streampass ON auth.users;
CREATE TRIGGER on_auth_user_created_streampass
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_streampass_new_user();

-- Update service last_active when watchlist changes
CREATE OR REPLACE FUNCTION public.update_service_last_active()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE streampass_user_services
  SET last_active_at = NOW()
  WHERE user_id = NEW.user_id
    AND service_name = NEW.platform;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_watchlist_activity ON streampass_watchlist;
CREATE TRIGGER on_watchlist_activity
  AFTER INSERT OR UPDATE ON streampass_watchlist
  FOR EACH ROW
  EXECUTE FUNCTION public.update_service_last_active();
