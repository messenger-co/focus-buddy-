import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import {useNavigate} from "react-router-dom";
import {ArrowDown,ArrowLeft,ArrowRight,ArrowUp,BookOpen,Check,Clock3,Flag,Footprints,Gamepad2,Gem,Grid2X2,Home,LampDesk,Layers,Map,Music2,Palette,Pause,Play,RotateCcw,Sprout,Sun,Undo2,Volume2,VolumeX} from "lucide-react";
import type {Profile} from "../state";
import {LevelPicker,levelKey,readScore,recordScore} from "../games/levels";
import {worlds,directions,makeBoard,start,move,collected,nextCell,type Direction,type Game} from "./logic";
import {roomScene,defaults,mapScene,markers,point,elevation,type Action,type Furnishings,type Piece,type Pos} from "./scenery";
import Viewport from "./Viewport";
import "./world.css";

const icons={maze:Map,parkour:Footprints,puzzle:Layers,collect:Gem,play:Music2};
const arrowIcons={up:ArrowUp,right:ArrowRight,down:ArrowDown,left:ArrowLeft};
const names={up:"Lên",right:"Phải",down:"Xuống",left:"Trái"};
const keys:Record<string,Direction>={ArrowUp:"up",KeyW:"up",ArrowDown:"down",KeyS:"down",ArrowLeft:"left",KeyA:"left",ArrowRight:"right",KeyD:"right"};
const noPieces:Piece[]=[];const inRoom:Pos=[1.1,.16,1.35];const noAction=()=>{};
function loadRoom():Furnishings{
 try{const s=JSON.parse(localStorage.getItem("fb3-study-room")||"null")??{};
 return {wood:["oak","walnut","mint"].includes(s.wood)?s.wood:defaults.wood,rug:["sea","berry","honey"].includes(s.rug)?s.rug:defaults.rug,plant:["fern","cactus","flower"].includes(s.plant)?s.plant:defaults.plant,night:s.night===true,lamp:s.lamp!==false,mirror:s.mirror===true};}catch{return defaults;}
}
function Room({profile}:{profile:Profile}){
 const nav=useNavigate(),[prefs,set]=useState(loadRoom),[time,setTime]=useState(()=>new Date());
 const scene=useMemo(()=>roomScene(prefs,time),[prefs,time]);
 useEffect(()=>{const id=setInterval(()=>setTime(new Date()),60000);return ()=>clearInterval(id);},[]);
 function update<K extends keyof Furnishings>(key:K,v:Furnishings[K]){set(prev=>{const next={...prev,[key]:v};try{localStorage.setItem("fb3-study-room",JSON.stringify(next));}catch{/* Thay đổi vẫn áp dụng trong phòng. */}return next;});}
 function interact(a:Action){if(a==="window")update("night",!prefs.night);else if(a==="lamp")update("lamp",!prefs.lamp);else if(a==="plant")update("plant",prefs.plant==="fern"?"flower":prefs.plant==="flower"?"cactus":"fern");else nav({focus:"/tap-trung",tasks:"/nhiem-vu",books:"/hanh-trinh",games:"/tro-choi"}[a]);}
 return <><div className="world-title"><div><h1>Phòng học thu nhỏ</h1><p>Kéo để xoay phòng. Chạm vào đồng hồ để học, kệ sách để xem hành trình hoặc cửa sổ để đổi ánh sáng.</p></div><Home size={30}/></div>
 <Viewport scene={scene} markers={noPieces} buddy={inRoom} profile={profile} onAction={interact} onView={noAction}/>
 <div className="world-objects" aria-label="Đồ vật trong phòng">{([["focus","Đồng hồ",Clock3],["tasks","Bàn học",LampDesk],["books","Kệ sách",BookOpen],["games","Máy tính",Gamepad2],["window",prefs.night?"Mở rèm ban ngày":"Ngắm đêm",Sun],["plant","Đổi cây",Sprout],["lamp",prefs.lamp?"Tắt đèn bàn":"Bật đèn bàn",LampDesk]] as const).map(([id,label,Icon])=><button key={id} onClick={()=>interact(id)}><Icon size={16}/>{label}</button>)}</div>
 <details className="world-decor"><summary><Palette size={18}/>Trang trí phòng</summary><div>
 <label>Chất liệu bàn<select value={prefs.wood} onChange={e=>update("wood",e.target.value as Furnishings["wood"])}><option value="oak">Gỗ sồi</option><option value="walnut">Óc chó</option><option value="mint">Bạc hà</option></select></label>
 <label>Thảm và ghế<select value={prefs.rug} onChange={e=>update("rug",e.target.value as Furnishings["rug"])}><option value="sea">Biển xanh</option><option value="berry">Hồng dâu</option><option value="honey">Mật ong</option></select></label>
 <label>Bố trí bàn<select value={prefs.mirror?"shelf":"window"} onChange={e=>update("mirror",e.target.value==="shelf")}><option value="window">Bên cửa sổ</option><option value="shelf">Góc bên phải</option></select></label>
 </div></details></>;
}
type Phase="ready"|"show"|"play"|"pause";
const titles=["Khởi hành","Lối quanh co","Bước tiến","Khám phá","Thử thách","Chinh phục"];
function Course({game,level,profile,advance,leave}:{game:Game;level:number;profile:Profile;advance?:()=>void;leave:()=>void}){
 const b=useMemo(()=>makeBoard(game,level),[game,level]),scene=useMemo(()=>mapScene(b),[b]);
 const [s,set]=useState(()=>start(b)),[phase,phaseTo]=useState<Phase>("ready"),[cue,setCue]=useState(0),[jump,setJump]=useState(false),[sound,setSound]=useState(false),[best,setBest]=useState(()=>readScore(levelKey("3d-"+game,level)));
 const ref=useRef<HTMLDivElement>(null),previous=useRef<Phase>("play"),history=useRef<typeof s[]>([]),audio=useRef<AudioContext|null>(null),clock=useRef({elapsed:0,since:0});
 const elapsed=()=>clock.current.elapsed+(clock.current.since?performance.now()-clock.current.since:0);
 function freeze(){clock.current={elapsed:elapsed(),since:0};}
 const pause=useCallback(()=>{if((phase==="play"||phase==="show")&&s.result==="play"){freeze();previous.current=phase;phaseTo("pause");}},[phase,s.result]);
 useEffect(()=>{const hidden=()=>{if(document.hidden)pause();};document.addEventListener("visibilitychange",hidden);window.addEventListener("blur",pause);return()=>{document.removeEventListener("visibilitychange",hidden);window.removeEventListener("blur",pause);};},[pause]);
 useEffect(()=>()=>{void audio.current?.close().catch(()=>{});},[]);
 function tone(hz:number){const a=audio.current;if(!sound||!a||a.state!=="running")return;const osc=a.createOscillator(),gain=a.createGain();osc.frequency.value=hz;gain.gain.setValueAtTime(.05,a.currentTime);gain.gain.exponentialRampToValueAtTime(.001,a.currentTime+.15);osc.connect(gain).connect(a.destination);osc.start();osc.stop(a.currentTime+.15);osc.onended=()=>{osc.disconnect();gain.disconnect();};}
 function begin(){set(start(b));setCue(0);history.current=[];setJump(false);clock.current={elapsed:0,since:performance.now()};phaseTo(game==="play"?"show":"play");ref.current?.focus({preventScroll:true});}
 function resume(){clock.current.since=performance.now();phaseTo(previous.current);ref.current?.focus({preventScroll:true});}
 const currentCue=phase==="show"&&cue%2===0?b.sequence[Math.floor(cue/2)]??null:null;
 useEffect(()=>{if(phase!=="show")return;const delay=cue%2===0?650:170;
 const id=setTimeout(()=>{if(cue+1>=b.sequence.length*2){phaseTo("play");setCue(0);}else setCue(c=>c+1);},delay);return()=>clearTimeout(id);},[phase,cue,b]);
 function action(d:Direction){if(phase!=="play"||s.result!=="play")return;
 const n=move(b,s,d,jump);if(game==="puzzle"&&n.moves!==s.moves)history.current.push(s);set(n);setJump(false);tone(n.result==="lost"?155:n.result==="won"?740:270+directions.indexOf(d)*85);
 if(n.result!=="play"){freeze();if(n.result==="won"){setBest(recordScore(levelKey("3d-"+game,level),{count:1,seconds:Math.max(.001,clock.current.elapsed/1000),moves:n.moves},1));}}}
 function undo(){const prior=history.current.pop();if(prior){set(prior);ref.current?.focus({preventScroll:true});}}
 const shownPos=currentCue?nextCell(b,b.start,currentCue):s.pos;
 const loc=useMemo(()=>point(b,shownPos,elevation(b,shownPos)+.10),[b,shownPos]);
 const items=useMemo(()=>markers(b,s,currentCue),[b,s,currentCue]);
 const caption=game==="play"?`${s.count} / ${b.sequence.length} nhịp`:game==="collect"?`${b.budget-s.moves} bước còn lại · ${collected(s.jewels)}/${b.gems.length} pha lê`:game==="puzzle"?`${s.boxes.filter(x=>b.goals.includes(x)).length} / ${b.goals.length} thùng`:game==="maze"?(s.jewels?"Đã có chìa khóa":"Tìm chìa khóa vàng"):"Chạm cờ vàng";
 const ended=s.result!=="play",active=phase==="play"&&!ended;
 return <div className="world-console" ref={ref} tabIndex={0} role="region" aria-label="Bàn điều khiển trò chơi" onKeyDown={e=>{if(e.altKey||e.metaKey||e.ctrlKey)return;
 if(e.code==="Escape"){e.preventDefault();if(phase==="pause")resume();else pause();return;}
 if(active&&keys[e.code]){e.preventDefault();if(!e.repeat)action(keys[e.code]);}
 else if(active&&game==="parkour"&&e.code==="Space"&&e.target===e.currentTarget){e.preventDefault();if(!e.repeat)setJump(v=>!v);}
 }}>
 <div className="world-status"><strong><Flag size={16}/>{caption}</strong><button aria-pressed={sound} onClick={async()=>{if(sound){setSound(false);return;}try{audio.current??=new AudioContext();await audio.current.resume();setSound(true);}catch{setSound(false);}}} aria-label={sound?"Tắt âm thanh":"Bật âm thanh"}>{sound?<Volume2/>:<VolumeX/>}</button>
 {!ended&&(phase==="play"||phase==="show")&&<button onClick={pause} aria-label="Tạm dừng trò chơi"><Pause/></button>}</div>
 <div className="world-playfield"><Viewport scene={scene} markers={items} buddy={loc} profile={profile} onAction={noAction} onView={noAction}/>
 {(phase==="ready"||phase==="pause"||ended)&&<div className="world-cover"><div>{ended?<><strong>{s.result==="won"?"Đã vượt chặng!":"Thử lại nhé"}</strong><p>{s.result==="won"?`${s.moves} lượt · ${(elapsed()/1000).toFixed(1)} giây`:s.note}</p></>:<strong>{phase==="pause"?"Tạm dừng":worlds.find(w=>w.id===game)!.name}</strong>}
 <div>{phase==="ready"?<button onClick={begin}><Play/>Bắt đầu</button>:phase==="pause"?<button onClick={resume}><Play/>Tiếp tục</button>:s.result==="won"&&advance?<button onClick={advance}>Chặng tiếp theo <ArrowRight/></button>:null}
 {(ended||phase==="pause")&&<button onClick={begin}><RotateCcw/>Chơi lại</button>}</div></div></div>}
 </div>
 <div className="world-inputs"><div className="world-pad">{directions.map(d=>{const Icon=arrowIcons[d];return <button type="button" key={d} data-dir={d} aria-label={names[d]} disabled={!active} onClick={()=>{ref.current?.focus({preventScroll:true});action(d);}}><Icon/></button>;})}</div>
 <div className="world-actions">{game==="parkour"&&<button disabled={!active} aria-pressed={jump} onClick={()=>{setJump(!jump);ref.current?.focus({preventScroll:true});}}><Footprints/>Nhảy xa</button>}{game==="puzzle"&&<button disabled={!active||!history.current.length} onClick={undo}><Undo2/>Lùi lượt</button>}
 {active&&<button onClick={begin}><RotateCcw/>Chơi lại</button>}<button onClick={leave}><Home/>Về phòng</button></div></div>
 <p role="status" className="world-note">{ended?"":phase==="show"?(currentCue?"Buddy chọn: "+names[currentCue]:"…"):s.note||(game==="play"?"Đến lượt bạn nhắc lại chuỗi hướng.":"Dùng phím mũi tên, WASD hoặc các nút hướng.")}{game==="parkour"&&active?" Nhấn Cách hoặc Nhảy xa rồi chọn hướng.":""}</p>
 {best&&<p className="world-record"><Check size={15}/>Kỷ lục: {best.moves} lượt · {best.seconds.toFixed(1)} giây</p>}</div>;
}
export default function World({profile}:{profile:Profile}){
 const [game,setGame]=useState<Game|null>(null),[level,setLevel]=useState(0);const info=worlds.find(w=>w.id===game);
 function choose(g:Game|null){setGame(g);setLevel(0);}
 return <section className="world-page">{game&&info?<><button className="world-back" onClick={()=>choose(null)}><ArrowLeft size={16}/>Phòng học thu nhỏ</button><div className="world-title"><div><h1>{info.name}</h1><p>{info.task}</p></div></div>
 <LevelPicker slug={"3d-"+game} titles={titles} index={level} onSelect={setLevel}/>
 <Course key={game+level} game={game} level={level} profile={profile} advance={level<5?()=>setLevel(level+1):undefined} leave={()=>choose(null)}/></>:<><Room profile={profile}/><h2 className="world-games-heading"><Grid2X2 size={20}/>Trò chơi trong thế giới 3D</h2><div className="world-games">
 {worlds.map(w=>{const Icon=icons[w.id];return <button key={w.id} className={"world-tile wt-"+w.id} onClick={()=>choose(w.id)}><span><Icon/></span><div><strong>{w.name}</strong><small>{w.task}</small></div><ArrowRight size={17}/></button>;})}</div></>}</section>;
}
