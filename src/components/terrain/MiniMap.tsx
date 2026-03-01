import { useRef, useEffect, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

function noise(x: number, z: number): number {
  return (
    Math.sin(x * 0.3) * Math.cos(z * 0.3) * 2 +
    Math.sin(x * 0.7 + 1.3) * Math.cos(z * 0.5 + 0.7) * 1.5 +
    Math.sin(x * 1.5 + 2.1) * Math.cos(z * 1.2 + 1.1) * 0.7 +
    Math.sin(x * 3.0) * Math.cos(z * 2.8) * 0.3
  );
}

function getColor(height: number): string {
  if (height < -1.5) return "#1a3a5c";
  if (height < -0.5) return "#2a6b8a";
  if (height < 0.0) return "#c2b280";
  if (height < 1.0) return "#4a8c3f";
  if (height < 2.0) return "#3a6b30";
  if (height < 3.0) return "#8b7355";
  return "#dce8f0";
}

export default function MiniMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<{ x: number; z: number; rotY: number }>({ x: 0, z: 0, rotY: 0 });
  const drawnRef = useRef(false);
  const { camera } = useThree();

  const drawTerrain = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || drawnRef.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 140;
    const terrainSize = 80;
    const scale = size / terrainSize;

    for (let px = 0; px < size; px++) {
      for (let py = 0; py < size; py++) {
        const x = (px / scale) - terrainSize / 2;
        const z = (py / scale) - terrainSize / 2;
        const h = noise(x, z);
        ctx.fillStyle = getColor(h);
        ctx.fillRect(px, py, 1, 1);
      }
    }
    drawnRef.current = true;
  }, []);

  useEffect(() => {
    drawTerrain();
  }, [drawTerrain]);

  useFrame(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const size = 140;
    const terrainSize = 80;
    const scale = size / terrainSize;

    cameraRef.current.x = (camera.position.x + terrainSize / 2) * scale;
    cameraRef.current.z = (camera.position.z + terrainSize / 2) * scale;

    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    cameraRef.current.rotY = Math.atan2(dir.x, dir.z);

    // Redraw terrain + camera overlay
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Restore terrain (redraw if needed)
    if (!drawnRef.current) drawTerrain();

    // We need to redraw terrain each frame since we draw camera on top
    // Use an offscreen approach: just redraw terrain + camera
    const tSize = 140;
    for (let px = 0; px < tSize; px++) {
      for (let py = 0; py < tSize; py++) {
        const x = (px / scale) - terrainSize / 2;
        const z = (py / scale) - terrainSize / 2;
        const h = noise(x, z);
        ctx.fillStyle = getColor(h);
        ctx.fillRect(px, py, 1, 1);
      }
    }

    // Draw camera position
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
      <div
        style={{
          position: "fixed",
          bottom: "16px",
          left: "16px",
          pointerEvents: "auto",
        }}
      >
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
          <canvas
            ref={canvasRef}
            width={140}
            height={140}
            style={{ borderRadius: "4px", display: "block" }}
          />
        </div>
      </div>
    </Html>
  );
}
