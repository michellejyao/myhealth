-- Create health_profile table
CREATE TABLE IF NOT EXISTS health_profile (
  user_id TEXT PRIMARY KEY,
  allergies TEXT[] DEFAULT '{}',
  height NUMERIC,
  weight NUMERIC,
  family_history TEXT[] DEFAULT '{}',
  lifestyle_sleep_hours NUMERIC,
  lifestyle_activity_level TEXT,
  lifestyle_diet_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ai_flags table
CREATE TABLE IF NOT EXISTS ai_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  log_id UUID REFERENCES health_logs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  reasoning_summary TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_flags_user_id ON ai_flags(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_flags_log_id ON ai_flags(log_id);
CREATE INDEX IF NOT EXISTS idx_ai_flags_created_at ON ai_flags(created_at DESC);

-- Create ai_summaries table
CREATE TABLE IF NOT EXISTS ai_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  summary_text TEXT NOT NULL,
  date_range_start TIMESTAMP WITH TIME ZONE,
  date_range_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_summaries_user_id ON ai_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_summaries_created_at ON ai_summaries(created_at DESC);

-- Enable RLS on new tables
ALTER TABLE health_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_summaries ENABLE ROW LEVEL SECURITY;

-- RLS policies: allow all for now (client enforces user_id; for production add backend verification)
DROP POLICY IF EXISTS "Read own health_profile" ON health_profile;
CREATE POLICY "Read own health_profile" ON health_profile FOR SELECT USING (true);
DROP POLICY IF EXISTS "Insert own health_profile" ON health_profile;
CREATE POLICY "Insert own health_profile" ON health_profile FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Update own health_profile" ON health_profile;
CREATE POLICY "Update own health_profile" ON health_profile FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Read own ai_flags" ON ai_flags;
CREATE POLICY "Read own ai_flags" ON ai_flags FOR SELECT USING (true);
DROP POLICY IF EXISTS "Insert ai_flags" ON ai_flags;
CREATE POLICY "Insert ai_flags" ON ai_flags FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Delete own ai_flags" ON ai_flags;
CREATE POLICY "Delete own ai_flags" ON ai_flags FOR DELETE USING (true);

DROP POLICY IF EXISTS "Read own ai_summaries" ON ai_summaries;
CREATE POLICY "Read own ai_summaries" ON ai_summaries FOR SELECT USING (true);
DROP POLICY IF EXISTS "Insert ai_summaries" ON ai_summaries;
CREATE POLICY "Insert ai_summaries" ON ai_summaries FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Delete own ai_summaries" ON ai_summaries;
CREATE POLICY "Delete own ai_summaries" ON ai_summaries FOR DELETE USING (true);
