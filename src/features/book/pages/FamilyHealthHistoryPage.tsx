import { useState, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import {
  BookPageLayout,
  BookSection,
  BookFormField,
  BookSaveButton,
} from '../components'
import {
  FAMILY_RELATIONSHIPS,
  CONFIDENCE_LEVELS,
  type FamilyRelationship,
  type ConfidenceLevel,
} from '../../../types'
import { familyHistoryService } from '../../../services/familyHistoryService'
import type { FamilyHistoryEntry } from '../../../types'

const inputClass =
  'w-full rounded border border-black/20 bg-white px-3 py-2 text-black text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent'

interface FamilyHealthHistoryPageProps {
  /** When true, only show recorded conditions (e.g. book bookmark); no add form. */
  recordedOnly?: boolean
}

export function FamilyHealthHistoryPage({ recordedOnly = false }: FamilyHealthHistoryPageProps) {
  const { user } = useAuth0()
  const userId = user?.sub ?? ''
  const [entries, setEntries] = useState<FamilyHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [conditionName, setConditionName] = useState('')
  const [relationship, setRelationship] = useState<FamilyRelationship>('mother')
  const [ageOfOnset, setAgeOfOnset] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [confidenceLevel, setConfidenceLevel] = useState<ConfidenceLevel>('suspected')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    familyHistoryService
      .fetchFamilyHistory(userId)
      .then(setEntries)
      .catch(() => setError('Failed to load family history'))
      .finally(() => setLoading(false))
  }, [userId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!conditionName.trim()) return
    setSaving(true)
    try {
      const created = await familyHistoryService.createFamilyHistoryEntry(userId, {
        condition_name: conditionName.trim(),
        relationship,
        age_of_onset: ageOfOnset ? parseInt(ageOfOnset, 10) : undefined,
        notes: notes.trim() || undefined,
        confidence_level: confidenceLevel,
      })
      setEntries((prev) => [created, ...prev])
      setConditionName('')
      setAgeOfOnset('')
      setNotes('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <BookPageLayout title="Family health history">
      {!recordedOnly && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-2 rounded bg-brand/20 text-accent text-sm">
              {error}
            </div>
          )}

          <BookSection title="Add condition">
            <BookFormField label="Condition" htmlFor="condition_name" required>
              <input
                id="condition_name"
                type="text"
                value={conditionName}
                onChange={(e) => setConditionName(e.target.value)}
                placeholder="e.g. Type 2 diabetes"
                className={inputClass}
              />
            </BookFormField>
            <BookFormField label="Relationship" htmlFor="relationship">
              <select
                id="relationship"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value as FamilyRelationship)}
                className={inputClass}
              >
                {FAMILY_RELATIONSHIPS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </BookFormField>
            <BookFormField label="Age of onset" htmlFor="age_of_onset" hint="Optional">
              <input
                id="age_of_onset"
                type="number"
                min={1}
                max={120}
                value={ageOfOnset}
                onChange={(e) => setAgeOfOnset(e.target.value)}
                placeholder="e.g. 45"
                className={inputClass}
              />
            </BookFormField>
            <BookFormField label="Confidence" htmlFor="confidence_level">
              <select
                id="confidence_level"
                value={confidenceLevel}
                onChange={(e) => setConfidenceLevel(e.target.value as ConfidenceLevel)}
                className={inputClass}
              >
                {CONFIDENCE_LEVELS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </BookFormField>
            <BookFormField label="Notes">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Optional notes"
                className={inputClass + ' resize-none'}
              />
            </BookFormField>
            <BookSaveButton type="submit" label="Save entry" saving={saving} />
          </BookSection>
        </form>
      )}

      <BookSection title="Recorded conditions">
        {loading ? (
          <p className="text-sm text-black/70">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-black/70">No family history recorded yet.</p>
        ) : (
          <ul className={`space-y-2 ${recordedOnly ? 'max-h-[60vh] overflow-y-auto' : ''}`}>
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="p-2 rounded border border-black/10 bg-white/80 text-sm text-black"
              >
                <span className="font-medium">{entry.condition_name}</span>
                {' — '}
                {entry.relationship}
                {entry.age_of_onset != null && ` (onset ${entry.age_of_onset})`}
                {' — '}
                <span className="text-black/70">{entry.confidence_level}</span>
                {entry.notes && (
                  <p className="mt-0.5 text-xs text-black/70 line-clamp-1">{entry.notes}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </BookSection>
    </BookPageLayout>
  )
}
