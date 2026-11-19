import { createHash } from "node:crypto";
import type { Plugin } from "vite";
export function offlineShell(): Plugin {
  return {
    name: "focus-buddy-offline",
    apply: "build",
    enforce: "post",
    generateBundle(_, bundle) {
      const files = Object.keys(bundle);
      const revision = createHash("sha256")
        .update(files.sort().join("\n"))
        .digest("hex")
        .slice(0, 12);
      const seed = new Set(["index.html", "favicon.svg"]);
      function requireChunk(path: string) {
        if (seed.has(path)) return;
        seed.add(path);
        const c = bundle[path];
        if (c?.type === "chunk") for (const dep of c.imports) requireChunk(dep);
      }
      for (const entry of Object.values(bundle))
        if (entry.type === "chunk" && entry.isEntry)
          requireChunk(entry.fileName);
      for (const file of files)
        if (
          file.endsWith(".css") ||
          (file.includes("vietnamese") && file.endsWith(".woff2"))
        )
          seed.add(file);
      const code = `
const root=new URL(self.registration.scope);
const prefix="focus-buddy-shell:"+root.pathname+":";
const current=prefix+${JSON.stringify(revision)};
const home=new URL("index.html",root).href;
self.addEventListener("install",e=>e.waitUntil((async()=>{const c=await caches.open(current);await c.addAll(${JSON.stringify([...seed])}.map(p=>new URL(p,root).href));await self.skipWaiting();})()));
self.addEventListener("activate",e=>e.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith(prefix)&&k!==current)await caches.delete(k);await self.clients.claim();})()));
self.addEventListener("fetch",e=>{const req=e.request,u=new URL(req.url);
 if(req.method!=="GET"||u.origin!==root.origin||!u.pathname.startsWith(root.pathname))return;
 if(req.mode==="navigate"&&(u.pathname===root.pathname||u.href===home)){e.respondWith(fetch(req).catch(()=>caches.match(home)));return;}
 if(u.search||!u.pathname.startsWith(root.pathname+"assets/"))return;
 e.respondWith((async()=>{const c=await caches.open(current);const hit=await c.match(req);if(hit)return hit;
 const res=await fetch(req);if(res.ok)await c.put(req,res.clone());return res;})());
});`;
      this.emitFile({ type: "asset", fileName: "offline.js", source: code });
    },
  };
}
