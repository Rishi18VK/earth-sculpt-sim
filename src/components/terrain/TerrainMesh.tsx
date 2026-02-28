import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Simplex-like noise using sine combinations
function noise(x: number, z: number): number {
  return (
    Math.sin(x * 0.3) * Math.cos(z * 0.3) * 2 +
    Math.sin(x * 0.7 + 1.3) * Math.cos(z * 0.5 + 0.7) * 1.5 +
    Math.sin(x * 1.5 + 2.1) * Math.cos(z * 1.2 + 1.1) * 0.7 +
    Math.sin(x * 3.0) * Math.cos(z * 2.8) * 0.3
  );
}

function getTerrainColor(height: number, x: number, z: number): THREE.Color {
  // Deep water
  if (height < -1.5) return new THREE.Color().setHSL(0.58, 0.8, 0.25);
  // Shallow water
  if (height < -0.5) return new THREE.Color().setHSL(0.55, 0.7, 0.4);
  // Sand/beach
  if (height < 0.0) return new THREE.Color().setHSL(0.12, 0.5, 0.65);
  // Green lowland
  if (height < 1.0) return new THREE.Color().setHSL(0.33, 0.55, 0.35);
  // Forest
  if (height < 2.0) return new THREE.Color().setHSL(0.28, 0.5, 0.28);
  // Stone/rock
  if (height < 3.0) return new THREE.Color().setHSL(0.08, 0.1, 0.45);
  // Snow/ice
  return new THREE.Color().setHSL(0.58, 0.15, 0.85);
}

interface TerrainMeshProps {
  onPointClick?: (info: { type: string; height: number; position: [number, number, number] }) => void;
}

export default function TerrainMesh({ onPointClick }: TerrainMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const { geometry, waterGeometry } = useMemo(() => {
    const size = 80;
    const segments = 200;
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);

    const positions = geo.attributes.position;
    const colors = new Float32Array(positions.count * 3);

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const height = noise(x, z);
      positions.setY(i, height);

      const color = getTerrainColor(height, x, z);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const waterGeo = new THREE.PlaneGeometry(size, size, 1, 1);
    waterGeo.rotateX(-Math.PI / 2);

    return { geometry: geo, waterGeometry: waterGeo };
  }, []);

  const waterRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (waterRef.current) {
      waterRef.current.position.y = -0.5 + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    const point = e.point;
    const height = point.y;
    let type = "Water";
    if (height >= -0.5 && height < 0.0) type = "Sand/Beach";
    else if (height >= 0.0 && height < 1.0) type = "Greenery/Lowland";
    else if (height >= 1.0 && height < 2.0) type = "Forest";
    else if (height >= 2.0 && height < 3.0) type = "Stone/Rock";
    else if (height >= 3.0) type = "Snow/Ice";
    else if (height < -1.5) type = "Deep Sea";
    else type = "Shallow Water";

    onPointClick?.({
      type,
      height: Math.round(height * 100) / 100,
      position: [Math.round(point.x * 10) / 10, Math.round(point.y * 10) / 10, Math.round(point.z * 10) / 10],
    });
  };

  return (
    <group>
      <mesh ref={meshRef} geometry={geometry} onClick={handleClick} castShadow receiveShadow>
        <meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={0.8} metalness={0.1} />
      </mesh>
      <mesh ref={waterRef} geometry={waterGeometry} position={[0, -0.5, 0]}>
        <meshStandardMaterial
          color="#1a6b8a"
          transparent
          opacity={0.6}
          roughness={0.1}
          metalness={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
