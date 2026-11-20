import { describe, expect, it } from "vitest";
import { offlineRevision, offlineWorkerSource } from "../tooling/offline";

describe("content-versioned Focus Buddy offline shell",()=>{
  const old=[
    {name:"assets/index.js",content:"console.log('first')"},
    {name:"assets/main.css",content:"body { color: green }"},
  ] as const;
  it("stays deterministic regardless of bundle iteration order",()=>{
    expect(offlineRevision(old)).toBe(offlineRevision([...old].reverse()));
    expect(offlineRevision(old)).toMatch(/^[a-f0-9]{16}$/);
  });
  it("changes cache revision if content changes but filenames stay unchanged",()=>{
    const changed=[
      {name:"assets/index.js",content:"console.log('second')"},
      old[1],
    ];
    expect(offlineRevision(changed)).not.toBe(offlineRevision(old));
  });
  it("distinguishes different filenames and binary asset bytes",()=>{
    const a=[{name:"assets/asset.webp",content:new Uint8Array([1,2,3])}];
    const b=[{name:"assets/asset.webp",content:new Uint8Array([1,2,4])}];
    expect(offlineRevision(a)).not.toBe(offlineRevision(b));
    expect(offlineRevision(a)).not.toBe(offlineRevision([
      {name:"assets/other.webp",content:new Uint8Array([1,2,3])},
    ]));
  });
  it("emits versioned scope-contained caching with atomic install and offline fallback",()=>{
    const code=offlineWorkerSource("abcdef1234567890",[
      "index.html","favicon.svg","assets/index.js",
    ]);
    expect(code).toContain('const current=prefix+"abcdef1234567890"');
    expect(code).toContain("await cache.addAll(assets)");
    expect(code.indexOf("await cache.addAll")).toBeLessThan(code.indexOf("await self.skipWaiting"));
    expect(code).toContain('url.pathname.startsWith(root.pathname+"assets/")');
    expect(code).toContain('request.method!=="GET"');
    expect(code).toContain('url.origin!==root.origin');
    expect(code).toContain("await cache.match(home)");
    expect(code).not.toContain("__REVISION__");
    expect(code).not.toContain("__ASSETS__");
    expect(code).toContain("assets/index.js");
  });
});
