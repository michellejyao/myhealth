-- Expand health_profile table with additional health information fields
-- All fields are optional to respect user privacy

-- Add new columns to health_profile table
ALTER TABLE health_profile 
ADD COLUMN IF NOT EXISTS blood_type TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS medications TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS primary_physician TEXT,
ADD COLUMN IF NOT EXISTS chronic_conditions TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS height_unit TEXT DEFAULT 'metric',
ADD COLUMN IF NOT EXISTS weight_unit TEXT DEFAULT 'metric';

-- Add check constraint for blood_type
ALTER TABLE health_profile 
ADD CONSTRAINT blood_type_check 
CHECK (blood_type IS NULL OR blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'));

-- Add check constraint for unit preferences
ALTER TABLE health_profile 
ADD CONSTRAINT height_unit_check 
CHECK (height_unit IN ('metric', 'imperial'));

ALTER TABLE health_profile 
ADD CONSTRAINT weight_unit_check 
CHECK (weight_unit IN ('metric', 'imperial'));

-- Update the updated_at trigger to include new columns
CREATE OR REPLACE FUNCTION update_health_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_health_profile_timestamp ON health_profile;

CREATE TRIGGER update_health_profile_timestamp
BEFORE UPDATE ON health_profile
FOR EACH ROW
EXECUTE FUNCTION update_health_profile_updated_at();
