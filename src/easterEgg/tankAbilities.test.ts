import { describe, expect, it } from "vitest";
import {
  ALLY_CARDS, canRecruit, createTankState, launchMissile, MISSILE_COOLDOWN,
  MAX_ALLIES, recruitAlly, spawnDelayForWave, stepTank, IDLE_INPUT,
} from "./tankGame";
const stable=()=>.5;
describe("friendlier Winter Front abilities",()=>{
  it("has slower enemy arrivals than old hard mode",()=>{
    expect(spawnDelayForWave(1)).toBeGreaterThan(2.5);
    expect(spawnDelayForWave(5)).toBeGreaterThan(1.5);
    const game=createTankState();
    game.phase="running";
    for(let i=0;i<35;i++)stepTank(game,IDLE_INPUT,.04,stable);
    expect(game.troops).toHaveLength(0);
  });
  it("fires an area-effect missile once per 13-second cooldown",()=>{
    const game=createTankState();
    game.phase="running";
    game.troops=[
      {id:10,x:450,y:190,hp:4,speed:0,type:"armored",shotTimer:99,wobble:0},
      {id:11,x:490,y:205,hp:2,speed:0,type:"regular",shotTimer:99,wobble:0},
      {id:12,x:780,y:100,hp:2,speed:0,type:"regular",shotTimer:99,wobble:0},
    ];
    expect(launchMissile(game,470,200,stable)).toBe(true);
    expect(game.troops.map(x=>x.id)).toEqual([12]);
    expect(game.defeated).toBe(2);
    expect(game.missileCooldown).toBe(MISSILE_COOLDOWN);
    expect(launchMissile(game,780,100,stable)).toBe(false);
    for(let i=0;i<300;i++)stepTank(game,IDLE_INPUT,.04,stable);
    expect(game.missileCooldown).toBeGreaterThan(0);
    for(let i=0;i<35;i++)stepTank(game,IDLE_INPUT,.04,stable);
    expect(game.missileCooldown).toBe(0);
  });
  it("lets players recruit actual auto-fighting allied soldiers",()=>{
    const game=createTankState();game.phase="running";game.credits=900;
    expect(ALLY_CARDS).toHaveLength(3);
    expect(recruitAlly(game,"rifle")).toBe(true);
    expect(recruitAlly(game,"ranger")).toBe(true);
    expect(recruitAlly(game,"guard")).toBe(true);
    expect(game.allies).toHaveLength(3);
    expect(game.credits).toBe(900-100-160-130);
    const target={id:12,x:115,y:400,hp:2,speed:0,type:"regular" as const,shotTimer:99,wobble:0};
    game.troops.push(target);
    game.spawnDelay=99;
    for(let i=0;i<55;i++)stepTank(game,IDLE_INPUT,.04,stable);
    expect(game.defeated).toBeGreaterThanOrEqual(1);
  });
  it("limits squads to six and two of each card",()=>{
    const game=createTankState();game.phase="running";game.credits=9999;
    for(const card of ALLY_CARDS){
      expect(recruitAlly(game,card.kind)).toBe(true);
      expect(recruitAlly(game,card.kind)).toBe(true);
      expect(canRecruit(game,card.kind)).toBe(false);
    }
    expect(game.allies).toHaveLength(MAX_ALLIES);
    expect(recruitAlly(game,"rifle")).toBe(false);
  });
  it("does not launch a missile while paused or after losing",()=>{
    const game=createTankState();
    expect(launchMissile(game,400,100,stable)).toBe(false);
    game.phase="paused";
    expect(launchMissile(game,400,100,stable)).toBe(false);
  });
});
