import { describe, expect, it } from "vitest";
import {
  HOME, PROJECTS, WORLD_SIZE, buildWorld, canBuild, decodeWorld,
  gatherWorld, initialWorld, isBlocked, keyOf, resourceAt,
  restWorld, stepWorld, tileAt,
} from "./world";
import { isoPoint, tileFromScreen } from "./paint";

describe("Buddy Survival block-world", () => {
  it("is a deterministic 40x40 world with safe spawn and useful landmarks", () => {
    expect(WORLD_SIZE).toBe(40);
    expect(tileAt(HOME, HOME)).toEqual({ terrain: "grass", elevation: 0, object: null });
    expect(tileAt(HOME-3, HOME).object).toBe("tree");
    expect(resourceAt(HOME+3, HOME)).toBe("stone");
    expect(resourceAt(HOME, HOME-4)).toBe("food");
    expect(tileAt(HOME+7, HOME+5).terrain).toBe("water");
    expect(tileAt(12, 12)).toEqual(tileAt(12, 12));
  });
  it("blocks water and solid trees but opens terrain when harvested", () => {
    const world = { ...initialWorld(), x: HOME-2, y: HOME };
    expect(isBlocked(world, HOME-3, HOME)).toBe(true);
    expect(stepWorld(world, -1, 0)).toBeNull();
    const gathered = gatherWorld(world, HOME-3, HOME);
    expect(gathered?.supplies.wood).toBe(2);
    expect(gathered?.energy).toBe(world.energy-3);
    expect(gatherWorld(gathered!, HOME-3, HOME)).toBeNull();
    expect(stepWorld(gathered!, -1, 0)?.x).toBe(HOME-3);
  });
  it("offers a finite ten-chapter building progression", () => {
    expect(PROJECTS).toHaveLength(10);
    const ready = { ...initialWorld(),
      supplies: { wood: 100, stone: 100, water: 100, food: 100 } };
    expect(canBuild(ready)).toBe(true);
    const built = buildWorld(ready);
    expect(built?.projects).toBe(1);
    expect(built!.supplies.wood).toBe(96);
    const finished = { ...ready, projects: PROJECTS.length };
    expect(canBuild(finished)).toBe(false);
    expect(buildWorld(finished)).toBeNull();
  });
  it("restores daily resources when returning to camp", () => {
    const world = { ...initialWorld(), harvested: [keyOf(HOME-3,HOME)], energy: 4 };
    const rested = restWorld(world);
    expect(rested.day).toBe(2);
    expect(rested.energy).toBe(100);
    expect(rested.harvested).toEqual([]);
    const away = restWorld({ ...world, x:HOME+9,y:HOME+9 });
    expect(away.day).toBe(world.day);
    expect(away.energy).toBe(39);
  });
  it("migrates existing old local saves without losing inventory or buildings", () => {
    const old = {
      x:3, y:4, day:6, energy:9, steps:120, projects:4,
      supplies:{ wood:11, stone:13, food:5, water:7 },
      harvested:["0,0","6,6","junk"],
    };
    const migrated = decodeWorld(old, true);
    expect(migrated).toMatchObject({
      version:2, x:HOME, y:HOME+1, day:6, energy:75, steps:120, projects:4,
      supplies:old.supplies,
    });
    expect(migrated?.harvested).toContain(keyOf(HOME-3,HOME-3));
    expect(migrated?.harvested).toContain(keyOf(HOME+3,HOME+3));
    expect(decodeWorld({ ...old, supplies:{wood:-1} }, true)).toBeNull();
  });
  it("uses reversible coordinates to select isometric terrain tiles", () => {
    const [width,height] = [850,560];
    const point = isoPoint(HOME+4,HOME-2,HOME,HOME,width,height);
    expect(tileFromScreen(point.x,point.y,HOME,HOME,width,height))
      .toEqual({x:HOME+4,y:HOME-2});
  });
});
