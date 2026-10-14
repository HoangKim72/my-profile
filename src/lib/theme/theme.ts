export const THEME_STORAGE_KEY = "theme";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_PREFERENCES: readonly ThemePreference[] = [
  "light",
  "dark",
  "system",
];

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

/**
 * Inline, render-blocking script for <head>. Resolves the stored preference
 * before first paint (no flash) and keeps "system" in sync with the OS
 * setting for the lifetime of the page, even if no toggle is mounted.
 */
export const themeInitScript = `(function(){var k=${JSON.stringify(
  THEME_STORAGE_KEY,
)};var d=document.documentElement;var m=window.matchMedia("(prefers-color-scheme: dark)");function r(){var p="system";try{var s=localStorage.getItem(k);if(s==="light"||s==="dark"||s==="system")p=s}catch(e){}var t=p==="system"?(m.matches?"dark":"light"):p;d.dataset.theme=t;d.style.colorScheme=t}r();try{m.addEventListener("change",r)}catch(e){try{m.addListener(r)}catch(e2){}}window.addEventListener("storage",function(e){if(e.key===k||e.key===null)r()})})();`;

function systemPrefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function readThemePreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === "system") {
    return systemPrefersDark() ? "dark" : "light";
  }
  return preference;
}

export function applyTheme(preference: ThemePreference): ResolvedTheme {
  const resolved = resolveTheme(preference);
  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
  return resolved;
}

const listeners = new Set<() => void>();

/** Persist + apply a preference and notify every mounted ThemeToggle. */
export function setThemePreference(preference: ThemePreference): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Storage blocked (private mode etc.): still apply for this page view.
  }
  applyTheme(preference);
  listeners.forEach((listener) => listener());
}

/** useSyncExternalStore-compatible subscription (same tab + other tabs). */
export function subscribeThemePreference(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY || event.key === null) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}
