import { DISCOVER_LOCATIONS, type DiscoverLocation } from "@/lib/discover-locations";

/** Procedural holographic model kinds — no external assets required. */
export type ModelKind =
  | "tower"
  | "wall"
  | "citadel"
  | "peak"
  | "falls"
  | "dome"
  | "arena"
  | "forest"
  | "canyon";

export interface ModelDefinition {
  id: string;
  kind: ModelKind;
  label: string;
  /** Editable part ids exposed in the Parts tab. */
  parts: { id: string; label: string }[];
}

const KIND_PARTS: Record<ModelKind, { id: string; label: string }[]> = {
  tower: [
    { id: "base", label: "Base" },
    { id: "body", label: "Lattice" },
    { id: "crown", label: "Spire" },
    { id: "details", label: "Platforms" },
  ],
  wall: [
    { id: "base", label: "Foundation" },
    { id: "body", label: "Rampart" },
    { id: "crown", label: "Watchtowers" },
    { id: "details", label: "Battlements" },
  ],
  citadel: [
    { id: "base", label: "Terraces" },
    { id: "body", label: "Structures" },
    { id: "crown", label: "Temple" },
    { id: "details", label: "Pathways" },
  ],
  peak: [
    { id: "base", label: "Foothills" },
    { id: "body", label: "Massif" },
    { id: "crown", label: "Summit cap" },
    { id: "details", label: "Ridges" },
  ],
  falls: [
    { id: "base", label: "Plunge pool" },
    { id: "body", label: "Cliff face" },
    { id: "crown", label: "Water column" },
    { id: "details", label: "Mist" },
  ],
  dome: [
    { id: "base", label: "Plinth" },
    { id: "body", label: "Main hall" },
    { id: "crown", label: "Dome" },
    { id: "details", label: "Minarets" },
  ],
  arena: [
    { id: "base", label: "Foundation" },
    { id: "body", label: "Outer ring" },
    { id: "crown", label: "Upper tier" },
    { id: "details", label: "Arcades" },
  ],
  forest: [
    { id: "base", label: "Terrain" },
    { id: "body", label: "Canopy" },
    { id: "crown", label: "Ridgeline" },
    { id: "details", label: "Waterways" },
  ],
  canyon: [
    { id: "base", label: "Riverbed" },
    { id: "body", label: "Strata" },
    { id: "crown", label: "Plateau" },
    { id: "details", label: "Erosion lines" },
  ],
};

const OVERRIDES: Record<string, ModelKind> = {
  eiffel: "tower",
  "great-wall": "wall",
  machu: "citadel",
  petra: "citadel",
  colosseum: "arena",
  sydney: "dome",
  taj: "dome",
  "grand-canyon": "canyon",
};

function kindFor(loc: DiscoverLocation): ModelKind {
  if (OVERRIDES[loc.id]) return OVERRIDES[loc.id];
  switch (loc.category) {
    case "mountain": return "peak";
    case "waterfall": return "falls";
    case "park": return "forest";
    case "monument": return "citadel";
    case "landmark": return "tower";
    default: return "peak";
  }
}

export function getModelForLocation(locationId: string): ModelDefinition | null {
  const loc = DISCOVER_LOCATIONS.find((l) => l.id === locationId);
  if (!loc) return null;
  const kind = kindFor(loc);
  return {
    id: `${loc.id}-model`,
    kind,
    label: `${loc.name} — holographic reconstruction`,
    parts: KIND_PARTS[kind],
  };
}

export const JARVIS_LOCATIONS = DISCOVER_LOCATIONS;
