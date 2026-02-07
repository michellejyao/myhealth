/**
 * Re-export body region types and constants from app types.
 */
export {
  BODY_REGIONS,
  BODY_REGION_LABELS,
  type BodyRegionId,
} from '../../types'

export const BODY_REGION_LIST = [
  { id: 'head' as const, label: 'Head' },
  { id: 'neck' as const, label: 'Neck' },
  { id: 'chest' as const, label: 'Chest' },
  { id: 'abdomen' as const, label: 'Abdomen' },
  { id: 'back' as const, label: 'Back' },
  { id: 'left_arm' as const, label: 'Left arm' },
  { id: 'right_arm' as const, label: 'Right arm' },
  { id: 'left_leg' as const, label: 'Left leg' },
  { id: 'right_leg' as const, label: 'Right leg' },
]

export type BodyRegionDef = (typeof BODY_REGION_LIST)[number]

export function getBodyRegionLabel(id: string): string {
  const labels: Record<string, string> = {
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
  return labels[id] ?? id
}

export function isBodyRegionId(id: string): id is import('../../types').BodyRegionId {
  return ['head', 'neck', 'chest', 'abdomen', 'back', 'left_arm', 'right_arm', 'left_leg', 'right_leg'].includes(id)
}
