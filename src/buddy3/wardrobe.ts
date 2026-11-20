import { useSyncExternalStore } from "react";
import {
  ACCESSORIES,
  COLORS,
  COMPANIONS,
  type BuddyAccessory,
  type CompanionColor,
  type CompanionKind,
} from "../data";

export const bodies = {
  original: { label: "Màu tự nhiên", shades: null },
  honey: { label: "Mật ong", shades: ["#fcda9b", "#d19c62"] },
  jade: { label: "Trà xanh", shades: ["#b7e2ce", "#6cad9d"] },
  lilac: { label: "Hoa tử đinh hương", shades: ["#d8caef", "#a58ebc"] },
  sorbet: { label: "Kem dâu", shades: ["#f8c7cb", "#d793a2"] },
  mist: { label: "Mây xanh", shades: ["#badde9", "#82a6c0"] },
} as const;
export const clothes = {
  plain: "Không mặc áo",
  hoodie: "Áo có mũ",
  sweater: "Áo len",
  jacket: "Áo khoác",
  school: "Đồng phục",
  pajamas: "Đồ ngủ",
  sport: "Áo thể thao",
  astronaut: "Đồ phi hành",
  overalls: "Yếm làm vườn",
  smock: "Tạp dề họa sĩ",
  sailor: "Áo thủy thủ",
} as const;
export const hats = {
  none: "Không thêm mũ",
  cap: "Mũ lưỡi trai",
  wool: "Mũ len bông",
  headband: "Băng đô",
  blossom: "Hoa anh đào",
  winter: "Mũ mùa đông",
  laurels: "Vòng nguyệt quế",
  straw: "Nón rơm",
  painter: "Mũ nồi họa sĩ",
  mariner: "Mũ thủy thủ",
} as const;
export const studyTools = {
  book: "Sách mở",
  journal: "Sổ ép lá",
  sketchpad: "Sổ ký họa",
  chart: "Bản đồ sao",
} as const;
export const eyewear = {
  none: "Để trống",
  shades: "Kính râm",
  heart: "Kính trái tim",
} as const;
export const effects = {
  none: "Tắt hiệu ứng",
  sparkle: "Đom đóm",
  stars: "Sao nổi",
  hearts: "Tim hồng",
  glow: "Viền sáng",
} as const;
export const textures = {
  soft: "Mịn",
  freckles: "Lốm đốm",
  stitch: "Đường chỉ",
} as const;
export const eyes = {
  bright: "Long lanh",
  crescent: "Trăng khuyết",
  button: "Mắt cúc áo",
  star: "Ánh sao",
} as const;
export const faces = {
  auto: "Tự nhiên",
  happy: "Vui vẻ",
  curious: "Tò mò",
  excited: "Háo hức",
  surprised: "Ngạc nhiên",
  relaxed: "Thư thái",
} as const;
export const personalities = {
  calm: "Điềm tĩnh",
  playful: "Tinh nghịch",
  sunny: "Vui tươi",
  curious: "Tò mò",
  coach: "Khích lệ",
} as const;
export const motionStyles = {
  gentle: "Nhẹ nhàng",
  lively: "Nhún nhảy",
  still: "Tĩnh",
} as const;
export const dyes = {
  sage: ["#80ac9b", "#456e67"],
  berry: ["#cf8797", "#985969"],
  denim: ["#90abc5", "#56708a"],
  umber: ["#cb9b73", "#8d674d"],
  iris: ["#ab99ce", "#766491"],
} as const;
export const dyeNames = {
  sage: "Lá thơm",
  berry: "Mâm xôi",
  denim: "Xanh vải",
  umber: "Ca cao",
  iris: "Diên vĩ",
};
export const bags = {
  none: "Không đeo",
  satchel: "Túi đeo chéo",
  pack: "Ba lô thám hiểm",
} as const;
export type Wardrobe = {
  body: keyof typeof bodies;
  garment: keyof typeof clothes;
  hat: keyof typeof hats;
  eyes: keyof typeof eyes;
  studyTool: keyof typeof studyTools;
  face: keyof typeof faces;
  dye: keyof typeof dyes;
  glasses: keyof typeof eyewear;
  bag: keyof typeof bags;
  effect: keyof typeof effects;
  texture: keyof typeof textures;
  personality: keyof typeof personalities;
  motion: keyof typeof motionStyles;
  x: number;
  y: number;
};
export type BaseLook = {
  companion: CompanionKind;
  color: CompanionColor;
  accessory: BuddyAccessory;
};
export type SavedLook = { name: string; look: Wardrobe; base: BaseLook };
type Store = { look: Wardrobe; outfits: SavedLook[] };
export const initialLook: Wardrobe = {
  body: "original",
  studyTool: "book",
  garment: "plain",
  hat: "none",
  eyes: "bright",
  face: "auto",
  dye: "sage",
  glasses: "none",
  bag: "none",
  effect: "none",
  texture: "soft",
  personality: "playful",
  motion: "gentle",
  x: 0,
  y: 0,
};
export const presets: {
  label: string;
  look: Partial<Wardrobe> & Pick<Wardrobe, "dye">;
}[] = [
  {
    label: "Góc đọc sách",
    look: {
      garment: "sweater",
      hat: "wool",
      dye: "umber",
      texture: "stitch",
      personality: "calm",
    },
  },
  {
    label: "Nhà thám hiểm",
    look: {
      garment: "jacket",
      hat: "cap",
      bag: "pack",
      dye: "sage",
      face: "curious",
      personality: "curious",
    },
  },
  {
    label: "Đêm ngắm sao",
    look: {
      garment: "astronaut",
      eyes: "star",
      effect: "stars",
      dye: "iris",
      personality: "sunny",
    },
  },
  {
    label: "Ngày đến lớp",
    look: {
      garment: "school",
      hat: "blossom",
      bag: "satchel",
      dye: "denim",
      personality: "coach",
    },
  },
  {
    label: "Nhà thực vật",
    look: {
      garment: "overalls",
      hat: "straw",
      body: "jade",
      dye: "sage",
      studyTool: "journal",
      personality: "curious",
    },
  },
  {
    label: "Họa sĩ màu nước",
    look: {
      garment: "smock",
      hat: "painter",
      dye: "berry",
      studyTool: "sketchpad",
      face: "happy",
      personality: "playful",
    },
  },
  {
    label: "Hoa tiêu nhí",
    look: {
      garment: "sailor",
      hat: "mariner",
      dye: "denim",
      studyTool: "chart",
      eyes: "star",
      personality: "calm",
    },
  },
];
const options = {
  body: bodies,
  studyTool: studyTools,
  garment: clothes,
  hat: hats,
  eyes,
  face: faces,
  dye: dyes,
  glasses: eyewear,
  bag: bags,
  effect: effects,
  texture: textures,
  personality: personalities,
  motion: motionStyles,
};
export const STORE_KEY = "focus-buddy-wardrobe-v3";
export function validateLook(input: unknown): Wardrobe {
  const look = { ...initialLook };
  if (!input || typeof input !== "object") return look;
  const data = input as Record<string, unknown>;
  for (const [field, choices] of Object.entries(options)) {
    const val = data[field];
    if (typeof val === "string" && Object.hasOwn(choices, val))
      Object.assign(look, { [field]: val });
  }
  for (const field of ["x", "y"] as const) {
    const n = data[field];
    if (typeof n === "number" && Number.isFinite(n))
      look[field] = Math.max(-22, Math.min(22, Math.round(n)));
  }
  return look;
}
function isBase(base: BaseLook | undefined): base is BaseLook {
  return (
    !!base &&
    COMPANIONS.some((x) => x.id === base.companion) &&
    COLORS.some((x) => x.id === base.color) &&
    ACCESSORIES.some((x) => x.id === base.accessory)
  );
}
export function parseWardrobe(raw: string | null): Store {
  try {
    const data = JSON.parse(raw || "{}");
    const outfits = Array.isArray(data.outfits)
      ? data.outfits
          .filter(
            (x: SavedLook) =>
              x &&
              typeof x.name === "string" &&
              x.name.trim() &&
              isBase(x.base),
          )
          .map((x: SavedLook) => ({
            name: x.name.slice(0, 32),
            look: validateLook(x.look),
            base: x.base,
          }))
      : [];
    return { look: validateLook(data.look), outfits };
  } catch {
    return { look: { ...initialLook }, outfits: [] };
  }
}
let cache: Store = parseWardrobe(null),
  last: string | null = null,
  memoryOnly = false;
function snapshot() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!memoryOnly && raw !== last) {
      last = raw;
      cache = parseWardrobe(raw);
    }
  } catch {
    /* Vẫn cho phép thử đồ trong phiên hiện tại. */
  }
  return cache;
}
const listeners = new Set<() => void>();
function write(transform: (old: Store) => Store) {
  const next = transform(snapshot());
  const raw = JSON.stringify(next);
  try {
    localStorage.setItem(STORE_KEY, raw);
    memoryOnly = false;
    last = raw;
  } catch {
    memoryOnly = true;
  }
  cache = next;
  for (const notify of listeners) notify();
  return !memoryOnly;
}
function storageChanged(e: StorageEvent) {
  if (e.key === STORE_KEY || e.key === null) {
    memoryOnly = false;
    last = null;
    cache = parseWardrobe(null);
    for (const notify of listeners) notify();
  }
}
function subscribe(fn: () => void) {
  if (listeners.size === 0) window.addEventListener("storage", storageChanged);
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
    if (!listeners.size) window.removeEventListener("storage", storageChanged);
  };
}
export function useWardrobe() {
  return useSyncExternalStore(subscribe, snapshot, () => cache);
}
export function dress(change: Partial<Wardrobe>) {
  return write((old) => ({
    ...old,
    look: validateLook({ ...old.look, ...change }),
  }));
}
export function saveOutfit(name: string, base: BaseLook) {
  const clean = name.trim().slice(0, 32);
  if (!clean || !isBase(base)) return false;
  return write((old) => ({
    ...old,
    outfits: [
      ...old.outfits.filter((x) => x.name !== clean),
      { name: clean, base, look: { ...old.look } },
    ],
  }));
}
export function removeOutfit(name: string) {
  return write((old) => ({
    ...old,
    outfits: old.outfits.filter((x) => x.name !== name),
  }));
}
function pick<T extends object>(
  values: T,
  filter?: (key: keyof T) => boolean,
): keyof T {
  const keys = (Object.keys(values) as (keyof T)[]).filter(
    (k) => !filter || filter(k),
  );
  return keys[Math.floor(Math.random() * keys.length)];
}
export function randomOutfit(xp: number): Partial<Wardrobe> {
  return {
    body: pick(bodies),
    studyTool: pick(studyTools),
    garment: pick(clothes),
    hat: pick(hats, (h) => h !== "laurels" || xp >= 100),
    dye: pick(dyes),
    glasses: pick(eyewear),
    bag: pick(bags),
    effect: pick(effects),
    texture: pick(textures),
    eyes: pick(eyes),
    x: 0,
    y: 0,
  };
}
