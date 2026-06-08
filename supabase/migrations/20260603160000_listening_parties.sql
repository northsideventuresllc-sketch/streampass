-- Listening parties / jam sessions (cross-platform music)

-- Distinguish watch parties from listening jams
ALTER TABLE streampass_watch_rooms
  ADD COLUMN IF NOT EXISTS room_type TEXT NOT NULL DEFAULT 'watch'
    CHECK (room_type IN ('watch', 'listen'));

CREATE INDEX IF NOT EXISTS idx_watch_rooms_type
  ON streampass_watch_rooms (room_type, scheduled_time DESC);

-- Per-member preferred music platform in a jam
ALTER TABLE streampass_room_members
  ADD COLUMN IF NOT EXISTS listening_platform TEXT;

-- OAuth-connected music streaming accounts
CREATE TABLE IF NOT EXISTS streampass_connected_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('Spotify', 'Apple Music')),
  platform_user_id TEXT,
  display_name TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  scopes TEXT[],
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_connected_accounts_user
  ON streampass_connected_accounts (user_id);

ALTER TABLE streampass_connected_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own connected accounts"
  ON streampass_connected_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connected accounts"
  ON streampass_connected_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connected accounts"
  ON streampass_connected_accounts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own connected accounts"
  ON streampass_connected_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Shared jam queue (platform-agnostic track metadata)
CREATE TABLE IF NOT EXISTS streampass_jam_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES streampass_watch_rooms(id) ON DELETE CASCADE,
  added_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_title TEXT NOT NULL,
  track_artist TEXT NOT NULL,
  track_album TEXT,
  track_artwork_url TEXT,
  track_duration_ms INTEGER,
  isrc TEXT,
  spotify_uri TEXT,
  spotify_url TEXT,
  apple_music_url TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  votes INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jam_queue_room_position
  ON streampass_jam_queue (room_id, position);

ALTER TABLE streampass_jam_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Room members can view jam queue"
  ON streampass_jam_queue FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM streampass_room_members m
      WHERE m.room_id = streampass_jam_queue.room_id
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Room members can add to jam queue"
  ON streampass_jam_queue FOR INSERT
  WITH CHECK (
    auth.uid() = added_by
    AND EXISTS (
      SELECT 1 FROM streampass_room_members m
      WHERE m.room_id = streampass_jam_queue.room_id
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Host can update jam queue"
  ON streampass_jam_queue FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM streampass_watch_rooms r
      WHERE r.id = streampass_jam_queue.room_id
        AND r.created_by = auth.uid()
    )
  );

CREATE POLICY "Host or adder can remove from jam queue"
  ON streampass_jam_queue FOR DELETE
  USING (
    auth.uid() = added_by
    OR EXISTS (
      SELECT 1 FROM streampass_watch_rooms r
      WHERE r.id = streampass_jam_queue.room_id
        AND r.created_by = auth.uid()
    )
  );

-- Now playing state for a jam
CREATE TABLE IF NOT EXISTS streampass_jam_state (
  room_id UUID PRIMARY KEY REFERENCES streampass_watch_rooms(id) ON DELETE CASCADE,
  queue_item_id UUID REFERENCES streampass_jam_queue(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ,
  is_playing BOOLEAN NOT NULL DEFAULT false,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE streampass_jam_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Room members can view jam state"
  ON streampass_jam_state FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM streampass_room_members m
      WHERE m.room_id = streampass_jam_state.room_id
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Host can upsert jam state"
  ON streampass_jam_state FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM streampass_watch_rooms r
      WHERE r.id = streampass_jam_state.room_id
        AND r.created_by = auth.uid()
    )
  );

CREATE POLICY "Host can update jam state"
  ON streampass_jam_state FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM streampass_watch_rooms r
      WHERE r.id = streampass_jam_state.room_id
        AND r.created_by = auth.uid()
    )
  );

-- Realtime for collaborative queue + playback state
ALTER PUBLICATION supabase_realtime ADD TABLE streampass_jam_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE streampass_jam_state;
