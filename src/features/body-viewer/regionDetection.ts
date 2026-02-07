import * as THREE from 'three'
import { type BodyRegionId, BODY_REGIONS, isBodyRegionId } from './bodyRegions'

/**
 * Result of region detection with confidence scoring.
 */
export interface RegionDetectionResult {
  region: BodyRegionId | null
  confidence: number // 0-1, where 1 is certain
  method: 'mesh_name' | 'position' | 'nearest' | 'fallback'
}

/**
 * Reference positions for each body region.
 * Calibrated for models centered around orbit target y=0.5.
 * Used for nearest-neighbor matching when other methods fail.
 */
const REGION_REFERENCE_POINTS: Record<BodyRegionId, THREE.Vector3> = {
  head: new THREE.Vector3(0, 0.95, 0),
  neck: new THREE.Vector3(0, 0.7, 0),
  chest: new THREE.Vector3(0, 0.35, 0.05),
  abdomen: new THREE.Vector3(0, -0.1, 0.05),
  back: new THREE.Vector3(0, 0.2, -0.15),
  left_arm: new THREE.Vector3(-0.4, 0.3, 0),
  right_arm: new THREE.Vector3(0.4, 0.3, 0),
  left_leg: new THREE.Vector3(-0.12, -0.7, 0),
  right_leg: new THREE.Vector3(0.12, -0.7, 0),
}

/**
 * Common mesh name patterns in various 3D models that map to body regions.
 * Supports Ready Player Me, Mixamo, and generic naming conventions.
 */
const MESH_NAME_PATTERNS: Array<{ pattern: RegExp; region: BodyRegionId }> = [
  // Head variations
  { pattern: /head|skull|cranium|face/i, region: 'head' },
  { pattern: /hair|eyebrow|eyelash|eye(?!_)|ear|nose|mouth|lip|teeth|tongue|jaw/i, region: 'head' },
  
  // Neck variations
  { pattern: /neck|throat/i, region: 'neck' },
  
  // Chest/upper torso
  { pattern: /chest|pector|breast|shoulder|clavicle|upper.?torso|upper.?body/i, region: 'chest' },
  { pattern: /^torso$|^body$/i, region: 'chest' }, // Generic torso defaults to chest
  
  // Abdomen/lower torso
  { pattern: /abdomen|belly|stomach|waist|hip|pelvis|lower.?torso|lower.?body/i, region: 'abdomen' },
  
  // Back
  { pattern: /back|spine|lumbar|thoracic/i, region: 'back' },
  
  // Arms - left
  { pattern: /left.?arm|l.?arm|arm.?l|left.?forearm|left.?bicep|left.?hand|left.?wrist|left.?elbow/i, region: 'left_arm' },
  { pattern: /left.?shoulder/i, region: 'left_arm' },
  
  // Arms - right
  { pattern: /right.?arm|r.?arm|arm.?r|right.?forearm|right.?bicep|right.?hand|right.?wrist|right.?elbow/i, region: 'right_arm' },
  { pattern: /right.?shoulder/i, region: 'right_arm' },
  
  // Legs - left
  { pattern: /left.?leg|l.?leg|leg.?l|left.?thigh|left.?calf|left.?foot|left.?ankle|left.?knee|left.?shin/i, region: 'left_leg' },
  
  // Legs - right
  { pattern: /right.?leg|r.?leg|leg.?r|right.?thigh|right.?calf|right.?foot|right.?ankle|right.?knee|right.?shin/i, region: 'right_leg' },
]

/**
 * Try to detect region from mesh name using pattern matching.
 * High confidence when mesh names follow standard conventions.
 */
function detectFromMeshName(meshName: string): RegionDetectionResult {
  // Direct match against region IDs
  const lowerName = meshName.toLowerCase()
  if (isBodyRegionId(lowerName)) {
    return { region: lowerName as BodyRegionId, confidence: 1.0, method: 'mesh_name' }
  }

  // Pattern matching
  for (const { pattern, region } of MESH_NAME_PATTERNS) {
    if (pattern.test(meshName)) {
      return { region, confidence: 0.9, method: 'mesh_name' }
    }
  }

  return { region: null, confidence: 0, method: 'mesh_name' }
}

/**
 * Position-based thresholds for region detection.
 * Calibrated for models centered around y=0.5 (orbit target):
 * - Placeholder model: roughly y=-0.9 to y=0.95
 * - Avatar model: roughly y=-0.5 to y=1.5
 */
interface PositionThreshold {
  region: BodyRegionId
  yMin: number
  yMax: number
  xMin?: number
  xMax?: number
  zMin?: number
  zMax?: number
  priority: number // Higher = checked first
}

const POSITION_THRESHOLDS: PositionThreshold[] = ([
  // Head (top of model) - highest priority
  { region: 'head', yMin: 0.8, yMax: 2.0, priority: 10 },
  
  // Neck (small band below head)
  { region: 'neck', yMin: 0.6, yMax: 0.8, priority: 9 },
  
  // Back (behind center line, mid-torso)
  { region: 'back', yMin: -0.3, yMax: 0.6, zMin: -0.5, zMax: -0.05, priority: 8 },
  
  // Arms (outside main body width)
  { region: 'left_arm', yMin: -0.2, yMax: 0.8, xMin: -1.0, xMax: -0.15, priority: 7 },
  { region: 'right_arm', yMin: -0.2, yMax: 0.8, xMin: 0.15, xMax: 1.0, priority: 7 },
  
  // Chest (upper torso, front)
  { region: 'chest', yMin: 0.15, yMax: 0.6, xMin: -0.2, xMax: 0.2, zMin: -0.05, zMax: 0.5, priority: 6 },
  
  // Abdomen (lower torso)
  { region: 'abdomen', yMin: -0.4, yMax: 0.15, xMin: -0.2, xMax: 0.2, priority: 5 },
  
  // Legs (bottom of model)
  { region: 'left_leg', yMin: -1.2, yMax: -0.4, xMin: -0.5, xMax: 0.0, priority: 4 },
  { region: 'right_leg', yMin: -1.2, yMax: -0.4, xMin: 0.0, xMax: 0.5, priority: 4 },
] as PositionThreshold[]).sort((a, b) => b.priority - a.priority)

/**
 * Detect region based on 3D position using threshold zones.
 * Moderate confidence - works for any humanoid model.
 */
function detectFromPosition(position: THREE.Vector3): RegionDetectionResult {
  const { x, y, z } = position

  for (const threshold of POSITION_THRESHOLDS) {
    const yInRange = y >= threshold.yMin && y <= threshold.yMax
    const xInRange = threshold.xMin === undefined || threshold.xMax === undefined ||
                     (x >= threshold.xMin && x <= threshold.xMax)
    const zInRange = threshold.zMin === undefined || threshold.zMax === undefined ||
                     (z >= threshold.zMin && z <= threshold.zMax)

    if (yInRange && xInRange && zInRange) {
      // Calculate confidence based on how centered the point is in the region
      const yCenter = (threshold.yMin + threshold.yMax) / 2
      const yRange = threshold.yMax - threshold.yMin
      const yConfidence = 1 - Math.abs(y - yCenter) / (yRange / 2) * 0.3

      return {
        region: threshold.region,
        confidence: Math.max(0.6, Math.min(0.85, yConfidence)),
        method: 'position',
      }
    }
  }

  return { region: null, confidence: 0, method: 'position' }
}

/**
 * Find nearest body region by distance to reference points.
 * Lower confidence fallback when other methods fail.
 */
function detectFromNearest(position: THREE.Vector3): RegionDetectionResult {
  let nearestRegion: BodyRegionId = 'chest' // Default
  let minDistance = Infinity

  for (const region of BODY_REGIONS) {
    const refPoint = REGION_REFERENCE_POINTS[region]
    const distance = position.distanceTo(refPoint)
    
    if (distance < minDistance) {
      minDistance = distance
      nearestRegion = region
    }
  }

  // Confidence decreases with distance (max ~1.5 units away for any reasonable click)
  const confidence = Math.max(0.3, Math.min(0.6, 1 - minDistance / 1.5))

  return {
    region: nearestRegion,
    confidence,
    method: 'nearest',
  }
}

/**
 * Main detection function combining all strategies.
 * Returns best result or triggers fallback.
 * 
 * @param hitPoint - World position where the click intersected the mesh
 * @param meshName - Name of the mesh that was hit (optional)
 * @param meshObject - The mesh object for additional context (optional)
 */
export function detectBodyRegion(
  hitPoint: THREE.Vector3,
  meshName?: string,
  meshObject?: THREE.Object3D | null
): RegionDetectionResult {
  // Strategy 1: Try mesh name first (highest confidence when available)
  if (meshName) {
    const nameResult = detectFromMeshName(meshName)
    if (nameResult.region && nameResult.confidence >= 0.8) {
      return nameResult
    }
  }

  // Strategy 2: Also check parent names (models often group by body part)
  if (meshObject?.parent?.name) {
    const parentResult = detectFromMeshName(meshObject.parent.name)
    if (parentResult.region && parentResult.confidence >= 0.8) {
      return { ...parentResult, confidence: parentResult.confidence * 0.95 }
    }
  }

  // Strategy 3: Position-based detection
  const positionResult = detectFromPosition(hitPoint)
  if (positionResult.region && positionResult.confidence >= 0.6) {
    return positionResult
  }

  // Strategy 4: Nearest neighbor fallback (always returns something)
  const nearestResult = detectFromNearest(hitPoint)
  
  // If position also had a guess, combine them
  if (positionResult.region) {
    if (positionResult.region === nearestResult.region) {
      // Agreement increases confidence
      return {
        region: positionResult.region,
        confidence: Math.min(0.8, positionResult.confidence + 0.15),
        method: 'position',
      }
    }
  }

  return nearestResult
}

/**
 * Confidence threshold below which we should show the fallback picker.
 */
export const FALLBACK_CONFIDENCE_THRESHOLD = 0.5

/**
 * Check if we should show fallback picker for a detection result.
 */
export function shouldShowFallback(result: RegionDetectionResult): boolean {
  return result.region === null || result.confidence < FALLBACK_CONFIDENCE_THRESHOLD
}
