import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import HoloModel from "./HoloModel";
import { ENV_BACKGROUNDS, type ModelConfiguration } from "@/lib/jarvis/config";
import type { ModelDefinition } from "@/lib/jarvis/models";

interface Props {
  model: ModelDefinition | null;
  config: ModelConfiguration;
  quality: "low" | "medium" | "high";
}

function HologramStage({ model, config, quality }: Props) {
  const bg = ENV_BACKGROUNDS[config.environment.preset];
  return (
    <>
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, 8, 24]} />
      <ambientLight intensity={config.lighting.ambient} color="#91dfff" />
      <directionalLight position={[4, 7, 5]} intensity={config.lighting.key} color="#e6f7ff" />
      <pointLight position={[-4, 3, -3]} intensity={1.4} color={config.lighting.rim} distance={12} />
      {config.environment.stars && <Stars radius={40} depth={18} count={quality === "low" ? 400 : quality === "medium" ? 900 : 1600} factor={2} saturation={0.3} fade speed={0.2} />}
      {config.environment.grid && (
        <gridHelper args={[18, quality === "low" ? 12 : 24, "#1d5a75", "#0b2735"]} position={[0, -0.08, 0]} />
      )}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
        <ringGeometry args={[3.25, 3.28, 64]} />
        <meshBasicMaterial color={config.material.color} transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>
      {config.environment.scanlines && (
        <mesh position={[0, 1.8, 0]} rotation={[0, 0, 0]}>
          <boxGeometry args={[7.8, 0.012, 0.012]} />
          <meshBasicMaterial color={config.material.color} transparent opacity={0.36} />
        </mesh>
      )}
      <HoloModel model={model} config={config} detail={quality} />
      <OrbitControls enablePan={false} minDistance={4} maxDistance={13} target={[0, 1.3, 0]} />
    </>
  );
}

export default function JarvisCanvas({ model, config, quality }: Props) {
  return (
    <Canvas
      dpr={quality === "high" ? [1, 2] : [1, 1.35]}
      camera={{ position: [5.4, 3.7, 6.4], fov: 42 }}
      gl={{ antialias: quality !== "low", powerPreference: "high-performance" }}
      className="h-full w-full"
    >
      <HologramStage model={model} config={config} quality={quality} />
    </Canvas>
  );
}
