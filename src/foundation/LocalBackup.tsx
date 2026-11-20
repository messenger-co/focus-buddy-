import { useRef, useState } from "react";
import { Download, FileCheck2, HardDriveDownload, ShieldCheck, Upload } from "lucide-react";
import {
  exportLocalBackup, MAX_BACKUP_BYTES, parseLocalBackup, restoreLocalBackup,
  type BackupPreview,
} from "./localBackup";
import "./localBackup.css";

/** Device-to-device transfer. Never sends backup contents to any server. */
export default function LocalBackup() {
  const fileRef=useRef<HTMLInputElement>(null);
  const [withChat,setWithChat]=useState(false);
  const [raw,setRaw]=useState("");
  const [preview,setPreview]=useState<BackupPreview|null>(null);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState(false);
  function notify(text:string,failed=false){setMessage(text);setError(failed);}
  function download(){
    try{
      const backup=exportLocalBackup(localStorage,withChat);
      const data=JSON.stringify(backup,null,2);
      const date=new Date().toISOString().slice(0,10);
      const objectUrl=URL.createObjectURL(new Blob([data],{type:"application/json"}));
      const link=document.createElement("a");
      link.href=objectUrl;
      link.download="focus-buddy-backup-"+date+".json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(()=>URL.revokeObjectURL(objectUrl),1000);
      notify("Đã tạo tệp sao lưu trên thiết bị. Hãy lưu tệp ở nơi riêng tư.");
    }catch(cause){
      notify(cause instanceof Error?cause.message:"Chưa thể tạo bản sao lưu.",true);
    }
  }
  async function selectFile(file:File|undefined){
    if(!file)return;
    setBusy(true);setRaw("");setPreview(null);notify("");
    try{
      if(file.size>MAX_BACKUP_BYTES)
        throw new Error("Tệp quá lớn. Bản sao lưu tối đa 4 MB.");
      const content=await file.text();
      const result=parseLocalBackup(content,withChat);
      setRaw(content);setPreview(result);
      notify("Đã kiểm tra tệp. Dữ liệu chưa được thay đổi.");
    }catch(cause){
      notify(cause instanceof Error?cause.message:"Không mở được tệp sao lưu.",true);
    }finally{
      setBusy(false);
      if(fileRef.current)fileRef.current.value="";
    }
  }
  function restore(){
    if(!raw||busy)return;
    try{
      const checked=parseLocalBackup(raw,withChat);
      if(!window.confirm(
        "Khôi phục "+checked.itemCount+
        " mục từ bản sao lưu? Những mục trùng tên trên thiết bị này sẽ được ghi đè. "+
        "Không ảnh hưởng tài khoản Supabase; chỉ dữ liệu lưu tại trình duyệt."
      ))return;
      const count=restoreLocalBackup(localStorage,checked.backup);
      notify("Đã khôi phục "+count+" mục. Đang tải lại trang…");
      window.location.reload();
    }catch(cause){
      notify(cause instanceof Error?cause.message:"Khôi phục chưa thành công.",true);
    }
  }
  function toggleChat(next:boolean){
    setWithChat(next);
    if(raw){
      try{setPreview(parseLocalBackup(raw,next));notify("Đã cập nhật lựa chọn dữ liệu sẽ khôi phục.");}
      catch(cause){setPreview(null);notify(cause instanceof Error?cause.message:"Không thể xem bản sao lưu.",true);}
    }
  }
  return (
    <section className="settings-section local-backup" aria-label="Sao lưu dữ liệu cá nhân">
      <div className="local-backup-heading">
        <span className="local-backup-icon"><HardDriveDownload size={22}/></span>
        <div><h3>Sao lưu & chuyển thiết bị</h3>
          <p className="muted">Lưu tiến trình học, chủ đề, trò chơi và playlist vào một tệp JSON. Dữ liệu chỉ được xử lý trên thiết bị, không gửi lên máy chủ.</p>
        </div>
      </div>
      <div className="local-backup-privacy">
        <ShieldCheck size={16}/>
        <span>Không sao lưu mật khẩu, mã đăng nhập hay phiên xác thực. Không tự sao lưu lịch sử trò chuyện AI.</span>
      </div>
      <label className="local-backup-chat-toggle">
        <input type="checkbox" checked={withChat} onChange={event=>toggleChat(event.target.checked)}/>
        Kèm lịch sử chat AI đã lưu (nếu có)
      </label>
      <p className="local-backup-warning">
        Tệp sao lưu có thể chứa biệt danh, ghi chú học tập và lựa chọn cá nhân. Đừng đăng công khai hoặc gửi cho người lạ.
      </p>
      <div className="local-backup-actions">
        <button type="button" className="button secondary" onClick={download}>
          <Download size={17}/> Tải tệp sao lưu
        </button>
        <button type="button" className="button secondary" disabled={busy} onClick={()=>fileRef.current?.click()}>
          <Upload size={17}/> Chọn tệp khôi phục
        </button>
        <input ref={fileRef} type="file" className="local-backup-file" accept=".json,application/json"
          aria-label="Chọn tệp sao lưu Focus Buddy"
          onChange={event=>{void selectFile(event.target.files?.[0]);}}/>
      </div>
      {preview&&(
        <div className="local-backup-preview" role="group" aria-label="Thông tin bản sao lưu">
          <FileCheck2 size={19}/>
          <div>
            <strong>{preview.itemCount} mục dữ liệu sẵn sàng</strong>
            <small>Tạo ngày {new Date(preview.createdAt).toLocaleDateString("vi-VN")} ·
              {preview.containsChat?" Có dữ liệu chat AI":" Không có dữ liệu chat AI"}
            </small>
            <small>Chỉ những dữ liệu hợp lệ, được phép sao lưu mới được khôi phục.</small>
          </div>
          <button type="button" className="button primary" disabled={busy} onClick={restore}>
            Khôi phục
          </button>
        </div>
      )}
      {message&&<p className={error?"form-error":"form-success"} role="status">{message}</p>}
    </section>
  );
}
