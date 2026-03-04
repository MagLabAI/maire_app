-- Migration: Create research queue and cities metadata tables
-- Run with: wrangler d1 execute maire-research-queue --file=./migrations/0001_research_queue.sql

-- Cities metadata: tracks all cities and their data status
CREATE TABLE IF NOT EXISTS cities_metadata (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  city_slug TEXT UNIQUE NOT NULL,
  city_name TEXT NOT NULL,
  department TEXT,
  region TEXT,
  population INTEGER DEFAULT 0,
  data_source TEXT DEFAULT 'pending',  -- 'static', 'kv', 'pending'
  kv_key TEXT,                         -- KV key if data_source = 'kv'
  last_researched_at TEXT,             -- ISO timestamp
  next_refresh_at TEXT,                -- ISO timestamp (2 weeks after research)
  research_cost_usd REAL DEFAULT 0,    -- Cumulative cost for this city
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Research queue: pending research jobs
CREATE TABLE IF NOT EXISTS research_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  city_slug TEXT NOT NULL,
  city_name TEXT NOT NULL,
  priority INTEGER DEFAULT 0,          -- Higher = more urgent (10=user, 5=auto-refresh, 1=admin-bulk)
  status TEXT DEFAULT 'pending',       -- 'pending', 'processing', 'completed', 'failed'
  requested_at TEXT DEFAULT CURRENT_TIMESTAMP,
  started_at TEXT,
  completed_at TEXT,
  error_message TEXT,
  request_source TEXT DEFAULT 'user',  -- 'user', 'auto-refresh', 'admin'
  requester_ip TEXT,                   -- For rate limiting
  retry_count INTEGER DEFAULT 0,       -- Number of retry attempts
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_queue_status_priority
  ON research_queue(status, priority DESC, requested_at ASC);

CREATE INDEX IF NOT EXISTS idx_queue_city_status
  ON research_queue(city_slug, status);

CREATE INDEX IF NOT EXISTS idx_cities_refresh
  ON cities_metadata(next_refresh_at)
  WHERE next_refresh_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cities_source
  ON cities_metadata(data_source);

-- Seed static cities (Paris, Lyon, Marseille, Annecy)
INSERT OR IGNORE INTO cities_metadata (city_slug, city_name, department, data_source) VALUES
  ('paris', 'Paris', '75', 'static'),
  ('lyon', 'Lyon', '69', 'static'),
  ('marseille', 'Marseille', '13', 'static'),
  ('annecy', 'Annecy', '74', 'static');
