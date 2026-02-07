/**
 * Body region definitions and utilities.
 * Central source of truth for all body region identifiers.
 */

/**
 * Valid body region identifiers.
 */
export type BodyRegionId =
  | 'head'
  | 'neck'
  | 'chest'
  | 'back'
  | 'abdomen'
  | 'left_arm'
  | 'right_arm'
  | 'left_leg'
  | 'right_leg'

/**
 * Definition for a body region with metadata.
 */
export interface BodyRegionDef {
  id: BodyRegionId
  label: string
  description?: string
}

/**
 * Array of all valid body region IDs.
 */
export const BODY_REGIONS: BodyRegionId[] = [
  'head',
  'neck',
  'chest',
  'back',
  'abdomen',
  'left_arm',
  'right_arm',
  'left_leg',
  'right_leg',
]

/**
 * Human-readable labels for each body region.
 */
export const BODY_REGION_LABELS: Record<BodyRegionId, string> = {
  head: 'Head',
  neck: 'Neck',
  chest: 'Chest',
  back: 'Back',
  abdomen: 'Abdomen',
  left_arm: 'Left Arm',
  right_arm: 'Right Arm',
  left_leg: 'Left Leg',
  right_leg: 'Right Leg',
}

/**
 * List of body region definitions with full metadata.
 */
export const BODY_REGION_LIST: BodyRegionDef[] = BODY_REGIONS.map((id) => ({
  id,
  label: BODY_REGION_LABELS[id],
}))

/**
 * Get the human-readable label for a body region.
 */
export function getBodyRegionLabel(regionId: BodyRegionId): string {
  return BODY_REGION_LABELS[regionId]
}

/**
 * Type guard to check if a string is a valid BodyRegionId.
 */
export function isBodyRegionId(value: unknown): value is BodyRegionId {
  return typeof value === 'string' && BODY_REGIONS.includes(value as BodyRegionId)
}
