// BookModel.tsx
import { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, RoundedBox, Environment } from '@react-three/drei';
import * as THREE from 'three';

// ---------- Page Component ----------
interface PageProps {
  position: [number, number, number];
  rotation: [number, number, number];
  index: number;
  isOpen: boolean;
  flipDelay: number;
  totalPages: number;
  onRotationChange?: (index: number, rotationY: number) => void; // new
}

const Page = ({
  position,
  rotation,
  index,
  isOpen,
  flipDelay,
  totalPages,
  onRotationChange,
}: PageProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const targetRotation = useRef(0);
  const currentRotation = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const maxRotation = -Math.PI * 0.85;
    const delayFactor = flipDelay * index;

    if (isOpen) {
      targetRotation.current =
        maxRotation * Math.min(1, Math.max(0, (Date.now() / 1000 - delayFactor) * 2));
    } else {
      targetRotation.current = 0;
    }

    const speed = 3;
    currentRotation.current += (targetRotation.current - currentRotation.current) * delta * speed;

    // flutter
    const flutter =
      isOpen && Math.abs(targetRotation.current - currentRotation.current) > 0.1
        ? Math.sin(Date.now() * 0.02 + index) * 0.02
        : 0;

    (groupRef.current.rotation as THREE.Euler).y = currentRotation.current + flutter;

    if (onRotationChange) onRotationChange(index, currentRotation.current); // report rotation
  });

  const pageColor = useMemo(() => {
    const variation = (index / totalPages) * 0.05;
    return new THREE.Color().setHSL(0.1, 0.15, 0.92 - variation);
  }, [index, totalPages]);

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      <group position={[1.4, 0, 0]}>
        <mesh position={[0, 0, index * 0.003]} castShadow receiveShadow>
          <boxGeometry args={[2.8, 3.8, 0.002]} />
          <meshStandardMaterial color={pageColor} roughness={0.8} metalness={0} />
        </mesh>

        {[...Array(12)].map((_, i) => (
          <mesh key={i} position={[0.1, 1.5 - i * 0.28, index * 0.003 + 0.002]}>
            <boxGeometry args={[2.2, 0.02, 0.001]} />
            <meshStandardMaterial color="#d4cfc4" />
          </mesh>
        ))}
      </group>
    </group>
  );
};


// ---------- EndPage Component ----------
const EndPage = ({ position, rotation }: { position: [number, number, number]; rotation: [number, number, number] }) => {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[1.4, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.8, 3.8, 0.002]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} metalness={0} />
      </mesh>
      <Text
        position={[1.4, 0, 0.003]}
        fontSize={0.25}
        color="#333"
        anchorX="center"
        anchorY="middle"
      >
        The End
      </Text>
    </group>
  );
};


// ---------- Book Cover Component ----------
interface BookCoverProps {
  isOpen: boolean;
  projectName: string;
  authorName: string;
  pagesClosed?: boolean; // new prop to control closing
}
const BookCover = ({ isOpen, projectName, authorName, pagesClosed = true }: BookCoverProps) => {
  const frontCoverRef = useRef<THREE.Group>(null);
  const currentRotation = useRef(0);

  useFrame((_, delta) => {
    if (!frontCoverRef.current) return;

    // If opening, rotate immediately
    // If closing, only rotate back after pagesClosed is true
    const targetRotation = isOpen
      ? -Math.PI   // fully open
      : pagesClosed
      ? 0              // fully closed after pages closed
      : currentRotation.current; // freeze while pages are still closing

    const speed = 4;
    currentRotation.current += (targetRotation - currentRotation.current) * delta * speed;
    (frontCoverRef.current.rotation as THREE.Euler).y = currentRotation.current;
  });

  const leatherColor = new THREE.Color('#5c3d2e');
  const spineColor = new THREE.Color('#4a3020');
  const goldColor = new THREE.Color('#c9a227');

  return (
    <group>
      {/* Back Cover */}
      <RoundedBox args={[3, 4, 0.15]} radius={0.02} position={[0, 0, -0.2]} castShadow receiveShadow>
        <meshStandardMaterial color={leatherColor} roughness={0.7} metalness={0.1} />
      </RoundedBox>

      {/* Spine */}
      <RoundedBox args={[0.3, 4, 0.5]} radius={0.05} position={[-1.65, 0, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={spineColor} roughness={0.6} metalness={0.1} />
      </RoundedBox>

      {/* Spine decorations */}
      {[-1.2, -0.6, 0, 0.6, 1.2].map((y, i) => (
        <mesh key={i} position={[-1.65, y, 0.26]}>
          <boxGeometry args={[0.25, 0.03, 0.01]} />
          <meshStandardMaterial color={goldColor} roughness={0.2} metalness={0.8} />
        </mesh>
      ))}

      {/* Spine title */}
      <Text
        position={[-1.68, 0, 0.05]}
        rotation={[0, 0, -Math.PI / 2]}
        fontSize={0.18}
        color="#c9a227"
        anchorX="center"
        anchorY="middle"
      >
        {projectName}
      </Text>

      {/* Front Cover - always visible */}
      <group ref={frontCoverRef} position={[-1.5, 0, 0]}>
        <group position={[1.5, 0, 0]}>
          <RoundedBox args={[3, 4, 0.15]} radius={0.02} position={[0, 0, 0.2]} castShadow receiveShadow>
            <meshStandardMaterial color={leatherColor} roughness={0.7} metalness={0.1} />
          </RoundedBox>

          {/* Cover decorations */}
          <mesh position={[0, 0, 0.285]}>
            <ringGeometry args={[1.3, 1.35, 32]} />
            <meshStandardMaterial color={goldColor} roughness={0.2} metalness={0.8} />
          </mesh>
          <mesh position={[0, 0, 0.284]}>
            <ringGeometry args={[1.1, 1.15, 32]} />
            <meshStandardMaterial color={goldColor} roughness={0.2} metalness={0.8} />
          </mesh>

          <Text
            position={[0, 0.3, 0.29]}
            fontSize={0.28}
            color="#c9a227"
            anchorX="center"
            anchorY="middle"
            maxWidth={2.5}
            textAlign="center"
          >
            {projectName}
          </Text>

          <Text
            position={[0, -0.3, 0.29]}
            fontSize={0.14}
            color="#a88b5a"
            anchorX="center"
            anchorY="middle"
            maxWidth={2}
            textAlign="center"
          >
            {authorName}
          </Text>

          {[
            [1.2, 1.7],
            [-1.2, 1.7],
            [1.2, -1.7],
            [-1.2, -1.7],
          ].map(([x, y], i) => (
            <mesh key={i} position={[x, y, 0.285]}>
              <circleGeometry args={[0.08, 16]} />
              <meshStandardMaterial color={goldColor} metalness={0.8} roughness={0.2} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
};



// ---------- Book 3D Component ----------
interface Book3DProps {
  isOpen: boolean;
  onToggle: () => void;
  projectName: string;
  authorName: string;
}
const Book3D = ({ isOpen, onToggle, projectName, authorName }: Book3DProps) => {
  const bookRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageRotations, setPageRotations] = useState<number[]>([]); // new
  const pageCount = 8;

  const handleRotationChange = (index: number, rotationY: number) => {
    setPageRotations((prev) => {
      const newArr = [...prev];
      newArr[index] = rotationY;
      return newArr;
    });
  };

  // Float + tilt
  useFrame((_, delta) => {
    if (!bookRef.current) return;
    bookRef.current.position.y = Math.sin(Date.now() * 0.001) * 0.05;
    const targetRotX = hovered ? -0.1 : 0;
    bookRef.current.rotation.x += (targetRotX - bookRef.current.rotation.x) * delta * 3;
  });

  // Sequential page flip
  useEffect(() => {
    if (isOpen && currentPage < pageCount) {
      const timer = setTimeout(() => setCurrentPage(currentPage + 1), 150);
      return () => clearTimeout(timer);
    }
    if (!isOpen && currentPage > 0) {
      const timer = setTimeout(() => setCurrentPage(currentPage - 1), 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentPage]);

  // Check if all pages are fully closed (rotation near 0)
  const pagesClosed = pageRotations.every((rot) => Math.abs(rot || 0) < 0.01);

  return (
    <group
      ref={bookRef}
      onClick={onToggle}
      onPointerOver={() => {
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
    >
      <BookCover
        isOpen={isOpen}
        projectName={projectName}
        authorName={authorName}
        pagesClosed={pagesClosed} // only allow cover to close after pages fully closed
      />

      {[...Array(pageCount)].map((_, i) => (
        <Page
          key={i}
          position={[-1.5, 0, 0.05 + i * 0.01]}
          rotation={[0, 0, 0]}
          index={i}
          isOpen={i < currentPage}
          flipDelay={0}
          totalPages={pageCount}
          onRotationChange={handleRotationChange} // track rotations
        />
      ))}

      {isOpen && currentPage >= pageCount && (
        <EndPage position={[-1.5, 0, 0.05 + pageCount * 0.01]} rotation={[0, 0, 0]} />
      )}
    </group>
  );
};



// ---------- Main BookModel Component ----------
export interface BookModelProps {
  projectName?: string;
  authorName?: string;
  className?: string;
}

const BookModel = ({
  projectName = 'MyHealth',
  authorName = 'Personal Health Journal',
  className = '',
}: BookModelProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative w-full h-full min-h-[500px] ${className}`}>
      <Canvas shadows camera={{ position: [0, 2, 6], fov: 45 }} gl={{ antialias: true }}>
        <color attach="background" args={['#1a1412']} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow shadow-mapSize={[2048, 2048]} />
        <pointLight position={[-5, 3, -5]} intensity={0.5} color="#ffcba4" />
        <spotLight position={[0, 8, 0]} intensity={0.8} angle={0.5} penumbra={0.5} color="#fff5e6" />

        <Book3D
          isOpen={isOpen}
          onToggle={() => setIsOpen(!isOpen)}
          projectName={projectName}
          authorName={authorName}
        />

        <Environment preset="apartment" />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <shadowMaterial opacity={0.3} />
        </mesh>
      </Canvas>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-book-gold/70 text-sm font-serif pointer-events-none">
        {isOpen ? 'Click to close' : 'Click to open'}
      </div>
    </div>
  );
};

export default BookModel;
