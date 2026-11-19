/** Fictional winter-front arcade game with stylized enemy tanks. Non-graphic alternate history.
 * A deterministic state machine when a seeded random source is supplied.
 */
export const TANK_WIDTH = 900;
export const TANK_HEIGHT = 540;
export const TANK_DURATION = 95;
export const WAVE_SECONDS = 19;
export const LAST_WAVE = 5;

export type TankPhase = "ready" | "running" | "paused" | "won" | "lost";
export type TroopType = "scout" | "regular" | "armored";
export type TankPlayer = {
  x: number; y: number; hp: number; heat: number;
  cooldown: number; invulnerable: number;
};
export type Troop = {
  id: number; x: number; y: number; hp: number;
  speed: number; type: TroopType; shotTimer: number;
  wobble: number;
};
export type Projectile = {
  x: number; y: number; vx: number; vy: number;
  radius: number; ttl: number;
};
export type Spark = {
  x: number; y: number; vx: number; vy: number;
  ttl: number; maxTtl: number; size: number;
};
export type TankState = {
  phase: TankPhase;
  elapsed: number;
  wave: number;
  score: number;
  defeated: number;
  baseHp: number;
  player: TankPlayer;
  troops: Troop[];
  shots: Projectile[];
  hostileShots: Projectile[];
  sparks: Spark[];
  spawnDelay: number;
  nextId: number;
};
export type TankInput = {
  left: boolean; right: boolean; up: boolean; down: boolean;
  firing: boolean; aimX: number; aimY: number;
};
export const IDLE_INPUT: Readonly<TankInput> = {
  left: false, right: false, up: false, down: false,
  firing: false, aimX: TANK_WIDTH / 2, aimY: 40,
};

export function createTankState(): TankState {
  return {
    phase: "ready", elapsed: 0, wave: 1, score: 0, defeated: 0,
    baseHp: 100, player: {
      x: 450, y: 450, hp: 100, heat: 0,
      cooldown: 0, invulnerable: 0,
    },
    troops: [], shots: [], hostileShots: [], sparks: [],
    spawnDelay: .85, nextId: 0,
  };
}
export function waveAt(time: number): number {
  return Math.min(LAST_WAVE, Math.max(1, 1 + Math.floor(time / WAVE_SECONDS)));
}
export function spawnDelayForWave(wave: number): number {
  return Math.max(.24, .9 - wave * .125);
}
const clamp = (n: number, low: number, high: number) =>
  Math.min(high, Math.max(low, n));
const distanceSq = (a: {x: number; y: number}, b: {x: number; y: number}) => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
};
function sparksAt(state: TankState, x: number, y: number, random: () => number, amount = 7) {
  for (let i = 0; i < amount && state.sparks.length < 96; i++) {
    const angle = random() * Math.PI * 2;
    const speed = 32 + random() * 80;
    const ttl = .18 + random() * .3;
    state.sparks.push({
      x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      ttl, maxTtl: ttl, size: 1.6 + random() * 2.2,
    });
  }
}
function spawnTroop(state: TankState, random: () => number) {
  if (state.troops.length >= 46) return;
  const roll = random();
  const type: TroopType = roll < .17 + state.wave * .02 ? "scout"
    : roll > .84 - state.wave * .025 ? "armored" : "regular";
  const speed = (type === "scout" ? 75 : type === "armored" ? 32 : 51) +
    state.wave * (type === "scout" ? 10 : 8) + random() * 15;
  state.troops.push({
    id: ++state.nextId, x: 30 + random() * (TANK_WIDTH - 60),
    y: -18, hp: type === "armored" ? 4 : type === "regular" ? 2 : 1,
    type, speed, shotTimer: 1.1 + random() * 2.4,
    wobble: random() * 7,
  });
}
function fireTank(state: TankState, input: TankInput) {
  const tank = state.player;
  if (!input.firing || tank.cooldown > 0 || tank.heat > 86 ||
      state.shots.length >= 26) return;
  let vx = input.aimX - tank.x;
  let vy = input.aimY - tank.y;
  const magnitude = Math.hypot(vx, vy);
  if (magnitude < 5) { vx = 0; vy = -1; }
  else { vx /= magnitude; vy /= magnitude; }
  state.shots.push({
    x: tank.x + vx * 28, y: tank.y + vy * 28,
    vx: vx * 780, vy: vy * 780, radius: 5, ttl: 1.35,
  });
  tank.cooldown = .185;
  tank.heat += 15;
}
function moveProjectile(projectile: Projectile, dt: number) {
  projectile.x += projectile.vx * dt;
  projectile.y += projectile.vy * dt;
  projectile.ttl -= dt;
}
function expired(p: Projectile) {
  return p.ttl <= 0 || p.x < -35 || p.x > TANK_WIDTH + 35 ||
    p.y < -60 || p.y > TANK_HEIGHT + 60;
}

/** State updates are in-place for the requestAnimationFrame loop.
 * No React render is required for individual enemies or bullets.
 */
export function stepTank(
  state: TankState, input: TankInput, delta: number,
  random: () => number = Math.random,
): TankState {
  if (state.phase !== "running") return state;
  const dt = clamp(delta, 0, .045);
  if (dt === 0) return state;
  state.elapsed += dt;
  state.wave = waveAt(state.elapsed);
  const player = state.player;

  const horizontal = Number(input.right) - Number(input.left);
  const vertical = Number(input.down) - Number(input.up);
  const len = Math.max(1, Math.hypot(horizontal, vertical));
  player.x = clamp(player.x + horizontal / len * dt * 310, 34, TANK_WIDTH - 34);
  player.y = clamp(player.y + vertical / len * dt * 235, 310, TANK_HEIGHT - 45);
  player.heat = Math.max(0, player.heat - dt * 34);
  player.cooldown = Math.max(0, player.cooldown - dt);
  player.invulnerable = Math.max(0, player.invulnerable - dt);
  fireTank(state, input);

  state.spawnDelay -= dt;
  if (state.spawnDelay <= 0) {
    spawnTroop(state, random);
    state.spawnDelay += spawnDelayForWave(state.wave) * (.8 + random() * .35);
  }

  for (let i = state.troops.length - 1; i >= 0; i--) {
    const troop = state.troops[i];
    troop.wobble += dt * (troop.type === "scout" ? 4.2 : 2.4);
    troop.x += Math.sin(troop.wobble) * dt * (troop.type === "scout" ? 24 : 9);
    troop.x = clamp(troop.x, 20, TANK_WIDTH - 20);
    troop.y += troop.speed * dt;
    troop.shotTimer -= dt;

    if (troop.shotTimer <= 0 && troop.y > 30 && troop.y < TANK_HEIGHT - 110 &&
        state.hostileShots.length < 42) {
      const dx = player.x - troop.x;
      const dy = player.y - troop.y;
      const norm = Math.max(1, Math.hypot(dx, dy));
      const velocity = 158 + state.wave * 20;
      state.hostileShots.push({
        x: troop.x, y: troop.y + 10,
        vx: dx / norm * velocity, vy: dy / norm * velocity,
        radius: 4, ttl: 3.1,
      });
      troop.shotTimer = (troop.type === "scout" ? 2.1 : 2.8) +
        random() * 1.3 - state.wave * .12;
    }
    if (troop.y > TANK_HEIGHT - 22) {
      state.baseHp = Math.max(0, state.baseHp - (troop.type === "armored" ? 24 : 13));
      state.troops.splice(i, 1);
      sparksAt(state, troop.x, TANK_HEIGHT - 23, random, 4);
    }
  }
  for (let i = state.shots.length - 1; i >= 0; i--) {
    const projectile = state.shots[i];
    moveProjectile(projectile, dt);
    if (expired(projectile)) { state.shots.splice(i, 1); continue; }
    for (let j = state.troops.length - 1; j >= 0; j--) {
      const troop = state.troops[j];
      const radius = troop.type === "armored" ? 31 : troop.type === "regular" ? 27 : 23;
      if (distanceSq(projectile, troop) > (projectile.radius + radius) ** 2) continue;
      state.shots.splice(i, 1);
      troop.hp--;
      sparksAt(state, troop.x, troop.y, random, troop.hp <= 0 ? 8 : 4);
      if (troop.hp <= 0) {
        state.defeated++;
        state.score += (troop.type === "scout" ? 140 : troop.type === "armored" ? 220 : 100) *
          state.wave;
        state.troops.splice(j, 1);
      }
      break;
    }
  }
  for (let i = state.hostileShots.length - 1; i >= 0; i--) {
    const projectile = state.hostileShots[i];
    moveProjectile(projectile, dt);
    if (expired(projectile)) { state.hostileShots.splice(i, 1); continue; }
    if (player.invulnerable <= 0 && distanceSq(projectile, player) < 23 ** 2) {
      player.hp = Math.max(0, player.hp - (state.wave >= 4 ? 18 : 13));
      player.invulnerable = .68;
      sparksAt(state, player.x, player.y, random, 6);
      state.hostileShots.splice(i, 1);
    }
  }
  for (let i = state.sparks.length - 1; i >= 0; i--) {
    const spark = state.sparks[i];
    spark.x += spark.vx * dt;
    spark.y += spark.vy * dt;
    spark.ttl -= dt;
    if (spark.ttl <= 0) state.sparks.splice(i, 1);
  }
  if (player.hp <= 0 || state.baseHp <= 0) state.phase = "lost";
  else if (state.elapsed >= TANK_DURATION) state.phase = "won";
  return state;
}
