// STL binary export utility for terrain geometry
import { BiomeConfig, biomeNoise } from "@/lib/biomes";

interface ExportOptions {
  size: number;
  segments: number;
  baseThickness: number;
  scale: number;
  biome: BiomeConfig;
  seed?: number;
}

export function generateSTLBinary(options: ExportOptions): ArrayBuffer {
  const { size, segments, baseThickness, scale, biome, seed = 0 } = options;
  const step = size / segments;
  const half = size / 2;

  const grid: number[][] = [];
  for (let iz = 0; iz <= segments; iz++) {
    grid[iz] = [];
    for (let ix = 0; ix <= segments; ix++) {
      const x = -half + ix * step;
      const z = -half + iz * step;
      grid[iz][ix] = biomeNoise(x, z, biome, seed);
    }
  }

  const topTris = segments * segments * 2;
  const bottomTris = segments * segments * 2;
  const sideTris = segments * 4 * 2;
  const totalTris = topTris + bottomTris + sideTris;

  const bufferSize = 80 + 4 + totalTris * 50;
  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);

  const header = "TerraCraft 3D STL Export - Generated for 3D Printing";
  for (let i = 0; i < 80; i++) {
    view.setUint8(i, i < header.length ? header.charCodeAt(i) : 0);
  }
  view.setUint32(80, totalTris, true);

  let offset = 84;

  function writeTriangle(
    nx: number, ny: number, nz: number,
    x1: number, y1: number, z1: number,
    x2: number, y2: number, z2: number,
    x3: number, y3: number, z3: number
  ) {
    view.setFloat32(offset, nx, true); offset += 4;
    view.setFloat32(offset, ny, true); offset += 4;
    view.setFloat32(offset, nz, true); offset += 4;
    view.setFloat32(offset, x1 * scale, true); offset += 4;
    view.setFloat32(offset, y1 * scale, true); offset += 4;
    view.setFloat32(offset, z1 * scale, true); offset += 4;
    view.setFloat32(offset, x2 * scale, true); offset += 4;
    view.setFloat32(offset, y2 * scale, true); offset += 4;
    view.setFloat32(offset, z2 * scale, true); offset += 4;
    view.setFloat32(offset, x3 * scale, true); offset += 4;
    view.setFloat32(offset, y3 * scale, true); offset += 4;
    view.setFloat32(offset, z3 * scale, true); offset += 4;
    view.setUint16(offset, 0, true); offset += 2;
  }

  const minHeight = -baseThickness;

  for (let iz = 0; iz < segments; iz++) {
    for (let ix = 0; ix < segments; ix++) {
      const x0 = -half + ix * step;
      const z0 = -half + iz * step;
      const x1 = x0 + step;
      const z1 = z0 + step;
      const h00 = grid[iz][ix];
      const h10 = grid[iz][ix + 1];
      const h01 = grid[iz + 1][ix];
      const h11 = grid[iz + 1][ix + 1];
      writeTriangle(0, 1, 0, x0, h00, z0, x1, h10, z0, x0, h01, z1);
      writeTriangle(0, 1, 0, x1, h10, z0, x1, h11, z1, x0, h01, z1);
    }
  }

  for (let iz = 0; iz < segments; iz++) {
    for (let ix = 0; ix < segments; ix++) {
      const x0 = -half + ix * step;
      const z0 = -half + iz * step;
      const x1 = x0 + step;
      const z1 = z0 + step;
      writeTriangle(0, -1, 0, x0, minHeight, z0, x0, minHeight, z1, x1, minHeight, z0);
      writeTriangle(0, -1, 0, x1, minHeight, z0, x0, minHeight, z1, x1, minHeight, z1);
    }
  }

  for (let ix = 0; ix < segments; ix++) {
    const x0 = -half + ix * step;
    const x1 = x0 + step;
    const z = -half;
    const h0 = grid[0][ix];
    const h1 = grid[0][ix + 1];
    writeTriangle(0, 0, -1, x0, h0, z, x1, minHeight, z, x0, minHeight, z);
    writeTriangle(0, 0, -1, x0, h0, z, x1, h1, z, x1, minHeight, z);
  }

  for (let ix = 0; ix < segments; ix++) {
    const x0 = -half + ix * step;
    const x1 = x0 + step;
    const z = half;
    const h0 = grid[segments][ix];
    const h1 = grid[segments][ix + 1];
    writeTriangle(0, 0, 1, x0, h0, z, x0, minHeight, z, x1, minHeight, z);
    writeTriangle(0, 0, 1, x0, h0, z, x1, minHeight, z, x1, h1, z);
  }

  for (let iz = 0; iz < segments; iz++) {
    const z0 = -half + iz * step;
    const z1 = z0 + step;
    const x = -half;
    const h0 = grid[iz][0];
    const h1 = grid[iz + 1][0];
    writeTriangle(-1, 0, 0, x, h0, z0, x, minHeight, z0, x, minHeight, z1);
    writeTriangle(-1, 0, 0, x, h0, z0, x, minHeight, z1, x, h1, z1);
  }

  for (let ix2 = 0; ix2 < segments; ix2++) {
    const z0 = -half + ix2 * step;
    const z1 = z0 + step;
    const x = half;
    const h0 = grid[ix2][segments];
    const h1 = grid[ix2 + 1][segments];
    writeTriangle(1, 0, 0, x, h0, z0, x, minHeight, z1, x, minHeight, z0);
    writeTriangle(1, 0, 0, x, h0, z0, x, h1, z1, x, minHeight, z1);
  }

  return buffer;
}

export function downloadSTL(options: ExportOptions, filename = "terracraft-terrain.stl") {
  const buffer = generateSTLBinary(options);
  const blob = new Blob([buffer], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function getEstimatedFileSize(segments: number): string {
  const topTris = segments * segments * 2;
  const bottomTris = segments * segments * 2;
  const sideTris = segments * 4 * 2;
  const totalTris = topTris + bottomTris + sideTris;
  const bytes = 80 + 4 + totalTris * 50;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
