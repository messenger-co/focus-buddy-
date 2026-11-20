const key = "focus-buddy-language";
function read() {
  try {
    return localStorage.getItem(key) === "en" ? "en" : "vi";
  } catch {
    return "vi";
  }
}
export const language = read();
export const english = language === "en";
export const locale = english ? "en-GB" : "vi-VN";
document.documentElement.lang = language;
export function switchLanguage(next: "vi" | "en") {
  try {
    localStorage.setItem(key, next);
  } catch {
    return;
  }
  window.location.reload();
}
