import {
  TANK_HEIGHT as H, TANK_WIDTH as W, TANK_DURATION,
  type TankInput, type TankState, type Troop,
} from "./tankGame";

type Canvas = CanvasRenderingContext2D;
const pi2 = Math.PI * 2;
function ellipse(ctx: Canvas, x: number, y: number, a: number, b: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, a, b, 0, 0, pi2);
  ctx.fill();
}
function line(ctx: Canvas, color: string, width: number, ...pts: number[]) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i+1]);
  ctx.stroke();
}
function snowflake(ctx: Canvas, x: number, y: number, r: number) {
  line(ctx, "#f5f9fa96", 1.3, x-r, y, x+r, y);
  line(ctx, "#f5f9fa96", 1.3, x, y-r, x, y+r);
}
function background(ctx: Canvas, time: number, effects: boolean) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#273a56");
  sky.addColorStop(.58, "#526782");
  sky.addColorStop(1, "#9fb4b7");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Soviet-era winter architecture, intentionally simple and non-graphic.
  ctx.fillStyle = "#24344c";
  for (let i = 0; i < 13; i++) {
    const x = i*86-27;
    const tall = 50 + (i*37)%46;
    ctx.fillRect(x, 76-tall/2, 72, tall);
    ctx.fillStyle = "#ffe3a84f";
    for (let col = 0; col < 3; col++) {
      for (let row = 0; row < 2; row++) {
        ctx.fillRect(x+9+col*18, 81-tall/2+row*22, 7, 10);
      }
    }
    ctx.fillStyle = "#24344c";
  }
  ctx.fillStyle = "#fff0d1bb";
  ellipse(ctx, 725, 48, 29, 29, "#e2ebdd");
  const earth = ctx.createLinearGradient(0, 100, 0, H);
  earth.addColorStop(0, "#b4c7c5");
  earth.addColorStop(.35, "#d2dbd6");
  earth.addColorStop(1, "#a0b4b0");
  ctx.fillStyle = earth;
  ctx.fillRect(0, 105, W, H-105);
  // Tank tracks and frozen road give depth and an obvious direction.
  ctx.fillStyle = "#839d9e76";
  ctx.beginPath();
  ctx.moveTo(W*.39, 110);
  ctx.lineTo(W*.62, 110);
  ctx.lineTo(W*.92, H);
  ctx.lineTo(W*.12, H);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#f4f3e091";
  ctx.beginPath();
  ctx.moveTo(W*.46, 116);
  ctx.lineTo(W*.53, 116);
  ctx.lineTo(W*.59, H);
  ctx.lineTo(W*.42, H);
  ctx.closePath();
  ctx.fill();

  // Low-cost fixed snow drifts and tufts of frozen vegetation.
  for (let i = 0; i < 90; i++) {
    const x = (i*197.83)%W;
    const y = 113+(i*113.4)%(H-113);
    const size = 2+i%4;
    ellipse(ctx,x,y,size,1.2,i%3 ? "#eaf2e799":"#829ea36f");
    if (i%7===0) line(ctx,"#536d7377",1.3,x,y,x-2,y-5,x+2,y-2);
  }
  for (let i = 0; i < 12; i++) {
    const x = i%2===0 ? 15+(i%6)*25 : W-21-(i%6)*25;
    const y = 130+i*30;
    if(y>H-38)continue;
    line(ctx,"#f8f6e9",10,x,y+23,x,y-25);
    line(ctx,"#2b4351",2,x-4,y-13,x+1,y-10);
    line(ctx,"#394b50",2,x-3,y+2,x+3,y+5);
    line(ctx,"#f4f4eb",5,x,y-12,x-11,y-30);
    line(ctx,"#f4f4eb",4,x,y-18,x+12,y-35);
  }
  // Protective wall at the southern objective.
  ctx.fillStyle = "#354a54";
  ctx.fillRect(0,H-19,W,19);
  for (let i = 0; i < 29; i++) {
    const x = i*33;
    ctx.fillStyle = i%2 ? "#60737a" : "#506571";
    ctx.fillRect(x,H-24,30,11);
    line(ctx,"#b5c0b9",2,x,H-23,x+30,H-23);
  }
  if (effects) {
    for (let i = 0; i < 49; i++) {
      const x = (i*73.31+Math.sin(i*9)*39)%W;
      const y = ((i*83.77+time*(24+i%5*11))%(H+20));
      snowflake(ctx,x,y,i%3===0?4:2);
    }
  }
  ctx.fillStyle="#d9b66d";
  ctx.font="bold 13px sans-serif";
  ctx.fillText("ЗИМНИЙ РУБЕЖ · 1943",18,30);
  ctx.fillStyle="#d4e5de";
  ctx.font="10px sans-serif";
  ctx.fillText("СТОЙКОСТЬ · WINTER FRONT",20,47);
}
/** Existing root-level repo artwork, read once by TankDefense and reused for all tanks. */
export const USA_TANK_FLAG_URL =
  "https://raw.githubusercontent.com/messenger-co/focus-buddy-/main/usa%20flag.webp";

/** Enemy vehicles are stylized 2.5D tanks, not soldiers or robots.
 * The exact usa flag.webp is drawn on a small mast attached to each hull.
 */
function enemyTank(ctx: Canvas, enemy: Troop, time: number, flag: HTMLImageElement | null) {
  const { x, y, type } = enemy;
  const scale = type === "armored" ? 1.22 : type === "scout" ? .83 : 1;
  const bob = Math.sin(time * 4.2 + enemy.wobble) * .7;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.scale(scale, scale);
  ellipse(ctx, 5, 17, 27, 10, "#263b4669");

  // Tank treads and road wheels provide a clearly recognizable vehicle silhouette.
  const tracks = ctx.createLinearGradient(-27, 0, 27, 0);
  tracks.addColorStop(0, "#273540");
  tracks.addColorStop(.5, "#55636c");
  tracks.addColorStop(1, "#202c37");
  ctx.fillStyle = tracks;
  ctx.beginPath();
  ctx.roundRect(-27, -22, 13, 48, 5);
  ctx.roundRect(14, -22, 13, 48, 5);
  ctx.fill();
  for (const wheelX of [-21, 21]) {
    for (let i = 0; i < 5; i++) {
      ellipse(ctx, wheelX, -16 + i * 9, 4.6, 3.1, "#9aa3a4");
      ellipse(ctx, wheelX - 1, -16 + i * 9, 1.6, 1.5, "#46545d");
    }
  }
  // Chassis has a lit top surface and darker side to stay 2.5D.
  const armor = ctx.createLinearGradient(-17, -24, 18, 25);
  armor.addColorStop(0, type === "armored" ? "#9dabb5" : "#bec7c8");
  armor.addColorStop(.48, type === "scout" ? "#9daaad" : "#82929c");
  armor.addColorStop(1, "#485d6d");
  ctx.fillStyle = armor;
  ctx.beginPath();
  ctx.roundRect(-16, -24, 32, 49, 6);
  ctx.fill();
  line(ctx, "#dfe6e1", 2, -12, -17, -12, 14);
  line(ctx, "#465868", 2, 13, -17, 13, 18);
  // Sloped side armor plates, avoiding any extremist insignia.
  ctx.fillStyle = "#485965";
  ctx.beginPath();
  ctx.moveTo(-16, 10); ctx.lineTo(-25, 14); ctx.lineTo(-19, 22); ctx.lineTo(-12, 20);
  ctx.closePath();ctx.fill();
  ctx.beginPath();
  ctx.moveTo(16, 10); ctx.lineTo(25, 14); ctx.lineTo(19, 22); ctx.lineTo(12, 20);
  ctx.closePath();ctx.fill();

  // Main turret and barrel point toward the defended outpost.
  ctx.fillStyle = "#556c79";
  ctx.beginPath();
  ctx.roundRect(-5, 11, 10, 28, 3);ctx.fill();
  ctx.fillStyle = "#9cb1b5";
  ctx.fillRect(-3.5, 15, 3, 20);
  ellipse(ctx, 0, -2, 15, 18, "#586f7b");
  ellipse(ctx, -5, -8, 7.5, 7.5, "#a9b8b4");
  line(ctx, "#cadae0", 2, -7, -14, 2, -17);

  // Flag pole is physically attached to the rear-right of the vehicle.
  line(ctx, "#d6dce1", 2.5, 19, -11, 19, -53);
  ellipse(ctx, 19, -53, 2.8, 2.8, "#f3dfb6");
  if (flag && flag.complete && flag.naturalWidth > 0) {
    // Exact user-provided image: "usa flag.webp" (space is URL-encoded).
    ctx.drawImage(flag, 20, -53, 29, 17);
  } else {
    // Tiny recognizable fallback if GitHub raw image is temporarily unavailable.
    ctx.fillStyle = "#fff9f2";
    ctx.fillRect(20, -53, 29, 17);
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = "#c64756";
      ctx.fillRect(20, -53 + i * 3, 29, 1.6);
    }
    ctx.fillStyle = "#2c5388";
    ctx.fillRect(20, -53, 12, 9);
  }
  // A short energy bar visually distinguishes light/armored enemy tanks.
  if (type === "armored" && enemy.hp > 0) {
    ctx.fillStyle = "#1e2933bf";ctx.fillRect(-17, -31, 34, 4);
    ctx.fillStyle = "#d5e4d6";ctx.fillRect(-16, -30, Math.min(32, enemy.hp / 3 * 32), 2);
  }
  ctx.restore();
}

function tank(ctx: Canvas, state:TankState, input:TankInput, time:number) {
  const p=state.player;
  ctx.save();
  ctx.translate(p.x,p.y);
  const angle=Math.atan2(input.aimY-p.y,input.aimX-p.x);
  const flicker = p.invulnerable > 0 && Math.sin(time*30) > .5;
  if(flicker)ctx.globalAlpha=.62;
  ellipse(ctx,5,14,36,14,"#1d353c67");
  // Tread strips and repeated wheel elements.
  ctx.fillStyle="#34473d";
  ctx.beginPath();ctx.roundRect(-29,-32,15,64,8);ctx.fill();
  ctx.beginPath();ctx.roundRect(14,-32,15,64,8);ctx.fill();
  for (let i=-3;i<=3;i++) {
    ellipse(ctx,-21,i*8,5,4,"#6f7d61");
    ellipse(ctx,21,i*8,5,4,"#6f7d61");
  }
  const armor=ctx.createLinearGradient(-25,-33,24,34);
  armor.addColorStop(0,"#9baa72");armor.addColorStop(.56,"#718559");
  armor.addColorStop(1,"#394f40");
  ctx.fillStyle=armor;
  ctx.beginPath();ctx.roundRect(-18,-34,36,68,8);ctx.fill();
  line(ctx,"#d1d5ad",2,-15,-24,-15,20);
  line(ctx,"#324337",2,16,-18,16,19);
  ctx.save();
  ctx.rotate(angle+Math.PI/2);
  ctx.fillStyle="#647955";
  ctx.beginPath();ctx.roundRect(-8,-58,16,44,4);ctx.fill();
  line(ctx,"#c7d5a4",2,-5,-55,-5,-22);
  ctx.fillStyle="#536747";
  ctx.beginPath();ctx.ellipse(0,0,20,22,0,0,pi2);ctx.fill();
  ellipse(ctx,-6,-7,9,10,"#95a879");
  // Friendly red star, distinct from the neutral opposing side.
  ctx.fillStyle="#e2b565";
  ctx.font="bold 21px sans-serif";
  ctx.textAlign="center";ctx.textBaseline="middle";
  ctx.fillText("★",1,1);
  ctx.restore();
  ctx.restore();
}
export function drawTankGame(
  ctx: Canvas, state: TankState, input: TankInput, seconds: number,
  effects = true, flag: HTMLImageElement | null = null,
) {
  ctx.clearRect(0,0,W,H);
  background(ctx,seconds,effects);
  for (const troop of state.troops) enemyTank(ctx, troop, seconds, flag);
  for (const shot of state.shots) {
    ellipse(ctx,shot.x,shot.y,7,7,"#ffde8b80");
    ellipse(ctx,shot.x,shot.y,3.2,3.2,"#fff4c8");
  }
  for (const shot of state.hostileShots) {
    ellipse(ctx,shot.x,shot.y,5.8,5.8,"#a54c4d83");
    ellipse(ctx,shot.x,shot.y,2.7,2.7,"#e1a38f");
  }
  for (const spark of state.sparks) {
    const alpha=Math.max(0,spark.ttl/spark.maxTtl);
    ctx.globalAlpha=alpha;
    ellipse(ctx,spark.x,spark.y,spark.size,spark.size, "#ffe3a3");
  }
  ctx.globalAlpha=1;
  tank(ctx,state,input,seconds);
  const left=1-Math.min(1,state.elapsed/TANK_DURATION);
  ctx.fillStyle="#283a4499";
  ctx.fillRect(0,0,W,7);
  ctx.fillStyle="#f4d09c";
  ctx.fillRect(0,0,W*(1-left),7);
  ctx.fillStyle="#ebf4e9";
  ctx.font="bold 13px sans-serif";
  ctx.textAlign="right";
  ctx.fillText("WAVE "+String(state.wave)+" / 5",W-23,29);
}
