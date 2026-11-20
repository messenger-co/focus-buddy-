import { createHash } from "node:crypto";
import type { Plugin } from "vite";

export type RevisionItem={name:string;content:string|Uint8Array};

/** Include content bytes, not just filenames: a changed resource must
 * never reuse its previous service-worker cache revision.
 */
export function offlineRevision(files:readonly RevisionItem[]):string {
  const hash=createHash("sha256");
  for(const {name,content} of [...files].sort((a,b)=>a.name.localeCompare(b.name))){
    const bytes=typeof content==="string"?Buffer.from(content,"utf8"):content;
    hash.update(Buffer.from(name,"utf8"));
    hash.update(Buffer.from([0]));
    hash.update(Buffer.from(String(bytes.byteLength),"ascii"));
    hash.update(Buffer.from([0]));
    hash.update(bytes);
    hash.update(Buffer.from([0]));
  }
  return hash.digest("hex").slice(0,16);
}
/** Pure generator so service-worker source is testable without a live browser. */
export function offlineWorkerSource(revision:string,assets:readonly string[]):string {
  return "const root=new URL(self.registration.scope);\nconst prefix=\"focus-buddy-shell:\"+root.pathname+\":\";\nconst current=prefix+__REVISION__;\nconst home=new URL(\"index.html\",root).href;\nconst assets=__ASSETS__.map(path=>new URL(path,root).href);\nself.addEventListener(\"install\",event=>{\n  event.waitUntil((async()=>{\n    const cache=await caches.open(current);\n    // A failed pre-cache must not replace the last working offline shell.\n    await cache.addAll(assets);\n    await self.skipWaiting();\n  })());\n});\nself.addEventListener(\"activate\",event=>{\n  event.waitUntil((async()=>{\n    for(const key of await caches.keys()){\n      if(key.startsWith(prefix)&&key!==current)await caches.delete(key);\n    }\n    await self.clients.claim();\n  })());\n});\nself.addEventListener(\"fetch\",event=>{\n  const request=event.request;\n  const url=new URL(request.url);\n  if(request.method!==\"GET\"||url.origin!==root.origin||\n      !url.pathname.startsWith(root.pathname))return;\n  if(request.mode===\"navigate\"&&\n      (url.pathname===root.pathname||url.href===home)){\n    event.respondWith(fetch(request).catch(async()=>{\n      const cache=await caches.open(current);\n      const fallback=await cache.match(home);\n      if(fallback)return fallback;\n      throw new Error(\"Offline shell unavailable\");\n    }));\n    return;\n  }\n  // Static assets only. Never cache API, auth or external requests.\n  if(url.search||!url.pathname.startsWith(root.pathname+\"assets/\"))return;\n  event.respondWith((async()=>{\n    const cache=await caches.open(current);\n    const hit=await cache.match(request);\n    if(hit)return hit;\n    const response=await fetch(request);\n    if(response.ok&&response.type!==\"opaque\"){\n      try{await cache.put(request,response.clone());}catch{/* Quota exceeded. */}\n    }\n    return response;\n  })());\n});"
    .replace("__REVISION__",JSON.stringify(revision))
    .replace("__ASSETS__",JSON.stringify(assets));
}
export function offlineShell():Plugin {
  return {
    name:"focus-buddy-offline",
    apply:"build",
    enforce:"post",
    generateBundle(_options,bundle){
      const files=Object.entries(bundle).map(([name,file])=>({
        name,content:file.type==="chunk"?file.code:file.source,
      }));
      const revision=offlineRevision(files);
      const seed=new Set<string>(["index.html","favicon.svg"]);
      function requireChunk(path:string){
        if(seed.has(path))return;
        seed.add(path);
        const file=bundle[path];
        if(file?.type==="chunk")for(const dependency of file.imports)requireChunk(dependency);
      }
      for(const entry of Object.values(bundle)){
        if(entry.type==="chunk"&&entry.isEntry)requireChunk(entry.fileName);
      }
      for(const name of Object.keys(bundle)){
        if(name.endsWith(".css")||(name.includes("vietnamese")&&name.endsWith(".woff2")))
          seed.add(name);
      }
      this.emitFile({
        type:"asset",fileName:"offline.js",
        source:offlineWorkerSource(revision,[...seed].sort()),
      });
    },
  };
}
