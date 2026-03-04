-- Migration: 0002_users.sql
-- Description: User accounts from Google OAuth with subscription tiers

-- Users table for registered accounts
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  google_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  picture TEXT,
  subscription_tier TEXT DEFAULT 'free',  -- 'free', 'candidat', 'campagne', 'metropole'
  tracked_candidates TEXT,                 -- JSON array of candidate IDs (max 4)
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_login_at TEXT
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- City requests table (link user to their city research requests)
CREATE TABLE IF NOT EXISTS user_city_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  city_slug TEXT NOT NULL,
  city_name TEXT NOT NULL,
  requested_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, city_slug)
);

CREATE INDEX IF NOT EXISTS idx_user_city_requests_user ON user_city_requests(user_id);
