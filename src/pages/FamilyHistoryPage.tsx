import { useState, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import {
  FAMILY_RELATIONSHIPS,
  CONFIDENCE_LEVELS,
  type FamilyRelationship,
  type ConfidenceLevel,
} from '../types'
import type { FamilyHistoryEntry } from '../types'
import { familyHistoryService } from '../services/familyHistoryService'
import { PageContainer } from '../components/PageContainer'

const inputClass =
  'w-full rounded border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 px-3 py-2 text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-white/40 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand'

export function FamilyHistoryPage() {
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

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this family history entry?')) return
    try {
      await familyHistoryService.deleteFamilyHistoryEntry(id)
      setEntries((prev) => prev.filter((e) => e.id !== id))
    } catch {
      setError('Failed to delete entry')
    }
  }

  return (
    <PageContainer>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 font-display">Family History</h1>
      <p className="text-slate-600 dark:text-white/70 mb-6">
        Add health conditions that your relatives have. Records are saved to your family history.
      </p>

      <div className="glass-card p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Add condition</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-2 rounded bg-red-500/20 text-red-200 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="condition_name" className="block text-sm font-medium text-slate-700 dark:text-white/80 mb-1">
              Condition <span className="text-red-400">*</span>
            </label>
            <input
              id="condition_name"
              type="text"
              value={conditionName}
              onChange={(e) => setConditionName(e.target.value)}
              placeholder="e.g. Type 2 diabetes"
              className={inputClass}
              required
            />
          </div>

          <div>
            <label htmlFor="relationship" className="block text-sm font-medium text-slate-700 dark:text-white/80 mb-1">
              Relationship
            </label>
            <select
              id="relationship"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value as FamilyRelationship)}
              className={inputClass}
            >
              {FAMILY_RELATIONSHIPS.map((r) => (
                <option key={r} value={r} className="text-black">
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="age_of_onset" className="block text-sm font-medium text-slate-700 dark:text-white/80 mb-1">
              Age of onset <span className="text-slate-500 dark:text-white/60">(optional)</span>
            </label>
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
          </div>

          <div>
            <label htmlFor="confidence_level" className="block text-sm font-medium text-slate-700 dark:text-white/80 mb-1">
              Confidence
            </label>
            <select
              id="confidence_level"
              value={confidenceLevel}
              onChange={(e) => setConfidenceLevel(e.target.value as ConfidenceLevel)}
              className={inputClass}
            >
              {CONFIDENCE_LEVELS.map((c) => (
                <option key={c} value={c} className="text-black">
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-slate-700 dark:text-white/80 mb-1">
              Notes <span className="text-slate-500 dark:text-white/60">(optional)</span>
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional notes"
              className={inputClass + ' resize-none'}
            />
          </div>

          <button
            type="submit"
            disabled={saving || !conditionName.trim()}
            className="px-4 py-2 rounded-lg bg-brand text-white font-medium hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving…' : 'Save entry'}
          </button>
        </form>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Your recorded conditions</h2>
        {loading ? (
          <p className="text-sm text-slate-600 dark:text-white/70">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-white/70">No family history recorded yet. Add one above.</p>
        ) : (
          <ul className="space-y-2">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="flex items-start justify-between gap-4 p-3 rounded-lg border border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white"
              >
                <div className="min-w-0 flex-1">
                  <span className="font-medium">{entry.condition_name}</span>
                  {' — '}
                  <span className="capitalize">{entry.relationship}</span>
                  {entry.age_of_onset != null && ` (onset ${entry.age_of_onset})`}
                  {' — '}
                  <span className="text-slate-600 dark:text-white/70 capitalize">{entry.confidence_level.replace(' ', ' · ')}</span>
                  {entry.notes && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-white/60 line-clamp-2">{entry.notes}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(entry.id)}
                  className="shrink-0 px-2 py-1 text-xs text-red-300 hover:text-red-200 hover:bg-red-500/20 rounded transition-colors"
                  aria-label="Remove entry"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageContainer>
  )
}
