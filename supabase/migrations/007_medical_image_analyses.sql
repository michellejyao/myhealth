-- Table for storing medical image analysis results (segmentation + abnormality detection).
-- Links to attachment and log; segmentation mask stored in storage or as reference.
CREATE TABLE IF NOT EXISTS medical_image_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  log_id UUID NOT NULL REFERENCES health_logs(id) ON DELETE CASCADE,
  attachment_id UUID NOT NULL REFERENCES attachments(id) ON DELETE CASCADE,
  -- Segmentation: optional path in storage (e.g. log-attachments/analyses/<id>/mask.png)
  segmentation_storage_path TEXT,
  -- Segmentation labels per class (e.g. ["background", "tumor", "edema"])
  segmentation_labels TEXT[] DEFAULT '{}',
  -- Abnormality findings from model
  findings JSONB NOT NULL DEFAULT '[]',
  -- Metadata: model version, modality inferred, etc.
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(attachment_id)
);

CREATE INDEX IF NOT EXISTS idx_medical_image_analyses_user_id ON medical_image_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_image_analyses_log_id ON medical_image_analyses(log_id);
CREATE INDEX IF NOT EXISTS idx_medical_image_analyses_attachment_id ON medical_image_analyses(attachment_id);

ALTER TABLE medical_image_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "medical_image_analyses_select" ON medical_image_analyses FOR SELECT USING (true);
CREATE POLICY "medical_image_analyses_insert" ON medical_image_analyses FOR INSERT WITH CHECK (true);
CREATE POLICY "medical_image_analyses_update" ON medical_image_analyses FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "medical_image_analyses_delete" ON medical_image_analyses FOR DELETE USING (true);
