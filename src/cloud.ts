import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL?.trim() || "";
const publishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || "";
export const apiBaseUrl = `${url.replace(/\/+$/, "")}/functions/v1`;
export const cloudConfigured = Boolean(
  url && publishableKey && /^https:\/\//.test(url),
);
export const apiConfigured = Boolean(
  cloudConfigured,
);

export const supabase = cloudConfigured
  ? createClient(url, publishableKey, {
      auth: {
        flowType: "pkce",
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export function authRedirectUrl(): string {
  return new URL(import.meta.env.BASE_URL, window.location.origin).href;
}

export function friendlyError(
  error: unknown,
  fallback = "Có lỗi xảy ra. Bạn thử lại sau một chút nhé.",
): Error {
  if (error instanceof Error && /[à-ỹÀ-ỸđĐ]/u.test(error.message)) return error;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = String(error.message);
    if (/[à-ỹÀ-ỸđĐ]/u.test(message)) return new Error(message);
  }
  return new Error(fallback);
}
