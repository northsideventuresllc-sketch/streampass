-- Optional metadata for watchlist items added via search
ALTER TABLE streampass_watchlist
  ADD COLUMN IF NOT EXISTS external_id TEXT,
  ADD COLUMN IF NOT EXISTS media_type TEXT
    CHECK (media_type IS NULL OR media_type IN ('movie', 'tv')),
  ADD COLUMN IF NOT EXISTS poster_url TEXT,
  ADD COLUMN IF NOT EXISTS release_year INTEGER;
