import { useRef, useEffect, useState, Suspense } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import type { Group, Mesh, MeshStandardMaterial, SkinnedMesh } from 'three'
import * as THREE from 'three'
import { type BodyRegionId } from './bodyRegions'
import { 
  detectBodyRegion, 
  type RegionDetectionResult,
  FALLBACK_CONFIDENCE_THRESHOLD 
} from './regionDetection'

interface AvatarModelProps {
  url: string
  /** Called with detection result (may need fallback if confidence is low) */
  onRegionDetected: (result: RegionDetectionResult, clickPoint: THREE.Vector3) => void
  highlightedRegion?: BodyRegionId | null
}

/**
 * Loads a Ready Player Me GLB avatar and enables region selection via raycast.
 * Uses multi-strategy detection: mesh name → position → nearest neighbor.
 */
function AvatarModelInner({ url, onRegionDetected, highlightedRegion }: AvatarModelProps) {
  const groupRef = useRef<Group>(null)
  const { scene } = useGLTF(url)
  const [clonedScene, setClonedScene] = useState<THREE.Group | null>(null)
  const originalMaterials = useRef<Map<string, MeshStandardMaterial>>(new Map())
  const highlightColor = new THREE.Color('#818cf8')
  const highlightEmissive = new THREE.Color('#4338ca')

  // Clone scene on load to avoid modifying the cached original
  useEffect(() => {
    const clone = scene.clone(true)
    
    // Store original materials and make them modifiable
    clone.traverse((child) => {
      if ((child as Mesh).isMesh || (child as SkinnedMesh).isSkinnedMesh) {
        const mesh = child as Mesh
        if (mesh.material) {
          const mat = (mesh.material as MeshStandardMaterial).clone()
          originalMaterials.current.set(mesh.uuid, mat.clone())
          mesh.material = mat
        }
      }
    })

    // Center and scale the avatar
    const box = new THREE.Box3().setFromObject(clone)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    
    // Scale to roughly 2 units tall
    const scale = 2 / size.y
    clone.scale.setScalar(scale)
    
    // Center horizontally and put feet at y=0
    clone.position.set(
      -center.x * scale,
      -box.min.y * scale,
      -center.z * scale
    )

    setClonedScene(clone)

    return () => {
      originalMaterials.current.clear()
    }
  }, [scene])

  // Update highlighting when region changes
  useEffect(() => {
    if (!clonedScene) return

    clonedScene.traverse((child) => {
      if ((child as Mesh).isMesh || (child as SkinnedMesh).isSkinnedMesh) {
        const mesh = child as Mesh
        const mat = mesh.material as MeshStandardMaterial
        if (!mat) return

        // Get mesh center position
        mesh.geometry.computeBoundingBox()
        const meshBox = mesh.geometry.boundingBox
        if (!meshBox) return

        const worldPos = new THREE.Vector3()
        meshBox.getCenter(worldPos)
        mesh.localToWorld(worldPos)

        // Use new detection system to determine region for highlighting
        const detection = detectBodyRegion(worldPos, mesh.name, mesh)

        if (detection.region === highlightedRegion && detection.confidence >= FALLBACK_CONFIDENCE_THRESHOLD) {
          mat.color = highlightColor
          mat.emissive = highlightEmissive
          mat.emissiveIntensity = 0.3
        } else {
          const original = originalMaterials.current.get(mesh.uuid)
          if (original) {
            mat.color.copy(original.color)
            mat.emissive.copy(original.emissive)
            mat.emissiveIntensity = original.emissiveIntensity
          }
        }
      }
    })
  }, [clonedScene, highlightedRegion])

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    const point = e.point.clone()
    const mesh = e.object as Mesh
    
    // Use multi-strategy detection
    const result = detectBodyRegion(point, mesh.name, mesh)
    
    // Always call back with result - parent decides whether to show fallback
    onRegionDetected(result, point)
  }

  // Idle animation - gentle breathing/sway
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.05
    }
  })

  if (!clonedScene) return null

  // Position to center the avatar vertically (avatar is 2 units tall, 0-2, so center at y=1)
  // Offset by -0.5 to align center with orbit target at y=0.5
  return (
    <group ref={groupRef} position={[0, -0.5, 0]}>
      <primitive object={clonedScene} onClick={handleClick} />
    </group>
  )
}

/**
 * Wrapped with Suspense for loading state.
 */
export function AvatarModel(props: AvatarModelProps) {
  return (
    <Suspense fallback={<LoadingPlaceholder />}>
      <AvatarModelInner {...props} />
    </Suspense>
  )
}

function LoadingPlaceholder() {
  const ref = useRef<Mesh>(null)

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime
    }
  })

  return (
    <mesh ref={ref} position={[0, 0, 0]}>
      <torusGeometry args={[0.3, 0.1, 16, 32]} />
      <meshStandardMaterial color="#818cf8" />
    </mesh>
  )
}

// Preload helper for Ready Player Me URLs
export function preloadAvatar(url: string) {
  useGLTF.preload(url)
}
