import { useEffect, useRef, useState } from "react";
import { AlertCircle, CloudOff, RefreshCw, X } from "lucide-react";
import "./siteStatus.css";

type UpdateState="idle"|"available"|"error";
/** A service-worker update is informational: never reload an active study session. */
export default function SiteStatus() {
  const [online,setOnline]=useState(
    ()=>typeof navigator==="undefined"||navigator.onLine!==false,
  );
  const [update,setUpdate]=useState<UpdateState>("idle");
  const [dismissed,setDismissed]=useState(false);
  const [attempt,setAttempt]=useState(0);
  const controlled=useRef<ServiceWorker|null>(
    typeof navigator!=="undefined"&&"serviceWorker" in navigator
      ? navigator.serviceWorker.controller:null,
  );

  useEffect(()=>{
    const onOnline=()=>setOnline(true);
    const onOffline=()=>setOnline(false);
    window.addEventListener("online",onOnline);
    window.addEventListener("offline",onOffline);
    return ()=>{
      window.removeEventListener("online",onOnline);
      window.removeEventListener("offline",onOffline);
    };
  },[]);
  useEffect(()=>{
    if(!("serviceWorker" in navigator))return;
    let live=true;
    let registration:ServiceWorkerRegistration|null=null;
    let installing:ServiceWorker|null=null;
    const announce=()=>{
      if(!live)return;
      setUpdate("available");
      setDismissed(false);
    };
    const onWorkerState=()=>{
      if(installing?.state==="installed"&&controlled.current)announce();
    };
    const listenToInstalling=()=>{
      if(installing)installing.removeEventListener("statechange",onWorkerState);
      installing=registration?.installing||null;
      if(installing){
        installing.addEventListener("statechange",onWorkerState);
        onWorkerState();
      }
    };
    const onControllerChanged=()=>{
      const next=navigator.serviceWorker.controller;
      if(controlled.current&&next&&controlled.current!==next)announce();
      controlled.current=next;
    };
    navigator.serviceWorker.addEventListener("controllerchange",onControllerChanged);
    void navigator.serviceWorker.getRegistration().then(found=>{
      if(!live)return;
      registration=found||null;
      if(!registration)return;
      if(registration.waiting&&controlled.current)announce();
      registration.addEventListener("updatefound",listenToInstalling);
      listenToInstalling();
    }).catch(()=>{
      if(live&&navigator.onLine)setUpdate("error");
    });
    return ()=>{
      live=false;
      navigator.serviceWorker.removeEventListener("controllerchange",onControllerChanged);
      registration?.removeEventListener("updatefound",listenToInstalling);
      installing?.removeEventListener("statechange",onWorkerState);
    };
  },[attempt]);

  if(!online)return(
    <div className="site-status-banner offline" role="status">
      <CloudOff size={19}/>
      <span><strong>Thiết bị đang ngoại tuyến.</strong> Bạn vẫn có thể dùng nội dung
        đã tải và dữ liệu trên máy; AI và phòng học chung cần internet.</span>
    </div>
  );
  if(dismissed||update==="idle")return null;
  if(update==="error")return(
    <div className="site-status-banner warning" role="status">
      <AlertCircle size={19}/>
      <span><strong>Chưa kiểm tra được bản cập nhật.</strong> Bạn vẫn có thể học bình thường.</span>
      <button className="site-status-refresh" type="button" onClick={()=>{
        setUpdate("idle");setAttempt(value=>value+1);
      }}>Thử lại</button>
      <button className="site-status-close" type="button"
        aria-label="Đóng thông báo" onClick={()=>setDismissed(true)}><X size={17}/></button>
    </div>
  );
  return(
    <div className="site-status-banner update" role="status">
      <RefreshCw size={19}/>
      <span><strong>Focus Buddy có bản mới.</strong> Lưu công việc đang làm
        trước khi tải lại để nhận phiên bản vừa cập nhật.</span>
      <button className="site-status-refresh" type="button"
        onClick={()=>window.location.reload()}>Tải phiên bản mới</button>
      <button className="site-status-close" type="button"
        aria-label="Để cập nhật sau" onClick={()=>setDismissed(true)}><X size={17}/></button>
    </div>
  );
}
