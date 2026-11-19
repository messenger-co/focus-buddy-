/** Fictional, non-graphic winter defense arcade. Small deterministic game engine.
 * All coordinates are abstract screen positions, not real-world ballistics.
 */
export const TANK_WIDTH = 900;
export const TANK_HEIGHT = 540;
export const TANK_DURATION = 95;
export const WAVE_SECONDS = 19;
export const LAST_WAVE = 5;
export const MISSILE_COOLDOWN = 13;
export const MISSILE_RADIUS = 110;
export const MAX_ALLIES = 6;

export type TankPhase = "ready"|"running"|"paused"|"won"|"lost";
export type TroopType = "scout"|"regular"|"armored";
export type AllyKind = "rifle"|"ranger"|"guard";
export type AllyCard = {kind:AllyKind;name:string;cost:number;description:string;icon:string};
export const ALLY_CARDS:readonly AllyCard[] = [
  {kind:"rifle",name:"Rifle Squad",cost:100,description:"Steady automatic support",icon:"🪖"},
  {kind:"ranger",name:"Ranger Team",cost:160,description:"Stronger precise attacks",icon:"🎯"},
  {kind:"guard",name:"Base Guards",cost:130,description:"Fast defense near the outpost",icon:"🛡️"},
];
export type TankPlayer = {
  x:number;y:number;hp:number;heat:number;cooldown:number;invulnerable:number;
};
export type Troop = {
  id:number;x:number;y:number;hp:number;speed:number;type:TroopType;
  shotTimer:number;wobble:number;
};
export type Projectile = {
  x:number;y:number;vx:number;vy:number;radius:number;ttl:number;damage?:number;
};
export type Spark = {
  x:number;y:number;vx:number;vy:number;ttl:number;maxTtl:number;size:number;
};
export type Ally = {
  id:number;kind:AllyKind;x:number;y:number;cooldown:number;
};
export type MissileBlast = {
  x:number;y:number;originX:number;originY:number;
  age:number;ttl:number;radius:number;
};
export type TankState = {
  phase:TankPhase;elapsed:number;wave:number;score:number;defeated:number;baseHp:number;
  player:TankPlayer;troops:Troop[];shots:Projectile[];allyShots:Projectile[];
  hostileShots:Projectile[];sparks:Spark[];spawnDelay:number;nextId:number;
  missileCooldown:number;missileBlasts:MissileBlast[];
  credits:number;allies:Ally[];
};
export type TankInput = {
  left:boolean;right:boolean;up:boolean;down:boolean;
  firing:boolean;aimX:number;aimY:number;
  missile?:boolean;
};
export const IDLE_INPUT:Readonly<TankInput> = {
  left:false,right:false,up:false,down:false,firing:false,
  aimX:TANK_WIDTH/2,aimY:40,missile:false,
};
export function createTankState():TankState {
  return {
    phase:"ready",elapsed:0,wave:1,score:0,defeated:0,baseHp:100,
    player:{x:450,y:450,hp:100,heat:0,cooldown:0,invulnerable:0},
    troops:[],shots:[],allyShots:[],hostileShots:[],sparks:[],
    spawnDelay:2.2,nextId:0,missileCooldown:0,missileBlasts:[],
    credits:140,allies:[],
  };
}
export function waveAt(time:number):number {
  return Math.min(LAST_WAVE,Math.max(1,1+Math.floor(time/WAVE_SECONDS)));
}
/** More forgiving pacing than the previous 0.3–0.8-second spawns. */
export function spawnDelayForWave(wave:number):number {
  return Math.max(1.55,3.25-wave*.28);
}
const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));
const dist2=(a:{x:number;y:number},b:{x:number;y:number})=>{
  const dx=a.x-b.x,dy=a.y-b.y;return dx*dx+dy*dy;
};
const troopRadius=(type:TroopType)=>type==="armored"?31:type==="regular"?27:23;
function effect(state:TankState,x:number,y:number,random:()=>number,number=6) {
  for(let i=0;i<number&&state.sparks.length<90;i++) {
    const a=random()*Math.PI*2,v=35+random()*65,ttl=.2+random()*.32;
    state.sparks.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,ttl,maxTtl:ttl,size:1.5+random()*2.3});
  }
}
function spawn(state:TankState,random:()=>number) {
  if(state.troops.length>=26)return;
  const n=random();
  const type:TroopType=n<.17?"scout":n>.91?"armored":"regular";
  const speed=(type==="scout"?42:type==="armored"?20:31)+state.wave*2.6+random()*8;
  state.troops.push({
    id:++state.nextId,x:38+random()*(TANK_WIDTH-76),y:-33,
    hp:type==="armored"?3:type==="regular"?2:1,type,speed,
    shotTimer:2.7+random()*2,wobble:random()*7,
  });
}
export function canRecruit(state:TankState,kind:AllyKind):boolean {
  const card=ALLY_CARDS.find(card=>card.kind===kind);
  return state.phase==="running"&&!!card&&state.credits>=card.cost &&
    state.allies.length<MAX_ALLIES &&
    state.allies.filter(ally=>ally.kind===kind).length<2;
}
export function recruitAlly(state:TankState,kind:AllyKind):boolean {
  if(!canRecruit(state,kind))return false;
  const card=ALLY_CARDS.find(card=>card.kind===kind)!;
  state.credits-=card.cost;
  const n=state.allies.length;
  // Visual soldier units defend the lower edge; positions are decorative.
  const slots=[115,280,615,785,380,520];
  state.allies.push({id:++state.nextId,kind,x:slots[n],y:471,cooldown:0.6});
  return true;
}
function damageTroop(state:TankState,troop:Troop,damage:number,random:()=>number) {
  troop.hp-=damage;
  effect(state,troop.x,troop.y,random,troop.hp<=0?8:3);
  if(troop.hp>0)return;
  const index=state.troops.indexOf(troop);
  if(index>=0)state.troops.splice(index,1);
  state.defeated++;
  const gained=(troop.type==="scout"?130:troop.type==="armored"?220:110)*state.wave;
  state.score+=gained;
  state.credits=Math.min(9999,state.credits+65+(troop.type==="armored"?30:0));
}
/** Cartoon area ability: abstract game coordinates, no realistic weapon simulation. */
export function launchMissile(state:TankState,x:number,y:number,random:()=>number=Math.random):boolean {
  if(state.phase!=="running"||state.missileCooldown>0)return false;
  const impactX=clamp(x,25,TANK_WIDTH-25);
  const impactY=clamp(y,18,TANK_HEIGHT-75);
  const p=state.player;
  state.missileCooldown=MISSILE_COOLDOWN;
  state.missileBlasts.push({
    originX:p.x,originY:p.y,x:impactX,y:impactY,age:0,ttl:.6,radius:MISSILE_RADIUS,
  });
  // A single target area effect with a visible arc and ring; avoid large particle costs.
  for(const troop of [...state.troops]) {
    if(dist2(troop,{x:impactX,y:impactY})<(MISSILE_RADIUS+10)**2)
      damageTroop(state,troop,4,random);
  }
  effect(state,impactX,impactY,random,12);
  return true;
}
function firing(state:TankState,input:TankInput) {
  const p=state.player;
  if(!input.firing||p.cooldown>0||p.heat>86||state.shots.length>=24)return;
  let dx=input.aimX-p.x,dy=input.aimY-p.y;
  const n=Math.max(1,Math.hypot(dx,dy));
  dx/=n;dy/=n;
  state.shots.push({x:p.x+dx*29,y:p.y+dy*29,vx:dx*780,vy:dy*780,radius:5,ttl:1.4,damage:1});
  p.cooldown=.17;
  p.heat=Math.min(100,p.heat+12);
}
function advanceShot(shot:Projectile,dt:number) {
  shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;shot.ttl-=dt;
}
function expired(p:Projectile) {
  return p.ttl<=0||p.x< -35||p.x>TANK_WIDTH+35||p.y< -55||p.y>TANK_HEIGHT+55;
}
function allyActions(state:TankState,dt:number) {
  for(const ally of state.allies) {
    ally.cooldown-=dt;
    if(ally.cooldown>0)continue;
    const limit=ally.kind==="ranger"?500:ally.kind==="guard"?340:420;
    let closest:Troop|null=null,nearest=limit*limit;
    for(const troop of state.troops) {
      const distance=dist2(ally,troop);
      if(distance<nearest){nearest=distance;closest=troop;}
    }
    if(closest && state.allyShots.length<28) {
      const dx=closest.x-ally.x,dy=closest.y-ally.y;
      const n=Math.max(1,Math.hypot(dx,dy));
      const speed=ally.kind==="ranger"?660:540;
      state.allyShots.push({
        x:ally.x,y:ally.y-12,
        vx:dx/n*speed,vy:dy/n*speed,
        ttl:1.35,radius:ally.kind==="ranger"?5.5:4.2,
        damage:ally.kind==="ranger"?2:1,
      });
    }
    ally.cooldown=ally.kind==="guard"?.75:ally.kind==="ranger"?1.85:1.15;
  }
}
function resolveFriendlyShots(state:TankState,dt:number,random:()=>number) {
  for(const list of [state.shots,state.allyShots]) {
    for(let i=list.length-1;i>=0;i--){
      const shot=list[i];advanceShot(shot,dt);
      if(expired(shot)){list.splice(i,1);continue;}
      for(const troop of [...state.troops]) {
        if(dist2(shot,troop)>(shot.radius+troopRadius(troop.type))**2)continue;
        list.splice(i,1);
        damageTroop(state,troop,shot.damage||1,random);
        break;
      }
    }
  }
}
export function stepTank(
  state:TankState,input:TankInput,delta:number,random:()=>number=Math.random,
):TankState {
  if(state.phase!=="running")return state;
  const dt=clamp(delta,0,.045);
  if(dt<=0)return state;
  const previousWave=state.wave;
  state.elapsed+=dt;
  state.wave=waveAt(state.elapsed);
  if(state.wave>previousWave) {
    state.player.hp=Math.min(100,state.player.hp+10);
    state.baseHp=Math.min(100,state.baseHp+8);
    state.credits+=70;
  }
  const player=state.player;
  const horizontal=Number(input.right)-Number(input.left);
  const vertical=Number(input.down)-Number(input.up);
  const n=Math.max(1,Math.hypot(horizontal,vertical));
  player.x=clamp(player.x+horizontal/n*dt*335,34,TANK_WIDTH-34);
  player.y=clamp(player.y+vertical/n*dt*250,310,TANK_HEIGHT-45);
  player.heat=Math.max(0,player.heat-dt*47);
  player.cooldown=Math.max(0,player.cooldown-dt);
  player.invulnerable=Math.max(0,player.invulnerable-dt);
  state.missileCooldown=Math.max(0,state.missileCooldown-dt);
  if(input.missile)launchMissile(state,input.aimX,input.aimY,random);
  firing(state,input);

  state.spawnDelay-=dt;
  if(state.spawnDelay<=0){
    spawn(state,random);
    state.spawnDelay+=spawnDelayForWave(state.wave)*(.85+random()*.35);
  }
  for(let i=state.troops.length-1;i>=0;i--) {
    const troop=state.troops[i];
    troop.wobble+=dt*(troop.type==="scout"?3.3:2);
    troop.x=clamp(troop.x+Math.sin(troop.wobble)*dt*11,20,TANK_WIDTH-20);
    troop.y+=troop.speed*dt;
    troop.shotTimer-=dt;
    if(troop.shotTimer<=0&&troop.y>55&&troop.y<TANK_HEIGHT-125&&state.hostileShots.length<25) {
      const dx=player.x-troop.x,dy=player.y-troop.y;
      const mag=Math.max(1,Math.hypot(dx,dy));
      const velocity=100+state.wave*9;
      state.hostileShots.push({
        x:troop.x,y:troop.y+10,vx:dx/mag*velocity,vy:dy/mag*velocity,
        radius:4,ttl:4,
      });
      troop.shotTimer=4.2+random()*1.7;
    }
    if(troop.y>TANK_HEIGHT-22) {
      state.baseHp=Math.max(0,state.baseHp-(troop.type==="armored"?16:9));
      state.troops.splice(i,1);
      effect(state,troop.x,TANK_HEIGHT-23,random,4);
    }
  }
  allyActions(state,dt);
  resolveFriendlyShots(state,dt,random);
  for(let i=state.hostileShots.length-1;i>=0;i--) {
    const shot=state.hostileShots[i];advanceShot(shot,dt);
    if(expired(shot)){state.hostileShots.splice(i,1);continue;}
    if(player.invulnerable<=0&&dist2(shot,player)<25**2) {
      player.hp=Math.max(0,player.hp-(state.wave>=4?9:7));
      player.invulnerable=.9;
      effect(state,player.x,player.y,random,5);
      state.hostileShots.splice(i,1);
    }
  }
  for(let i=state.sparks.length-1;i>=0;i--) {
    const spark=state.sparks[i];
    spark.x+=spark.vx*dt;spark.y+=spark.vy*dt;
    spark.ttl-=dt;
    if(spark.ttl<=0)state.sparks.splice(i,1);
  }
  for(let i=state.missileBlasts.length-1;i>=0;i--) {
    state.missileBlasts[i].age+=dt;
    if(state.missileBlasts[i].age>state.missileBlasts[i].ttl)state.missileBlasts.splice(i,1);
  }
  if(player.hp<=0||state.baseHp<=0)state.phase="lost";
  else if(state.elapsed>=TANK_DURATION)state.phase="won";
  return state;
}
