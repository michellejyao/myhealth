import { useRef, useMemo, useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { type Group, Mesh, MeshStandardMaterial, Box3, Vector3, Color, BufferAttribute, MathUtils } from "three";
import { useGLTF, useCursor } from "@react-three/drei";
import type { BodyRegionId } from "../../types";
import { BODY_REGIONS, type BodyRegionId as BodyRegion } from "../../types";

const MODEL_PATH = "/male_base_3d_model.glb";
const LOCKED_MODEL_SCALE = 0.02;

const PROXY_REGIONS: Array<{
  id: BodyRegion;
  position: [number, number, number];
  rotation?: [number, number, number];
  radius?: number;
  height?: number;
  type: "sphere" | "capsule";
}> = [
  { id: "head", position: [82, 0, 0.02], radius: 0.12, type: "sphere" },
  { id: "neck", position: [76, 0, 0.02], radius: 0.04, height: 0.2, type: "capsule" },
  { id: "chest", position: [67, 0, 0.1], radius: 0.2, height: 0.2, type: "capsule" },
  { id: "abdomen", position: [55, 0, 0.02], radius: 0.15, height: 0.2, type: "capsule" },
  { id: "pelvis", position: [47, 0, 0.02], radius: 0.07, height: 0.33, type: "capsule" },
  { id: "back", position: [67, 0, -1], radius: 0.2, height: 0.2, type: "capsule" },
  { id: "left_shoulder", position: [69, 10, 0.02], radius: 0.09, type: "sphere" },
  { id: "left_upper_arm", position: [64, 14, 0.02], rotation: [0, 0, Math.PI / 4], radius: 0.055, height: 0.22, type: "capsule" },
  { id: "left_forearm", position: [58, 21, 3], rotation: [0, 0, Math.PI / 5], radius: 0.045, height: 0.25, type: "capsule" },
  { id: "left_hand", position: [52, 25, 15], radius: 0.07, type: "sphere" },
  { id: "right_shoulder", position: [69, -10, 0.02], radius: 0.09, type: "sphere" },
  { id: "right_upper_arm", position: [64, -14, 0.02], rotation: [0, 0, -Math.PI / 4], radius: 0.055, height: 0.22, type: "capsule" },
  { id: "right_forearm", position: [58, -21, 3], rotation: [0, 0, -Math.PI/5], radius: 0.045, height: 0.25, type: "capsule" },
  { id: "right_hand", position: [52, -25, 15], radius: 0.07, type: "sphere" },
  { id: "left_upper_leg", position: [34, 6, 0.02], rotation: [0, 0, Math.PI/2.3], radius: 0.07, height: 0.5, type: "capsule" },
  { id: "left_lower_leg", position: [15, 9, 0.02], rotation: [0, 0, Math.PI/2.2], radius: 0.055, height: 0.45, type: "capsule" },
  { id: "left_foot", position: [2, 10, -0.01], radius: 0.08, type: "sphere" },
  { id: "right_upper_leg", position: [34, -6, 0.02], rotation: [0, 0, -Math.PI/2.3], radius: 0.07, height: 0.5, type: "capsule" },
  { id: "right_lower_leg", position: [15, -9, 0.02], rotation: [0, 0, -Math.PI/2.2], radius: 0.055, height: 0.45, type: "capsule" },
  { id: "right_foot", position: [2, -10, -0.01], radius: 0.08, type: "sphere" },
];

const NORMALIZED_CENTERS: Record<BodyRegionId, Vector3> = {
  head: new Vector3(0.5, 1.1, 0.5),
  neck: new Vector3(0.5, 0.75, 0.5),
  chest: new Vector3(0.5, 0.8, 0.5),
  back: new Vector3(0.5, 0.75, 0),
  abdomen: new Vector3(0.5, 0.6, 0.5),
  pelvis: new Vector3(0.5, 0.5, 0.5),
  left_shoulder: new Vector3(0.25, 0.65, 0.5),
  left_upper_arm: new Vector3(0.22, 0.58, 0.5),
  left_forearm: new Vector3(0.2, 0.5, 0.5),
  left_hand: new Vector3(0.18, 0.45, 0.5),
  right_shoulder: new Vector3(0.75, 0.65, 0.5),
  right_upper_arm: new Vector3(0.78, 0.58, 0.5),
  right_forearm: new Vector3(0.8, 0.5, 0.5),
  right_hand: new Vector3(0.82, 0.45, 0.5),
  left_upper_leg: new Vector3(0.45, 0.28, 0.5),
  left_lower_leg: new Vector3(0.45, 0.16, 0.5),
  left_foot: new Vector3(0.45, 0.05, 0.5),
  right_upper_leg: new Vector3(0.55, 0.28, 0.5),
  right_lower_leg: new Vector3(0.75, 0.5, 0.2),
  right_foot: new Vector3(0.55, 0.05, 0.5),
};

interface BodyModelProps {
  onSelectRegion: (region: BodyRegionId) => void;
  highlightedRegion?: BodyRegionId | null;
  yOffset?: number;           // world units
  rotation?: [number, number, number];

  proxyScale?: number;        // default 50
  proxyZOffset?: number;      // default 0.5
  heatmapRegionCounts?: Partial<Record<BodyRegionId, number>>;
  heatmapRegionColors?: Partial<Record<BodyRegionId, string>>;
  highlightedHeatmapRegion?: BodyRegionId | null;
  lowIntensityBlend?: number; // 0=neutral, 1=green
}

useGLTF.preload(MODEL_PATH);

export function BodyModel({
  onSelectRegion,
  highlightedRegion,
  yOffset = 0,
  rotation,
  proxyScale = 50,
  proxyZOffset = 0.5,
  heatmapRegionCounts,
  heatmapRegionColors,
  highlightedHeatmapRegion,
  lowIntensityBlend = 0,
}: BodyModelProps) {
  const groupRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  
  // Track pointer down position to prevent accidental clicks
  const pointerDownRef = useRef<{ region: BodyRegionId | null; x: number; y: number } | null>(null);

  const { scene } = useGLTF(MODEL_PATH) as { scene: Group };

  const regionSet = useMemo(() => new Set(BODY_REGIONS), []);
  const maxHeatmapCount = useMemo(() => {
    if (!heatmapRegionCounts) return 0;
    let max = 0;
    for (const count of Object.values(heatmapRegionCounts)) {
      if (typeof count === "number" && count > max) max = count;
    }
    return max;
  }, [heatmapRegionCounts]);

  const HEATMAP_RADIUS = 0.25;

  const applyVertexHeatmap = (
    mesh: Mesh,
    centers: Array<{ pos: Vector3; weight: number; radius?: number; color: Color }>,
    boxMin: Vector3,
    boxSize: Vector3,
    lowColor: Color
  ) => {
    const geo = mesh.geometry;
    if (!geo) return;
    const pos = geo.getAttribute("position");
    if (!pos) return;

    let colorAttr = geo.getAttribute("color") as BufferAttribute | null;
    if (!colorAttr) {
      const colors = new Float32Array(pos.count * 3);
      colorAttr = new BufferAttribute(colors, 3);
      geo.setAttribute("color", colorAttr);
    }

    const v = new Vector3();
    const n = new Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos as BufferAttribute, i);
      v.applyMatrix4(mesh.matrixWorld);
      n.set(
        boxSize.x > 0 ? (v.x - boxMin.x) / boxSize.x : 0.5,
        boxSize.y > 0 ? (v.y - boxMin.y) / boxSize.y : 0.5,
        boxSize.z > 0 ? (v.z - boxMin.z) / boxSize.z : 0.5
      );

      let intensity = 0;
      let bestColor = lowColor;
      for (const center of centers) {
        const radius = center.radius ?? HEATMAP_RADIUS;
        const d = n.distanceTo(center.pos);
        const inner = radius * 0.6; // core radius (no fade)
        let smooth = 0;
        if (d <= inner) {
          smooth = 1;
        } else if (d < radius) {
          const edgeT = (radius - d) / (radius - inner);
          smooth = edgeT * edgeT * (3 - 2 * edgeT); // smoothstep only on edge
        }
        const contribution = smooth * center.weight;
        if (contribution > intensity) {
          intensity = contribution;
          bestColor = center.color;
        }
      }

      if (intensity <= 0) {
        colorAttr.setXYZ(i, lowColor.r, lowColor.g, lowColor.b);
      } else { 
        const clamped = MathUtils.clamp(intensity, 0, 1);
        const mix = Math.pow(clamped, 1.4); // less fade at low intensity
        const c = lowColor.clone().lerp(bestColor, mix);
        colorAttr.setXYZ(i, c.r, c.g, c.b);
      }
    }

    colorAttr.needsUpdate = true;

    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map((mat) => {
        const next = mat.clone();
        next.vertexColors = true;
        next.needsUpdate = true;
        return next;
      });
    } else if (mesh.material) {
      const next = mesh.material.clone();
      next.vertexColors = true;
      next.needsUpdate = true;
      mesh.material = next;
    }
  };

  // Visual scene: clone + disable raycast so proxies get clicks
  const displayScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.updateMatrixWorld(true);

    const modelBox = new Box3().setFromObject(clone);
    const boxSize = new Vector3();
    const boxMin = modelBox.min.clone();
    modelBox.getSize(boxSize);

    const heatCenters: Array<{ pos: Vector3; weight: number; radius?: number; color: Color }> = [];

    if (heatmapRegionCounts) {
      const denom = maxHeatmapCount > 0 ? maxHeatmapCount : 1;
      for (const [region, count] of Object.entries(heatmapRegionCounts)) {
        if (!count) continue;
        const pos = NORMALIZED_CENTERS[region as BodyRegionId];
        if (pos) {
          const colorHex = heatmapRegionColors?.[region as BodyRegionId] ?? "#ef4444";
          heatCenters.push({
            pos,
            weight: MathUtils.clamp(count / denom, 0, 1),
            color: new Color(colorHex),
            radius:
              region === "back"
                ? HEATMAP_RADIUS * 0.5
                : region === "chest"
                  ? HEATMAP_RADIUS * 0.5
                : region === "neck"
                  ? HEATMAP_RADIUS * 0.3
                : region === "left_upper_arm"
                  ? HEATMAP_RADIUS * 0.6
                : region === "right_upper_arm"
                  ? HEATMAP_RADIUS * 0.6
                : region === "abdomen"
                  ? HEATMAP_RADIUS * 0.6
                : region === "pelvis"
                  ? HEATMAP_RADIUS * 0.5
                : HEATMAP_RADIUS,
          });
        }
      }
    }
    if (highlightedHeatmapRegion) {
      const pos = NORMALIZED_CENTERS[highlightedHeatmapRegion];
      if (pos) {
        const colorHex = heatmapRegionColors?.[highlightedHeatmapRegion] ?? "#ef4444";
        heatCenters.push({
          pos,
          weight: 1,
          color: new Color(colorHex),
          radius:
            highlightedHeatmapRegion === "back"
              ? HEATMAP_RADIUS * 0.5
              : highlightedHeatmapRegion === "chest"
                ? HEATMAP_RADIUS * 0.4
              : highlightedHeatmapRegion === "neck"
                ? HEATMAP_RADIUS * 0.3
              : highlightedHeatmapRegion === "left_upper_arm"
                ? HEATMAP_RADIUS * 0.6
              : highlightedHeatmapRegion === "abdomen"
                ? HEATMAP_RADIUS * 0.6
              : highlightedHeatmapRegion === "pelvis"
                ? HEATMAP_RADIUS * 0.3
              : highlightedHeatmapRegion === "left_shoulder"
                ? HEATMAP_RADIUS * 0.3
              : highlightedHeatmapRegion === "right_shoulder"
                ? HEATMAP_RADIUS * 0.3
              : HEATMAP_RADIUS,
        });
      }
    }

    clone.traverse((child) => {
      if (child instanceof Mesh) {
        child.raycast = () => undefined;
        child.castShadow = true;
        child.receiveShadow = true;
        child.frustumCulled = false;

        if (heatCenters.length > 0) {
          const baseColor = new Color("#ffffff");
          const material = Array.isArray(child.material) ? child.material[0] : child.material;
          if (material && (material as MeshStandardMaterial).color) {
            baseColor.copy((material as MeshStandardMaterial).color);
          }
          const lowColor = baseColor.clone().lerp(new Color("#22c55e"), lowIntensityBlend);
          applyVertexHeatmap(child, heatCenters, boxMin, boxSize, lowColor);
        }
      }
    });
    return clone;
  }, [
    scene,
    heatmapRegionCounts,
    heatmapRegionColors,
    highlightedHeatmapRegion,
    maxHeatmapCount,
    lowIntensityBlend,
  ]);

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const region = (e.object as Mesh).userData?.region as BodyRegionId | undefined;
    if (region && regionSet.has(region)) {
      // Store the pointer down position and region
      pointerDownRef.current = { region, x: e.clientX, y: e.clientY };
    }
  };

  const onPointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const region = (e.object as Mesh).userData?.region as BodyRegionId | undefined;
    
    // Only trigger if we pressed down and up on the same region at approximately the same position
    if (
      region &&
      pointerDownRef.current &&
      pointerDownRef.current.region === region &&
      regionSet.has(region)
    ) {
      // Check if pointer moved less than 5 pixels (prevents drag/accidental clicks)
      const deltaX = Math.abs(e.clientX - pointerDownRef.current.x);
      const deltaY = Math.abs(e.clientY - pointerDownRef.current.y);
      
      if (deltaX < 5 && deltaY < 5) {
        onSelectRegion(region);
      }
    }
    
    // Clear the pointer down reference
    pointerDownRef.current = null;
  };

  const onPointerOver = (e: ThreeEvent<PointerEvent>) => {
    const region = (e.object as Mesh).userData?.region as BodyRegionId | undefined;
    if (region && regionSet.has(region)) {
      setHovered(true);
    }
  };

  const onPointerOut = () => {
    setHovered(false);
  };

  const { centeredPosition, uniformScale } = useMemo(() => {
    const box = new Box3().setFromObject(displayScene);
    const center = new Vector3();
    box.getCenter(center);
    const scale = LOCKED_MODEL_SCALE;

    return {
      centeredPosition: [-center.x * scale, -center.y * scale + yOffset, -center.z * scale] as [
        number,
        number,
        number
      ],
      uniformScale: scale,
    };
  }, [displayScene, yOffset]);


  const appliedRotation = rotation ?? ([0, 0, Math.PI / 2] as [number, number, number]);

  return (
    <group ref={groupRef} position={centeredPosition} scale={uniformScale}>
      <group rotation={appliedRotation}>
        <primitive object={displayScene} />

        <group position={[0, 0, proxyZOffset]}>
          {PROXY_REGIONS.map(({ id, position, rotation, radius = 0.05, height = 0.1, type }) => {
            const scaledRadius = radius * proxyScale;
            const scaledHeight = height * proxyScale;

            return (
              <group key={id} position={position} rotation={rotation}>
                <mesh
                  name={id}
                  userData={{ region: id }}
                  renderOrder={1}
                  onPointerDown={onPointerDown}
                  onPointerUp={onPointerUp}
                  onPointerOver={onPointerOver}
                  onPointerOut={onPointerOut}
                >
                  {type === "sphere" ? (
                    <sphereGeometry args={[scaledRadius, 12, 12]} />
                  ) : (
                    <capsuleGeometry
                      args={[scaledRadius, Math.max(0.01, scaledHeight - scaledRadius * 2), 4, 8]}
                    />
                  )}
                  <meshBasicMaterial
                    color={highlightedRegion === id ? "#818cf8" : "#ef4444"}
                    transparent
                    // Adujust this opacity for debugging clickable regions
                    opacity={0}
                    depthWrite={false}
                    depthTest={false}
                  />
                </mesh>
              </group>
            );
          })}
        </group>
      </group>
    </group>
  );
}
