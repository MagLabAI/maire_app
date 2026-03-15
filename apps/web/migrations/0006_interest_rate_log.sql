-- Rate limiting log for interest API (replaces KV-based rate limiting)
CREATE TABLE IF NOT EXISTS city_interest_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  city_slug TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_interest_log_lookup
  ON city_interest_log (city_slug, ip_hash, created_at);
