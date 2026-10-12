import { describe, it, expect } from "vitest";
import { DISCOVER_LOCATIONS } from "@/lib/discover-locations";
import { DISCOVER_LOCATION_PROFILES, REAL_EARTH_LOCATIONS } from "@/lib/real-earth-locations";

describe("Discover location profiles", () => {
  it("provides a matching Explore profile for every Discover card", () => {
    for (const location of DISCOVER_LOCATIONS) {
      const profile = DISCOVER_LOCATION_PROFILES[location.id];
      expect(profile, `${location.id} should resolve to an Explore profile`).toBeDefined();
      expect(profile?.name).toBe(location.name);
      expect(profile?.lat).toBe(location.lat);
      expect(profile?.lng).toBe(location.lng);
      expect(profile?.detailCategory).toBe(location.category === "trending" ? "landmark" : location.category);
    }
  });

  it("keeps the dedicated Dudhsagar biome and legacy Real Earth profiles", () => {
    expect(DISCOVER_LOCATION_PROFILES.dudhsagar?.biomeBase).toBe("dudhsagar");
    expect(REAL_EARTH_LOCATIONS.himalayas?.name).toBe("Himalayas");
    expect(REAL_EARTH_LOCATIONS.grandcanyon?.name).toBe("Grand Canyon");
  });
});
