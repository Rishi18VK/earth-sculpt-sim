import { z } from "zod";
import type JSZip from "jszip";
import type { ModConfig, ModType } from "./mod-types";

/**
 * Terra Explorer mod API version. Bump the MAJOR when we make breaking
 * changes to the mod schema/behavior. Mods declare `apiVersion` (or the
 * legacy `minAppVersion`) to opt in.
 */
export const APP_MOD_API_VERSION = "1.0.0";

// ---------- Limits ----------
export const MOD_LIMITS = {
  maxZipBytes: 20 * 1024 * 1024, // 20 MB total
  maxFileBytes: 15 * 1024 * 1024, // 15 MB per file (model)
  maxFileCount: 200,
  maxConfigBytes: 256 * 1024, // 256 KB mod.json
  allowedModelExts: [".glb", ".gltf", ".obj"] as const,
  allowedTextureExts: [".png", ".jpg", ".jpeg", ".webp", ".ktx2"] as const,
  // Anything executable / scriptable is rejected — mods are declarative assets only.
  forbiddenExts: [
    ".exe", ".dll", ".so", ".dylib", ".bat", ".cmd", ".sh", ".ps1",
    ".js", ".mjs", ".cjs", ".ts", ".jsx", ".tsx", ".html", ".htm",
    ".svg", ".wasm", ".php", ".py", ".rb", ".jar", ".apk",
  ] as const,
};

const VALID_MOD_TYPES: ModType[] = ["player", "weather", "terrain_color", "biome_effect", "camera"];

// ---------- Zod schema (permissive but bounded) ----------
const hex = z.string().regex(/^#[0-9a-fA-F]{3,8}$/, "must be a hex color like #ffcc00");
const semver = z.string().regex(/^\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/, "must be semver like 1.2.3");

export const modConfigSchema = z.object({
  name: z.string().trim().min(1, "name is required").max(80),
  version: semver.default("1.0.0"),
  author: z.string().trim().max(80).default("Unknown"),
  description: z.string().trim().max(500).optional(),
  type: z.enum(["player", "weather", "terrain_color", "biome_effect", "camera"]),
  apiVersion: semver.optional(),
  minAppVersion: semver.optional(),
  model: z.string().max(200).optional(),
  textures: z.record(z.string().max(200)).optional(),
  animations: z.record(z.string().max(200)).optional(),
  player: z.object({
    speed: z.number().min(0).max(200).optional(),
    sprintSpeed: z.number().min(0).max(400).optional(),
    jumpForce: z.number().min(0).max(200).optional(),
    gravity: z.number().min(-500).max(500).optional(),
    cameraDistance: z.number().min(0).max(200).optional(),
    cameraHeight: z.number().min(-100).max(200).optional(),
    scale: z.number().min(0.01).max(50).optional(),
  }).partial().optional(),
  weather: z.object({
    particleCount: z.number().int().min(0).max(50000).optional(),
    particleColor: hex.optional(),
    particleSize: z.number().min(0).max(50).optional(),
    speed: z.number().min(0).max(200).optional(),
    drift: z.number().min(-50).max(50).optional(),
    opacity: z.number().min(0).max(1).optional(),
    direction: z.tuple([z.number(), z.number(), z.number()]).optional(),
    spread: z.number().min(0).max(500).optional(),
  }).partial().optional(),
  terrainColor: z.object({
    colorMultiplier: z.object({ r: z.number(), g: z.number(), b: z.number() }).optional(),
    saturationShift: z.number().min(-1).max(1).optional(),
    lightnessShift: z.number().min(-1).max(1).optional(),
    hueShift: z.number().min(-360).max(360).optional(),
    waterColor: hex.optional(),
    waterOpacity: z.number().min(0).max(1).optional(),
    fogColor: hex.optional(),
  }).partial().optional(),
  biomeEffect: z.object({
    objectDensityMultiplier: z.number().min(0).max(20).optional(),
    objectScaleMultiplier: z.number().min(0).max(20).optional(),
    extraObjectTypes: z.array(z.string().max(40)).max(20).optional(),
    ambientIntensityMultiplier: z.number().min(0).max(20).optional(),
    glowEnabled: z.boolean().optional(),
    glowColor: hex.optional(),
    glowIntensity: z.number().min(0).max(20).optional(),
  }).partial().optional(),
  camera: z.object({
    fov: z.number().min(1).max(179).optional(),
    distance: z.number().min(0).max(500).optional(),
    height: z.number().min(-100).max(500).optional(),
    lerpSpeed: z.number().min(0).max(50).optional(),
    minPitch: z.number().min(-Math.PI).max(Math.PI).optional(),
    maxPitch: z.number().min(-Math.PI).max(Math.PI).optional(),
    autoRotate: z.boolean().optional(),
    autoRotateSpeed: z.number().min(-100).max(100).optional(),
    firstPerson: z.boolean().optional(),
  }).partial().optional(),
});

// ---------- Version compatibility ----------
function parseSemver(v: string): [number, number, number] | null {
  const m = v.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/**
 * Compatible if MAJOR matches and mod's MINOR ≤ app's MINOR.
 * (Classic "semver caret" range within the same major.)
 */
export function isApiCompatible(modApiVersion: string, appVersion = APP_MOD_API_VERSION): boolean {
  const a = parseSemver(modApiVersion);
  const b = parseSemver(appVersion);
  if (!a || !b) return false;
  if (a[0] !== b[0]) return false;
  if (a[1] > b[1]) return false;
  return true;
}

// ---------- Path safety ----------
function isUnsafePath(p: string): string | null {
  if (!p) return "empty path";
  if (p.startsWith("/") || /^[a-zA-Z]:[\\/]/.test(p)) return "absolute path not allowed";
  if (p.split(/[\\/]/).some((seg) => seg === "..")) return "path traversal (..) not allowed";
  if (/[\x00-\x1f]/.test(p)) return "control characters in path";
  return null;
}

function extOf(p: string): string {
  const i = p.lastIndexOf(".");
  return i === -1 ? "" : p.slice(i).toLowerCase();
}

// ---------- Public: validate a parsed config ----------
export interface ValidatedConfig {
  config: ModConfig;
  warnings: string[];
}

export function validateModConfig(raw: unknown): ValidatedConfig {
  const parsed = modConfigSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .slice(0, 5)
      .map((i) => `• ${i.path.join(".") || "root"}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid mod.json:\n${issues}`);
  }
  const cfg = parsed.data as ModConfig & { apiVersion?: string; minAppVersion?: string };

  const declared = cfg.apiVersion ?? cfg.minAppVersion;
  const warnings: string[] = [];
  if (!declared) {
    warnings.push(
      `Mod does not declare "apiVersion". Assuming ${APP_MOD_API_VERSION} — it may break in future updates.`
    );
  } else if (!isApiCompatible(declared)) {
    throw new Error(
      `Version incompatible: mod requires API v${declared} but this app supports v${APP_MOD_API_VERSION}.\n` +
        `Update Terra Explorer or install a mod built for v${APP_MOD_API_VERSION.split(".")[0]}.x.`
    );
  }

  if (!VALID_MOD_TYPES.includes(cfg.type)) {
    throw new Error(
      `Unsupported mod type "${cfg.type}". Supported: ${VALID_MOD_TYPES.join(", ")}.`
    );
  }

  return { config: cfg, warnings };
}

// ---------- Public: validate a ZIP before extraction ----------
export interface ZipValidationReport {
  totalBytes: number;
  fileCount: number;
  warnings: string[];
}

export async function validateModZip(file: File, zip: JSZip): Promise<ZipValidationReport> {
  if (file.size > MOD_LIMITS.maxZipBytes) {
    throw new Error(
      `ZIP is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max ${MOD_LIMITS.maxZipBytes / 1024 / 1024} MB.`
    );
  }

  const entries = Object.entries(zip.files);
  if (entries.length === 0) throw new Error("ZIP is empty.");
  if (entries.length > MOD_LIMITS.maxFileCount) {
    throw new Error(`ZIP contains too many files (${entries.length}). Max ${MOD_LIMITS.maxFileCount}.`);
  }

  let totalBytes = 0;
  const warnings: string[] = [];
  let hasManifest = false;

  for (const [path, entry] of entries) {
    if (entry.dir) continue;
    const unsafe = isUnsafePath(path);
    if (unsafe) throw new Error(`Rejected unsafe file "${path}": ${unsafe}.`);

    const ext = extOf(path);
    if ((MOD_LIMITS.forbiddenExts as readonly string[]).includes(ext)) {
      throw new Error(
        `Rejected "${path}": ${ext} files are not allowed in mods (executable/scriptable content).`
      );
    }

    // Best-effort uncompressed size via internal jszip fields.
    // Falls back gracefully if the property is missing.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const size = (entry as any)._data?.uncompressedSize ?? 0;
    totalBytes += size;
    if (size > MOD_LIMITS.maxFileBytes) {
      throw new Error(
        `File "${path}" is too large (${(size / 1024 / 1024).toFixed(1)} MB). Max ${MOD_LIMITS.maxFileBytes / 1024 / 1024} MB per file.`
      );
    }

    if (path.toLowerCase().endsWith("mod.json")) hasManifest = true;
  }

  if (totalBytes > MOD_LIMITS.maxZipBytes) {
    throw new Error(
      `Uncompressed contents too large (${(totalBytes / 1024 / 1024).toFixed(1)} MB). Possible zip bomb — rejected.`
    );
  }
  if (!hasManifest) {
    throw new Error(`No mod.json found in ZIP. Every mod must include a mod.json manifest at the root.`);
  }

  return { totalBytes, fileCount: entries.length, warnings };
}

// ---------- Public: validate a standalone model file ----------
export function validateModelFile(file: File): void {
  const ext = extOf(file.name);
  if (!(MOD_LIMITS.allowedModelExts as readonly string[]).includes(ext)) {
    throw new Error(
      `Unsupported model format "${ext || "(none)"}". Use ${MOD_LIMITS.allowedModelExts.join(", ")}.`
    );
  }
  if (file.size > MOD_LIMITS.maxFileBytes) {
    throw new Error(
      `Model file too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max ${MOD_LIMITS.maxFileBytes / 1024 / 1024} MB.`
    );
  }
}
