-- Storage bucket for log (and appointment) attachments.
-- Create via API or Dashboard if this fails (storage schema may be read-only).
-- Bucket name: log-attachments, set public = true.
INSERT INTO storage.buckets (id, name, public)
VALUES ('log-attachments', 'log-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read (public bucket).
CREATE POLICY "log-attachments public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'log-attachments');

-- Allow anyone to upload (app uses Auth0; restrict by user in app layer via user_id in attachments table).
CREATE POLICY "log-attachments public insert"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'log-attachments');

-- Allow anyone to delete (app will only delete own user's attachments by id).
CREATE POLICY "log-attachments public delete"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'log-attachments');
