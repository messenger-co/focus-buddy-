import {
  HOME, WORLD_SIZE, PROJECTS, keyOf, noise, projectSite, tileAt,
  type WorldSave, type Tile,
} from "./world";

export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;
const HALF_W = TILE_WIDTH / 2;
const HALF_H = TILE_HEIGHT / 2;
const BLOCK_HEIGHT = 9;
type Ctx = CanvasRenderingContext2D;
type Colors = { top: string; left: string; right: string; edge: string };
const GRASS: Colors = { top: "#8ac67d", left: "#5e9b6b", right: "#477e5d", edge: "#a7d996" };
const SAND: Colors = { top: "#ebd29a", left: "#b69c73", right: "#ad8a63", edge: "#fff0bf" };
const ROCK: Colors = { top: "#9dadac", left: "#748e91", right: "#637c84", edge: "#dce5e2" };
const WATER: Colors = { top: "#64bbd0", left: "#3c94b9", right: "#327aa6", edge: "#c4faff" };
const TILES: Tile[] = Array.from({ length: WORLD_SIZE * WORLD_SIZE }, (_, i) =>
  tileAt(i % WORLD_SIZE, Math.floor(i / WORLD_SIZE)));
function tile(x: number, y: number) { return TILES[y * WORLD_SIZE + x]; }
function path(ctx: Ctx, points: number[]) {
  ctx.beginPath();
  ctx.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) ctx.lineTo(points[i], points[i + 1]);
  ctx.closePath();
}
function polygon(ctx: Ctx, color: string, pts: number[]) {
  ctx.fillStyle = color; path(ctx, pts); ctx.fill();
}
function ellipse(ctx: Ctx, x: number, y: number, rx: number, ry: number, color: string) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
}
function line(ctx: Ctx, color: string, size: number, pts: number[]) {
  ctx.strokeStyle = color;ctx.lineWidth = size;
  ctx.beginPath();ctx.moveTo(pts[0],pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i],pts[i+1]);
  ctx.stroke();
}

/** Projection is independent of display resolution: 2.5D in standard Canvas 2D. */
export function isoPoint(x: number, y: number, cameraX: number, cameraY: number, width: number, height: number) {
  return {
    x: (x - y - cameraX + cameraY) * HALF_W + width / 2,
    y: (x + y - cameraX - cameraY) * HALF_H + height * .52,
  };
}
export function tileFromScreen(
  screenX: number, screenY: number, camX: number, camY: number, width: number, height: number,
) {
  const a = (screenX - width / 2) / HALF_W;
  const b = (screenY - height * .52) / HALF_H;
  return { x: Math.round(camX + (a + b) / 2), y: Math.round(camY + (b - a) / 2) };
}
function tileFace(ctx: Ctx, x: number, y: number, t: Tile, time: number, rich: boolean) {
  const palette = t.terrain === "water" ? WATER : t.terrain === "sand" ? SAND : t.terrain === "rock" ? ROCK : GRASS;
  const top = y - t.elevation * BLOCK_HEIGHT;
  const bottom = top + BLOCK_HEIGHT + t.elevation * BLOCK_HEIGHT;
  // Top diamond and two exposed cube faces (actual painted block geometry).
  polygon(ctx, palette.left, [x-HALF_W,top,x,top+HALF_H,x,top+HALF_H+bottom,x-HALF_W,top+bottom]);
  polygon(ctx, palette.right,[x,top+HALF_H,x+HALF_W,top,x+HALF_W,top+bottom,x,top+HALF_H+bottom]);
  polygon(ctx,palette.top,[x,top-HALF_H,x+HALF_W,top,x,top+HALF_H,x-HALF_W,top]);
  line(ctx,palette.edge,1,[x-HALF_W+2,top,x,top+HALF_H-1,x+HALF_W-2,top]);
  if (t.terrain === "water") {
    const wave = Math.sin(time * 1.7 + x * .13 + y * .17) * (rich ? 3 : 1);
    line(ctx,"#c8fdff9c",1.5,[x-14,top-1+wave,x-6,top-4+wave,x+8,top+1+wave]);
    if (rich) ellipse(ctx,x+11,top+2-wave,4,1.3,"#e9ffff7d");
  } else if (t.terrain === "grass" && rich) {
    const h = noise(Math.round(x),Math.round(y),21);
    if (h > .56) {
      line(ctx,"#376d4777",1,[x-10,top-2,x-12,top-5,x-10,top-9]);
      line(ctx,"#d9f0a8",1,[x-7,top+1,x-3,top-3,x+1,top+1]);
    }
  }
}
/** Painted voxel cuboid with individual light, side and shadow planes. */
function box(ctx: Ctx, x: number, bottom: number, r: number, h: number, p: Colors) {
  const top = bottom - h;
  polygon(ctx, p.left, [x-r,top,x,top+r*.45,x,bottom+r*.45,x-r,bottom]);
  polygon(ctx,p.right,[x,top+r*.45,x+r,top,x+r,bottom,x,bottom+r*.45]);
  polygon(ctx,p.top,[x,top-r*.45,x+r,top,x,top+r*.45,x-r,top]);
  line(ctx,p.edge,1,[x-r+2,top,x,top+r*.45-1,x+r-2,top]);
}
function resourceObject(
  ctx: Ctx, x: number, y: number, kind: Tile["object"], seed: number, time: number, rich: boolean,
) {
  if (!kind) return;
  ellipse(ctx,x+6,y+7,19,6,"#294f4349");
  if (kind === "tree" || kind === "pine") {
    box(ctx,x,y,6,30,{top:"#ad8d61",left:"#7f583d",right:"#66462e",edge:"#ddbd7d"});
    const wiggle = rich ? Math.sin(time*.8 + seed)*1.1 : 0;
    const shade = kind === "pine"
      ? {top:"#91c86f",left:"#4e9465",right:"#28785e",edge:"#c5e5a5"}
      : {top:"#a7d57b",left:"#6ba56c",right:"#43845d",edge:"#e2f5bd"};
    if(kind === "pine") {
      box(ctx,x+wiggle,y-17,17,19,shade);
      box(ctx,x-wiggle*.6,y-31,13,18,shade);
      box(ctx,x+wiggle,y-45,8,11,shade);
    } else {
      box(ctx,x+wiggle,y-27,21,22,shade);
      box(ctx,x-6+wiggle,y-44,19,15,{...shade,top:"#c0e995"});
      box(ctx,x+6-wiggle,y-52,13,12,shade);
    }
    if (rich) {
      ellipse(ctx,x-11,y-43,3,2,"#e1f5ae");
      ellipse(ctx,x+7,y-59,2,2,"#e1f5ae");
    }
    return;
  }
  if (kind === "stone") {
    box(ctx,x,y,14,16,{top:"#dce6df",left:"#8eaba9",right:"#6c8e99",edge:"#f4fbf2"});
    box(ctx,x+7,y-3,8,10,{top:"#b9c9c4",left:"#829b99",right:"#587b83",edge:"#eff4e8"});
    return;
  }
  if (kind === "berry") {
    box(ctx,x,y-1,11,9,{top:"#85c36e",left:"#58865d",right:"#3f775b",edge:"#c5e5a5"});
    for (let i=0;i<4;i++) {
      const bx=x + (i%2===0?-8:8),by=y-16+(i<2?0:8);
      ellipse(ctx,bx,by,3,3,i%2 ? "#ef7b8f" : "#d95473");
      ellipse(ctx,bx-1,by-1,1,1,"#ffe7ee");
    }
    return;
  }
  if (kind === "flower") {
    line(ctx,"#468b62",2,[x,y,x,y-13]);
    for(let i=0;i<5;i++){
      const a=i*Math.PI*2/5;
      ellipse(ctx,x+Math.cos(a)*5,y-14+Math.sin(a)*5,4,4,seed%2>1 ? "#f3bedc" : "#ffe2a3");
    }
    ellipse(ctx,x,y-14,3,3,"#eab65e");
    return;
  }
  if (kind === "grass") {
    line(ctx,"#41855a",2,[x-5,y,x-9,y-9,x-6,y-13]);
    line(ctx,"#bbda8f",2,[x+2,y,x+6,y-12,x+3,y-16]);
  }
}
function building(ctx: Ctx, x: number, y: number, index: number, time: number) {
  const p = PROJECTS[index];
  if(!p) return;
  const tall = index===5 || index===9;
  const h = tall ? 66 : index===2 ? 26 : 38;
  const roof = {top:"#fff2ca",left:p.roof,right:"#7c8e8b",edge:"#ffffff"};
  ellipse(ctx,x+9,y+14,28,10,"#244b4477");
  box(ctx,x,y,22,h,{top:"#f1dfb7",left:"#c6ac8d",right:"#a1836f",edge:"#fff0ce"});
  box(ctx,x,y-h,25,13,roof);
  // Door, small windows and roof details make structures distinct in-world.
  polygon(ctx,"#765d51",[x-10,y-19,x-1,y-15,x-1,y+4,x-10,y]);
  polygon(ctx,"#b6e5da",[x+8,y-25,x+17,y-30,x+17,y-17,x+8,y-14]);
  line(ctx,"#e4f8d6",1,[x+10,y-21,x+14,y-22]);
  if(index===1 || index===5 || index===9) {
    box(ctx,x,y-h-16,7,19,{top:"#fff3c9",left:p.roof,right:"#987c79",edge:"#ffffff"});
  }
  if(index===2 || index===7) {
    for(let i=0;i<4;i++)
      ellipse(ctx,x-22+i*13,y+12,4,4,i%2?"#f4c56f":"#ef879b");
  }
  if(index===8) {
    for(let i=0;i<3;i++) {
      const bx=x-22+i*20;
      ellipse(ctx,bx,y-h-10+Math.sin(time*2+i)*1,4,4,"#fff0a4");
    }
  }
  if(index===9) ellipse(ctx,x,y-h-34,17,13,"#fff7c75c");
}
function campfire(ctx: Ctx, x: number, y: number, time: number, rich: boolean) {
  const glow = ctx.createRadialGradient(x,y-4,3,x,y-4,58);
  glow.addColorStop(0,"#fff5b1a0");glow.addColorStop(1,"#fff5b100");
  ctx.fillStyle=glow;ctx.fillRect(x-58,y-62,116,116);
  ellipse(ctx,x,y+7,21,10,"#6e785c");
  box(ctx,x-12,y+3,11,5,{top:"#d39b62",left:"#8c603e",right:"#70503c",edge:"#f7d4a1"});
  box(ctx,x+9,y+1,11,6,{top:"#dab681",left:"#936a45",right:"#72513b",edge:"#fff0c6"});
  const flame=rich?Math.sin(time*9)*2:0;
  polygon(ctx,"#f7ac58",[x-8,y-4,x+flame,y-24,x+8,y-4,x,y+2]);
  polygon(ctx,"#fff5ac",[x-4,y-2,x+flame/2,y-15,x+4,y-2,x,y+1]);
  // Little camp flag is visible from across the island.
  line(ctx,"#765f48",3,[x+25,y+6,x+25,y-46]);
  polygon(ctx,"#f2dca3",[x+26,y-45,x+49,y-41,x+26,y-31]);
}
function landmark(ctx:Ctx,x:number,y:number,time:number){
  ctx.save();ctx.globalAlpha=.9;
  ellipse(ctx,x,y+8,17,6,"#315d4a43");
  const pulse=Math.sin(time*2.2)*3;
  polygon(ctx,"#ffe0a3",[x,y-30-pulse,x+8,y-18-pulse,x,y-8-pulse,x-8,y-18-pulse]);
  polygon(ctx,"#fff8d9",[x,y-30-pulse,x,y-8-pulse,x-8,y-18-pulse]);
  ctx.restore();
}
export function drawIsland(
  ctx: Ctx,
  width:number,height:number,
  camX:number,camY:number,
  world:WorldSave,
  time:number,rich=true,
) {
  const sky=ctx.createLinearGradient(0,0,0,height);
  const evening=world.day%4===0;
  sky.addColorStop(0, evening?"#6587a8":"#9ed5dc");
  sky.addColorStop(1,evening?"#e1c6b2":"#e6eecf");
  ctx.fillStyle=sky;ctx.fillRect(0,0,width,height);
  const sunX=width*.78;
  const sunY=height*.14;
  ellipse(ctx,sunX,sunY,46,46,evening?"#ffe4be57":"#fff4c875");
  ellipse(ctx,sunX,sunY,24,24,evening?"#ffe4b3":"#fff8d6");
  const placedBlocks = new Map(world.placed.map((b) => [keyOf(b.x, b.y), b]));
  const radius=Math.min(26,Math.ceil(Math.max(width/64,height/32)/2)+8);
  // Painter's algorithm: back rows first, each tile owns its scenery objects.
  const xmin=Math.max(0,Math.floor(camX-radius)),xmax=Math.min(WORLD_SIZE-1,Math.ceil(camX+radius));
  const ymin=Math.max(0,Math.floor(camY-radius)),ymax=Math.min(WORLD_SIZE-1,Math.ceil(camY+radius));
  for(let sum=xmin+ymin;sum<=xmax+ymax;sum++){
    for(let x=xmin;x<=xmax;x++){
      const y=sum-x;
      if(y<ymin || y>ymax)continue;
      const point=isoPoint(x,y,camX,camY,width,height);
      if(point.x < -90||point.x>width+90||point.y < -110||point.y>height+130)continue;
      const t=tile(x,y);
      if(!t)continue;
      const elevation=t.elevation*BLOCK_HEIGHT;
      tileFace(ctx,point.x,point.y,t,time,rich);
      const base=point.y-elevation+9;
      const built=projectSite(x,y);
      const placed=placedBlocks.get(keyOf(x,y));
      if(placed) {
        const colors=placed.material==="wood"
          ? {top:"#f0ce94",left:"#bf8955",right:"#936141",edge:"#ffe4b3"}
          : {top:"#dce6e5",left:"#8ca9a9",right:"#678c9b",edge:"#f4f8f2"};
        box(ctx,point.x,base,20,23,colors);
        line(ctx,placed.material==="wood"?"#ffe4b184":"#ffffff80",2,
          [point.x-12,base-11,point.x-4,base-8,point.x+4,base-12]);
      }
      else if(built!==-1 && built<world.projects)building(ctx,point.x,base,built,time);
      else if(x===HOME&&y===HOME)campfire(ctx,point.x,base,time,rich);
      else if(!world.harvested.includes(keyOf(x,y)) && t.object){
        resourceObject(ctx,point.x,base,t.object,x*137+y*67,time,rich);
      }
      else if (world.harvested.includes(keyOf(x,y)) && t.object &&
          (t.object==="tree"||t.object==="pine")) {
        box(ctx,point.x,base,6,5,{top:"#bda27d",left:"#89634d",right:"#765443",edge:"#eccea9"});
      }
      if(rich&&t.terrain==="sand"&&noise(x,y,9)>.95)
        ellipse(ctx,point.x+7,base-5,2,2,"#f1efd3");
      if(x===HOME+6&&y===HOME-5)landmark(ctx,point.x,base,time);
    }
  }
  // Ground shadow follows the camera-controlled avatar.
  const player=isoPoint(world.x,world.y,camX,camY,width,height);
  const elevation=tileAt(world.x,world.y).elevation;
  const py=player.y-elevation*BLOCK_HEIGHT+8;
  ellipse(ctx,player.x,py+3,20,7,"#244b4552");
  if(rich) {
    for(let i=0;i<9;i++) {
      const x=width*(i+.5)/9+Math.sin(time*.4+i*17)*13;
      const y=height*(.16+(i%4)*.18)+Math.sin(time*.6+i)*7;
      ellipse(ctx,x,y,1.6,1.6,"#fffbe79b");
    }
  }
}
/** Draw inexpensive, static overview; no map tiles are sent to a server. */
export function drawMiniMap(ctx:Ctx,width:number,height:number,world:WorldSave){
  const scale=Math.min(width,height)/WORLD_SIZE;
  ctx.clearRect(0,0,width,height);
  for(let y=0;y<WORLD_SIZE;y++){
    for(let x=0;x<WORLD_SIZE;x++){
      const t=tile(x,y);
      ctx.fillStyle=t.terrain==="water"?"#58a9c4":t.terrain==="sand"?"#e4d09d":
        t.terrain==="rock"?"#9fa9a7":t.object==="tree"||t.object==="pine"?"#4c9870":"#91c37c";
      ctx.fillRect(x*scale,y*scale,scale+0.1,scale+0.1);
    }
  }
  for(const b of world.placed){
    ctx.fillStyle=b.material==="wood"?"#b88154":"#dce5e7";
    ctx.fillRect(b.x*scale,b.y*scale,scale+0.2,scale+0.2);
  }
  for(let i=0;i<world.projects;i++){
    const p=PROJECTS[i];
    ctx.fillStyle="#ffe5a6";
    ctx.fillRect((HOME+p.site[0]-.4)*scale,(HOME+p.site[1]-.4)*scale,scale*1.8,scale*1.8);
  }
  ctx.strokeStyle="#ffffff";ctx.lineWidth=2;
  ctx.strokeRect(world.x*scale-.2,world.y*scale-.2,scale+1,scale+1);
  ellipse(ctx,(world.x+.5)*scale,(world.y+.5)*scale,Math.max(2,scale*.78),Math.max(2,scale*.78),"#f4696e");
}
