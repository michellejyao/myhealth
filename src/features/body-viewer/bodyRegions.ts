/**
 * PR-01: Single source of truth for body region definitions.
 * Used by BodyModel, forms, and any region-related UI.
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

export interface BodyRegionDef {
  id: BodyRegionId
  label: string
}

export const BODY_REGION_LABELS: Record<BodyRegionId, string> = {
  head: 'Head',
  neck: 'Neck',
  chest: 'Chest',
  abdomen: 'Abdomen',
  back: 'Back',
  left_arm: 'Left Arm',
  right_arm: 'Right Arm',
  left_leg: 'Left Leg',
  right_leg: 'Right Leg',
}

/**
 * Array format with id + label for dropdowns / lists.
 */
export const BODY_REGION_LIST: BodyRegionDef[] = BODY_REGIONS.map((id) => ({
  id,
  label: BODY_REGION_LABELS[id],
}))

/**
 * Helper to get human-readable label from ID.
 */
export function getBodyRegionLabel(id: BodyRegionId): string {
  return BODY_REGION_LABELS[id]
}

/**
 * Type guard to check if a string is a valid BodyRegionId.
 */
export function isBodyRegionId(value: string): value is BodyRegionId {
  return BODY_REGIONS.includes(value as BodyRegionId)
}
