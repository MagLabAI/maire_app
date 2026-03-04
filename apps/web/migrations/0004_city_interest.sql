-- City interest counters: tracks user demand for candidate research
CREATE TABLE IF NOT EXISTS city_interest (
  city_slug TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  last_at TEXT NOT NULL DEFAULT (datetime('now'))
);
