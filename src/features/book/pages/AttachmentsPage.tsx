import { useState, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { BookPageLayout, BookSection } from '../components'
import { BookAttachmentViewer } from '../components/BookAttachmentViewer'
import { supabase } from '../../../lib/supabase'
import type { AttachmentEntry } from '../../../types'

export function AttachmentsPage() {
  const { user } = useAuth0()
  const userId = user?.sub ?? ''
  const [attachments, setAttachments] = useState<AttachmentEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<AttachmentEntry | null>(null)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    const run = async () => {
      const { data, error } = await supabase
        .from('attachments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (!cancelled && !error) setAttachments(data ?? [])
      if (!cancelled) setLoading(false)
    }
    run()
    return () => { cancelled = true }
  }, [userId])

  if (selected) {
    return (
      <BookPageLayout title="Attachment">
        <BookAttachmentViewer attachment={selected} onClose={() => setSelected(null)} />
      </BookPageLayout>
    )
  }

  const byType = (type: string) => attachments.filter((a) => a.type === type)
  const images = byType('image')
  const videos = byType('video')
  const audio = byType('audio')
  const documents = byType('document')

  return (
    <BookPageLayout title="Attachments">
      {loading ? (
        <p className="text-sm text-[#6b6358]">Loading…</p>
      ) : attachments.length === 0 ? (
        <p className="text-sm text-[#6b6358]">
          No attachments yet. Add images or files from symptom logs or appointments.
        </p>
      ) : (
        <div className="grid gap-4">
          {images.length > 0 && (
            <BookSection title="Images">
              <div className="grid grid-cols-3 gap-2">
                {images.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelected(a)}
                    className="aspect-square rounded border border-[#e0d9cc] bg-white/80 overflow-hidden hover:ring-2 ring-[#5c4a3a]"
                  >
                    {a.storage_path ? (
                      <img
                        src={a.storage_path}
                        alt={a.file_name || 'Image'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="flex items-center justify-center h-full text-2xl">🖼️</span>
                    )}
                  </button>
                ))}
              </div>
            </BookSection>
          )}
          {videos.length > 0 && (
            <BookSection title="Videos">
              <div className="flex flex-wrap gap-2">
                {videos.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelected(a)}
                    className="p-3 rounded border border-[#e0d9cc] bg-white/80 text-sm hover:bg-[#faf8f5]"
                  >
                    🎬 {a.file_name || 'Video'}
                  </button>
                ))}
              </div>
            </BookSection>
          )}
          {audio.length > 0 && (
            <BookSection title="Audio">
              <div className="flex flex-wrap gap-2">
                {audio.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelected(a)}
                    className="p-3 rounded border border-[#e0d9cc] bg-white/80 text-sm hover:bg-[#faf8f5]"
                  >
                    🎵 {a.file_name || 'Audio'}
                  </button>
                ))}
              </div>
            </BookSection>
          )}
          {documents.length > 0 && (
            <BookSection title="Documents">
              <div className="flex flex-wrap gap-2">
                {documents.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelected(a)}
                    className="p-3 rounded border border-[#e0d9cc] bg-white/80 text-sm hover:bg-[#faf8f5]"
                  >
                    📄 {a.file_name || 'Document'}
                  </button>
                ))}
              </div>
            </BookSection>
          )}
        </div>
      )}
    </BookPageLayout>
  )
}
