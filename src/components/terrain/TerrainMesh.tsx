import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BiomeConfig, biomeNoise, biomeColor, biomeTerrainType } from "@/lib/biomes";

interface TerrainMeshProps {
  onPointClick?: (info: { type: string; height: number; position: [number, number, number] }) => void;
  biome: BiomeConfig;
  seed?: number;
}

export default function TerrainMesh({ onPointClick, biome, seed = 0 }: TerrainMeshProps) {
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
      const height = biomeNoise(x, z, biome, seed);
      positions.setY(i, height);

      const color = biomeColor(height, biome);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const waterGeo = new THREE.PlaneGeometry(size, size, 1, 1);
    waterGeo.rotateX(-Math.PI / 2);

    return { geometry: geo, waterGeometry: waterGeo };
  }, [biome, seed]);

  const waterRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (waterRef.current) {
      waterRef.current.position.y = biome.waterLevel + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    const point = e.point;
    const height = point.y;
    const type = biomeTerrainType(height, biome);

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
      <mesh ref={waterRef} geometry={waterGeometry} position={[0, biome.waterLevel, 0]}>
        <meshStandardMaterial
          color={biome.waterColor}
          transparent
          opacity={biome.waterOpacity}
          roughness={0.1}
          metalness={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
