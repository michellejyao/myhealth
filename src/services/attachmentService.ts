import { supabase } from '../lib/supabase'
import type { AttachmentEntry, AttachmentTypeDb } from '../types'

const BUCKET = 'log-attachments'

/**
 * Sanitize a segment for Supabase Storage object keys.
 * Auth0 user IDs contain "|" which is invalid in storage keys.
 */
function sanitizeStoragePathSegment(segment: string): string {
  return segment.replace(/\|/g, '-').replace(/[#?%*]/g, '-')
}

function inferType(mimeType: string, fileName: string): AttachmentTypeDb {
  const m = mimeType?.toLowerCase() ?? ''
  const n = fileName?.toLowerCase() ?? ''
  if (m.startsWith('image/') || /\.(jpe?g|png|gif|webp|heic)$/i.test(n)) return 'image'
  if (m.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(n)) return 'video'
  if (m.startsWith('audio/') || /\.(mp3|wav|webm|m4a|ogg)$/i.test(n)) return 'audio'
  return 'document'
}

/** Public URL for an attachment (storage_path is the bucket key). */
export function getAttachmentUrl(attachment: AttachmentEntry): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(attachment.storage_path)
  return data.publicUrl
}

export const attachmentService = {
  /** Upload a file for a log and create the attachment record. */
  async uploadLogAttachment(
    userId: string,
    logId: string,
    file: File
  ): Promise<AttachmentEntry> {
    const ext = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')) : ''
    const safeUserId = sanitizeStoragePathSegment(userId)
    const key = `${safeUserId}/${logId}/${crypto.randomUUID()}${ext}`

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(key, file, {
      cacheControl: '3600',
      upsert: false,
    })
    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

    const type = inferType(file.type, file.name)
    const row = {
      user_id: userId,
      log_id: logId,
      type,
      storage_path: key,
      file_name: file.name,
      mime_type: file.type || undefined,
    }
    const { data, error } = await supabase.from('attachments').insert([row]).select()
    if (error) {
      await supabase.storage.from(BUCKET).remove([key])
      throw new Error(`Failed to save attachment: ${error.message}`)
    }
    return data[0]
  },

  /** List attachments for a log. */
  async getAttachmentsByLogId(logId: string): Promise<AttachmentEntry[]> {
    const { data, error } = await supabase
      .from('attachments')
      .select('*')
      .eq('log_id', logId)
      .order('created_at', { ascending: true })
    if (error) throw new Error(`Failed to load attachments: ${error.message}`)
    return data ?? []
  },

  /** Delete an attachment (storage object + DB row). */
  async deleteAttachment(id: string): Promise<void> {
    const { data: row, error: fetchError } = await supabase
      .from('attachments')
      .select('storage_path')
      .eq('id', id)
      .single()
    if (fetchError || !row) throw new Error('Attachment not found')
    await supabase.storage.from(BUCKET).remove([row.storage_path])
    const { error: deleteError } = await supabase.from('attachments').delete().eq('id', id)
    if (deleteError) throw new Error(`Failed to delete attachment: ${deleteError.message}`)
  },

  getAttachmentUrl,
}
