-- Add location and questions_to_ask to appointments
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS questions_to_ask TEXT[] DEFAULT '{}';
