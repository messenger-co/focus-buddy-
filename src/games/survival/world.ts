/** Deterministic 2.5D sandbox. No network, textures, backend, or random saves. */
export const WORLD_SIZE = 40;
export const HOME = 20;
export const MAX_ENERGY = 100;
export const WORLD_SAVE_KEY = "focus-buddy-island-survival-v2";
export const LEGACY_SAVE_KEY = "focus-buddy-island-survival-v1";

export type Resource = "wood" | "stone" | "water" | "food";
export type Terrain = "grass" | "sand" | "rock" | "water";
export type ObjectKind = "tree" | "pine" | "stone" | "berry" | "flower" | "grass" | null;
export type Supplies = Record<Resource, number>;
export type Tile = { terrain: Terrain; elevation: number; object: ObjectKind };
export type WorldSave = {
  version: 2;
  x: number;
  y: number;
  day: number;
  energy: number;
  supplies: Supplies;
  projects: number;
  harvested: string[];
  steps: number;
};
export type Project = { name: string; hint: string; costs: Partial<Supplies>; site: [number, number]; roof: string };
export const PROJECTS: readonly Project[] = [
  { name: "Lều gỗ", hint: "Một mái nhà ấm áp cho Buddy", costs: { wood: 4, stone: 2 }, site: [-2, -2], roof: "#e7aa78" },
  { name: "Giếng nước", hint: "Nguồn nước sạch ở khu trại", costs: { wood: 3, stone: 3, water: 2 }, site: [0, -3], roof: "#86c6d4" },
  { name: "Vườn quả", hint: "Trồng cây và thu hoạch trái", costs: { wood: 3, stone: 2, food: 2 }, site: [2, -3], roof: "#c9d97e" },
  { name: "Cầu nhỏ", hint: "Con đường mới qua vườn", costs: { wood: 6, stone: 3 }, site: [4, -2], roof: "#c89a6c" },
  { name: "Thư viện", hint: "Ngôi nhà dành cho sách", costs: { wood: 6, stone: 2, food: 2 }, site: [4, 1], roof: "#b9b4e7" },
  { name: "Tháp sao", hint: "Ngắm bầu trời lúc tối", costs: { wood: 4, stone: 6, water: 2 }, site: [3, 4], roof: "#cab1e6" },
  { name: "Xưởng gỗ", hint: "Cùng tạo đồ dùng mới", costs: { wood: 7, stone: 4, food: 2 }, site: [0, 4], roof: "#e6b98b" },
  { name: "Nhà kính", hint: "Trồng cây quanh năm", costs: { wood: 4, stone: 5, water: 5 }, site: [-3, 3], roof: "#94d4c2" },
  { name: "Quảng trường", hint: "Nơi gặp gỡ dưới ánh đèn", costs: { wood: 6, stone: 6, food: 3 }, site: [-4, 0], roof: "#f3d38a" },
  { name: "Hải đăng", hint: "Thắp sáng toàn đảo xanh", costs: { wood: 7, stone: 7, water: 4, food: 4 }, site: [-4, -3], roof: "#f4c5ac" },
];
export const RESOURCE_LABELS: Record<Resource, string> = {
  wood: "Gỗ", stone: "Đá", water: "Nước", food: "Quả",
};
export const RESOURCE_ICONS: Record<Resource, string> = {
  wood: "🪵", stone: "🪨", water: "💧", food: "🍓",
};

export function inside(x: number, y: number) {
  return Number.isInteger(x) && Number.isInteger(y) &&
    x >= 0 && y >= 0 && x < WORLD_SIZE && y < WORLD_SIZE;
}
export function keyOf(x: number, y: number) { return String(x) + "," + String(y); }
/** Integer hash avoids drifting procedural worlds across refreshes. */
export function noise(x: number, y: number, salt = 0) {
  let n = (Math.imul(x + 14671, 374761393) + Math.imul(y + 9176, 668265263) + salt) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
export function projectSite(x: number, y: number) {
  return PROJECTS.findIndex((p) => HOME + p.site[0] === x && HOME + p.site[1] === y);
}
const special: Record<string, ObjectKind> = {
  [keyOf(HOME - 3, HOME)]: "tree",
  [keyOf(HOME + 3, HOME)]: "stone",
  [keyOf(HOME, HOME - 4)]: "berry",
  [keyOf(HOME + 1, HOME + 4)]: "pine",
  [keyOf(HOME - 4, HOME + 1)]: "stone",
  [keyOf(HOME - 1, HOME + 5)]: "berry",
};
export function tileAt(x: number, y: number): Tile {
  if (!inside(x, y)) return { terrain: "water", elevation: 0, object: null };
  const dx = x - HOME, dy = y - HOME;
  const nearCamp = Math.abs(dx) <= 2 && Math.abs(dy) <= 2;
  const isSite = projectSite(x, y) !== -1;
  const lake1 = Math.hypot(x - (HOME + 7), y - (HOME + 5)) < 3.2;
  const lake2 = Math.hypot(x - 7, y - 29) < 4.5;
  const coast = Math.min(x, y, WORLD_SIZE - 1 - x, WORLD_SIZE - 1 - y);
  let terrain: Terrain = "grass";
  if (!nearCamp && !isSite && (lake1 || lake2 || (coast <= 1 && noise(x, y, 10) > .27))) {
    terrain = "water";
  } else if (!nearCamp && !isSite && (coast <= 3 || (Math.hypot(x - HOME - 7, y - HOME - 5) < 4.2))) {
    terrain = "sand";
  } else if (!nearCamp && !isSite && noise(Math.floor(x / 4), Math.floor(y / 4), 8) > .79) {
    terrain = "rock";
  }
  const elevation = nearCamp || isSite || terrain === "water" ? 0 : noise(x, y, 31) > .84 ? 2 : noise(x, y, 19) > .5 ? 1 : 0;
  if (terrain === "water") return { terrain, elevation: 0, object: null };
  if ((nearCamp && x === HOME && y === HOME) || isSite) return { terrain: "grass", elevation: 0, object: null };
  if (special[keyOf(x, y)] !== undefined) return { terrain: "grass", elevation, object: special[keyOf(x, y)] };
  if (nearCamp) return { terrain: "grass", elevation, object: noise(x, y, 32) > .7 ? "flower" : null };
  const p = noise(x, y, 1);
  const biome = noise(Math.floor(x / 5), Math.floor(y / 5), 4);
  const object: ObjectKind = terrain === "sand"
    ? p > .93 ? "grass" : null
    : terrain === "rock"
      ? p > .68 ? "stone" : p > .58 ? "pine" : null
      : p > .87 ? "stone"
        : p > (biome > .55 ? .56 : .71) ? (noise(x, y, 2) > .62 ? "pine" : "tree")
        : p > .47 && p < .54 ? "berry" : p > .35 && p < .43 ? "flower" : p < .1 ? "grass" : null;
  return { terrain, elevation, object };
}
export function resourceAt(x: number, y: number): Resource | null {
  const t = tileAt(x, y);
  if (t.terrain === "water") return "water";
  if (t.object === "tree" || t.object === "pine") return "wood";
  if (t.object === "stone") return "stone";
  if (t.object === "berry") return "food";
  return null;
}
export function initialWorld(): WorldSave {
  return { version: 2, x: HOME, y: HOME, day: 1, energy: MAX_ENERGY,
    supplies: { wood: 0, stone: 0, water: 2, food: 2 }, projects: 0, harvested: [], steps: 0 };
}
function validCount(n: unknown, max: number) {
  return typeof n === "number" && Number.isSafeInteger(n) && n >= 0 && n <= max;
}
export function decodeWorld(input: unknown, legacy = false): WorldSave | null {
  if (!input || typeof input !== "object") return null;
  const item = input as Partial<WorldSave>;
  const max = legacy ? 6 : WORLD_SIZE - 1;
  if (!validCount(item.x, max) || !validCount(item.y, max) ||
    !validCount(item.day, 999999) || item.day === 0 ||
    !validCount(item.energy, legacy ? 12 : MAX_ENERGY) ||
    !validCount(item.steps, 999999999) || !validCount(item.projects, PROJECTS.length) ||
    !item.supplies || typeof item.supplies !== "object" ||
    !(["wood", "stone", "food", "water"] as Resource[]).every((r) => validCount(item.supplies?.[r], 99999)) ||
    !Array.isArray(item.harvested)) return null;
  const harvested: string[] = [];
  for (const candidate of item.harvested) {
    if (typeof candidate !== "string") continue;
    const match = /^(\d{1,2}),(\d{1,2})$/.exec(candidate);
    if (!match) continue;
    const x = Number(match[1]), y = Number(match[2]);
    if (!inside(x + (legacy ? HOME - 3 : 0), y + (legacy ? HOME - 3 : 0))) continue;
    harvested.push(legacy ? keyOf(x + HOME - 3, y + HOME - 3) : candidate);
    if (harvested.length >= WORLD_SIZE * WORLD_SIZE) break;
  }
  return {
    version: 2, x: (item.x as number) + (legacy ? HOME - 3 : 0),
    y: (item.y as number) + (legacy ? HOME - 3 : 0),
    day: item.day as number,
    energy: legacy ? Math.round((item.energy as number) / 12 * MAX_ENERGY) : item.energy as number,
    steps: item.steps as number, projects: item.projects as number,
    supplies: { ...item.supplies } as Supplies, harvested,
  };
}
export function loadWorld(): WorldSave {
  try {
    const now = localStorage.getItem(WORLD_SAVE_KEY);
    if (now) {
      const parsed = decodeWorld(JSON.parse(now));
      if (parsed) return parsed;
    }
    const old = localStorage.getItem(LEGACY_SAVE_KEY);
    if (old) {
      const migrated = decodeWorld(JSON.parse(old), true);
      if (migrated) return migrated;
    }
  } catch { /* Local storage is unavailable or data was invalid. */ }
  return initialWorld();
}
export function storeWorld(world: WorldSave) {
  try { localStorage.setItem(WORLD_SAVE_KEY, JSON.stringify(world)); } catch { /* Device storage is optional. */ }
}
export function isBlocked(world: WorldSave, x: number, y: number) {
  if (!inside(x, y) || tileAt(x, y).terrain === "water") return true;
  const site = projectSite(x, y);
  if (site !== -1 && site < world.projects) return true;
  const kind = tileAt(x, y).object;
  return !!(kind === "tree" || kind === "pine" || kind === "stone") &&
    !world.harvested.includes(keyOf(x, y));
}
export function stepWorld(world: WorldSave, dx: number, dy: number): WorldSave | null {
  if (Math.abs(dx) + Math.abs(dy) !== 1 || world.energy < 1) return null;
  const x = world.x + dx, y = world.y + dy;
  if (isBlocked(world, x, y)) return null;
  return { ...world, x, y, steps: world.steps + 1, energy: world.energy - 1 };
}
export function gatherWorld(world: WorldSave, x: number, y: number): WorldSave | null {
  if (!inside(x, y) || Math.abs(world.x - x) + Math.abs(world.y - y) > 1 ||
    world.energy < 3 || world.harvested.includes(keyOf(x, y))) return null;
  const resource = resourceAt(x, y);
  if (!resource) return null;
  return {
    ...world,
    energy: world.energy - 3,
    harvested: [...world.harvested, keyOf(x, y)],
    supplies: { ...world.supplies, [resource]: world.supplies[resource] + (resource === "water" ? 3 : 2) },
  };
}
export function canBuild(world: WorldSave) {
  const next = PROJECTS[world.projects];
  if (!next || Math.abs(world.x - HOME) + Math.abs(world.y - HOME) > 3) return false;
  return (Object.entries(next.costs) as [Resource, number][])
    .every(([type, count]) => world.supplies[type] >= count);
}
export function buildWorld(world: WorldSave): WorldSave | null {
  const next = PROJECTS[world.projects];
  if (!next || !canBuild(world)) return null;
  const supplies = { ...world.supplies };
  for (const [resource, count] of Object.entries(next.costs) as [Resource, number][]) supplies[resource] -= count;
  return { ...world, projects: world.projects + 1, supplies };
}
export function restWorld(world: WorldSave): WorldSave {
  const atHome = Math.abs(world.x - HOME) + Math.abs(world.y - HOME) <= 2;
  return { ...world,
    energy: atHome ? MAX_ENERGY : Math.min(MAX_ENERGY, world.energy + 35),
    ...(atHome ? { day: world.day + 1, harvested: [] } : {}),
  };
}
