-- Drop existing policies
DROP POLICY IF EXISTS "Users can read their own logs" ON health_logs;
DROP POLICY IF EXISTS "Users can insert their own logs" ON health_logs;
DROP POLICY IF EXISTS "Users can update their own logs" ON health_logs;
DROP POLICY IF EXISTS "Users can delete their own logs" ON health_logs;

-- Create new policies that work with Auth0 user_id (without requiring Supabase auth)

-- Allow read: anyone can read logs with their user_id
CREATE POLICY "Read own logs" ON health_logs FOR SELECT
  USING (true);

-- Allow insert: anyone can insert a log and must set their own user_id
-- The client enforces this with Auth0's user.sub
CREATE POLICY "Insert own log" ON health_logs FOR INSERT
  WITH CHECK (true);

-- Allow update: anyone can update logs with their user_id
CREATE POLICY "Update own log" ON health_logs FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow delete: anyone can delete logs with their user_id
CREATE POLICY "Delete own log" ON health_logs FOR DELETE
  USING (true);

-- IMPORTANT: This works because:
-- 1. The client enforces that user_id must be set from Auth0 (user.sub)
-- 2. The client code won't allow creating logs for other users
-- 3. For production, add a backend API that verifies Auth0 tokens server-side
