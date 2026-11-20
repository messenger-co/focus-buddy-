import { useRef, useState } from "react";
import {
  AlertTriangle, Check, Download, FileCheck2, HardDriveDownload,
  ShieldCheck, Upload, X,
} from "lucide-react";
import {
  BACKUP_CATEGORIES, backupOverwriteCount, exportLocalBackup,
  MAX_BACKUP_BYTES, parseLocalBackup, restoreLocalBackup,
  type BackupPreview, type BackupCategory,
} from "./localBackup";
import "./localBackup.css";

const friendly=(reason:unknown,fallback:string)=>
  reason instanceof Error?reason.message:fallback;

/** Private transfer panel. File contents never leave the browser. */
export default function LocalBackup() {
  const fileInput=useRef<HTMLInputElement>(null);
  const requestIndex=useRef(0);
  const [includeChat,setIncludeChat]=useState(false);
  const [raw,setRaw]=useState("");
  const [preview,setPreview]=useState<BackupPreview|null>(null);
  const [overwrite,setOverwrite]=useState(0);
  const [confirming,setConfirming]=useState(false);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [failed,setFailed]=useState(false);

  function feedback(text:string,isError=false){
    setMessage(text);
    setFailed(isError);
  }
  function download(){
    try{
      const backup=exportLocalBackup(localStorage,includeChat);
      const data=JSON.stringify(backup,null,2);
      const url=URL.createObjectURL(new Blob([data],{type:"application/json;charset=utf-8"}));
      const a=document.createElement("a");
      a.href=url;
      a.download="focus-buddy-backup-"+new Date().toISOString().slice(0,10)+".json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(()=>URL.revokeObjectURL(url),1000);
      feedback("Đã chuẩn bị tệp sao lưu. Hãy giữ tệp ở nơi riêng tư.");
    }catch(reason){
      feedback(friendly(reason,"Không thể sao lưu dữ liệu trên thiết bị."),true);
    }
  }
  function inspect(content:string,withHistory:boolean) {
    const result=parseLocalBackup(content,withHistory);
    // Browser privacy settings may block localStorage completely.
    const count=backupOverwriteCount(localStorage,result.backup);
    setPreview(result);
    setOverwrite(count);
    return result;
  }
  async function pickFile(file:File|undefined){
    if(!file)return;
    const ticket=++requestIndex.current;
    setBusy(true);
    setRaw("");
    setPreview(null);
    setConfirming(false);
    feedback("");
    try{
      if(!file.name.toLowerCase().endsWith(".json"))
        throw new Error("Hãy chọn tệp .json từ Focus Buddy.");
      if(file.size>MAX_BACKUP_BYTES)
        throw new Error("Tệp sao lưu vượt giới hạn 4 MB.");
      const content=await file.text();
      if(ticket!==requestIndex.current)return;
      inspect(content,includeChat);
      setRaw(content);
      feedback("Đã kiểm tra bản sao lưu. Chưa thay đổi dữ liệu trên thiết bị.");
    }catch(reason){
      if(ticket===requestIndex.current){
        setPreview(null);
        feedback(friendly(reason,"Không thể đọc tệp sao lưu."),true);
      }
    }finally{
      if(ticket===requestIndex.current)setBusy(false);
      if(fileInput.current)fileInput.current.value="";
    }
  }
  function changeChat(next:boolean){
    setIncludeChat(next);
    setConfirming(false);
    if(!raw)return;
    try{
      inspect(raw,next);
      feedback(next?"Đã đưa lịch sử AI được lưu vào bản xem trước.":"Đã bỏ lịch sử AI khỏi bản xem trước.");
    }catch(reason){
      setPreview(null);
      feedback(friendly(reason,"Không thể xem dữ liệu chat."),true);
    }
  }
  function restore(){
    if(!raw||!preview||busy||!confirming)return;
    setBusy(true);
    try{
      // Parse again immediately before writing, using the selected consent state.
      const selection=parseLocalBackup(raw,includeChat);
      const count=restoreLocalBackup(localStorage,selection.backup);
      feedback("Đã khôi phục "+count+" mục. Đang tải lại trang để cập nhật dữ liệu.");
      window.location.reload();
    }catch(reason){
      setConfirming(false);
      feedback(friendly(reason,"Không thể khôi phục bản sao lưu."),true);
    }finally{
      setBusy(false);
    }
  }

  return (
    <section className="settings-section local-backup" aria-label="Sao lưu và khôi phục dữ liệu">
      <div className="local-backup-heading">
        <span className="local-backup-icon"><HardDriveDownload size={22}/></span>
        <div>
          <h3>Sao lưu & chuyển thiết bị</h3>
          <p className="muted">
            Lưu tiến trình học, điểm trò chơi, phòng học 3D, chủ đề, nhạc và nhật ký
            thành tệp JSON. Dữ liệu chỉ được xử lý trên thiết bị của bạn.
          </p>
        </div>
      </div>
      <div className="local-backup-privacy">
        <ShieldCheck size={17}/>
        <span>Không xuất khóa đăng nhập, phiên Supabase hay dữ liệu của trang khác.
          Lịch sử AI chỉ được xuất hoặc khôi phục khi bạn tự chọn.</span>
      </div>
      <label className="local-backup-chat-toggle">
        <input type="checkbox" checked={includeChat}
          onChange={event=>changeChat(event.target.checked)}/>
        Kèm lịch sử trò chuyện AI đã lưu (tùy chọn)
      </label>
      <p className="local-backup-warning">
        Bản sao lưu có thể chứa tên hiển thị, lịch sử học và ghi chú riêng tư.
        Không đăng tệp lên mạng hoặc chia sẻ cho người lạ.
        Dữ liệu thuộc tài khoản trực tuyến không nằm trong bản sao lưu này.
      </p>
      <div className="local-backup-actions">
        <button className="button secondary" type="button" onClick={download} disabled={busy}>
          <Download size={17}/> Tải bản sao lưu
        </button>
        <button className="button secondary" type="button" disabled={busy}
          onClick={()=>fileInput.current?.click()}>
          <Upload size={17}/> Chọn tệp để khôi phục
        </button>
        <input ref={fileInput} className="local-backup-file" type="file"
          accept=".json,application/json" aria-label="Tệp sao lưu JSON"
          onChange={event=>{void pickFile(event.target.files?.[0]);}}/>
      </div>
      {busy&&<p className="muted" role="status">Đang xử lý dữ liệu trên thiết bị…</p>}
      {preview&&(
        <div className="local-backup-preview" role="group" aria-label="Xem trước bản sao lưu">
          <div className="local-backup-preview-head">
            <FileCheck2 size={20}/>
            <div>
              <strong>{preview.itemCount} mục có thể khôi phục</strong>
              <small>Ngày tạo: {new Date(preview.createdAt).toLocaleString("vi-VN")}</small>
            </div>
          </div>
          <div className="local-backup-category-grid">
            {(Object.keys(BACKUP_CATEGORIES) as BackupCategory[]).map(category=>{
              const count=preview.categories.find(group=>group.category===category)?.count||0;
              return (
                <span key={category} className={count?"has-data":"no-data"}>
                  {count?<Check size={13}/>:<X size={13}/>}
                  {BACKUP_CATEGORIES[category]} · {count}
                </span>
              );
            })}
          </div>
          <p className="local-backup-warning">
            {overwrite} mục sẽ thay thế dữ liệu đang có trong trình duyệt; các mục
            khác được giữ nguyên. {preview.containsChat&&!includeChat
              ?"Lịch sử AI trong tệp đang được bỏ qua.":""}
          </p>
          {!confirming?(
            <button className="button primary" type="button"
              disabled={busy} onClick={()=>setConfirming(true)}>
              Xem xác nhận khôi phục
            </button>
          ):(
            <div className="local-backup-confirm" role="group"
              aria-label="Xác nhận ghi đè dữ liệu">
              <AlertTriangle size={19}/>
              <p>
                Khôi phục {preview.itemCount} mục và ghi đè {overwrite} mục đang có?
                Hãy sao lưu dữ liệu hiện tại trước khi tiếp tục.
              </p>
              <div className="local-backup-confirm-actions">
                <button className="button secondary" type="button"
                  onClick={()=>setConfirming(false)} disabled={busy}>Hủy</button>
                <button className="button primary" type="button"
                  onClick={restore} disabled={busy}>Xác nhận khôi phục</button>
              </div>
            </div>
          )}
        </div>
      )}
      {message&&<p role={failed?"alert":"status"}
        className={failed?"form-error":"form-success"}>{message}</p>}
    </section>
  );
}
