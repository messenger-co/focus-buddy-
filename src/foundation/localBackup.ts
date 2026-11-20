/** Portable, local-only Focus Buddy data backup.
 * Never export browser session tokens, Supabase auth, API credentials or unknown keys.
 * Backups contain locally saved preferences, practice results and game progress.
 */
export const BACKUP_FORMAT = "focus-buddy-local-backup";
export const BACKUP_VERSION = 1;
export const MAX_BACKUP_BYTES = 4_000_000;
export const MAX_BACKUP_ITEMS = 150;
const MAX_VALUE_BYTES = 650_000;
const CHAT_KEY = "focus-buddy-assistant-history-v1";
const CHAT_PREFERENCE = "focus-buddy-assistant-history-enabled-v1";
const SAFE_KEY = /^focus-buddy-[a-zA-Z0-9_:\-]{1,115}$/;
const FORBIDDEN = /(^|[-_:])(auth|token|secret|password|credential|keychain|private|supabase|apikey|api_key|api-key|session-token)([-_:]|$)/i;

export type LocalBackup = {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  createdAt: string;
  items: Record<string,string>;
};
export type BackupPreview = {
  backup: LocalBackup;
  itemCount: number;
  containsChat: boolean;
  createdAt: string;
};
function isKeyAllowed(key:string, includeChat:boolean){
  if(!SAFE_KEY.test(key)||FORBIDDEN.test(key))return false;
  if(!includeChat&&(key===CHAT_KEY||key===CHAT_PREFERENCE))return false;
  return true;
}
function sizeOf(value:string){
  return new TextEncoder().encode(value).byteLength;
}
function invalid(message:string):never{throw new Error(message);}
export function exportLocalBackup(
  storage:Pick<Storage,"length"|"key"|"getItem">,
  includeChat=false,
  timestamp=new Date(),
):LocalBackup {
  const items:Record<string,string>=Object.create(null);
  let totalBytes=0;
  let count=0;
  for(let i=0;i<storage.length;i++){
    const key=storage.key(i);
    if(!key||!isKeyAllowed(key,includeChat))continue;
    const value=storage.getItem(key);
    if(value===null)continue;
    const bytes=sizeOf(value);
    if(bytes>MAX_VALUE_BYTES)invalid("Một mục dữ liệu quá lớn để sao lưu. Hãy giải phóng bớt dung lượng.");
    totalBytes+=bytes;
    count++;
    if(count>MAX_BACKUP_ITEMS||totalBytes>MAX_BACKUP_BYTES)
      invalid("Dữ liệu trên thiết bị vượt giới hạn sao lưu 4 MB.");
    items[key]=value;
  }
  if(!count)invalid("Thiết bị chưa có dữ liệu Focus Buddy để sao lưu.");
  const backup:LocalBackup={format:BACKUP_FORMAT,version:BACKUP_VERSION,createdAt:timestamp.toISOString(),items};
  if(sizeOf(JSON.stringify(backup))>MAX_BACKUP_BYTES)
    invalid("Bản sao lưu vượt giới hạn 4 MB.");
  return backup;
}
export function parseLocalBackup(raw:string,includeChat=false):BackupPreview{
  if(sizeOf(raw)>MAX_BACKUP_BYTES)invalid("Tệp sao lưu quá lớn (tối đa 4 MB).");
  let source:unknown;
  try{source=JSON.parse(raw);}catch{invalid("Tệp JSON không hợp lệ.");}
  if(!source||typeof source!=="object"||Array.isArray(source))
    invalid("Định dạng bản sao lưu không hợp lệ.");
  const value=source as Partial<LocalBackup>;
  if(value.format!==BACKUP_FORMAT||value.version!==BACKUP_VERSION)
    invalid("Đây không phải bản sao lưu Focus Buddy tương thích.");
  if(typeof value.createdAt!=="string"||!Number.isFinite(Date.parse(value.createdAt)))
    invalid("Thiếu ngày tạo bản sao lưu.");
  if(!value.items||typeof value.items!=="object"||Array.isArray(value.items))
    invalid("Bản sao lưu không có danh sách dữ liệu.");
  const items:Record<string,string>=Object.create(null);
  let totalBytes=0,count=0,containsChat=false;
  for(const [key,item] of Object.entries(value.items)){
    if(key===CHAT_KEY||key===CHAT_PREFERENCE)containsChat=true;
    if(!isKeyAllowed(key,includeChat))continue;
    if(typeof item!=="string")invalid("Tệp sao lưu chứa dữ liệu không hợp lệ.");
    const bytes=sizeOf(item);
    if(bytes>MAX_VALUE_BYTES)invalid("Một mục trong bản sao lưu vượt giới hạn.");
    totalBytes+=bytes;
    if(++count>MAX_BACKUP_ITEMS||totalBytes>MAX_BACKUP_BYTES)
      invalid("Bản sao lưu vượt giới hạn số mục hoặc dung lượng.");
    items[key]=item;
  }
  if(!count)invalid("Không có dữ liệu hợp lệ để khôi phục.");
  return {
    backup:{format:BACKUP_FORMAT,version:BACKUP_VERSION,createdAt:value.createdAt,items},
    itemCount:count,
    containsChat,
    createdAt:value.createdAt,
  };
}
/** Validate fully before writing. Roll back if storage fails or runs out of quota. */
export function restoreLocalBackup(
  storage:Pick<Storage,"getItem"|"setItem"|"removeItem">,
  backup:LocalBackup,
):number {
  const checked=parseLocalBackup(JSON.stringify(backup),true).backup;
  const existing:[string,string|null][]=[];
  const entries=Object.entries(checked.items);
  try{
    for(const [key,value] of entries){
      existing.push([key,storage.getItem(key)]);
      storage.setItem(key,value);
    }
  }catch{
    for(const [key,old] of existing.reverse()){
      try{
        if(old===null)storage.removeItem(key);
        else storage.setItem(key,old);
      }catch{/* Browser may reject rollback when storage is disabled. */}
    }
    invalid("Không thể khôi phục dữ liệu. Bộ nhớ trình duyệt có thể đã đầy hoặc bị chặn.");
  }
  return entries.length;
}
