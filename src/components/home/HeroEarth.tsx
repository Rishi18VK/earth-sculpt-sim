import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, Float } from "@react-three/drei";
import { Suspense, useRef } from "react";
import * as THREE from "three";

function Earth() {
  const mesh = useRef<THREE.Mesh>(null);
  const glow = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (mesh.current) mesh.current.rotation.y += dt * 0.12;
    if (glow.current) glow.current.rotation.y -= dt * 0.05;
  });
  return (
    <group>
      {/* Atmosphere glow */}
      <mesh ref={glow} scale={2.35}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshBasicMaterial color={new THREE.Color("#4fb8ff")} transparent opacity={0.06} side={THREE.BackSide} />
      </mesh>
      <mesh scale={2.2}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshBasicMaterial color={new THREE.Color("#8b5cf6")} transparent opacity={0.09} side={THREE.BackSide} />
      </mesh>

      <Float speed={0.6} rotationIntensity={0.15} floatIntensity={0.4}>
        {/* Ocean base */}
        <mesh ref={mesh} scale={2}>
          <icosahedronGeometry args={[1, 6]} />
          <meshStandardMaterial
            color="#0b3a7a"
            metalness={0.35}
            roughness={0.55}
            emissive="#0a2a55"
            emissiveIntensity={0.35}
          />
        </mesh>
        {/* Wireframe overlay for "landmass" feel */}
        <mesh scale={2.01}>
          <icosahedronGeometry args={[1, 3]} />
          <meshBasicMaterial color="#5cbdff" wireframe transparent opacity={0.35} />
        </mesh>
      </Float>
    </group>
  );
}

export default function HeroEarth() {
  return (
    <Canvas
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 6], fov: 45 }}
      dpr={[1, 2]}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 3, 5]} intensity={1.4} color="#8ab8ff" />
        <directionalLight position={[-4, -2, -3]} intensity={0.5} color="#c084fc" />
        <Stars radius={60} depth={40} count={2500} factor={3} saturation={0} fade speed={0.5} />
        <Earth />
      </Suspense>
    </Canvas>
  );
}
