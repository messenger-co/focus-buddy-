import { describe, expect, it } from "vitest";
import {
  BACKUP_FORMAT, BACKUP_VERSION, exportLocalBackup,
  MAX_BACKUP_BYTES, parseLocalBackup, restoreLocalBackup, backupOverwriteCount,
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
  it("preserves actual slash-delimited game scores, creative rooms and the 3D study room",()=>{
    const device=memory({
      "focus-buddy-level-v1/hang-bang/2":'{"count":5,"seconds":29}',
      "focus-buddy-arcade-v1/jump/grove":'{"count":1,"seconds":15}',
      "focus-buddy-creative/xuong-ve":'[{"x":3,"y":4,"ink":"#487b65"}]',
      "focus-buddy-creative/phong-nho":'["🪴"]',
      "fb3-study-room":'{"wood":"walnut","lamp":true}',
      "focus-buddy-unknown-fake":"not-app-data",
      "focus-buddy-session-token":"never-export",
    });
    const backup=exportLocalBackup(device);
    expect(Object.keys(backup.items)).toHaveLength(5);
    expect(backup.items["focus-buddy-level-v1/hang-bang/2"]).toBeDefined();
    expect(backup.items["fb3-study-room"]).toBeDefined();
    expect(backup.items["focus-buddy-unknown-fake"]).toBeUndefined();
    expect(backup.items["focus-buddy-session-token"]).toBeUndefined();
    const preview=parseLocalBackup(JSON.stringify(backup));
    expect(preview.categories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({category:"games",count:4}),
        expect.objectContaining({category:"world",count:1}),
      ]),
    );
    const restored=memory();
    expect(restoreLocalBackup(restored,preview.backup)).toBe(5);
    expect(restored.getItem("fb3-study-room")).toBe(device.getItem("fb3-study-room"));
    expect(restored.getItem("focus-buddy-level-v1/hang-bang/2")).toBe(device.getItem("focus-buddy-level-v1/hang-bang/2"));
  });
  it("accepts old version-one backups and ignores unknown or dangerous keys",()=>{
    const legacy={
      format:BACKUP_FORMAT,version:1,createdAt:"2026-11-20T00:00:00.000Z",
      items:{
        "focus-buddy-demo-v2":"old-version",
        "focus-buddy-level-v1/dao-may/3":'{"count":1,"seconds":18}',
        "focus-buddy-evil-storage":"ignored",
        "__proto__":"ignored",
        "sb-supabase-auth-token":"secret",
      },
    };
    const preview=parseLocalBackup(JSON.stringify(legacy));
    expect(preview.itemCount).toBe(2);
    expect(preview.backup.items["focus-buddy-evil-storage"]).toBeUndefined();
    const destination=memory({"focus-buddy-demo-v2":"current"});
    expect(backupOverwriteCount(destination,preview.backup)).toBe(1);
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
