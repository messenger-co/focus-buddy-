import { describe, expect, it } from "vitest";
import {
  BACKUP_FORMAT, BACKUP_VERSION, exportLocalBackup,
  MAX_BACKUP_BYTES, parseLocalBackup, restoreLocalBackup,
} from "./localBackup";

function memory(initial:Record<string,string>={}) {
  const rows=new Map(Object.entries(initial));
  const storage={
    get length(){return rows.size;},
    key(index:number){return [...rows.keys()][index]??null;},
    getItem(key:string){return rows.get(key)??null;},
    setItem(key:string,value:string){rows.set(key,value);},
    removeItem(key:string){rows.delete(key);},
  };
  return storage;
}
describe("local-only Focus Buddy backup",()=>{
  it("exports progress and preferences but excludes auth secrets and unrelated storage",()=>{
    const storage=memory({
      "focus-buddy-demo-v2":'{"progress":1}',
      "focus-buddy-appearance-v3":'{"motion":"minimal"}',
      "focus-buddy-youtube-music-v1":'[]',
      "focus-buddy-auth-token":"secret",
      "focus-buddy-api-key-v1":"do-not-export",
      "sb-project-auth-token":"supabase-token",
      "external-app":"ignore",
      "focus-buddy-assistant-history-v1":'[{"role":"user"}]',
    });
    const data=exportLocalBackup(storage,false,new Date("2026-11-20T00:00:00.000Z"));
    expect(data.format).toBe(BACKUP_FORMAT);
    expect(data.version).toBe(BACKUP_VERSION);
    expect(data.createdAt).toBe("2026-11-20T00:00:00.000Z");
    expect(data.items["focus-buddy-demo-v2"]).toBe('{"progress":1}');
    expect(data.items["focus-buddy-appearance-v3"]).toBeDefined();
    expect(data.items["focus-buddy-auth-token"]).toBeUndefined();
    expect(data.items["focus-buddy-api-key-v1"]).toBeUndefined();
    expect(data.items["sb-project-auth-token"]).toBeUndefined();
    expect(data.items["focus-buddy-assistant-history-v1"]).toBeUndefined();
  });
  it("lets chat history opt in, but not credentials",()=>{
    const storage=memory({
      "focus-buddy-demo-v2":"game",
      "focus-buddy-assistant-history-v1":"my chat",
      "focus-buddy-assistant-history-enabled-v1":"1",
      "focus-buddy-secret":"private",
    });
    const backup=exportLocalBackup(storage,true);
    expect(backup.items["focus-buddy-assistant-history-v1"]).toBe("my chat");
    expect(backup.items["focus-buddy-secret"]).toBeUndefined();
    const preview=parseLocalBackup(JSON.stringify(backup),false);
    expect(preview.containsChat).toBe(true);
    expect(preview.itemCount).toBe(1);
    expect(preview.backup.items["focus-buddy-assistant-history-v1"]).toBeUndefined();
    expect(parseLocalBackup(JSON.stringify(backup),true).itemCount).toBe(3);
  });
  it("restores only validated keys and overwrites matching local values",()=>{
    const old=memory({"focus-buddy-demo-v2":"old","unrelated":"keep"});
    const src=exportLocalBackup(memory({
      "focus-buddy-demo-v2":"new",
      "focus-buddy-appearance-v3":"light",
    }));
    const count=restoreLocalBackup(old,src);
    expect(count).toBe(2);
    expect(old.getItem("focus-buddy-demo-v2")).toBe("new");
    expect(old.getItem("focus-buddy-appearance-v3")).toBe("light");
    expect(old.getItem("unrelated")).toBe("keep");
  });
  it("rejects oversized, unknown format and malformed data",()=>{
    expect(()=>parseLocalBackup("{")).toThrow("JSON");
    expect(()=>parseLocalBackup("X".repeat(MAX_BACKUP_BYTES+1))).toThrow("4 MB");
    expect(()=>parseLocalBackup(JSON.stringify({format:"other",version:1,createdAt:"2026-11-20",items:{"focus-buddy-demo-v2":"ok"}}))).toThrow("tương thích");
    const unsafe={format:BACKUP_FORMAT,version:BACKUP_VERSION,createdAt:"2026-11-20",items:{"focus-buddy-demo-v2":123}};
    expect(()=>parseLocalBackup(JSON.stringify(unsafe))).toThrow("không hợp lệ");
    const noValid={...unsafe,items:{"sb-project-auth-token":"secret"}};
    expect(()=>parseLocalBackup(JSON.stringify(noValid))).toThrow("Không có dữ liệu");
  });
  it("rolls back when storage runs out of space mid-restore",()=>{
    const storage=memory({"focus-buddy-demo-v2":"old"});
    const backup=exportLocalBackup(memory({
      "focus-buddy-demo-v2":"new",
      "focus-buddy-appearance-v3":"new-theme",
    }));
    const failing={
      getItem:storage.getItem,
      setItem:(key:string,value:string)=>{
        if(key==="focus-buddy-appearance-v3")throw new Error("quota");
        storage.setItem(key,value);
      },
      removeItem:storage.removeItem,
    };
    expect(()=>restoreLocalBackup(failing,backup)).toThrow("Không thể khôi phục");
    expect(storage.getItem("focus-buddy-demo-v2")).toBe("old");
    expect(storage.getItem("focus-buddy-appearance-v3")).toBeNull();
  });
});
