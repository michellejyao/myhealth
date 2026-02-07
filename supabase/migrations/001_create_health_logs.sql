-- Create health_logs table
CREATE TABLE IF NOT EXISTS health_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  body_parts TEXT[] DEFAULT '{}',
  severity INTEGER CHECK (severity >= 1 AND severity <= 10),
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_health_logs_user_id ON health_logs(user_id);
CREATE INDEX idx_health_logs_date ON health_logs(date DESC);
CREATE INDEX idx_health_logs_body_parts ON health_logs USING GIN(body_parts);

-- Enable RLS (Row Level Security)
ALTER TABLE health_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own logs
CREATE POLICY "Users can read their own logs"
  ON health_logs
  FOR SELECT
  USING (user_id = auth.uid()::text);

-- Create policy to allow users to insert their own logs
CREATE POLICY "Users can insert their own logs"
  ON health_logs
  FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

-- Create policy to allow users to update their own logs
CREATE POLICY "Users can update their own logs"
  ON health_logs
  FOR UPDATE
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- Create policy to allow users to delete their own logs
CREATE POLICY "Users can delete their own logs"
  ON health_logs
  FOR DELETE
  USING (user_id = auth.uid()::text);
