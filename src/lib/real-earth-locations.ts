import { BiomeId, BiomeConfig, BIOMES } from "./biomes";

export interface RealEarthLocation {
  name: string;
  region: string;
  lat: number;
  lng: number;
  biomeBase: BiomeId;
  // Terrain shape overrides
  noiseScale: number[];
  noiseAmplitude: number[];
  noiseOffset: number[];
  // Visual overrides
  waterLevel: number;
  fogColor: string;
  description: string;
  tags: string[];
}

export const REAL_EARTH_LOCATIONS: Record<string, RealEarthLocation> = {
  himalayas: {
    name: "Himalayas",
    region: "Nepal / India",
    lat: 27.9881,
    lng: 86.925,
    biomeBase: "arctic",
    noiseScale: [0.12, 0.35, 0.9, 2.0],
    noiseAmplitude: [6, 3.5, 1.5, 0.6],
    noiseOffset: [50, 42, 55, 48],
    waterLevel: -2.0,
    fogColor: "#b0c8e0",
    description: "Towering snow-capped peaks with deep valleys and glaciers",
    tags: ["mountain", "snow", "glacier", "himalaya", "everest", "nepal"],
  },
  goa: {
    name: "Goa",
    region: "India",
    lat: 15.2993,
    lng: 74.124,
    biomeBase: "tropical",
    noiseScale: [0.18, 0.45, 1.1, 2.4],
    noiseAmplitude: [1.2, 0.8, 0.4, 0.15],
    noiseOffset: [60, 55, 63, 58],
    waterLevel: -0.2,
    fogColor: "#80c8d8",
    description: "Tropical coastline with palm-fringed beaches and lush hills",
    tags: ["beach", "tropical", "coast", "india", "palm"],
  },
  sahara: {
    name: "Sahara Desert",
    region: "North Africa",
    lat: 23.4162,
    lng: 25.6628,
    biomeBase: "desert",
    noiseScale: [0.15, 0.4, 1.0, 2.2],
    noiseAmplitude: [2.0, 1.2, 0.5, 0.2],
    noiseOffset: [70, 65, 73, 68],
    waterLevel: -3.0,
    fogColor: "#e0d0a0",
    description: "Vast sand dunes stretching to the horizon with rocky outcrops",
    tags: ["desert", "sand", "dunes", "africa", "sahara"],
  },
  alps: {
    name: "Swiss Alps",
    region: "Switzerland",
    lat: 46.8182,
    lng: 8.2275,
    biomeBase: "earth",
    noiseScale: [0.15, 0.4, 1.0, 2.5],
    noiseAmplitude: [5, 3, 1.2, 0.5],
    noiseOffset: [80, 75, 83, 78],
    waterLevel: -0.8,
    fogColor: "#a0b8d0",
    description: "Alpine meadows, rocky peaks, and glacial lakes",
    tags: ["alps", "mountain", "switzerland", "europe", "alpine", "meadow"],
  },
  amazon: {
    name: "Amazon Rainforest",
    region: "Brazil",
    lat: -3.4653,
    lng: -62.2159,
    biomeBase: "tropical",
    noiseScale: [0.2, 0.5, 1.2, 2.6],
    noiseAmplitude: [1.0, 0.6, 0.3, 0.1],
    noiseOffset: [90, 85, 93, 88],
    waterLevel: 0.0,
    fogColor: "#60a080",
    description: "Dense tropical jungle with winding rivers and flat terrain",
    tags: ["rainforest", "jungle", "amazon", "brazil", "river", "tropical"],
  },
  iceland: {
    name: "Iceland",
    region: "North Atlantic",
    lat: 64.9631,
    lng: -19.0208,
    biomeBase: "volcanic",
    noiseScale: [0.2, 0.5, 1.3, 2.8],
    noiseAmplitude: [3, 2, 0.8, 0.3],
    noiseOffset: [100, 95, 103, 98],
    waterLevel: -0.5,
    fogColor: "#90a0b0",
    description: "Volcanic terrain with geysers, lava fields, and glaciers",
    tags: ["volcano", "iceland", "geyser", "lava", "glacier", "nordic"],
  },
  grandcanyon: {
    name: "Grand Canyon",
    region: "Arizona, USA",
    lat: 36.1069,
    lng: -112.1129,
    biomeBase: "desert",
    noiseScale: [0.1, 0.3, 0.8, 1.8],
    noiseAmplitude: [5, 3, 1.5, 0.6],
    noiseOffset: [110, 105, 113, 108],
    waterLevel: -3.5,
    fogColor: "#c0a880",
    description: "Deep layered canyon carved by the Colorado River",
    tags: ["canyon", "grand canyon", "arizona", "usa", "desert", "river"],
  },
  newzealand: {
    name: "New Zealand",
    region: "Oceania",
    lat: -44.0,
    lng: 170.0,
    biomeBase: "earth",
    noiseScale: [0.18, 0.45, 1.1, 2.3],
    noiseAmplitude: [3.5, 2, 0.9, 0.35],
    noiseOffset: [120, 115, 123, 118],
    waterLevel: -0.4,
    fogColor: "#90c0a0",
    description: "Rolling green hills, fjords, and snow-capped mountains",
    tags: ["new zealand", "hills", "fjord", "mountain", "green", "oceania"],
  },
  maldives: {
    name: "Maldives",
    region: "Indian Ocean",
    lat: 3.2028,
    lng: 73.2207,
    biomeBase: "tropical",
    noiseScale: [0.25, 0.6, 1.4, 3.0],
    noiseAmplitude: [0.5, 0.3, 0.15, 0.05],
    noiseOffset: [130, 125, 133, 128],
    waterLevel: 0.1,
    fogColor: "#80d0e8",
    description: "Flat coral atolls with crystal-clear turquoise lagoons",
    tags: ["maldives", "island", "atoll", "coral", "beach", "ocean"],
  },
  norway: {
    name: "Norwegian Fjords",
    region: "Norway",
    lat: 61.0,
    lng: 7.0,
    biomeBase: "arctic",
    noiseScale: [0.12, 0.35, 0.9, 2.0],
    noiseAmplitude: [5, 3, 1.2, 0.5],
    noiseOffset: [140, 135, 143, 138],
    waterLevel: -1.0,
    fogColor: "#90a8c0",
    description: "Deep fjords carved between steep snow-dusted mountains",
    tags: ["fjord", "norway", "nordic", "mountain", "snow", "coast"],
  },
  newyork: {
    name: "New York Coast",
    region: "USA",
    lat: 40.7128,
    lng: -74.006,
    biomeBase: "earth",
    noiseScale: [0.2, 0.5, 1.2, 2.5],
    noiseAmplitude: [1.0, 0.6, 0.3, 0.1],
    noiseOffset: [150, 145, 153, 148],
    waterLevel: -0.1,
    fogColor: "#a0b0c0",
    description: "Coastal lowlands with gentle rolling terrain and waterways",
    tags: ["new york", "coast", "usa", "city", "urban", "atlantic"],
  },
  kilimanjaro: {
    name: "Mount Kilimanjaro",
    region: "Tanzania",
    lat: -3.0674,
    lng: 37.3556,
    biomeBase: "earth",
    noiseScale: [0.1, 0.3, 0.7, 1.5],
    noiseAmplitude: [6, 3.5, 1.5, 0.6],
    noiseOffset: [160, 155, 163, 158],
    waterLevel: -1.5,
    fogColor: "#90b0a0",
    description: "Africa's tallest peak rising from savanna to snow-capped summit",
    tags: ["kilimanjaro", "mountain", "africa", "tanzania", "snow", "savanna"],
  },
};

/** Search locations by name or tags */
export function searchLocations(query: string): RealEarthLocation[] {
  const q = query.toLowerCase().trim();
  if (!q) return Object.values(REAL_EARTH_LOCATIONS);

  return Object.values(REAL_EARTH_LOCATIONS).filter(
    (loc) =>
      loc.name.toLowerCase().includes(q) ||
      loc.region.toLowerCase().includes(q) ||
      loc.tags.some((t) => t.includes(q))
  );
}

/** Build a BiomeConfig from a real-earth location */
export function locationToBiome(loc: RealEarthLocation): BiomeConfig {
  const base = BIOMES[loc.biomeBase];
  return {
    ...base,
    id: loc.biomeBase,
    name: loc.name,
    emoji: "🌎",
    description: loc.description,
    noiseScale: loc.noiseScale,
    noiseAmplitude: loc.noiseAmplitude,
    noiseOffset: loc.noiseOffset,
    waterLevel: loc.waterLevel,
    fogColor: loc.fogColor,
  };
}
