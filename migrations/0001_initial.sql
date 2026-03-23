CREATE TABLE IF NOT EXISTS interview_sessions (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  interview_type TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  mode TEXT NOT NULL,
  status TEXT NOT NULL,
  question_count INTEGER NOT NULL,
  current_question_index INTEGER NOT NULL,
  overall_score REAL,
  latest_summary TEXT,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS interview_feedback (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  question_index INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  answer_text TEXT NOT NULL,
  score REAL,
  strengths_json TEXT NOT NULL,
  improvements_json TEXT NOT NULL,
  summary TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES interview_sessions(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_interview_feedback_session_question
  ON interview_feedback(session_id, question_index);

CREATE TABLE IF NOT EXISTS interview_reports (
  session_id TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  interview_type TEXT NOT NULL,
  overall_score REAL,
  summary TEXT NOT NULL,
  readiness_assessment TEXT NOT NULL,
  strengths_json TEXT NOT NULL,
  growth_areas_json TEXT NOT NULL,
  next_steps_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES interview_sessions(id)
);

CREATE INDEX IF NOT EXISTS idx_interview_sessions_updated_at
  ON interview_sessions(updated_at DESC);
