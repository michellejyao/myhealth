// BookModel.tsx
import { useRef, useState, useMemo, useEffect, ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, RoundedBox, Environment, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Bookmark3D } from './Bookmark';

// ---------- Page Component ----------
interface PageProps {
  position: [number, number, number];
  rotation: [number, number, number];
  index: number;
  isOpen: boolean;
  flipDelay: number;
  totalPages: number;
  scale?: number;
  onRotationChange?: (index: number, rotationY: number) => void;
}

const Page = ({
  position,
  rotation,
  index,
  isOpen,
  flipDelay,
  totalPages,
  scale = 1,
  onRotationChange,
}: PageProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const targetRotation = useRef(0);
  const currentRotation = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const maxRotation = -Math.PI * 0.85;
    const delayFactor = flipDelay * index;

    targetRotation.current = isOpen
      ? maxRotation * Math.min(1, Math.max(0, (Date.now() / 1000 - delayFactor) * 2))
      : 0;

    const speed = 3;
    currentRotation.current += (targetRotation.current - currentRotation.current) * delta * speed;

    const flutter =
      isOpen && Math.abs(targetRotation.current - currentRotation.current) > 0.1
        ? Math.sin(Date.now() * 0.02 + index) * 0.02
        : 0;

    (groupRef.current.rotation as THREE.Euler).y = currentRotation.current + flutter;

    if (onRotationChange) onRotationChange(index, currentRotation.current);
  });

  const pageColor = useMemo(() => {
    const variation = (index / totalPages) * 0.05;
    return new THREE.Color().setHSL(0.1, 0.15, 0.92 - variation);
  }, [index, totalPages]);

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      <group position={[1.4 * scale, 0, 0]}>
        <mesh position={[0, 0, index * 0.003 * scale]} castShadow receiveShadow>
          <boxGeometry args={[2.8 * scale, 3.8 * scale, 0.002 * scale]} />
          <meshStandardMaterial color={pageColor} roughness={0.8} metalness={0} />
        </mesh>

        {[...Array(12)].map((_, i) => (
          <mesh
            key={i}
            position={[0.1 * scale, 1.5 * scale - i * 0.28 * scale, index * 0.003 * scale + 0.002 * scale]}
          >
            <boxGeometry args={[2.2 * scale, 0.02 * scale, 0.001 * scale]} />
            <meshStandardMaterial color="#d4cfc4" />
          </mesh>
        ))}
      </group>
    </group>
  );
};

// ---------- EndPage Component ----------

interface EndPageProps {
  position: [number, number, number];
  rotation: [number, number, number];
  scale?: number;
  children?: ReactNode;
}

export const EndPage = ({
  position,
  rotation,
  scale = 1,
  children,
}: EndPageProps) => {
  const pageWidth = 2.7 * scale;
  const pageHeight = 3.65 * scale;
  const pageThickness = 0.002 * scale;

  return (
    <group position={position} rotation={rotation}>
      {/* Physical page (slightly shorter for input area) */}
      <mesh
        position={[1.4 * scale, 0, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[pageWidth, pageHeight, pageThickness]} />
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.9}
          metalness={0}
        />
      </mesh>

      {/* Page content (HTML overlay) */}
      {children && (
        <Html
          transform
          occlude={false}
          distanceFactor={scale * 5}
          position={[1.4 * scale, -0.22 * scale, pageThickness + 0.001]}
          style={{
            width: `${pageWidth * 100}px`,
            height: `${pageHeight * 100}px`,
            padding: '14px',
            boxSizing: 'border-box',
            overflow: 'hidden',
            // pointerEvents removed to avoid raycast bug
          }}
        >
          {/* Inner wrapper for layout control */}
          <div
            style={{
              width: '100%',
              height: '100%',
              overflow: 'auto',
              borderRadius: 8,
            }}
          >
            {children}
          </div>
        </Html>
      )}
    </group>
  );
};


// ---------- BookCover Component ----------
interface BookCoverProps {
  isOpen: boolean;
  projectName: string;
  authorName: string;
  pagesClosed?: boolean;
  scale?: number;
}

const BookCover = ({ isOpen, projectName, authorName, pagesClosed = true, scale = 1 }: BookCoverProps) => {
  const frontCoverRef = useRef<THREE.Group>(null);
  const currentRotation = useRef(0);

  const leatherColor = new THREE.Color('#5c3d2e');
  const spineColor = new THREE.Color('#4a3020');

  useFrame((_, delta) => {
    if (!frontCoverRef.current) return;
    const targetRotation = isOpen ? -Math.PI : (pagesClosed ? 0 : currentRotation.current);
    const speed = 4;
    currentRotation.current += (targetRotation - currentRotation.current) * delta * speed;
    (frontCoverRef.current.rotation as THREE.Euler).y = currentRotation.current;
  });

  return (
    <group>
      {/* Back Cover */}
      <RoundedBox args={[3 * scale, 4 * scale, 0.15 * scale]} radius={0.02 * scale} position={[0, 0, -0.2 * scale]} castShadow receiveShadow>
        <meshStandardMaterial color={leatherColor} roughness={0.7} metalness={0.1} />
      </RoundedBox>

      {/* Spine */}
      <RoundedBox args={[0.3 * scale, 4 * scale, 0.5 * scale]} radius={0.05 * scale} position={[-1.65 * scale, 0, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={spineColor} roughness={0.6} metalness={0.1} />
      </RoundedBox>

      {/* Front Cover */}
      <group ref={frontCoverRef} position={[-1.5 * scale, 0, 0]}>
        <group position={[1.5 * scale, 0, 0]}>
          <RoundedBox args={[3 * scale, 4 * scale, 0.15 * scale]} radius={0.02 * scale} position={[0, 0, 0.2 * scale]} castShadow receiveShadow>
            <meshStandardMaterial color={leatherColor} roughness={0.7} metalness={0.1} />
          </RoundedBox>
          <Text
            position={[0, 0.3 * scale, 0.29 * scale]}
            fontSize={0.28 * scale}
            color="#c9a227"
            anchorX="center"
            anchorY="middle"
            maxWidth={2.5 * scale}
            textAlign="center"
          >
            {projectName}
          </Text>
          <Text
            position={[0, -0.3 * scale, 0.29 * scale]}
            fontSize={0.14 * scale}
            color="#a88b5a"
            anchorX="center"
            anchorY="middle"
            maxWidth={2 * scale}
            textAlign="center"
          >
            {authorName}
          </Text>
        </group>
      </group>
    </group>
  );
};

// ---------- Book3D Component ----------
interface Bookmark {
  label: string;
  component: ReactNode; // component to display when clicked
}

interface Book3DProps {
  isOpen: boolean;
  onToggle: () => void;
  projectName: string;
  authorName: string;
  scale?: number;
  bookmarks?: Bookmark[];
  /** When set, book opens and shows this content (e.g. body region log from body click). */
  openWithContent?: ReactNode;
}

const Book3D = ({
  isOpen,
  onToggle,
  projectName,
  authorName,
  scale = 1,
  bookmarks = [],
  openWithContent,
}: Book3DProps) => {
  const bookRef = useRef<THREE.Group>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedComponent, setSelectedComponent] = useState<ReactNode | null>(null);
  const [pageRotations, setPageRotations] = useState<number[]>([]);
  const pageCount = 8;

  const displayComponent = openWithContent ?? selectedComponent;

  useEffect(() => {
    if (openWithContent) {
      setSelectedComponent(openWithContent);
    }
  }, [openWithContent]);

  const handleRotationChange = (index: number, rotationY: number) => {
    setPageRotations((prev) => {
      const next = [...prev];
      next[index] = rotationY;
      return next;
    });
  };

  // Page flip animation
  useEffect(() => {
    if (isOpen && currentPage < pageCount) {
      const t = setTimeout(() => setCurrentPage((p) => p + 1), 150);
      return () => clearTimeout(t);
    }

    if (!isOpen && currentPage > 0) {
      const t = setTimeout(() => setCurrentPage((p) => p - 1), 150);
      return () => clearTimeout(t);
    }
  }, [isOpen, currentPage]);

  const handleBookmarkClick = (component: ReactNode) => {
    setSelectedComponent(component);
    setCurrentPage(0);
    if (!isOpen) onToggle();
  };

  return (
    <group
      ref={bookRef}
      onPointerDown={e => {
        console.log('Book3D group pointerDown', e);
      }}
      onClick={e => {
        console.log('Book3D group click', e);
      }}
    >
      {/* Book visuals ONLY */}
      <BookCover
        isOpen={isOpen}
        projectName={projectName}
        authorName={authorName}
        pagesClosed={pageRotations.every((r) => Math.abs(r || 0) < 0.01)}
        scale={scale}
      />

      {/* Pages */}
      {[...Array(pageCount)].map((_, i) => (
        <Page
          key={i}
          position={[-1.5 * scale, 0, 0.05 * scale + i * 0.01 * scale]}
          rotation={[0, 0, 0]}
          index={i}
          isOpen={i < currentPage}
          flipDelay={0}
          totalPages={pageCount}
          scale={scale}
          onRotationChange={handleRotationChange}
        />
      ))}

      {/* 🔖 BOOKMARKS (ONLY CLICKABLE OBJECTS) */}
      {/* End Page */}
      {displayComponent && currentPage >= pageCount && (
        <EndPage
          position={[-1.5 * scale, 0, 0.05 * scale + pageCount * 0.01 * scale]}
          rotation={[0, 0, 0]}
          scale={scale}
        >
          {displayComponent}
        </EndPage>
      )}

      {/* Bookmarks always rendered last for top z-order */}
      <group position={[0, 0.17 * scale, 0.25 * scale]}>
        {bookmarks.map((bm, i) => (
          <Bookmark3D
            key={i}
            label={bm.label}
            scale={scale * 1.2}
            position={[
              0.25 * scale,
              (1.0 - i * 0.5) * scale,
              0,
            ]}
            height={0.25 * scale}
            onClick={() => handleBookmarkClick(bm.component)}
          />
        ))}
      </group>

      {/* End Page duplicate for both sides - use displayComponent */}
      {displayComponent && currentPage >= pageCount && (
        <EndPage
          position={[-1.5 * scale, 0, 0.05 * scale + pageCount * 0.01 * scale]}
          rotation={[0, 0, 0]}
          scale={scale}
        >
          {displayComponent}
        </EndPage>
      )}
    </group>
  );
};


// ---------- Main BookModel Component ----------
export interface BookModelProps {
  projectName?: string;
  authorName?: string;
  className?: string;
  scale?: number;
  bookmarks?: Bookmark[];
  /** When set, book opens and shows this content (e.g. body region log). */
  openWithContent?: ReactNode;
  onClose?: () => void;
}

const BookModel = ({
  projectName = 'MyHealth',
  authorName = 'Personal Health Journal',
  className = '',
  scale = 1,
  bookmarks = [],
  openWithContent,
  onClose,
}: BookModelProps) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (openWithContent) setIsOpen(true);
  }, [openWithContent]);

  const handleToggle = () => {
    setIsOpen((prev) => {
      if (prev) onClose?.();
      return !prev;
    });
  };

  return (
    <div className={`relative w-full h-full min-h-[500px] ${className}`}>
      <Canvas
        camera={{ position: [0, 2, 6], fov: 45 }}
        onCreated={({ raycaster, camera }) => {
          raycaster.layers.set(1); // 👈 ONLY bookmarks receive clicks
          camera.layers.enable(1); // 👈 still visible
        }}
      >

        <color attach="background" args={['#1a1412']} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow shadow-mapSize={[2048, 2048]} />
        <pointLight position={[-5, 3, -5]} intensity={0.5} color="#ffcba4" />
        <spotLight position={[0, 8, 0]} intensity={0.8} angle={0.5} penumbra={0.5} color="#fff5e6" />

        <Book3D
          isOpen={isOpen}
          onToggle={handleToggle}
          projectName={projectName}
          authorName={authorName}
          scale={scale}
          bookmarks={bookmarks}
          openWithContent={openWithContent}
        />

        <Environment preset="apartment" />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <shadowMaterial opacity={0.3} />
        </mesh>
      </Canvas>
    </div>
  );
};

export default BookModel;
