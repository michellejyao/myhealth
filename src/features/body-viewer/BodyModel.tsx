import { useRef, useMemo, useState } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { type Group, Mesh, Box3, Vector3, MeshNormalMaterial } from 'three'
import { useGLTF, useCursor } from '@react-three/drei'
import type { BodyRegionId } from '../../types'
import { BODY_REGIONS, type BodyRegionId as BodyRegion } from '../../types'
import { useEffect } from 'react'

const MODEL_PATH = '/basic_human_male.glb'

/**
 * Proxy mesh definition: position, size, and region id for each clickable body part.
 * Proxies use transparent materials so they're invisible but receive raycasts.
 */
const PROXY_REGIONS: Array<{
  id: BodyRegion
  position: [number, number, number]
  radius?: number
  height?: number
  type: 'sphere' | 'capsule'
}> = [
  { id: 'head', position: [0, 1.15, 0.02], radius: 0.12, type: 'sphere' },
  { id: 'neck', position: [0, 0.95, 0.02], radius: 0.06, height: 0.12, type: 'capsule' },
  { id: 'chest', position: [0, 0.72, 0.02], radius: 0.12, height: 0.2, type: 'capsule' },
  { id: 'abdomen', position: [0, 0.4, 0.02], radius: 0.11, height: 0.2, type: 'capsule' },
  { id: 'pelvis', position: [0, 0.1, 0.02], radius: 0.1, height: 0.15, type: 'capsule' },
  { id: 'back', position: [0, 0.5, -0.12], radius: 0.1, height: 0.5, type: 'capsule' },
  { id: 'left_shoulder', position: [-0.24, 0.88, 0.02], radius: 0.07, type: 'sphere' },
  { id: 'left_upper_arm', position: [-0.38, 0.65, 0.02], radius: 0.055, height: 0.22, type: 'capsule' },
  { id: 'left_forearm', position: [-0.48, 0.35, 0.02], radius: 0.045, height: 0.2, type: 'capsule' },
  { id: 'left_hand', position: [-0.5, 0.1, 0.02], radius: 0.05, type: 'sphere' },
  { id: 'right_shoulder', position: [0.24, 0.88, 0.02], radius: 0.07, type: 'sphere' },
  { id: 'right_upper_arm', position: [0.38, 0.65, 0.02], radius: 0.055, height: 0.22, type: 'capsule' },
  { id: 'right_forearm', position: [0.48, 0.35, 0.02], radius: 0.045, height: 0.2, type: 'capsule' },
  { id: 'right_hand', position: [0.5, 0.1, 0.02], radius: 0.05, type: 'sphere' },
  { id: 'left_upper_leg', position: [-0.1, -0.2, 0.02], radius: 0.07, height: 0.25, type: 'capsule' },
  { id: 'left_lower_leg', position: [-0.1, -0.48, 0.02], radius: 0.055, height: 0.25, type: 'capsule' },
  { id: 'left_foot', position: [-0.1, -0.72, -0.01], radius: 0.045, type: 'sphere' },
  { id: 'right_upper_leg', position: [0.1, -0.2, 0.02], radius: 0.07, height: 0.25, type: 'capsule' },
  { id: 'right_lower_leg', position: [0.1, -0.48, 0.02], radius: 0.055, height: 0.25, type: 'capsule' },
  { id: 'right_foot', position: [0.1, -0.72, -0.01], radius: 0.045, type: 'sphere' },
]

/**
 * GLB body model with ~20 invisible proxy meshes for clickable region detection.
 * Proxies are transparent; GLB meshes are excluded from raycasting so clicks hit proxies.
 */
interface BodyModelProps {
  onSelectRegion: (region: BodyRegionId) => void
  highlightedRegion?: BodyRegionId | null
  scaleMultiplier?: number
  absoluteScale?: number
  targetHeight?: number
  yOffset?: number
}

useGLTF.preload(MODEL_PATH, false, false)

export function BodyModel({
  onSelectRegion,
  highlightedRegion,
  scaleMultiplier = 1,
  absoluteScale,
  targetHeight,
  yOffset = 0,
}: BodyModelProps) {
  const groupRef = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)
  useCursor(hovered)
  const { scene } = useGLTF(MODEL_PATH, false, false) as { scene: Group }
  const showDebug =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('debug3d')

  const regions = useMemo(() => BODY_REGIONS, [])

  // Clone scene, disable raycasting on GLB meshes so clicks hit our proxies
  const displayScene = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((child) => {
      if (child instanceof Mesh) {
        child.raycast = () => {} // Exclude from raycast so proxies receive clicks
        child.castShadow = true
        child.receiveShadow = true
        child.frustumCulled = false
        if (showDebug) {
          // Force a visible material in debug to prove geometry is rendering
          child.material = new MeshNormalMaterial()
        }
      }
    })
    return clone
  }, [scene, showDebug])

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    const name = (e.object as Mesh).userData?.region as BodyRegionId | undefined
    if (name && regions.includes(name)) {
      onSelectRegion(name)
    }
  }

  const { centeredPosition, uniformScale, debugInfo, debugBoxSize } = useMemo(() => {
    const box = new Box3().setFromObject(displayScene)
    const size = new Vector3()
    const center = new Vector3()
    box.getSize(size)
    box.getCenter(center)
    // Fit model to ~1.6 units tall in the scene
    const baseTargetHeight = 1.2
    const height = Math.max(size.y, 0)
    // Guard against invalid or tiny bounds (can happen with some scans)
    let scale = 1
    if (height > 0.0001) {
      const heightTarget = typeof targetHeight === 'number' ? targetHeight : baseTargetHeight
      scale = heightTarget / height
    }
    // Clamp to avoid extreme scales that push the model out of view
    scale = Math.min(Math.max(scale * scaleMultiplier, 0.001), 100)
    if (typeof absoluteScale === 'number' && Number.isFinite(absoluteScale)) {
      scale = absoluteScale
    }
    return {
      centeredPosition: [
        -center.x * scale,
        -center.y * scale + yOffset,
        -center.z * scale,
      ] as [
        number,
        number,
        number,
      ],
      uniformScale: scale,
      debugInfo: {
        size: [size.x, size.y, size.z],
        center: [center.x, center.y, center.z],
        scale,
      },
      debugBoxSize: [size.x, size.y, size.z] as [number, number, number],
    }
  }, [displayScene, scaleMultiplier, absoluteScale, targetHeight, yOffset])

  useEffect(() => {
    if (!showDebug) return
    // Log once per recompute to help verify scaling/centering in debug
    console.log('[BodyModel] bounds', debugInfo)
  }, [showDebug, debugInfo])

  return (
    <group ref={groupRef} position={centeredPosition} scale={uniformScale}>
      {showDebug && <axesHelper args={[0.5]} />}
      {/* GLB model - visual only, raycast disabled */}
      <primitive object={displayScene} />
      {showDebug && (
        <mesh position={centeredPosition} scale={uniformScale}>
          <boxGeometry args={debugBoxSize} />
          <meshBasicMaterial color="#22c55e" wireframe />
        </mesh>
      )}

      {/* Invisible proxy meshes for click detection - in front (z offset) so they receive rays */}
      <group position={[0, 0, 0.03]}>
        {PROXY_REGIONS.map(({ id, position, radius = 0.05, height = 0.1, type }) => (
          <group key={id} position={position}>
            <mesh
              name={id}
              userData={{ region: id }}
              renderOrder={1}
              onPointerDown={onPointerDown}
              onPointerOver={() => setHovered(true)}
              onPointerOut={() => setHovered(false)}
            >
              {type === 'sphere' ? (
                <sphereGeometry args={[radius, 12, 12]} />
              ) : (
                <capsuleGeometry args={[radius, Math.max(0.01, height - radius * 2), 4, 8]} />
              )}
              <meshBasicMaterial
                color={highlightedRegion === id ? '#818cf8' : '#ef4444'}
                transparent
                opacity={highlightedRegion === id ? 0.35 : showDebug ? 0.35 : 0}
                depthWrite={false}
              />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}
