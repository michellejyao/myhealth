import { useState, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { BookPageLayout, BookSection } from '../components'
import { BookTimelineItem } from '../components/BookTimelineItem'
import { logService, type HealthLog } from '../../../services/logService'
import { BodyRegionLogPage } from './BodyRegionLogPage'
import type { BodyRegionId } from '../../../types'

export function BookTimelinePage() {
  const { user } = useAuth0()
  const userId = user?.sub ?? ''
  const [logs, setLogs] = useState<HealthLog[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<BodyRegionId | null>(null)

  useEffect(() => {
    if (!userId) return
    logService
      .fetchLogs(userId)
      .then(setLogs)
      .finally(() => setLoading(false))
  }, [userId])

  const handleEntryClick = (log: HealthLog) => {
    setSelectedLogId(log.id ?? null)
    const region = (log.body_region || log.body_parts?.[0] || 'head') as BodyRegionId
    setSelectedRegion(region)
  }

  const handleCloseLog = () => {
    setSelectedLogId(null)
    setSelectedRegion(null)
    if (userId) logService.fetchLogs(userId).then(setLogs)
  }

  if (selectedLogId && selectedRegion) {
    return (
      <BodyRegionLogPage
        bodyRegion={selectedRegion}
        logId={selectedLogId}
        onSaved={handleCloseLog}
        onCancel={handleCloseLog}
      />
    )
  }

  return (
    <BookPageLayout title="Timeline">
      <BookSection title="Chronological history">
        {loading ? (
          <p className="text-sm text-black/70">Loading…</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-black/70">No logs yet. Log symptoms from the body viewer.</p>
        ) : (
          <ul className="space-y-2 max-h-[60vh] overflow-y-auto">
            {logs.map((log) => (
              <li key={log.id}>
                <BookTimelineItem
                  log={log}
                  onClick={() => handleEntryClick(log)}
                />
              </li>
            ))}
          </ul>
        )}
      </BookSection>
    </BookPageLayout>
  )
}
