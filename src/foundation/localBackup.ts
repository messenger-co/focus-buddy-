/** Portable, local-only Focus Buddy backup.
 * Only audited application keys are eligible. Supabase sessions, credentials and
 * other origin storage are never scanned for export or written during restore.
 */
export const BACKUP_FORMAT = "focus-buddy-local-backup";
export const BACKUP_VERSION = 1;
export const MAX_BACKUP_BYTES = 4_000_000;
export const MAX_BACKUP_ITEMS = 150;
export const MAX_VALUE_BYTES = 650_000;

const CHAT_KEY = "focus-buddy-assistant-history-v1";
const CHAT_PREFERENCE = "focus-buddy-assistant-history-enabled-v1";

/** These match actual storage writers in src/state.ts, focus3/settings.ts,
 * foundation/{appearance,Journal}.tsx, games/{library,BuddyRunner,Games}.tsx,
 * music/Music.tsx and world3/World.tsx.
 */
const EXACT_KEYS = new Set([
  "focus-buddy-demo-v2",
  "focus-buddy-focus-studio-v1",
  "focus-buddy-appearance-v3",
  "focus-buddy-journal-v3",
  "focus-buddy-pinned-games-v1",
  "focus-buddy-rich-effects-v1",
  "focus-buddy-runner-record-v1",
  "focus-buddy-youtube-music-v1",
  "fb3-study-room",
  CHAT_KEY,
  CHAT_PREFERENCE,
]);

// Games record slash-delimited keys. They must never be rejected as malformed.
const LEVEL_KEY = /^focus-buddy-level-v1\/[a-z0-9-]{1,64}\/[1-9][0-9]?$/;
const LEGACY_ARCADE_KEY = /^focus-buddy-arcade-v1\/[a-z0-9-]{1,64}\/[a-z0-9-]{1,64}$/;
const CREATIVE_KEY = /^focus-buddy-creative\/(?:xuong-ve|vuon-nho|phong-nho)$/;

export type BackupCategory = "progress"|"focus"|"games"|"world"|"music"|"journal"|"appearance"|"chat";
export const BACKUP_CATEGORIES: Readonly<Record<BackupCategory,string>> = {
  progress: "Tiến trình Buddy",
  focus: "Thiết lập học tập",
  games: "Trò chơi và sáng tạo",
  world: "Phòng học 3D",
  music: "Playlist âm nhạc",
  journal: "Nhật ký học",
  appearance: "Giao diện",
  chat: "Lịch sử AI (tùy chọn)",
};
export type BackupSummary = { category: BackupCategory; label: string; count: number };
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
  categories: BackupSummary[];
  /** Number of valid, importable chat-related keys actually in the preview. */
  chatItems: number;
};

export function backupCategory(key:string):BackupCategory|null {
  if(!EXACT_KEYS.has(key)&&!LEVEL_KEY.test(key)&&
    !LEGACY_ARCADE_KEY.test(key)&&!CREATIVE_KEY.test(key))return null;
  if(key===CHAT_KEY||key===CHAT_PREFERENCE)return "chat";
  if(key==="focus-buddy-demo-v2")return "progress";
  if(key==="focus-buddy-focus-studio-v1")return "focus";
  if(key==="focus-buddy-appearance-v3"||key==="focus-buddy-rich-effects-v1")return "appearance";
  if(key==="focus-buddy-journal-v3")return "journal";
  if(key==="focus-buddy-youtube-music-v1")return "music";
  if(key==="fb3-study-room")return "world";
  return "games";
}
export function allowedBackupKey(key:string,includeChat=false):boolean {
  const type=backupCategory(key);
  return type!==null&&(includeChat||type!=="chat");
}
function byteLength(value:string):number {
  return new TextEncoder().encode(value).byteLength;
}
function invalid(message:string):never {throw new Error(message);}
function checkedItem(entries:Record<string,string>,key:string,value:unknown,
  includeChat:boolean,total:{bytes:number;count:number}):void {
  if(!allowedBackupKey(key,includeChat))return;
  if(typeof value!=="string")invalid("Bản sao lưu chứa dữ liệu không hợp lệ.");
  const bytes=byteLength(value);
  if(bytes>MAX_VALUE_BYTES)invalid("Một mục dữ liệu vượt quá giới hạn 650 KB.");
  total.bytes+=bytes;
  total.count++;
  if(total.count>MAX_BACKUP_ITEMS||total.bytes>MAX_BACKUP_BYTES)
    invalid("Bản sao lưu vượt giới hạn 150 mục hoặc 4 MB.");
  entries[key]=value;
}
function summarise(items:Record<string,string>):BackupSummary[] {
  const counts=new Map<BackupCategory,number>();
  for(const key of Object.keys(items)) {
    const category=backupCategory(key);
    if(category)counts.set(category,(counts.get(category)||0)+1);
  }
  return (Object.keys(BACKUP_CATEGORIES) as BackupCategory[])
    .filter(category=>counts.has(category))
    .map(category=>({category,label:BACKUP_CATEGORIES[category],count:counts.get(category)!}));
}
export function exportLocalBackup(
  storage:Pick<Storage,"length"|"key"|"getItem">,
  includeChat=false,
  timestamp=new Date(),
):LocalBackup {
  const items:Record<string,string>=Object.create(null);
  const total={bytes:0,count:0};
  // Snapshot the names up front: browsers can mutate localStorage while exporting.
  const names=new Set<string>();
  for(let i=0;i<storage.length;i++){
    const key=storage.key(i);
    if(key&&allowedBackupKey(key,includeChat))names.add(key);
  }
  for(const key of [...names].sort()){
    const value=storage.getItem(key);
    if(value!==null)checkedItem(items,key,value,includeChat,total);
  }
  if(!total.count)invalid("Thiết bị chưa có dữ liệu Focus Buddy để sao lưu.");
  const backup:LocalBackup={
    format:BACKUP_FORMAT,version:BACKUP_VERSION,
    createdAt:timestamp.toISOString(),items,
  };
  if(byteLength(JSON.stringify(backup))>MAX_BACKUP_BYTES)
    invalid("Bản sao lưu vượt giới hạn 4 MB.");
  return backup;
}
export function parseLocalBackup(raw:string,includeChat=false):BackupPreview {
  if(byteLength(raw)>MAX_BACKUP_BYTES)invalid("Tệp sao lưu quá lớn (tối đa 4 MB).");
  let source:unknown;
  try{source=JSON.parse(raw);}catch{invalid("Tệp JSON không hợp lệ.");}
  if(!source||typeof source!=="object"||Array.isArray(source))
    invalid("Định dạng bản sao lưu không hợp lệ.");
  const value=source as Partial<LocalBackup>;
  if(value.format!==BACKUP_FORMAT||value.version!==BACKUP_VERSION)
    invalid("Đây không phải bản sao lưu Focus Buddy tương thích.");
  if(typeof value.createdAt!=="string"||
     !Number.isFinite(Date.parse(value.createdAt))||
     value.createdAt.length>64)
    invalid("Thiếu ngày tạo bản sao lưu hợp lệ.");
  if(!value.items||typeof value.items!=="object"||Array.isArray(value.items))
    invalid("Bản sao lưu không có danh sách dữ liệu.");
  const items:Record<string,string>=Object.create(null);
  const total={bytes:0,count:0};
  const supplied=Object.entries(value.items);
  if(supplied.length>MAX_BACKUP_ITEMS*4)
    invalid("Bản sao lưu chứa quá nhiều mục.");
  const containsChat=supplied.some(([key])=>key===CHAT_KEY||key===CHAT_PREFERENCE);
  for(const [key,item] of supplied)checkedItem(items,key,item,includeChat,total);
  if(!total.count)invalid("Không có dữ liệu hợp lệ để khôi phục.");
  const categories=summarise(items);
  return {
    backup:{format:BACKUP_FORMAT,version:BACKUP_VERSION,createdAt:value.createdAt,items},
    itemCount:total.count,containsChat,createdAt:value.createdAt,
    categories,chatItems:categories.find(group=>group.category==="chat")?.count||0,
  };
}
export function backupOverwriteCount(
  storage:Pick<Storage,"getItem">,backup:LocalBackup,
):number {
  let count=0;
  for(const key of Object.keys(backup.items)){
    if(allowedBackupKey(key,true)&&storage.getItem(key)!==null)count++;
  }
  return count;
}
/** Validate the complete input before any writes. Restore old values on failure.
 * Existing keys not represented in the backup remain untouched.
 */
export function restoreLocalBackup(
  storage:Pick<Storage,"getItem"|"setItem"|"removeItem">,
  backup:LocalBackup,
):number {
  const checked=parseLocalBackup(JSON.stringify(backup),true).backup;
  const prior:[string,string|null][]=[];
  const entries=Object.entries(checked.items);
  try{
    for(const [key,value] of entries){
      prior.push([key,storage.getItem(key)]);
      storage.setItem(key,value);
    }
  }catch{
    for(const [key,previous] of prior.reverse()){
      try{
        if(previous===null)storage.removeItem(key);
        else storage.setItem(key,previous);
      }catch{/* The browser may have disabled writes entirely. */}
    }
    invalid("Không thể khôi phục dữ liệu. Bộ nhớ trình duyệt có thể đã đầy hoặc bị chặn.");
  }
  return entries.length;
}
