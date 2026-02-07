import { useRef, useMemo } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import type { Group, Mesh } from 'three'
import type { BodyRegionId } from '../../types'
import { BODY_REGIONS } from '../../types'

/**
 * Placeholder body: simple grouped meshes for each region (PR-01).
 * Each group has name = region id for raycast hit mapping (PR-02).
 */
interface BodyModelProps {
  onSelectRegion: (region: BodyRegionId) => void
  highlightedRegion?: BodyRegionId | null
}

export function BodyModel({ onSelectRegion, highlightedRegion }: BodyModelProps) {
  const groupRef = useRef<Group>(null)

  const regions = useMemo(() => BODY_REGIONS, [])

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    const name = (e.object as Mesh).name
    if (regions.includes(name as BodyRegionId)) {
      onSelectRegion(name as BodyRegionId)
    }
  }

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Simple humanoid placeholder: capsule for torso, spheres for head/limbs */}
      <group name="head" onPointerDown={onPointerDown}>
        <mesh position={[0, 1.2, 0]} name="head">
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshStandardMaterial
            color={highlightedRegion === 'head' ? '#818cf8' : '#94a3b8'}
            emissive={highlightedRegion === 'head' ? '#4338ca' : '#000'}
          />
        </mesh>
      </group>
      <group name="neck" onPointerDown={onPointerDown}>
        <mesh position={[0, 0.9, 0]} name="neck">
          <cylinderGeometry args={[0.08, 0.1, 0.2, 12]} />
          <meshStandardMaterial
            color={highlightedRegion === 'neck' ? '#818cf8' : '#94a3b8'}
            emissive={highlightedRegion === 'neck' ? '#4338ca' : '#000'}
          />
        </mesh>
      </group>
      <group name="chest" onPointerDown={onPointerDown}>
        <mesh position={[0, 0.5, 0]} name="chest">
          <cylinderGeometry args={[0.35, 0.4, 0.5, 12]} />
          <meshStandardMaterial
            color={highlightedRegion === 'chest' ? '#818cf8' : '#94a3b8'}
            emissive={highlightedRegion === 'chest' ? '#4338ca' : '#000'}
          />
        </mesh>
      </group>
      <group name="abdomen" onPointerDown={onPointerDown}>
        <mesh position={[0, 0, 0]} name="abdomen">
          <cylinderGeometry args={[0.38, 0.35, 0.4, 12]} />
          <meshStandardMaterial
            color={highlightedRegion === 'abdomen' ? '#818cf8' : '#94a3b8'}
            emissive={highlightedRegion === 'abdomen' ? '#4338ca' : '#000'}
          />
        </mesh>
      </group>
      <group name="back" onPointerDown={onPointerDown}>
        <mesh position={[0, 0.25, -0.2]} name="back">
          <boxGeometry args={[0.5, 0.7, 0.15]} />
          <meshStandardMaterial
            color={highlightedRegion === 'back' ? '#818cf8' : '#64748b'}
            emissive={highlightedRegion === 'back' ? '#4338ca' : '#000'}
          />
        </mesh>
      </group>
      <group name="left_arm" onPointerDown={onPointerDown}>
        <mesh position={[-0.5, 0.4, 0]} name="left_arm">
          <capsuleGeometry args={[0.06, 0.5, 4, 8]} />
          <meshStandardMaterial
            color={highlightedRegion === 'left_arm' ? '#818cf8' : '#94a3b8'}
            emissive={highlightedRegion === 'left_arm' ? '#4338ca' : '#000'}
          />
        </mesh>
      </group>
      <group name="right_arm" onPointerDown={onPointerDown}>
        <mesh position={[0.5, 0.4, 0]} name="right_arm">
          <capsuleGeometry args={[0.06, 0.5, 4, 8]} />
          <meshStandardMaterial
            color={highlightedRegion === 'right_arm' ? '#818cf8' : '#94a3b8'}
            emissive={highlightedRegion === 'right_arm' ? '#4338ca' : '#000'}
          />
        </mesh>
      </group>
      <group name="left_leg" onPointerDown={onPointerDown}>
        <mesh position={[-0.15, -0.65, 0]} name="left_leg">
          <capsuleGeometry args={[0.08, 0.6, 4, 8]} />
          <meshStandardMaterial
            color={highlightedRegion === 'left_leg' ? '#818cf8' : '#94a3b8'}
            emissive={highlightedRegion === 'left_leg' ? '#4338ca' : '#000'}
          />
        </mesh>
      </group>
      <group name="right_leg" onPointerDown={onPointerDown}>
        <mesh position={[0.15, -0.65, 0]} name="right_leg">
          <capsuleGeometry args={[0.08, 0.6, 4, 8]} />
          <meshStandardMaterial
            color={highlightedRegion === 'right_leg' ? '#818cf8' : '#94a3b8'}
            emissive={highlightedRegion === 'right_leg' ? '#4338ca' : '#000'}
          />
        </mesh>
      </group>
    </group>
  )
}
