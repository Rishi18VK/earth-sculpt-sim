import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getQualitySettings } from "@/lib/terrain-quality";

// ── Cloud Layer ──
export function CloudLayer({ isNight }: { isNight: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const quality = useMemo(() => getQualitySettings(), []);
  
  const clouds = useMemo(() => {
    const items: { pos: [number, number, number]; scale: [number, number, number]; opacity: number }[] = [];
    const count = quality.enableGodRays ? 12 : 6;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 30 + Math.random() * 30;
      items.push({
        pos: [Math.cos(angle) * radius, 25 + Math.random() * 10, Math.sin(angle) * radius],
        scale: [8 + Math.random() * 12, 1 + Math.random() * 2, 6 + Math.random() * 8],
        opacity: 0.15 + Math.random() * 0.15,
      });
    }
    return items;
  }, [quality.enableGodRays]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime * 0.02;
    ref.current.rotation.y = t;
    ref.current.children.forEach((child, i) => {
      const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.opacity = (isNight ? 0.06 : 0.18) + Math.sin(state.clock.elapsedTime * 0.1 + i) * 0.04;
      }
    });
  });

  return (
    <group ref={ref}>
      {clouds.map((c, i) => (
        <mesh key={i} position={c.pos} scale={c.scale}>
          <sphereGeometry args={[1, 6, 4]} />
          <meshStandardMaterial
            color={isNight ? "#334466" : "#e8e8f0"}
            transparent
            opacity={c.opacity}
            depthWrite={false}
            roughness={1}
          />
        </mesh>
      ))}
    </group>
  );
}

// ── Volumetric Fog Planes ──
export function VolumetricFog({ biome, isNight }: { biome: { fogColor: string }; isNight: boolean }) {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.opacity = (isNight ? 0.06 : 0.1) + Math.sin(state.clock.elapsedTime * 0.15 + i * 2) * 0.03;
        mesh.position.x += Math.sin(state.clock.elapsedTime * 0.05 + i) * 0.003;
      }
    });
  });

  return (
    <group ref={ref}>
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh
          key={i}
          position={[(i - 2) * 15, 1.5 + i * 0.5, (i - 2) * 10]}
          rotation={[-Math.PI / 2, 0, i * 0.3]}
        >
          <planeGeometry args={[30, 25]} />
          <meshStandardMaterial
            color={biome.fogColor}
            transparent
            opacity={0.08}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// ── Ambient Dust / Pollen Particles ──
export function AmbientParticles({ isNight }: { isNight: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const count = 300;

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 70;
      arr[i * 3 + 1] = Math.random() * 20 + 1;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 70;
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      arr[i3] += Math.sin(i * 0.1) * delta * 0.2;
      arr[i3 + 1] += Math.sin(i * 0.3 + arr[i3]) * delta * 0.05;
      arr[i3 + 2] += Math.cos(i * 0.2) * delta * 0.15;
      if (Math.abs(arr[i3]) > 35) arr[i3] *= -0.9;
      if (arr[i3 + 1] > 22) arr[i3 + 1] = 1;
      if (arr[i3 + 1] < 0) arr[i3 + 1] = 20;
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        color={isNight ? "#8899bb" : "#ddddaa"}
        size={0.04}
        transparent
        opacity={isNight ? 0.3 : 0.5}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

// ── Crepuscular Rays (God Rays) ──
export function GodRays({ sunPosition, isNight }: { sunPosition: [number, number, number]; isNight: boolean }) {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.children.forEach((child, i) => {
      const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      if (mat) {
        const base = isNight ? 0.01 : 0.04;
        mat.opacity = base + Math.sin(state.clock.elapsedTime * 0.15 + i * 1.2) * (isNight ? 0.005 : 0.02);
      }
    });
  });

  if (isNight) return null;

  return (
    <group ref={ref} position={sunPosition}>
      {Array.from({ length: 7 }).map((_, i) => (
        <mesh
          key={i}
          position={[i * 3 - 9, -10, i * 2 - 6]}
          rotation={[0.2, 0.4 + i * 0.15, -0.7 + i * 0.05]}
        >
          <planeGeometry args={[1.5, 25]} />
          <meshBasicMaterial
            color="#fff5d0"
            transparent
            opacity={0.04}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
