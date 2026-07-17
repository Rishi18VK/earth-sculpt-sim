export type DiscoverCategory = "landmark" | "waterfall" | "mountain" | "park" | "monument" | "trending";

export interface DiscoverLocation {
  id: string;
  name: string;
  region: string;
  category: DiscoverCategory;
  emoji: string;
  description: string;
  lat: number;
  lng: number;
  trending?: boolean;
  gradient: string;
}

export const DISCOVER_LOCATIONS: DiscoverLocation[] = [
  { id: "eiffel", name: "Eiffel Tower", region: "Paris, France", category: "landmark", emoji: "🗼", description: "Iron lattice tower on the Champ de Mars.", lat: 48.858, lng: 2.294, trending: true, gradient: "from-amber-500/40 to-rose-500/30" },
  { id: "great-wall", name: "Great Wall", region: "China", category: "monument", emoji: "🧱", description: "Ancient defensive walls spanning thousands of km.", lat: 40.431, lng: 116.570, gradient: "from-stone-500/40 to-amber-700/30" },
  { id: "machu", name: "Machu Picchu", region: "Peru", category: "monument", emoji: "🏔️", description: "15th-century Inca citadel in the Andes.", lat: -13.163, lng: -72.545, trending: true, gradient: "from-emerald-600/40 to-lime-500/30" },
  { id: "everest", name: "Mount Everest", region: "Nepal/Tibet", category: "mountain", emoji: "🗻", description: "Highest peak above sea level — 8,849 m.", lat: 27.988, lng: 86.925, trending: true, gradient: "from-sky-500/40 to-slate-300/30" },
  { id: "kilimanjaro", name: "Kilimanjaro", region: "Tanzania", category: "mountain", emoji: "🌋", description: "Africa's highest peak, dormant volcano.", lat: -3.076, lng: 37.353, gradient: "from-orange-500/40 to-yellow-500/30" },
  { id: "fuji", name: "Mount Fuji", region: "Japan", category: "mountain", emoji: "🗻", description: "Iconic snow-capped stratovolcano.", lat: 35.363, lng: 138.731, gradient: "from-indigo-500/40 to-rose-300/30" },
  { id: "niagara", name: "Niagara Falls", region: "Canada/USA", category: "waterfall", emoji: "💦", description: "Massive falls on the Niagara River.", lat: 43.096, lng: -79.038, gradient: "from-cyan-500/40 to-blue-600/30" },
  { id: "angel", name: "Angel Falls", region: "Venezuela", category: "waterfall", emoji: "🌊", description: "World's tallest uninterrupted waterfall — 979 m.", lat: 5.968, lng: -62.535, gradient: "from-teal-500/40 to-emerald-500/30" },
  { id: "dudhsagar", name: "Dudhsagar Falls", region: "Goa, India", category: "waterfall", emoji: "🥛", description: "Four-tiered milky waterfall in the Western Ghats.", lat: 15.314, lng: 74.315, trending: true, gradient: "from-white/40 to-emerald-500/30" },
  { id: "iguazu", name: "Iguazú Falls", region: "Argentina/Brazil", category: "waterfall", emoji: "💧", description: "System of 275 falls along the Iguazu River.", lat: -25.686, lng: -54.444, gradient: "from-cyan-400/40 to-teal-600/30" },
  { id: "yellowstone", name: "Yellowstone", region: "USA", category: "park", emoji: "🌲", description: "First national park — geysers and wildlife.", lat: 44.427, lng: -110.588, gradient: "from-amber-600/40 to-emerald-700/30" },
  { id: "banff", name: "Banff National Park", region: "Canada", category: "park", emoji: "🏞️", description: "Turquoise glacier lakes in the Rockies.", lat: 51.497, lng: -115.928, gradient: "from-sky-400/40 to-emerald-500/30" },
  { id: "serengeti", name: "Serengeti", region: "Tanzania", category: "park", emoji: "🦁", description: "Vast plains of the great migration.", lat: -2.333, lng: 34.833, gradient: "from-yellow-600/40 to-orange-500/30" },
  { id: "petra", name: "Petra", region: "Jordan", category: "monument", emoji: "🏛️", description: "Rose-red city carved from sandstone cliffs.", lat: 30.328, lng: 35.444, gradient: "from-rose-500/40 to-amber-700/30" },
  { id: "colosseum", name: "Colosseum", region: "Rome, Italy", category: "monument", emoji: "🏟️", description: "Iconic Roman amphitheatre.", lat: 41.890, lng: 12.492, gradient: "from-amber-500/40 to-stone-500/30" },
  { id: "taj", name: "Taj Mahal", region: "Agra, India", category: "landmark", emoji: "🕌", description: "White marble mausoleum of Mumtaz Mahal.", lat: 27.175, lng: 78.042, trending: true, gradient: "from-rose-300/40 to-purple-400/30" },
  { id: "sydney", name: "Sydney Opera House", region: "Australia", category: "landmark", emoji: "🎭", description: "Sail-shaped shells over Sydney Harbour.", lat: -33.857, lng: 151.215, gradient: "from-cyan-400/40 to-blue-500/30" },
  { id: "grand-canyon", name: "Grand Canyon", region: "USA", category: "park", emoji: "🏜️", description: "Mile-deep gorge carved by the Colorado.", lat: 36.107, lng: -112.113, gradient: "from-orange-600/40 to-red-700/30" },
];

export const CATEGORY_LABELS: Record<DiscoverCategory | "all", { label: string; emoji: string }> = {
  all: { label: "All", emoji: "✨" },
  trending: { label: "Trending", emoji: "🔥" },
  landmark: { label: "Landmarks", emoji: "🗼" },
  waterfall: { label: "Waterfalls", emoji: "💦" },
  mountain: { label: "Mountains", emoji: "🗻" },
  park: { label: "National Parks", emoji: "🌲" },
  monument: { label: "Monuments", emoji: "🏛️" },
};
