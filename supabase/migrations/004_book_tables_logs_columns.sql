-- Add columns to health_logs for body region log page (backward compatible)
ALTER TABLE health_logs
  ADD COLUMN IF NOT EXISTS body_region TEXT,
  ADD COLUMN IF NOT EXISTS pain_type TEXT,
  ADD COLUMN IF NOT EXISTS symptom_tags TEXT[] DEFAULT '{}';

-- family_history table
CREATE TABLE IF NOT EXISTS family_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  condition_name TEXT NOT NULL,
  relationship TEXT NOT NULL CHECK (relationship IN (
    'mother', 'father', 'grandmother', 'grandfather', 'sibling', 'other'
  )),
  age_of_onset INTEGER,
  notes TEXT,
  confidence_level TEXT NOT NULL CHECK (confidence_level IN (
    'confirmed diagnosis', 'suspected', 'unknown'
  )),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_family_history_user_id ON family_history(user_id);

ALTER TABLE family_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "family_history_select" ON family_history FOR SELECT USING (true);
CREATE POLICY "family_history_insert" ON family_history FOR INSERT WITH CHECK (true);
CREATE POLICY "family_history_update" ON family_history FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "family_history_delete" ON family_history FOR DELETE USING (true);

-- appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  doctor_name TEXT NOT NULL,
  specialty TEXT NOT NULL CHECK (specialty IN (
    'general practitioner', 'cardiologist', 'neurologist', 'orthopedist',
    'dermatologist', 'other'
  )),
  reason_for_visit TEXT,
  diagnosis TEXT,
  doctor_notes TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date DESC);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appointments_select" ON appointments FOR SELECT USING (true);
CREATE POLICY "appointments_insert" ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "appointments_update" ON appointments FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "appointments_delete" ON appointments FOR DELETE USING (true);

-- attachments table (for logs, appointments, or standalone)
CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  log_id UUID REFERENCES health_logs(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'audio', 'document')),
  storage_path TEXT NOT NULL,
  file_name TEXT,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attachments_user_id ON attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_attachments_log_id ON attachments(log_id);
CREATE INDEX IF NOT EXISTS idx_attachments_appointment_id ON attachments(appointment_id);

ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attachments_select" ON attachments FOR SELECT USING (true);
CREATE POLICY "attachments_insert" ON attachments FOR INSERT WITH CHECK (true);
CREATE POLICY "attachments_update" ON attachments FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "attachments_delete" ON attachments FOR DELETE USING (true);
