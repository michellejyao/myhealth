/**
 * Re-export body region types from the body-viewer feature (single source of truth).
 */
export {
  BODY_REGIONS,
  BODY_REGION_LABELS,
  BODY_REGION_LIST,
  getBodyRegionLabel,
  isBodyRegionId,
  type BodyRegionId,
  type BodyRegionDef,
} from '../features/body-viewer/bodyRegions'

import type { BodyRegionId } from '../features/body-viewer/bodyRegions'

/**
 * Log entry (PR-03).
 */
export interface LogEntry {
  id: string
  datetime: string // ISO
  bodyRegion: BodyRegionId
  painScore: number // 0–10
  tags: string[]
  notes?: string
  createdAt: string
  updatedAt: string
}

/**
 * Attachment metadata (PR-04).
 */
export type AttachmentType = 'image' | 'video' | 'audio'

export interface LogAttachment {
  id: string
  logId: string
  type: AttachmentType
  url: string // blob URL or path
  caption?: string
  createdAt: string
}

/**
 * Health profile baseline (PR-09).
 */
export interface HealthProfile {
  id: 'default'
  allergies: string[]
  heightCm?: number
  weightKg?: number
  familyHistory: string
  lifestyle: {
    sleepHours?: number
    dietNotes?: string
    exerciseNotes?: string
  }
  updatedAt: string
}

/**
 * AI flag (PR-11, PR-12).
 */
export type FlagSeverity = 'low' | 'med' | 'high'

export interface LogFlag {
  id: string
  logId: string
  title: string
  reasoningSummary: string
  severity: FlagSeverity
  score?: number // 0–100 (PR-12)
  scoreRationale?: string
  references: string[] // log IDs or field names
  createdAt: string
}
