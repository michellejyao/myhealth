import { Text } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';
import { useEffect, useRef } from 'react';

type Bookmark3DProps = {
  label: string;
  position: [number, number, number];
  scale?: number;
  notchDepth?: number;
  shadowColor?: string;
  height?: number;
  onClick: () => void;
};

export const Bookmark3D = ({
  label,
  position,
  scale = 1,
  height,
  onClick,
}: Bookmark3DProps) => {
  void _notchDepth
  void _shadowColor
  const bookmarkHeight = height || 0.32 * scale;

  const ref = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.traverse((obj) => {
      obj.layers.set(1); // 👈 BOOKMARK LAYER
    });
  }, []);

  return (
    <group ref={ref} position={position} onClick={onClick}>
      {/* Main bookmark mesh only */}
      <mesh
        castShadow
        onPointerDown={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          console.log('Bookmark3D clicked:', label);
          onClick();
        }}
      >
        <boxGeometry args={[0.5 * scale, bookmarkHeight, 0.04 * scale]} />
        <meshStandardMaterial
          color="#f2c94c"
          roughness={0.45}
          metalness={0.15}
        />
      </mesh>
      {/* Label higher on bookmark */}
      <Text
        position={[0, 0.25 * bookmarkHeight, 0.031 * scale]}
        fontSize={0.06 * scale}
        color="#1a1a1a"
        anchorX="center"
        anchorY="middle"
        maxWidth={0.5 * scale}
        textAlign="center"
        depthOffset={-1}
      >
        {label}
      </Text>
    </group>
  );
};
