import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkSupabaseConnection, cloudCheckText } from "./cloudHealth";

const mocks=vi.hoisted(()=>({
  getSession:vi.fn(),
  getUser:vi.fn(),
  refreshSession:vi.fn(),
  signOut:vi.fn(),
}));
vi.mock("./cloud",()=>({
  cloudConfigured:true,
  supabase:{auth:mocks},
}));
const good = vi.fn(async()=>({ok:true}));
const bad = vi.fn(async()=>({ok:false}));
beforeEach(()=>{
  vi.stubEnv("VITE_SUPABASE_URL","https://example.supabase.co");
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY","sb_publishable_safeexample");
  mocks.getSession.mockReset();
  mocks.getUser.mockReset();
  mocks.refreshSession.mockReset();
  mocks.signOut.mockReset();
  good.mockClear();bad.mockClear();
  mocks.getSession.mockResolvedValue({data:{session:null},error:null});
});
afterEach(()=>vi.unstubAllEnvs());

describe("Supabase reconnection diagnostics",()=>{
  it("identifies missing deployment variables without contacting the server",async()=>{
    vi.stubEnv("VITE_SUPABASE_URL","");
    const result=await checkSupabaseConnection({online:true,fetcher:good});
    expect(result.kind).toBe("unconfigured");
    expect(good).not.toHaveBeenCalled();
    expect(cloudCheckText(result,true)).toContain("GitHub Actions Variables");
  });
  it("reports offline devices without trying to use old cached tokens",async()=>{
    const result=await checkSupabaseConnection({online:false,fetcher:good});
    expect(result.kind).toBe("offline");
    expect(good).not.toHaveBeenCalled();
    expect(mocks.getSession).not.toHaveBeenCalled();
  });
  it("separates an online server from a missing account",async()=>{
    const result=await checkSupabaseConnection({online:true,fetcher:good});
    expect(result).toEqual({
      kind:"online-no-account",serverReachable:true,accountReady:false,
    });
    expect(good).toHaveBeenCalledWith(
      "https://example.supabase.co/auth/v1/health",
      expect.objectContaining({
        method:"GET",
        headers:{apikey:"sb_publishable_safeexample"},
      }),
    );
    expect(mocks.signOut).not.toHaveBeenCalled();
  });
  it("detects unreachable health endpoint instead of claiming reconnection succeeded",async()=>{
    const result=await checkSupabaseConnection({online:true,fetcher:bad});
    expect(result.kind).toBe("unreachable");
    expect(result.serverReachable).toBe(false);
    expect(mocks.getSession).not.toHaveBeenCalled();
  });
  it("distinguishes guest sessions from verified accounts",async()=>{
    mocks.getSession.mockResolvedValueOnce({
      data:{session:{user:{is_anonymous:true},refresh_token:"guest"}},
      error:null,
    });
    expect((await checkSupabaseConnection({online:true,fetcher:good})).kind)
      .toBe("online-guest");
    mocks.getSession.mockResolvedValueOnce({
      data:{session:{user:{is_anonymous:false},refresh_token:"refresh"}},
      error:null,
    });
    mocks.getUser.mockResolvedValueOnce({
      data:{user:{id:"test-user",email:"test@example.com"}},error:null,
    });
    const result=await checkSupabaseConnection({online:true,fetcher:good});
    expect(result.kind).toBe("online-account");
    expect(result.accountReady).toBe(true);
  });
  it("tries exactly one existing-session refresh and never signs out behind the user's back",async()=>{
    mocks.getSession.mockResolvedValue({
      data:{session:{user:{is_anonymous:false},refresh_token:"refresh-token"}},
      error:null,
    });
    mocks.getUser.mockResolvedValueOnce({data:{user:null},error:new Error("expired")});
    mocks.refreshSession.mockResolvedValueOnce({
      data:{session:{user:{id:"restored"}}},error:null,
    });
    mocks.getUser.mockResolvedValueOnce({
      data:{user:{id:"restored",email:"test@example.com"}},error:null,
    });
    const result=await checkSupabaseConnection({online:true,fetcher:good});
    expect(result.kind).toBe("online-account");
    expect(mocks.refreshSession).toHaveBeenCalledTimes(1);
    expect(mocks.signOut).not.toHaveBeenCalled();
  });
  it("points to email login after a genuinely expired session",async()=>{
    mocks.getSession.mockResolvedValue({
      data:{session:{user:{is_anonymous:false},refresh_token:"old"}},
      error:null,
    });
    mocks.getUser.mockResolvedValue({data:{user:null},error:new Error("expired")});
    mocks.refreshSession.mockResolvedValue({data:{session:null},error:new Error("revoked")});
    const result=await checkSupabaseConnection({online:true,fetcher:good});
    expect(result.kind).toBe("auth-expired");
    expect(cloudCheckText(result,false)).toContain("đăng nhập lại");
    expect(mocks.signOut).not.toHaveBeenCalled();
  });
});
