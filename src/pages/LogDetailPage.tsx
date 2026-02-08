import { useParams, Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { logService, HealthLog } from '../services/logService'
import { attachmentService } from '../services/attachmentService'
import { medicalImageAnalysisService } from '../services/medicalImageAnalysisService'
import type { AttachmentEntry, MedicalImageAnalysisResult, MedicalImageAnalysisEntry } from '../types'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { PageContainer } from '../components/PageContainer'

/**
 * PR-05: Log detail view. Loads log by id from Supabase and shows all fields.
 */
export function LogDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth0()
  const userId = user?.sub ?? ''
  const [log, setLog] = useState<HealthLog | null>(null)
  const [attachments, setAttachments] = useState<AttachmentEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analyzeImageOpen, setAnalyzeImageOpen] = useState(false)
  const [analyzingAttachmentId, setAnalyzingAttachmentId] = useState<string | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [currentResult, setCurrentResult] = useState<MedicalImageAnalysisResult | null>(null)
  const [currentAttachment, setCurrentAttachment] = useState<AttachmentEntry | null>(null)
  const [savedAnalyses, setSavedAnalyses] = useState<Record<string, MedicalImageAnalysisEntry>>({})
  const [logAnalyses, setLogAnalyses] = useState<MedicalImageAnalysisEntry[]>([])
  const [expandedAnalysisId, setExpandedAnalysisId] = useState<string | null>(null)

  useEffect(() => {
    async function loadLog() {
      if (!id) {
        setError('No log ID provided')
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        const [logData, attachmentsData, analysesData] = await Promise.all([
          logService.getLogById(id),
          attachmentService.getAttachmentsByLogId(id),
          medicalImageAnalysisService.getAnalysesByLogId(id),
        ])
        setLog(logData)
        setAttachments(attachmentsData)
        setLogAnalyses(analysesData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load log')
      } finally {
        setIsLoading(false)
      }
    }

    loadLog()
  }, [id])

  useEffect(() => {
    if (!id || !analyzeImageOpen) return
    medicalImageAnalysisService.getAnalysesByLogId(id).then((list) => {
      const byAttachment: Record<string, MedicalImageAnalysisEntry> = {}
      list.forEach((a) => { byAttachment[a.attachment_id] = a })
      setSavedAnalyses(byAttachment)
    }).catch(() => {})
  }, [id, analyzeImageOpen])

  const runAnalysisForAttachment = async (attachment: AttachmentEntry) => {
    if (!id || !userId) return
    const url = attachmentService.getAttachmentUrl(attachment)
    setAnalyzingAttachmentId(attachment.id)
    setAnalysisError(null)
    setCurrentResult(null)
    setCurrentAttachment(attachment)
    try {
      const result = await medicalImageAnalysisService.analyzeImageByUrl(url)
      const saved = await medicalImageAnalysisService.saveAnalysisResult(userId, id, attachment.id, result)
      setCurrentResult(result)
      setSavedAnalyses((prev) => ({ ...prev, [attachment.id]: saved }))
      setLogAnalyses((prev) => [saved, ...prev.filter((a) => a.attachment_id !== attachment.id)])
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setAnalyzingAttachmentId(null)
    }
  }

  const runAnalysisForFile = async (file: File) => {
    if (!id || !userId) return
    setAnalyzingAttachmentId('upload')
    setAnalysisError(null)
    setCurrentResult(null)
    setCurrentAttachment(null)
    try {
      const created = await attachmentService.uploadLogAttachment(userId, id, file)
      setAttachments((prev) => [...prev, created])
      const url = attachmentService.getAttachmentUrl(created)
      const result = await medicalImageAnalysisService.analyzeImageByUrl(url)
      const saved = await medicalImageAnalysisService.saveAnalysisResult(userId, id, created.id, result)
      setCurrentResult(result)
      setCurrentAttachment(created)
      setLogAnalyses((prev) => [saved, ...prev])
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setAnalyzingAttachmentId(null)
    }
  }

  const handleDelete = async () => {
    if (!id || !confirm('Are you sure you want to delete this log?')) return

    try {
      await logService.deleteLog(id)
      navigate('/logs')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete log')
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error || !log) {
    return (
      <PageContainer>
        <Link to="/logs" className="text-brand hover:text-slate-900 dark:hover:text-white font-medium mb-4 inline-block">
          ← Back to Logs
        </Link>
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg">
          {error || 'Log not found'}
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <Link to="/logs" className="text-brand hover:text-slate-900 dark:hover:text-white font-medium mb-4 inline-block">
        ← Back to Logs
      </Link>

      <div className="glass-card p-6">
        <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display">{log.title}</h1>
            <p className="text-slate-600 dark:text-white/70 mt-1">{log.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAnalyzeImageOpen(true)}
              className="px-3 py-1.5 text-sm text-black bg-accent hover:bg-accent/90 rounded-lg font-medium transition-colors"
            >
              Analyze Medical Image
            </button>
            <Link
              to={`/logs/${log.id}/edit`}
              className="px-3 py-1.5 text-sm text-black bg-brand hover:bg-brand/90 rounded-lg font-medium transition-colors"
            >
              Edit
            </Link>
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 text-sm text-white bg-red-500/90 hover:bg-red-500 rounded-lg font-medium transition-colors"
            >
              Delete
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-white/10">
          <div>
            <p className="text-sm font-semibold text-slate-600 dark:text-white/70">Date & Time</p>
            <p className="text-slate-800 dark:text-white/90">
              {new Date(log.date).toLocaleDateString()} at{' '}
              {new Date(log.date).toLocaleTimeString()}
            </p>
          </div>

          {log.severity && (
            <div>
              <p className="text-sm font-semibold text-slate-600 dark:text-white/70">Severity</p>
              <p className="text-slate-800 dark:text-white/90">{log.severity} / 10</p>
            </div>
          )}
        </div>

        {log.body_parts && log.body_parts.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/10">
            <p className="text-sm font-semibold text-slate-600 dark:text-white/70 mb-2">Body Parts / Tags</p>
            <div className="flex flex-wrap gap-2">
              {log.body_parts.map((part) => (
                <span
                  key={part}
                  className="inline-block text-sm bg-brand/20 text-brand px-3 py-1 rounded border border-brand/30"
                >
                  {part}
                </span>
              ))}
            </div>
          </div>
        )}

        {attachments.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-sm font-semibold text-white/70 mb-2">Attachments</p>
            <div className="flex flex-wrap gap-3">
              {attachments.map((a) => {
                const url = attachmentService.getAttachmentUrl(a)
                const isImage = a.type === 'image'
                return (
                  <div
                    key={a.id}
                    className="rounded-lg border border-white/20 bg-white/5 overflow-hidden"
                  >
                    {isImage ? (
                      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
                        <img
                          src={url}
                          alt={a.file_name || 'Attachment'}
                          className="h-24 w-auto max-w-[200px] object-cover"
                        />
                      </a>
                    ) : (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 text-white/90 hover:text-white"
                      >
                        <span>
                          {a.type === 'video' ? '🎬' : a.type === 'audio' ? '🎵' : '📄'}
                        </span>
                        <span className="text-sm truncate max-w-[160px]">
                          {a.file_name || a.type}
                        </span>
                      </a>
                    )}
                    {a.file_name && !isImage && (
                      <p className="px-2 pb-2 text-xs text-white/60 truncate max-w-[200px]">
                        {a.file_name}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {logAnalyses.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-sm font-semibold text-white/70 mb-2">Medical image analyses</p>
            <p className="text-xs text-white/50 mb-3">
              MONAI segmentation and findings stored for this record. Expand to revisit results.
            </p>
            <div className="space-y-3">
              {logAnalyses.map((analysis) => {
                const attachment = attachments.find((a) => a.id === analysis.attachment_id)
                const imageUrl = attachment ? attachmentService.getAttachmentUrl(attachment) : null
                const maskUrl = analysis.segmentation_storage_path
                  ? medicalImageAnalysisService.getSegmentationMaskUrl(analysis.segmentation_storage_path)
                  : null
                const isExpanded = expandedAnalysisId === analysis.id
                const findings = (analysis.findings || []) as Array<{ label?: string; confidence?: number; description?: string; region?: string }>
                const meta = analysis.meta || {}
                return (
                  <div
                    key={analysis.id}
                    className="rounded-lg border border-white/20 bg-white/5 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedAnalysisId(isExpanded ? null : analysis.id)}
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/5 transition-colors"
                    >
                      {attachment?.type === 'image' && imageUrl && (
                        <img
                          src={imageUrl}
                          alt=""
                          className="h-14 w-14 object-cover rounded border border-white/10"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white/90 truncate">
                          {attachment?.file_name || 'Image'} — analyzed {new Date(analysis.created_at).toLocaleString()}
                        </p>
                        <p className="text-xs text-white/50">
                          {analysis.segmentation_labels?.length ? `Labels: ${analysis.segmentation_labels.join(', ')}` : ''}
                          {findings.length > 0 && ` · ${findings.length} finding(s)`}
                        </p>
                      </div>
                      <span className="text-white/60 text-sm shrink-0">
                        {isExpanded ? '▼ Hide' : '▶ View results'}
                      </span>
                    </button>
                    {isExpanded && (
                      <div className="border-t border-white/10 p-4 space-y-4 bg-black/20">
                        {imageUrl && (
                          <div className="relative rounded-lg overflow-hidden border border-white/20 inline-block max-w-full">
                            <img
                              src={imageUrl}
                              alt="Original"
                              className="block max-h-64 w-auto object-contain"
                            />
                            {maskUrl && (
                              <img
                                src={maskUrl}
                                alt="Segmentation"
                                className="absolute inset-0 m-auto max-h-64 w-auto object-contain opacity-70 pointer-events-none"
                                style={{ mixBlendMode: 'multiply' }}
                              />
                            )}
                          </div>
                        )}
                        <p className="text-xs text-white/50">Segmentation overlay. Clinical correlation recommended.</p>
                        {analysis.segmentation_labels && analysis.segmentation_labels.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-white/60 uppercase tracking-wide mb-1">Segmentation labels</p>
                            <p className="text-sm text-white/80">{analysis.segmentation_labels.join(', ')}</p>
                          </div>
                        )}
                        {findings.length > 0 ? (
                          <div>
                            <p className="text-xs font-medium text-white/60 uppercase tracking-wide mb-2">Findings</p>
                            <ul className="space-y-2">
                              {findings.map((f, i) => (
                                <li key={i} className="text-sm text-white/90 bg-white/5 rounded-lg p-3 border border-white/10">
                                  <span className="font-medium">{f.label ?? 'Finding'}</span>
                                  {typeof f.confidence === 'number' && (
                                    <span className="text-white/60 ml-2">({Math.round(f.confidence * 100)}% confidence)</span>
                                  )}
                                  {f.description && <p className="mt-1 text-white/70 text-xs">{f.description}</p>}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <p className="text-sm text-white/60">No abnormalities reported. Not a clinical diagnosis.</p>
                        )}
                        {Object.keys(meta).length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-white/60 uppercase tracking-wide mb-2">Metadata (MONAI)</p>
                            <dl className="text-sm text-white/80 space-y-1 bg-white/5 rounded-lg p-3 border border-white/10">
                              {Object.entries(meta).map(([k, v]) => (
                                <div key={k} className="flex gap-2">
                                  <dt className="text-white/60 shrink-0">{k}:</dt>
                                  <dd className="break-all">
                                    {typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v)}
                                  </dd>
                                </div>
                              ))}
                            </dl>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-white/10 text-xs text-white/50">
          <p>Created: {new Date(log.created_at || '').toLocaleString()}</p>
          {log.updated_at && <p>Updated: {new Date(log.updated_at).toLocaleString()}</p>}
        </div>
      </div>

      {/* Analyze Medical Image modal */}
      {analyzeImageOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="analyze-image-title"
          onClick={() => setAnalyzeImageOpen(false)}
        >
          <div
            className="glass-card max-w-2xl w-full p-6 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="analyze-image-title" className="text-lg font-semibold text-white/90 mb-2">
              Analyze Medical Image
            </h2>
            <p className="text-sm text-white/70 mb-4">
              Upload or select an image to run MONAI segmentation and abnormality detection. Results are saved to this log.
            </p>

            {analysisError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/40 text-red-200 text-sm">
                {analysisError}
              </div>
            )}

            {analyzingAttachmentId && (
              <div className="mb-4 flex items-center gap-2 text-white/80">
                <LoadingSpinner />
                <span>Running analysis (segmentation + abnormality detection)…</span>
              </div>
            )}

            {currentResult && currentAttachment && (
              <div className="mb-6 space-y-4">
                <p className="text-sm font-medium text-white/80">Results</p>
                <div className="relative rounded-lg overflow-hidden border border-white/20 bg-black/40 inline-block max-w-full">
                  <img
                    src={attachmentService.getAttachmentUrl(currentAttachment)}
                    alt="Original"
                    className="block max-h-64 w-auto object-contain"
                  />
                  <img
                    src={`data:image/png;base64,${currentResult.segmentation_mask_b64}`}
                    alt="Segmentation"
                    className="absolute inset-0 m-auto max-h-64 w-auto object-contain opacity-70 pointer-events-none"
                    style={{ mixBlendMode: 'multiply' }}
                  />
                </div>
                <p className="text-xs text-white/50">Segmentation overlay (normal tissue / lesion). Clinical correlation recommended.</p>
                {currentResult.findings.length > 0 ? (
                  <div>
                    <p className="text-sm font-medium text-white/80 mb-2">Findings</p>
                    <ul className="space-y-2">
                      {currentResult.findings.map((f, i) => (
                        <li key={i} className="text-sm text-white/90 bg-white/5 rounded-lg p-3 border border-white/10">
                          <span className="font-medium">{f.label}</span>
                          <span className="text-white/60 ml-2">({Math.round((f.confidence ?? 0) * 100)}% confidence)</span>
                          {f.description && <p className="mt-1 text-white/70 text-xs">{f.description}</p>}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-white/60">No abnormalities reported. This is not a clinical diagnosis.</p>
                )}
              </div>
            )}

            {attachments.some((a) => a.type === 'image') && (
              <div className="space-y-2 mb-4">
                <p className="text-xs font-medium text-white/60 uppercase tracking-wide">Images on this log</p>
                <div className="flex flex-wrap gap-2">
                  {attachments
                    .filter((a) => a.type === 'image')
                    .map((a) => {
                      const url = attachmentService.getAttachmentUrl(a)
                      const saved = savedAnalyses[a.id]
                      const isAnalyzing = analyzingAttachmentId === a.id
                      return (
                        <button
                          key={a.id}
                          type="button"
                          disabled={!!analyzingAttachmentId}
                          className="rounded-lg border border-white/20 bg-white/5 overflow-hidden hover:border-brand focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
                          onClick={() => runAnalysisForAttachment(a)}
                        >
                          <img
                            src={url}
                            alt={a.file_name || 'Attachment'}
                            className="h-20 w-auto max-w-[140px] object-cover"
                          />
                          <p className="px-2 py-1 text-xs text-white/70 truncate max-w-[140px]">
                            {a.file_name || 'Image'}
                          </p>
                          {saved && <p className="px-2 pb-1 text-xs text-brand">Analyzed</p>}
                          {isAnalyzing && <p className="px-2 pb-1 text-xs text-accent">Analyzing…</p>}
                        </button>
                      )
                    })}
                </div>
              </div>
            )}

            <p className="text-xs text-white/50 mb-4">
              {attachments.some((a) => a.type === 'image')
                ? 'Click an image to analyze it, or upload a new image.'
                : 'Upload an image to analyze (e.g. MRI slice, X-ray).'}
            </p>
            <div className="flex gap-2 flex-wrap">
              <label className="cursor-pointer">
                <span className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-black bg-white/90 hover:bg-white rounded-lg border border-white/20 transition-colors">
                  {analyzingAttachmentId === 'upload' ? 'Uploading & analyzing…' : 'Upload & analyze…'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={!!analyzingAttachmentId}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) runAnalysisForFile(file)
                    e.target.value = ''
                  }}
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  setAnalyzeImageOpen(false)
                  setCurrentResult(null)
                  setCurrentAttachment(null)
                  setAnalysisError(null)
                }}
                className="px-3 py-2 text-sm font-medium text-white/80 hover:text-white border border-white/20 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
