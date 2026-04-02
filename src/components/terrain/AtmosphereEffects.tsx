import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getQualitySettings } from "@/lib/terrain-quality";

// ── Cloud Layer with volumetric look ──
export function CloudLayer({ isNight }: { isNight: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const quality = useMemo(() => getQualitySettings(), []);

  const clouds = useMemo(() => {
    const items: { pos: [number, number, number]; scale: [number, number, number]; opacity: number; speed: number }[] = [];
    const count = quality.cloudCount;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.sin(i * 3.7) * 0.5;
      const radius = 25 + Math.sin(i * 2.3) * 20 + Math.random() * 15;
      const height = 22 + Math.random() * 12;
      items.push({
        pos: [Math.cos(angle) * radius, height, Math.sin(angle) * radius],
        scale: [10 + Math.random() * 15, 1.5 + Math.random() * 2, 7 + Math.random() * 10],
        opacity: 0.12 + Math.random() * 0.12,
        speed: 0.01 + Math.random() * 0.015,
      });
    }
    return items;
  }, [quality.cloudCount]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.children.forEach((child, i) => {
      const cloud = clouds[i];
      if (!cloud) return;
      const mesh = child as THREE.Mesh;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.opacity = (isNight ? 0.04 : cloud.opacity) + Math.sin(t * 0.08 + i * 1.5) * 0.03;
      }
      // Drift clouds slowly
      mesh.position.x = cloud.pos[0] + Math.sin(t * cloud.speed + i) * 3;
      mesh.position.z = cloud.pos[2] + Math.cos(t * cloud.speed * 0.7 + i) * 2;
    });
  });

  return (
    <group ref={ref}>
      {clouds.map((c, i) => (
        <mesh key={i} position={c.pos} scale={c.scale}>
          <sphereGeometry args={[1, 8, 5]} />
          <meshStandardMaterial
            color={isNight ? "#2a3550" : "#e8e8f0"}
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

// ── Layered Volumetric Fog ──
export function VolumetricFog({ biome, isNight }: { biome: { fogColor: string }; isNight: boolean }) {
  const ref = useRef<THREE.Group>(null);

  const layers = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => ({
      pos: [(i - 4) * 12, 0.8 + i * 0.3 + Math.sin(i * 2) * 0.5, (i - 4) * 8 + Math.cos(i * 3) * 5] as [number, number, number],
      scale: 25 + Math.sin(i * 1.5) * 8,
      rotation: i * 0.25,
    }));
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat) {
        const baseOpacity = isNight ? 0.05 : 0.08;
        mat.opacity = baseOpacity + Math.sin(t * 0.12 + i * 1.8) * 0.025;
      }
      mesh.position.x += Math.sin(t * 0.04 + i * 0.7) * 0.002;
      mesh.position.z += Math.cos(t * 0.03 + i * 0.5) * 0.002;
    });
  });

  return (
    <group ref={ref}>
      {layers.map((l, i) => (
        <mesh key={i} position={l.pos} rotation={[-Math.PI / 2, 0, l.rotation]}>
          <planeGeometry args={[l.scale, l.scale * 0.8]} />
          <meshStandardMaterial
            color={biome.fogColor}
            transparent
            opacity={0.07}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// ── Ambient Dust / Pollen / Firefly Particles ──
export function AmbientParticles({ isNight }: { isNight: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const quality = useMemo(() => getQualitySettings(), []);
  const count = Math.min(quality.particleCount, 500);

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 70;
      pos[i * 3 + 1] = Math.random() * 18 + 0.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 70;
      vel[i * 3] = (Math.random() - 0.5) * 0.3;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.05;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
    }
    return { positions: pos, velocities: vel };
  }, [count]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    const dt = Math.min(delta, 0.05);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      arr[i3] += velocities[i3] * dt + Math.sin(i * 0.17 + arr[i3 + 1] * 0.1) * dt * 0.15;
      arr[i3 + 1] += velocities[i3 + 1] * dt + Math.sin(i * 0.31) * dt * 0.03;
      arr[i3 + 2] += velocities[i3 + 2] * dt + Math.cos(i * 0.23) * dt * 0.12;

      if (Math.abs(arr[i3]) > 35) arr[i3] *= -0.95;
      if (arr[i3 + 1] > 20) arr[i3 + 1] = 0.5;
      if (arr[i3 + 1] < 0) arr[i3 + 1] = 18;
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        color={isNight ? "#aabbdd" : "#eeeeaa"}
        size={isNight ? 0.06 : 0.04}
        transparent
        opacity={isNight ? 0.5 : 0.45}
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
    const t = state.clock.elapsedTime;
    ref.current.children.forEach((child, i) => {
      const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      if (mat) {
        const base = isNight ? 0.005 : 0.035;
        mat.opacity = base + Math.sin(t * 0.12 + i * 1.4) * (isNight ? 0.003 : 0.018);
      }
    });
  });

  if (isNight) return null;

  return (
    <group ref={ref} position={sunPosition}>
      {Array.from({ length: 9 }).map((_, i) => (
        <mesh
          key={i}
          position={[i * 2.5 - 10, -12, i * 1.5 - 6]}
          rotation={[0.15, 0.35 + i * 0.12, -0.65 + i * 0.04]}
        >
          <planeGeometry args={[1.2, 28]} />
          <meshBasicMaterial
            color="#fff8d8"
            transparent
            opacity={0.035}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// ── Mist near water / waterfalls ──
export function WaterMist({ waterLevel, intensity = 1 }: { waterLevel: number; intensity?: number }) {
  const ref = useRef<THREE.Points>(null);
  const count = 200;

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 50;
      arr[i * 3 + 1] = waterLevel + Math.random() * 2;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }
    return arr;
  }, [waterLevel]);

  useFrame((state) => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      arr[i3 + 1] = waterLevel + 0.3 + Math.sin(t * 0.3 + i * 0.5) * 0.8;
      arr[i3] += Math.sin(t * 0.1 + i * 0.2) * 0.005;
    }
    pos.needsUpdate = true;
    const mat = ref.current.material as THREE.PointsMaterial;
    mat.opacity = 0.15 * intensity + Math.sin(t * 0.15) * 0.05;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#d0e0f0" size={0.2} transparent opacity={0.15} depthWrite={false} sizeAttenuation />
    </points>
  );
}

// ── Canopy Light Rays (forest dappled light) ──
export function CanopyRays({ isNight }: { isNight: boolean }) {
  const ref = useRef<THREE.Group>(null);

  const rays = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      pos: [(Math.random() - 0.5) * 40, 15 + Math.random() * 5, (Math.random() - 0.5) * 40] as [number, number, number],
      rotation: [0.3 + Math.random() * 0.2, Math.random() * Math.PI, -0.5 + Math.random() * 0.3] as [number, number, number],
      width: 0.3 + Math.random() * 0.5,
    }));
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.children.forEach((child, i) => {
      const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = isNight ? 0 : (0.02 + Math.sin(t * 0.1 + i * 2) * 0.01);
      }
    });
  });

  if (isNight) return null;

  return (
    <group ref={ref}>
      {rays.map((r, i) => (
        <mesh key={i} position={r.pos} rotation={r.rotation}>
          <planeGeometry args={[r.width, 18]} />
          <meshBasicMaterial color="#fffae0" transparent opacity={0.025} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}
