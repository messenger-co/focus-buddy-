import { describe, expect, it } from "vitest";
import { USA_TANK_FLAG_URL } from "./tankPaint";
import {
  createTankState, IDLE_INPUT, LAST_WAVE, spawnDelayForWave, stepTank,
  TANK_DURATION, TANK_HEIGHT, TANK_WIDTH, waveAt,
  type TankInput,
} from "./tankGame";

const random = () => .5;
describe("Winter Front tank defense", () => {
  it("loads the exact USA flag artwork for enemy tanks from the repo root", () => {
    expect(decodeURIComponent(USA_TANK_FLAG_URL)).toContain("/main/usa flag.webp");
    expect(USA_TANK_FLAG_URL).toContain("usa%20flag.webp");
  });
  it("spawns enemy tanks with distinct scout, regular and armored hit points", () => {
    const regular=createTankState();regular.phase="running";
    stepTank(regular,IDLE_INPUT,.045,()=>.5);
    regular.spawnDelay=0;
    stepTank(regular,IDLE_INPUT,.045,()=>.5);
    expect(regular.troops[0]?.hp).toBe(2);

    const armored=createTankState();armored.phase="running";armored.spawnDelay=0;
    stepTank(armored,IDLE_INPUT,.045,()=>.99);
    expect(armored.troops[0]?.hp).toBe(4);
  });
  it("starts ready with health, base and zero score", () => {
    const game=createTankState();
    expect(game.phase).toBe("ready");
    expect(game.player.hp).toBe(100);
    expect(game.baseHp).toBe(100);
    expect(game.defeated).toBe(0);
    expect(stepTank(game,IDLE_INPUT,.04,random).elapsed).toBe(0);
  });
  it("has five escalating waves and a strictly harder spawn interval", () => {
    expect(waveAt(0)).toBe(1);
    expect(waveAt(19.1)).toBe(2);
    expect(waveAt(38.5)).toBe(3);
    expect(waveAt(77)).toBe(5);
    expect(waveAt(200)).toBe(LAST_WAVE);
    expect(spawnDelayForWave(5)).toBeLessThan(spawnDelayForWave(1));
  });
  it("clamps tank movement to safe on-screen coordinates", () => {
    const game=createTankState();game.phase="running";
    const input:TankInput={...IDLE_INPUT,left:true,down:true};
    for(let i=0;i<50;i++)stepTank(game,input,.04,random);
    expect(game.player.x).toBeGreaterThanOrEqual(34);
    expect(game.player.y).toBeLessThanOrEqual(TANK_HEIGHT-45);
    expect(game.player.x).toBeLessThanOrEqual(TANK_WIDTH-34);
  });
  it("spawns troops, shoots and prevents unlimited heat or projectile growth", () => {
    const game=createTankState();game.phase="running";
    const input:TankInput={...IDLE_INPUT,firing:true};
    for(let i=0;i<100;i++)stepTank(game,input,.04,random);
    expect(game.elapsed).toBeGreaterThan(3);
    expect(game.nextId).toBeGreaterThan(0); // An enemy spawned; a successful shot may already have cleared it.
    expect(game.player.heat).toBeGreaterThanOrEqual(0);
    expect(game.player.heat).toBeLessThanOrEqual(102);
    expect(game.shots.length).toBeLessThanOrEqual(26);
  });
  it("awards points for stopping an incoming target without graphic effects", () => {
    const game=createTankState();game.phase="running";
    game.spawnDelay=99;
    game.troops=[{id:1,x:450,y:400,hp:1,speed:0,type:"regular",shotTimer:99,wobble:0}];
    const input:TankInput={...IDLE_INPUT,firing:true,aimX:450,aimY:0};
    for(let i=0;i<10;i++)stepTank(game,input,.02,random);
    expect(game.defeated).toBe(1);
    expect(game.score).toBeGreaterThan(0);
    expect(game.troops).toHaveLength(0);
  });
  it("loses if enemies reach the defended base and wins after 95 seconds", () => {
    const losing=createTankState();losing.phase="running";losing.spawnDelay=99;losing.baseHp=10;
    losing.troops=[{id:1,x:300,y:TANK_HEIGHT-22,hp:1,speed:50,type:"regular",shotTimer:99,wobble:0}];
    stepTank(losing,IDLE_INPUT,.04,random);
    expect(losing.phase).toBe("lost");
    expect(losing.baseHp).toBe(0);
    const winning=createTankState();winning.phase="running";winning.spawnDelay=99;
    winning.elapsed=TANK_DURATION-.01;
    stepTank(winning,IDLE_INPUT,.02,random);
    expect(winning.phase).toBe("won");
    expect(stepTank(winning,IDLE_INPUT,1,random).phase).toBe("won");
  });
});
