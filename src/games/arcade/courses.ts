export type AdventureMode = "jump" | "glide";
export type Biome = "grove" | "coral" | "night";
export const adventures = [
  {
    mode: "jump",
    slug: "dao-may",
    title: "Bước nhảy Đảo Mây",
    blurb: "Bật nấm lò xo, nhảy qua đảo nổi và mở cổng sao.",
  },
  {
    mode: "glide",
    slug: "canh-luon",
    title: "Cánh lượn ngân hà",
    blurb: "Lái cánh diều qua vòng sáng giữa những đám mây giông.",
  },
] as const;
export const HEIGHT = 260;
export interface Point {
  x: number;
  y: number;
}
export interface Island extends Point {
  width: number;
  drift?: number;
  spring?: number;
  thorns?: number;
}
export interface Course {
  mode: AdventureMode;
  biome: Biome;
  title: string;
  goal: number;
  islands: Island[];
  gems: Point[];
  checkpoint: Point;
  storms: Point[];
  speed: number;
}
const land = (
  x: number,
  y: number,
  width: number,
  extras: Partial<Pick<Island, "drift" | "spring" | "thorns">> = {},
): Island => ({ x, y, width, ...extras });

const jumps: Course[] = [
  {
    mode: "jump",
    biome: "grove",
    title: "Thung lũng ngọc",
    goal: 1512,
    speed: 168,
    islands: [
      land(-40, 207, 234),
      land(246, 187, 110),
      land(415, 203, 183, { spring: 122 }),
      land(514, 116, 85),
      land(675, 179, 186),
      land(921, 162, 98, { drift: 14 }),
      land(1088, 197, 174, { thorns: 91 }),
      land(1320, 179, 247),
    ],
    checkpoint: { x: 727, y: 179 },
    gems: [
      { x: 163, y: 176 },
      { x: 291, y: 155 },
      { x: 553, y: 89 },
      { x: 802, y: 148 },
      { x: 1000, y: 116 },
      { x: 1187, y: 139 },
      { x: 1437, y: 145 },
    ],
    storms: [],
  },
  {
    mode: "jump",
    biome: "coral",
    title: "Hẻm nấm lò xo",
    goal: 1715,
    speed: 174,
    islands: [
      land(-40, 207, 210, { spring: 170 }),
      land(236, 145, 104),
      land(406, 185, 154, { thorns: 90 }),
      land(626, 176, 100, { drift: 18 }),
      land(808, 192, 188, { spring: 141 }),
      land(1037, 110, 110),
      land(1216, 158, 88, { drift: 16 }),
      land(1383, 192, 103),
      land(1548, 171, 221),
    ],
    checkpoint: { x: 852, y: 192 },
    gems: [
      { x: 135, y: 127 },
      { x: 294, y: 117 },
      { x: 500, y: 130 },
      { x: 675, y: 141 },
      { x: 933, y: 132 },
      { x: 1101, y: 81 },
      { x: 1260, y: 122 },
      { x: 1434, y: 161 },
      { x: 1615, y: 140 },
    ],
    storms: [],
  },
  {
    mode: "jump",
    biome: "night",
    title: "Đài sao phương Bắc",
    goal: 1830,
    speed: 180,
    islands: [
      land(-40, 204, 223),
      land(251, 180, 87, { drift: 15 }),
      land(406, 148, 104),
      land(577, 201, 137, { spring: 87 }),
      land(788, 137, 90),
      land(940, 181, 171),
      land(1178, 161, 80, { drift: 21 }),
      land(1336, 190, 122, { thorns: 61 }),
      land(1523, 150, 95),
      land(1682, 178, 207),
    ],
    checkpoint: { x: 990, y: 181 },
    gems: [
      { x: 155, y: 174 },
      { x: 291, y: 139 },
      { x: 461, y: 116 },
      { x: 672, y: 129 },
      { x: 830, y: 106 },
      { x: 1060, y: 152 },
      { x: 1215, y: 119 },
      { x: 1397, y: 129 },
      { x: 1577, y: 116 },
      { x: 1760, y: 147 },
    ],
    storms: [],
  },
];
function flight(
  biome: Biome,
  title: string,
  speed: number,
  heights: number[],
): Course {
  const gems = heights.map((y, i) => ({ x: 210 + i * 169, y }));
  const storms = gems.flatMap((g, i) => {
    if (i % 2 === 0 || !gems[i + 1]) return [];
    const pathY = (g.y + gems[i + 1].y) / 2;
    return [
      {
        x: g.x + 75,
        y: pathY < 130 ? Math.min(204, pathY + 46) : Math.max(48, pathY - 46),
      },
    ];
  });
  const flag = gems[Math.floor(gems.length / 2)];
  return {
    mode: "glide",
    biome,
    title,
    speed,
    gems,
    islands: [],
    storms,
    goal: gems[gems.length - 1].x + 164,
    checkpoint: { x: flag.x - 28, y: flag.y },
  };
}
export const courses: Record<AdventureMode, Course[]> = {
  jump: jumps,
  glide: [
    flight(
      "night",
      "Sông sao",
      114,
      [142, 111, 88, 142, 171, 127, 82, 120, 162],
    ),
    flight(
      "grove",
      "Luồng gió xanh",
      134,
      [146, 100, 62, 124, 173, 141, 83, 111, 165, 103],
    ),
    flight(
      "coral",
      "Ráng chiều",
      149,
      [140, 94, 148, 180, 98, 69, 139, 177, 106, 63, 133],
    ),
  ],
};
