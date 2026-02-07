import { supabase } from '../lib/supabase'
import type {
  MedicalImageAnalysisEntry,
  MedicalImageAnalysisResult,
  MedicalImageFinding,
} from '../types'

const API_BASE = import.meta.env.VITE_MEDICAL_IMAGE_API_URL || 'http://localhost:8000'
const BUCKET = 'log-attachments'

/**
 * Call the medical image analysis API (MONAI + PyTorch) with an image URL.
 * Returns segmentation mask (base64), labels, and abnormality findings.
 */
export async function analyzeImageByUrl(imageUrl: string): Promise<MedicalImageAnalysisResult> {
  const res = await fetch(`${API_BASE}/analyze/url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: imageUrl }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Analysis failed: ${res.status} ${text}`)
  }
  return res.json() as Promise<MedicalImageAnalysisResult>
}

/**
 * Call the medical image analysis API with uploaded file bytes.
 */
export async function analyzeImageFile(file: File): Promise<MedicalImageAnalysisResult> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Analysis failed: ${res.status} ${text}`)
  }
  return res.json() as Promise<MedicalImageAnalysisResult>
}

/**
 * Save analysis result to Supabase (medical_image_analyses) and optionally
 * upload segmentation mask to storage for persistence.
 */
export async function saveAnalysisResult(
  userId: string,
  logId: string,
  attachmentId: string,
  result: MedicalImageAnalysisResult
): Promise<MedicalImageAnalysisEntry> {
  const findings = result.findings as MedicalImageFinding[]
  const segmentationLabels = result.segmentation_labels || []
  const meta = result.meta || {}

  const safeUserId = userId.replace(/\|/g, '-').replace(/[#?%*]/g, '-')
  let segmentationStoragePath: string | null = null
  if (result.segmentation_mask_b64) {
    const buf = Uint8Array.from(atob(result.segmentation_mask_b64), (c) => c.charCodeAt(0))
    const blob = new Blob([buf], { type: 'image/png' })
    const path = `${safeUserId}/analyses/${attachmentId}/mask.png`
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, blob, {
      contentType: 'image/png',
      upsert: true,
    })
    if (!uploadError) segmentationStoragePath = path
  }

  const row = {
    user_id: userId,
    log_id: logId,
    attachment_id: attachmentId,
    segmentation_storage_path: segmentationStoragePath,
    segmentation_labels: segmentationLabels,
    findings,
    meta,
  }

  const { data, error } = await supabase
    .from('medical_image_analyses')
    .upsert(row, { onConflict: 'attachment_id' })
    .select()
    .single()

  if (error) throw new Error(`Failed to save analysis: ${error.message}`)
  return data
}

/**
 * Fetch stored analysis for an attachment (if any).
 */
export async function getAnalysisByAttachmentId(
  attachmentId: string
): Promise<MedicalImageAnalysisEntry | null> {
  const { data, error } = await supabase
    .from('medical_image_analyses')
    .select('*')
    .eq('attachment_id', attachmentId)
    .maybeSingle()
  if (error) throw new Error(`Failed to load analysis: ${error.message}`)
  return data
}

/**
 * Fetch all analyses for a log.
 */
export async function getAnalysesByLogId(
  logId: string
): Promise<MedicalImageAnalysisEntry[]> {
  const { data, error } = await supabase
    .from('medical_image_analyses')
    .select('*')
    .eq('log_id', logId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(`Failed to load analyses: ${error.message}`)
  return data ?? []
}

/**
 * Public URL for a stored segmentation mask (storage path).
 */
export function getSegmentationMaskUrl(storagePath: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}

export const medicalImageAnalysisService = {
  analyzeImageByUrl,
  analyzeImageFile,
  saveAnalysisResult,
  getAnalysisByAttachmentId,
  getAnalysesByLogId,
  getSegmentationMaskUrl,
}
