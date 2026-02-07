/**
 * Fixed set of body regions for logging (PR-01, PR-02).
 */
export const BODY_REGIONS = [
  'head',
  'neck',
  'chest',
  'abdomen',
  'back',
  'left_arm',
  'right_arm',
  'left_leg',
  'right_leg',
] as const

export type BodyRegionId = (typeof BODY_REGIONS)[number]

export const BODY_REGION_LABELS: Record<BodyRegionId, string> = {
  head: 'Head',
  neck: 'Neck',
  chest: 'Chest',
  abdomen: 'Abdomen',
  back: 'Back',
  left_arm: 'Left arm',
  right_arm: 'Right arm',
  left_leg: 'Left leg',
  right_leg: 'Right leg',
}

/** Pain type options for body region log. */
export const PAIN_TYPES = [
  'sharp', 'dull', 'throbbing', 'burning', 'aching',
  'numbness', 'tingling', 'stiffness', 'other',
] as const
export type PainType = (typeof PAIN_TYPES)[number]

/** Example symptom tags for body region log. */
export const SYMPTOM_TAG_OPTIONS = [
  'swelling', 'inflammation', 'weakness', 'fatigue', 'soreness',
] as const
export type SymptomTag = (typeof SYMPTOM_TAG_OPTIONS)[number]

/**
 * Log entry (PR-03). Book body region log shape for DB.
 */
export interface LogEntry {
  id: string
  datetime: string // ISO
  bodyRegion: BodyRegionId
  painScore: number // 0–10
  painType?: PainType
  tags: string[]
  notes?: string
  createdAt: string
  updatedAt: string
}

/** Family history relationship. */
export const FAMILY_RELATIONSHIPS = [
  'mother', 'father', 'grandmother', 'grandfather', 'sibling', 'other',
] as const
export type FamilyRelationship = (typeof FAMILY_RELATIONSHIPS)[number]

/** Confidence level for family history. */
export const CONFIDENCE_LEVELS = [
  'confirmed diagnosis', 'suspected', 'unknown',
] as const
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number]

export interface FamilyHistoryEntry {
  id: string
  user_id: string
  condition_name: string
  relationship: FamilyRelationship
  age_of_onset?: number
  notes?: string
  confidence_level: ConfidenceLevel
  created_at: string
  updated_at: string
}

/** Doctor specialty. */
export const SPECIALTIES = [
  'general practitioner', 'cardiologist', 'neurologist', 'orthopedist',
  'dermatologist', 'other',
] as const
export type Specialty = (typeof SPECIALTIES)[number]

export interface AppointmentEntry {
  id: string
  user_id: string
  appointment_date: string
  doctor_name: string
  specialty: Specialty
  reason_for_visit?: string
  diagnosis?: string
  doctor_notes?: string
  follow_up_required: boolean
  created_at: string
  updated_at: string
}

export type AttachmentTypeDb = 'image' | 'video' | 'audio' | 'document'

export interface AttachmentEntry {
  id: string
  user_id: string
  log_id?: string
  appointment_id?: string
  type: AttachmentTypeDb
  storage_path: string
  file_name?: string
  mime_type?: string
  created_at: string
  updated_at: string
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
