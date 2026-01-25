-- Initial database schema for Video Analysis History
-- This migration sets up all tables, indexes, and constraints

-- Core video metadata
CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  filepath TEXT,
  file_size INTEGER,
  duration REAL,
  width INTEGER,
  height INTEGER,
  codec TEXT,
  uploaded_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Transcription results
CREATE TABLE IF NOT EXISTS transcriptions (
  id TEXT PRIMARY KEY,
  video_id TEXT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  full_text TEXT NOT NULL,
  language TEXT,
  confidence REAL,
  processing_duration REAL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Transcription segments (for timeline sync)
CREATE TABLE IF NOT EXISTS transcription_segments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transcription_id TEXT NOT NULL REFERENCES transcriptions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  start_time REAL NOT NULL,
  end_time REAL NOT NULL,
  confidence REAL,
  speaker TEXT
);

-- Analysis sessions (one per analyze click)
CREATE TABLE IF NOT EXISTS analysis_sessions (
  id TEXT PRIMARY KEY,
  video_id TEXT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  transcription_id TEXT REFERENCES transcriptions(id),
  status TEXT CHECK(status IN ('pending', 'processing', 'completed', 'error')) DEFAULT 'pending',
  overall_score REAL,
  keyframes_count INTEGER,
  processing_time_ms INTEGER,
  error_message TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT
);

-- Category analysis results (one per category per session)
CREATE TABLE IF NOT EXISTS category_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL REFERENCES analysis_sessions(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  score REAL,
  response_json TEXT NOT NULL,
  processing_time_ms INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(session_id, category)
);

-- Individual issues extracted from analysis
CREATE TABLE IF NOT EXISTS analysis_issues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL REFERENCES analysis_sessions(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  severity TEXT CHECK(severity IN ('critical', 'major', 'minor', 'suggestion')) NOT NULL,
  timestamp_start REAL,
  timestamp_end REAL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  suggested_fix TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Keyframes (optional - store base64 or file paths)
CREATE TABLE IF NOT EXISTS keyframes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL REFERENCES analysis_sessions(id) ON DELETE CASCADE,
  timestamp REAL NOT NULL,
  file_path TEXT,
  width INTEGER,
  height INTEGER,
  size_bytes INTEGER
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_videos_uploaded_at ON videos(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_video_id ON analysis_sessions(video_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON analysis_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_category_results_session ON category_results(session_id);
CREATE INDEX IF NOT EXISTS idx_issues_session ON analysis_issues(session_id);
CREATE INDEX IF NOT EXISTS idx_issues_severity ON analysis_issues(severity);
CREATE INDEX IF NOT EXISTS idx_keyframes_session ON keyframes(session_id);