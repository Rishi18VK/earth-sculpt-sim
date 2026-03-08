import { useRef, useEffect, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { BiomeConfig, biomeNoise, biomeColorHex } from "@/lib/biomes";

interface MiniMapProps {
  biome: BiomeConfig;
  seed?: number;
  playerPosition?: [number, number, number] | null;
}

export default function MiniMap({ biome, seed = 0, playerPosition }: MiniMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const terrainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraRef = useRef<{ x: number; z: number; rotY: number }>({ x: 0, z: 0, rotY: 0 });
  const lastBiomeRef = useRef<string>("");
  const { camera } = useThree();

  const size = 140;
  const terrainSize = 80;
  const scale = size / terrainSize;

  const drawTerrainToBuffer = useCallback(() => {
    if (!terrainCanvasRef.current) {
      terrainCanvasRef.current = document.createElement("canvas");
      terrainCanvasRef.current.width = size;
      terrainCanvasRef.current.height = size;
    }
    const ctx = terrainCanvasRef.current.getContext("2d");
    if (!ctx) return;

    for (let px = 0; px < size; px++) {
      for (let py = 0; py < size; py++) {
        const x = (px / scale) - terrainSize / 2;
        const z = (py / scale) - terrainSize / 2;
        const h = biomeNoise(x, z, biome, seed);
        ctx.fillStyle = biomeColorHex(h, biome);
        ctx.fillRect(px, py, 1, 1);
      }
    }
    lastBiomeRef.current = `${biome.id}-${seed}`;
  }, [biome, seed, scale]);

  useEffect(() => {
    drawTerrainToBuffer();
  }, [drawTerrainToBuffer]);

  useFrame(() => {
    const canvas = canvasRef.current;
    if (!canvas || !terrainCanvasRef.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (lastBiomeRef.current !== `${biome.id}-${seed}`) drawTerrainToBuffer();

    // Draw cached terrain
    ctx.drawImage(terrainCanvasRef.current, 0, 0);

    // Camera info
    cameraRef.current.x = (camera.position.x + terrainSize / 2) * scale;
    cameraRef.current.z = (camera.position.z + terrainSize / 2) * scale;
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    cameraRef.current.rotY = Math.atan2(dir.x, dir.z);

    const cx = cameraRef.current.x;
    const cz = cameraRef.current.z;
    const rot = cameraRef.current.rotY;

    // FOV cone
    ctx.save();
    ctx.translate(cx, cz);
    ctx.rotate(-rot);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-8, -18);
    ctx.lineTo(8, -18);
    ctx.closePath();
    ctx.fillStyle = "rgba(59, 130, 246, 0.25)";
    ctx.fill();
    ctx.strokeStyle = "rgba(59, 130, 246, 0.6)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // Camera dot
    ctx.beginPath();
    ctx.arc(cx, cz, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#3b82f6";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  return (
    <Html position={[0, 0, 0]} style={{ pointerEvents: "none" }} wrapperClass="minimap-wrapper">
      <div style={{ position: "fixed", bottom: "16px", left: "16px", pointerEvents: "auto" }}>
        <div
          style={{
            background: "rgba(10, 22, 40, 0.85)",
            borderRadius: "8px",
            padding: "6px",
            border: "1px solid rgba(255,255,255,0.15)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div style={{ fontSize: "9px", color: "#94a3b8", fontFamily: "monospace", marginBottom: "4px", textAlign: "center" }}>
            TOP VIEW
          </div>
          <canvas ref={canvasRef} width={size} height={size} style={{ borderRadius: "4px", display: "block" }} />
        </div>
      </div>
    </Html>
  );
}
