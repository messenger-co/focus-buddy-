import { useEffect, useRef, useState } from "react";
import {RotateCcw,RotateCw, ZoomIn,ZoomOut} from "lucide-react";
import type {Profile} from "../state";
import Companion from "../components/Companion";
import {flatSurface,type Frame,type Surface} from "./view";
import type {Action,Diorama,Piece,Pos} from "./scenery";

interface Props {scene:Diorama;markers:Piece[];buddy:Pos;profile:Profile;onAction:(a:Action)=>void;onView:(flat:boolean)=>void}
export default function Viewport({scene,markers,buddy,profile,onAction,onView}:Props){
 const [flat,setFlat]=useState(()=>{try{return localStorage.getItem("fb3-world-display")==="flat";}catch{return false;}}),[failed,setFailed]=useState(false),[loading,setLoading]=useState(true);
 const useFlat=flat||failed;
 const [yaw,setYaw]=useState(.63),[zoom,setZoom]=useState(1);
 const canvas=useRef<HTMLCanvasElement>(null),avatar=useRef<HTMLDivElement>(null),surface=useRef<Surface|null>(null),redraw=useRef<()=>void>(()=>{}),gesture=useRef<{x:number;y:number;yaw:number;drag:boolean}|null>(null);
 const frame=useRef<Frame>({scene,markers,buddy,yaw,zoom});
 const anchor=(x:number,y:number,size:number)=>{if(avatar.current){avatar.current.style.width=size+"px";avatar.current.style.height=size+"px";avatar.current.style.left=x+"px";avatar.current.style.top=y+"px";}};
 useEffect(()=>{frame.current={scene,markers,buddy,yaw,zoom};redraw.current();},[scene,markers,buddy,yaw,zoom]);
 useEffect(()=>{onView(useFlat);},[useFlat,onView]);
 useEffect(()=>{
  const c=canvas.current;if(!c)return;let live=true,raf=0,slow=0;
  const paint=()=>{raf=0;if(!surface.current||document.hidden)return;const before=performance.now();surface.current.draw(frame.current);
   if(!useFlat){slow=performance.now()-before>125?slow+1:0;if(slow>=7)setFailed(true);}};
  const request=()=>{if(!raf)raf=requestAnimationFrame(paint);};redraw.current=request;
  const lose=(event:Event)=>{event.preventDefault();if(live)setFailed(true);};
  c.addEventListener("webglcontextlost",lose);const resize=new ResizeObserver(request);resize.observe(c);document.addEventListener("visibilitychange",request);
  setLoading(true);
  async function boot(){
   try{if(useFlat){surface.current=flatSurface(c!,anchor);}
   else{const mod=await import("./webgl");if(!live)return;surface.current=mod.glSurface(c!,anchor);}
   if(live){setLoading(false);request();}}
   catch{if(live){setLoading(false);setFailed(true);}}}
  void boot();
  return ()=>{live=false;c.removeEventListener("webglcontextlost",lose);document.removeEventListener("visibilitychange",request);resize.disconnect();cancelAnimationFrame(raf);redraw.current=()=>{};surface.current?.destroy();surface.current=null;};
 },[useFlat]);
 const rotate=(v:number)=>setYaw(scene.room?Math.max(-.14,Math.min(1.71,v)):v);
 const magnify=(step:number)=>setZoom(v=>Math.max(.68,Math.min(1.65,v+step)));
 function toggle(){const next=!useFlat;setFlat(next);setFailed(false);try{localStorage.setItem("fb3-world-display",next?"flat":"gl");}catch{/* Chế độ vẫn dùng trong lần mở này. */}}
 return <div className="world-frame" data-night={scene.night}>
  <div className="world-canvas">
   <canvas key={useFlat?"flat":"gl"} ref={canvas} aria-label={scene.room?"Mô hình phòng học với bàn, tủ sách và cửa sổ":"Bản đồ trò chơi của bạn đồng hành"}
    onPointerDown={e=>{if(!e.isPrimary||e.button!==0)return;gesture.current={x:e.clientX,y:e.clientY,yaw,drag:false};e.currentTarget.setPointerCapture(e.pointerId);}}
    onPointerMove={e=>{const p=gesture.current;if(!p)return;const dx=e.clientX-p.x;if(Math.hypot(dx,e.clientY-p.y)>6)p.drag=true;if(p.drag)rotate(p.yaw-dx*.009);}}
    onPointerCancel={()=>{gesture.current=null;}} onPointerUp={e=>{const p=gesture.current;gesture.current=null;if(!p||p.drag)return;const rect=e.currentTarget.getBoundingClientRect(),a=surface.current?.pick(e.clientX-rect.left,e.clientY-rect.top);if(a)onAction(a);}}/>
   <div ref={avatar} className="world-buddy" aria-hidden="true"><Companion kind={profile.companion} color={profile.color} accessory={profile.accessory} sprite paused size={100}/></div>
   {loading&&<span role="status" className="world-loading">Đang dựng khung cảnh…</span>}
  </div>
  <div className="world-camera"><div role="group" aria-label="Điều khiển góc nhìn">
    <button type="button" onClick={()=>rotate(yaw-.27)} aria-label="Xoay sang trái"><RotateCcw/></button><button type="button" onClick={()=>rotate(yaw+.27)} aria-label="Xoay sang phải"><RotateCw/></button>
    <button type="button" onClick={()=>magnify(-.15)} aria-label="Thu nhỏ"><ZoomOut/></button><button type="button" onClick={()=>magnify(.15)} aria-label="Phóng to"><ZoomIn/></button>
   </div><button type="button" onClick={toggle}>{useFlat?"Thử chế độ 3D":"Dùng bản 2D nhẹ"}</button>
  </div>
  {failed&&<p className="world-fallback" role="status">Đã chuyển sang bản 2D nhẹ. Bạn vẫn có thể chơi và lưu kỷ lục.</p>}
 </div>;
}
