-- Migration: 0003_contact_reports.sql
-- Description: Contact/error reports from the corrections page

CREATE TABLE IF NOT EXISTS contact_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  page_url TEXT,
  category TEXT DEFAULT 'other',  -- 'factual_error', 'missing_info', 'candidate_request', 'other'
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending',  -- 'pending', 'reviewed', 'corrected', 'rejected'
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contact_reports_status ON contact_reports(status);
CREATE INDEX IF NOT EXISTS idx_contact_reports_email ON contact_reports(email);
