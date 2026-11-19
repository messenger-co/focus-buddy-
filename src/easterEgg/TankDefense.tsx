import { useEffect, useRef, useState, type PointerEvent } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Crosshair, Flag, Gauge, Pause, Play, RotateCcw, Shield, X, Zap, Users, Box } from "lucide-react";
import {
  ALLY_CARDS, createTankState, recruitAlly, stepTank,
  MISSILE_COOLDOWN, TANK_DURATION, TANK_HEIGHT, TANK_WIDTH,
  type AllyKind, type TankInput, type TankPhase, type TankState,
} from "./tankGame";
import { drawTankGame, USA_TANK_FLAG_URL } from "./tankPaint";
import { createTank3D, type Tank3DRenderer } from "./tank3d";
import "./tankDefense.css";

type View = {
  phase: TankPhase;
  score: number;
  defeated: number;
  wave: number;
  seconds: number;
  tankHp: number;
  baseHp: number;
  heat: number;
  missiles: number;
  credits: number;
  allies: number;
  allyKinds: AllyKind[];
};
const snapshot=(state:TankState):View=>({
  phase:state.phase,score:state.score,defeated:state.defeated,
  wave:state.wave,seconds:Math.max(0,Math.ceil(TANK_DURATION-state.elapsed)),
  tankHp:state.player.hp,baseHp:state.baseHp,heat:Math.round(state.player.heat),
  missiles:state.missileCooldown,credits:state.credits,
  allies:state.allies.length,allyKinds:state.allies.map(ally=>ally.kind),
});
type Direction = "left"|"right"|"up"|"down";
const arrowKeys:Record<string,Direction> = {
  ArrowLeft:"left",KeyA:"left",ArrowRight:"right",KeyD:"right",
  ArrowUp:"up",KeyW:"up",ArrowDown:"down",KeyS:"down",
};
export default function TankDefense({ onExit }: { onExit:()=>void }) {
  const state=useRef(createTankState());
  const canvas=useRef<HTMLCanvasElement>(null);
  const webglMount=useRef<HTMLDivElement>(null);
  const visual3d=useRef<Tank3DRenderer|null>(null);
  const enemyFlag=useRef<HTMLImageElement|null>(null);
  const held=useRef(new Set<Direction>());
  const firing=useRef(false);
  const missileQueued=useRef(false);
  const aim=useRef({x:450,y:40});
  const aimedByPointer=useRef(false);
  const [view,setView]=useState<View>(()=>snapshot(state.current));
  const [effects,setEffects]=useState(true);
  const [renderMode,setRenderMode]=useState<"3d"|"2d">("3d");
  const previousUpdate=useRef(0);
  const renderedPhase=useRef<TankPhase>("ready");

  // Preload the exact usa flag.webp once. Never request the image per enemy/frame.
  useEffect(() => {
    const image = new Image();
    image.decoding = "async";
    image.crossOrigin = "anonymous";
    image.onload = () => { enemyFlag.current = image; };
    image.onerror = () => { enemyFlag.current = null; };
    image.src = USA_TANK_FLAG_URL;
    return () => {
      image.onload = null;
      image.onerror = null;
      enemyFlag.current = null;
    };
  }, []);

  function recruit(kind:AllyKind){
    if(recruitAlly(state.current,kind))setView(snapshot(state.current));
  }
  function missile(){
    if(state.current.phase==="running"&&state.current.missileCooldown<=0)
      missileQueued.current=true;
  }
  function start() {
    state.current=createTankState();
    state.current.phase="running";
    held.current.clear();
    firing.current=false;
    missileQueued.current=false;
    aimedByPointer.current=false;
    setView(snapshot(state.current));
  }
  function togglePause() {
    const game=state.current;
    if(game.phase==="running")game.phase="paused";
    else if(game.phase==="paused")game.phase="running";
    held.current.clear();
    firing.current=false;
    missileQueued.current=false;
    setView(snapshot(game));
  }
  useEffect(()=>{
    const keyDown=(event:KeyboardEvent)=>{
      if(event.repeat && (event.code==="KeyP"||event.code==="Escape"))return;
      const direction=arrowKeys[event.code];
      if(direction){
        event.preventDefault();
        held.current.add(direction);
      } else if(event.code==="Space"){
        event.preventDefault();
        firing.current=true;
      } else if(event.code==="KeyM") {
        event.preventDefault();if(!event.repeat)missile();
      } else if(event.code==="Digit1") {
        event.preventDefault();if(!event.repeat)recruit("rifle");
      } else if(event.code==="Digit2") {
        event.preventDefault();if(!event.repeat)recruit("ranger");
      } else if(event.code==="Digit3") {
        event.preventDefault();if(!event.repeat)recruit("guard");
      } else if(event.code==="KeyP") {
        event.preventDefault();
        togglePause();
      } else if(event.code==="Escape") {
        event.preventDefault();
        onExit();
      }
    };
    const keyUp=(event:KeyboardEvent)=>{
      const direction=arrowKeys[event.code];
      if(direction){event.preventDefault();held.current.delete(direction);}
      if(event.code==="Space"){event.preventDefault();firing.current=false;}
    };
    const release=()=>{
      firing.current=false;
      missileQueued.current=false;
      held.current.clear();
      if(document.visibilityState==="hidden" && state.current.phase==="running"){
        state.current.phase="paused";
        setView(snapshot(state.current));
      }
    };
    window.addEventListener("keydown",keyDown,true);
    window.addEventListener("keyup",keyUp,true);
    window.addEventListener("blur",release);
    document.addEventListener("visibilitychange",release);
    return ()=>{
      window.removeEventListener("keydown",keyDown,true);
      window.removeEventListener("keyup",keyUp,true);
      window.removeEventListener("blur",release);
      document.removeEventListener("visibilitychange",release);
    };
  },[onExit]);

  useEffect(()=>{
    const element=canvas.current;
    const mount=webglMount.current;
    if(!element||!mount)return;
    const surface:HTMLCanvasElement=element;
    let visual:Tank3DRenderer|null=null;
    let drawing:CanvasRenderingContext2D|null=null;
    let active=true,raf=0,last=0,lastFrame=0;
    try {
      if(renderMode==="3d"){
        visual=createTank3D(mount);
        visual3d.current=visual;
      } else {
        visual3d.current=null;
        drawing=surface.getContext("2d",{alpha:false});
      }
    } catch {
      visual3d.current=null;
      setRenderMode("2d");
      return;
    }
    const scene=visual;
    const ctx=drawing;
    if(!scene && !ctx)return;
    const resize=()=>{
      const bounds=surface.getBoundingClientRect();
      const width=Math.max(320,bounds.width),height=Math.max(180,bounds.height);
      if(scene)scene.resize(width,height);
      if(ctx){
        const dpr=Math.min(window.devicePixelRatio||1,1.4);
        const w=Math.floor(width*dpr),h=Math.floor(height*dpr);
        if(surface.width!==w)surface.width=w;
        if(surface.height!==h)surface.height=h;
      }
    };
    const observer=typeof ResizeObserver!=="undefined"?new ResizeObserver(resize):null;
    resize();observer?.observe(surface);
    function frame(time:number){
      if(!active)return;
      raf=requestAnimationFrame(frame);
      const game=state.current;
      const fps=game.phase==="running" ? (renderMode==="3d"?30:36) : 12;
      if(document.visibilityState==="hidden"||time-lastFrame<1000/fps)return;
      const dt=Math.min(.045,Math.max(0,(time-last)/1000||.02));
      lastFrame=time;last=time;
      const input:TankInput={
        left:held.current.has("left"),right:held.current.has("right"),
        up:held.current.has("up"),down:held.current.has("down"),
        firing:firing.current,missile:missileQueued.current,
        aimX:aim.current.x,aimY:aim.current.y,
      };
      missileQueued.current=false;
      if(!aimedByPointer.current&&game.troops.length){
        let best=game.troops[0],dist=Infinity;
        for(const enemy of game.troops){
          const dx=enemy.x-game.player.x,dy=enemy.y-game.player.y;
          const next=dx*dx+dy*dy;
          if(next<dist){dist=next;best=enemy;}
        }
        input.aimX=best.x;input.aimY=best.y;
      }
      stepTank(game,input,dt);
      if(scene)scene.draw(game,input,time/1000);
      else if(ctx){
        ctx.setTransform(surface.width/TANK_WIDTH,0,0,surface.height/TANK_HEIGHT,0,0);
        drawTankGame(ctx,game,input,time/1000,effects,enemyFlag.current);
      }
      if(time-previousUpdate.current>125||game.phase!==renderedPhase.current){
        renderedPhase.current=game.phase;
        previousUpdate.current=time;
        setView(snapshot(game));
      }
    }
    raf=requestAnimationFrame(frame);
    return ()=>{
      active=false;cancelAnimationFrame(raf);observer?.disconnect();
      if(visual3d.current===scene)visual3d.current=null;
      scene?.dispose();
    };
  },[effects,renderMode]);

  function pointerAim(event:PointerEvent<HTMLCanvasElement>){
    const rect=event.currentTarget.getBoundingClientRect();
    const u=(event.clientX-rect.left)/rect.width;
    const v=(event.clientY-rect.top)/rect.height;
    aim.current=visual3d.current?.pick(u,v) || {x:u*TANK_WIDTH,y:v*TANK_HEIGHT};
    aimedByPointer.current=true;
  }
  function pressDirection(direction:Direction){
    return {
      onPointerDown:(event:PointerEvent<HTMLButtonElement>)=>{
        event.preventDefault();
        held.current.add(direction);
        event.currentTarget.setPointerCapture(event.pointerId);
      },
      onPointerUp:()=>held.current.delete(direction),
      onPointerCancel:()=>held.current.delete(direction),
      onLostPointerCapture:()=>held.current.delete(direction),
    };
  }
  const finished=view.phase==="won"||view.phase==="lost";
  return (
    <div className="tank-defense">
      <div className="tank-game-heading">
        <div>
          <span className="tank-eyebrow">★ ЗИМНИЙ РУБЕЖ · 1943 ★</span>
          <h2>THE WINTER FRONT</h2>
          <p>True 3D winter battlefield · Easier waves · Missile support · Allied soldier cards</p>
        </div>
        <div className="tank-header-buttons">
          <button type="button" onClick={()=>setRenderMode(mode=>mode==="3d"?"2d":"3d")}
            aria-label="Toggle 3D and 2D rendering"><Box size={16}/>
            {renderMode==="3d"?"3D ON · SWITCH 2D":"2D FALLBACK · TRY 3D"}
          </button>
          <button type="button" onClick={()=>setEffects(x=>!x)}
            aria-pressed={!effects}><Gauge size={16}/>{effects?"LIGHT FX":"LOW FX"}</button>
          <button type="button" onClick={togglePause} disabled={view.phase==="ready"||finished}>
            {view.phase==="paused"?<Play size={16}/>:<Pause size={16}/>}
            {view.phase==="paused"?"RESUME":"PAUSE (P)"}
          </button>
          <button type="button" onClick={onExit} aria-label="Leave tank game">
            <X size={17}/> EXIT
          </button>
        </div>
      </div>
      <div className="tank-board">
        <div ref={webglMount} className="tank-3d-mount" aria-hidden="true"/>
        <canvas ref={canvas}
          className={"tank-canvas" + (renderMode==="3d"?" tank-3d-input-layer":"")}
          role="img" aria-label="Winter battlefield: tank defending an outpost against enemy tanks carrying USA flags"
          onPointerMove={pointerAim}
          onPointerDown={event=>{
            pointerAim(event);
            firing.current=true;
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerUp={()=>{firing.current=false;}}
          onPointerCancel={()=>{firing.current=false;}}
          onLostPointerCapture={()=>{firing.current=false;}}
        />
        <div className="tank-game-hud" aria-label="Tank game status">
          <span><Shield size={15}/> ARMOR <b>{view.tankHp}%</b></span>
          <span><Flag size={15}/> BASE <b>{view.baseHp}%</b></span>
          <span>WAVE <b>{view.wave}/5</b></span>
          <span>TIME <b>{view.seconds}s</b></span>
          <span>SCORE <b>{view.score.toLocaleString("en-US")}</b></span>
          <span><Users size={14}/> ALLIES <b>{view.allies}/6</b></span>
        </div>
        <div className="tank-heat" role="progressbar" aria-label="Weapon heat"
          aria-valuenow={view.heat} aria-valuemin={0} aria-valuemax={100}>
          <small>HEAT</small><span><i style={{width:String(view.heat)+"%"}}/></span>
        </div>
        <div className="tank-missile-hud" aria-label="Missile cooldown status">
          <Zap size={17}/>
          <span>{view.missiles<=0?"MISSILE READY":"RECHARGE "+view.missiles.toFixed(1)+"s"}</span>
          <div className="tank-missile-track"><i
            style={{width:String(100*(1-view.missiles/MISSILE_COOLDOWN))+"%"}}/></div>
        </div>
        {view.phase!=="running" && (
          <div className="tank-overlay" role="status">
            <div className="tank-start-card">
              <span className="tank-start-star">★</span>
              <h3>{view.phase==="ready"?"ЗА РОДИНУ!":
                view.phase==="paused"?"ПАУЗА":
                view.phase==="won"?"ПОБЕДА!":"МИССИЯ ПРОВАЛЕНА"}
              </h3>
              <p>{view.phase==="ready"
                ?"Defend your base for 95 seconds! Easier enemy waves, a rechargeable M missile and soldier squad cards help you survive."
                :view.phase==="paused"?"Take a short break. The battle is frozen."
                :view.phase==="won"?"You survived all five winter waves. Impressive!"
                :"Your tank or the outpost was overwhelmed. Try again!"}
              </p>
              {finished && <p className="tank-final-score">
                SCORE {view.score.toLocaleString("en-US")} · {view.defeated} TARGETS
              </p>}
              <div className="tank-start-actions">
                <button type="button" onClick={view.phase==="paused"?togglePause:start}>
                  {view.phase==="paused"?<Play size={18}/>:<Crosshair size={18}/>}
                  {view.phase==="ready"?"START DEFENSE":
                    view.phase==="paused"?"RESUME":"RETRY MISSION"}
                </button>
                <button type="button" className="tank-secondary" onClick={onExit}>
                  RETURN TO EASTER EGG
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="tank-controls">
        <div className="tank-game-pad" aria-label="Tank movement buttons">
          <button type="button" aria-label="Move up" style={{gridArea:"up"}} {...pressDirection("up")}>
            <ArrowUp size={22}/>
          </button>
          <button type="button" aria-label="Move left" style={{gridArea:"left"}} {...pressDirection("left")}>
            <ArrowLeft size={22}/>
          </button>
          <button type="button" aria-label="Move down" style={{gridArea:"down"}} {...pressDirection("down")}>
            <ArrowDown size={22}/>
          </button>
          <button type="button" aria-label="Move right" style={{gridArea:"right"}} {...pressDirection("right")}>
            <ArrowRight size={22}/>
          </button>
        </div>
        <div className="tank-control-copy">
          <strong>УДЕРЖИВАЙ РУБЕЖ! • DEFEND THE LINE</strong>
          <span><kbd>WASD</kbd> / <kbd>↑↓←→</kbd> Move</span>
          <span><kbd>Mouse</kbd> Aim · <kbd>Space</kbd> Fire · <kbd>M</kbd> Missile</span>
          <span><kbd>1</kbd> Rifle · <kbd>2</kbd> Rangers · <kbd>3</kbd> Guards</span>
          <span>Mobile: movement pad, FIRE/MISSILE buttons, tap squad cards.</span>
        </div>
        <button className="tank-fire-button" type="button"
          disabled={view.phase!=="running"}
          onPointerDown={event=>{
            event.preventDefault();firing.current=true;
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerUp={()=>{firing.current=false;}}
          onPointerCancel={()=>{firing.current=false;}}
          onLostPointerCapture={()=>{firing.current=false;}}>
          <Crosshair size={25}/> FIRE
        </button>
        <button className="tank-missile-button" type="button" onClick={missile}
          disabled={view.phase!=="running"||view.missiles>0}
          title="Launch area missile (M)">
          <Zap size={24}/>
          {view.missiles>0?view.missiles.toFixed(1)+"s":"MISSILE"}
        </button>
        <button className="tank-retry-mini" type="button" onClick={start}>
          <RotateCcw size={16}/> RESTART
        </button>
      </div>
      <section className="tank-recruit-panel" aria-label="Recruit allied soldier cards">
        <div className="tank-recruit-heading">
          <div><span>★ ALLIED SUPPORT ★</span><h3>Recruit soldier cards</h3>
            <p>Recruit up to six cartoon allies. They automatically help protect your base.</p>
          </div>
          <strong className="tank-credit-wallet">★ {view.credits} credits</strong>
        </div>
        <div className="tank-recruit-cards">
          {ALLY_CARDS.map((card,index)=>{
            const owned=view.allyKinds.filter(kind=>kind===card.kind).length;
            const affordable=view.phase==="running"&&view.credits>=card.cost&&owned<2&&view.allies<6;
            return <button type="button" key={card.kind}
              className={"tank-recruit-card"+(affordable?" available":"")}
              disabled={!affordable}
              onClick={()=>recruit(card.kind)}
              aria-label={"Recruit "+card.name+" for "+card.cost+" credits"}>
              <span className="tank-card-number">{index+1}</span>
              <span className="tank-card-icon" aria-hidden="true">{card.icon}</span>
              <strong>{card.name}</strong><small>{card.description}</small>
              <span className="tank-card-price">{owned}/2 · ★ {card.cost}</span>
            </button>;
          })}
        </div>
      </section>
      <p className="tank-game-note">
        Fictional, non-graphic winter arcade: opposing tanks carry usa flag.webp from the repository.
        Real WebGL 3D with a 2D fallback, simplified arcade mechanics, no cloud saves or purchases.
        The game pauses when its tab is hidden.
      </p>
    </div>
  );
}
