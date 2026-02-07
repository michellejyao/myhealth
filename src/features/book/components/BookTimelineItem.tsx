import type { HealthLog } from '../../../services/logService'
import { BODY_REGION_LABELS } from '../../../types'

interface BookTimelineItemProps {
  log: HealthLog
  onClick: () => void
}

export function BookTimelineItem({ log, onClick }: BookTimelineItemProps) {
  const date = log.date ? new Date(log.date) : null
  const regionLabel = log.body_region
    ? (BODY_REGION_LABELS as Record<string, string>)[log.body_region] ?? log.body_region
    : log.title
  const tags = log.symptom_tags?.length ? log.symptom_tags : log.body_parts ?? []
  const preview = (log.description || '').slice(0, 80)
  const painScore = log.severity ?? null

  return (
    <button
      type="button"
      onClick={onClick}
      className="
        w-full text-left p-3 rounded border border-black/10
        bg-white/80 hover:bg-white transition-colors
        book-timeline-item
      "
    >
      <div className="flex justify-between items-start gap-2">
        <span className="text-xs text-black/70 shrink-0">
          {date ? date.toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—'}
        </span>
        {painScore != null && (
          <span className="text-xs font-medium text-accent">
            Pain: {painScore}/10
          </span>
        )}
      </div>
      <p className="font-medium text-black mt-1">{regionLabel}</p>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {tags.slice(0, 5).map((t) => (
            <span
              key={t}
              className="text-xs bg-black/10 text-black/80 px-1.5 py-0.5 rounded"
            >
              {t}
            </span>
          ))}
        </div>
      )}
      {preview && (
        <p className="text-sm text-black/70 mt-1 line-clamp-2">{preview}</p>
      )}
    </button>
  )
}
