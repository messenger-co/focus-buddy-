import { cloudConfigured, supabase } from "./cloud";

/** Safe connection diagnostics. Never reads private keys or clears local progress.
 * A reachable Supabase server and a signed-in account are two different states.
 */
export type CloudCheckKind =
  | "unconfigured" | "offline" | "unreachable"
  | "online-no-account" | "online-guest" | "online-account" | "auth-expired";
export interface CloudCheck {
  kind: CloudCheckKind;
  serverReachable: boolean;
  accountReady: boolean;
}
type HealthResponse = {
  ok: boolean;
};
export type ProbeOptions = {
  online?: boolean;
  timeoutMs?: number;
  fetcher?: (input: string, init?: RequestInit) => Promise<HealthResponse>;
};

/** The health request tests real server reachability, unlike getSession(),
 * which can succeed by reading an old session from local storage alone.
 */
export async function checkSupabaseConnection(
  options: ProbeOptions = {},
): Promise<CloudCheck> {
  if (!cloudConfigured || !supabase)
    return { kind: "unconfigured", serverReachable: false, accountReady: false };
  if (options.online === false ||
      (options.online === undefined && typeof navigator !== "undefined" &&
        navigator.onLine === false))
    return { kind: "offline", serverReachable: false, accountReady: false };

  const url = import.meta.env.VITE_SUPABASE_URL?.trim().replace(/\/+$/, "");
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key)
    return { kind: "unconfigured", serverReachable: false, accountReady: false };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(),options.timeoutMs ?? 8500);
  try {
    const health = await (options.fetcher || fetch)(
      url + "/auth/v1/health",
      {
        method: "GET",
        cache: "no-store",
        headers: { apikey: key },
        signal: controller.signal,
      },
    );
    if (!health.ok)
      return { kind: "unreachable", serverReachable: false, accountReady: false };
  } catch {
    return { kind: "unreachable", serverReachable: false, accountReady: false };
  } finally {
    clearTimeout(timeout);
  }
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error)
      return { kind: "auth-expired", serverReachable: true, accountReady: false };
    const session = data.session;
    if (!session)
      return { kind: "online-no-account", serverReachable: true, accountReady: false };
    if (session.user.is_anonymous)
      return { kind: "online-guest", serverReachable: true, accountReady: false };

    // getUser confirms the session against Supabase, not just cached JWT claims.
    let check = await supabase.auth.getUser();
    if (check.error && session.refresh_token) {
      // Attempt exactly one safe refresh, without signing the user out.
      const renewed = await supabase.auth.refreshSession();
      if (!renewed.error && renewed.data.session)
        check = await supabase.auth.getUser();
    }
    if (check.error || !check.data.user)
      return { kind: "auth-expired", serverReachable: true, accountReady: false };
    return { kind: "online-account", serverReachable: true, accountReady: true };
  } catch {
    return { kind: "auth-expired", serverReachable: true, accountReady: false };
  }
}

export function cloudCheckText(result: CloudCheck, english: boolean): string {
  const messages: Record<CloudCheckKind, readonly [string, string]> = {
    unconfigured: [
      "Supabase chưa được cấu hình trong bản dựng GitHub Pages. Cần đặt GitHub Actions Variables VITE_SUPABASE_URL và VITE_SUPABASE_PUBLISHABLE_KEY rồi triển khai lại.",
      "Supabase isn't configured in this GitHub Pages build. Set GitHub Actions Variables VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY, then redeploy.",
    ],
    offline: [
      "Thiết bị đang ngoại tuyến. Hãy kết nối Wi-Fi hoặc dữ liệu di động rồi thử lại.",
      "Your device is offline. Connect to the internet and try again.",
    ],
    unreachable: [
      "Chưa liên hệ được máy chủ Supabase. Kiểm tra mạng, trạng thái dự án Supabase rồi thử lại. Tiến trình cục bộ vẫn an toàn.",
      "Can't reach the Supabase server. Check your connection and project status, then retry. Your local progress is safe.",
    ],
    "online-no-account": [
      "Đã kết nối Supabase! Bạn chưa đăng nhập. Trợ lý AI vẫn có thể dùng phiên khách; phòng thảo luận cần email đã xác minh.",
      "Connected to Supabase! You're not signed in. The AI tutor can use guest access; live discussions need verified email.",
    ],
    "online-guest": [
      "Đã kết nối Supabase bằng phiên khách. Đăng nhập bằng email đã xác minh nếu muốn tham gia phòng thảo luận trực tuyến.",
      "Connected to Supabase with a guest session. Sign in with a verified email to join live discussions.",
    ],
    "online-account": [
      "Đã kết nối lại Supabase và xác minh phiên tài khoản thành công.",
      "Reconnected to Supabase and verified your account session.",
    ],
    "auth-expired": [
      "Máy chủ Supabase đang hoạt động, nhưng phiên đăng nhập không còn hợp lệ. Hãy đăng nhập lại bằng email trong phần Tài khoản phòng học.",
      "Supabase is online, but your login session needs attention. Sign in again with your email under Study Room Account.",
    ],
  };
  return messages[result.kind][english ? 1 : 0];
}
