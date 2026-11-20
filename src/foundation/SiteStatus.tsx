import { useEffect, useRef, useState } from "react";
import { CloudOff, RefreshCw, X } from "lucide-react";
import "./siteStatus.css";

/** Informative only: never refresh automatically while someone is studying. */
export default function SiteStatus() {
  const [online,setOnline]=useState(()=>{
    return typeof navigator==="undefined" || navigator.onLine!==false;
  });
  const [updated,setUpdated]=useState(false);
  const [dismissed,setDismissed]=useState(false);
  const controller=useRef<ServiceWorker|null>(
    typeof navigator!=="undefined"&&"serviceWorker" in navigator
      ? navigator.serviceWorker.controller : null,
  );
  useEffect(()=>{
    const onOnline=()=>setOnline(true);
    const onOffline=()=>setOnline(false);
    window.addEventListener("online",onOnline);
    window.addEventListener("offline",onOffline);
    if(!("serviceWorker" in navigator))return()=>{
      window.removeEventListener("online",onOnline);
      window.removeEventListener("offline",onOffline);
    };
    let active=true;
    const onChange=()=>{
      const next=navigator.serviceWorker.controller;
      if(active && controller.current && next && next!==controller.current){
        setUpdated(true);
        setDismissed(false);
      }
      controller.current=next;
    };
    navigator.serviceWorker.addEventListener("controllerchange",onChange);
    void navigator.serviceWorker.getRegistration().then(reg=>{
      if(active&&reg?.waiting&&controller.current){
        setUpdated(true);
        setDismissed(false);
      }
    }).catch(()=>undefined);
    return()=>{
      active=false;
      window.removeEventListener("online",onOnline);
      window.removeEventListener("offline",onOffline);
      navigator.serviceWorker.removeEventListener("controllerchange",onChange);
    };
  },[]);
  if(!online)return (
    <div className="site-status-banner offline" role="status">
      <CloudOff size={19}/>
      <span><strong>Đang ngoại tuyến.</strong> Các tính năng đã tải và dữ liệu trên thiết bị vẫn có thể dùng. AI trực tuyến và phòng thảo luận cần mạng.</span>
    </div>
  );
  if(!updated||dismissed)return null;
  return (
    <div className="site-status-banner update" role="status">
      <RefreshCw size={19}/>
      <span><strong>Có phiên bản mới!</strong> Hãy lưu công việc đang làm trước khi tải lại.</span>
      <button type="button" className="site-status-refresh" onClick={()=>window.location.reload()}>
        Tải phiên bản mới
      </button>
      <button type="button" className="site-status-close" onClick={()=>setDismissed(true)}
        aria-label="Để cập nhật sau"><X size={17}/></button>
    </div>
  );
}
