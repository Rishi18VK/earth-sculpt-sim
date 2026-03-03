

## Add Terrain Seed Input

### Approach
Add a numeric `seed` value that offsets the noise function, allowing users to generate different terrains within the same biome. The seed will be managed in `Index.tsx` and passed through to `TerrainMesh`, `BiomeObjects`, `MiniMap`, and `stl-export`.

### Changes

1. **`src/lib/biomes.ts`** — Update `biomeNoise()` to accept a `seed` parameter, adding it as an offset to the noise calculation.

2. **`src/components/terrain/BiomeSelector.tsx`** — Add a seed input field (number input) and a "Randomize" button (🎲) below the biome list. Emit seed changes via a new `onSeedChange` callback.

3. **`src/pages/Index.tsx`** — Add `seed` state (default: 1), pass it to `Scene3D`, `ExportPanel`, and `BiomeSelector`. Reset measurements on seed change.

4. **`src/components/terrain/Scene3D.tsx`** — Accept and forward `seed` to `TerrainMesh`, `BiomeObjects`, `MiniMap`.

5. **`src/components/terrain/TerrainMesh.tsx`** — Pass `seed` to `biomeNoise()` calls; add `seed` to `useMemo` dependency.

6. **`src/components/terrain/BiomeObjects.tsx`** — Use `seed` to offset object placement positions.

7. **`src/components/terrain/MiniMap.tsx`** — Pass `seed` to `biomeNoise()` for the 2D canvas rendering.

8. **`src/lib/stl-export.ts`** — Accept `seed` parameter and pass it to `biomeNoise()`.

9. **`src/components/terrain/ExportPanel.tsx`** — Pass `seed` through to the STL export function.

