import type { SyntheticEvent } from "react";

/**
 * Bridges the legacy inline `onclick="..."` handlers to React.
 * The app logic lives in /flowance-app.js and registers its functions
 * on the global scope, so the handler body is evaluated there.
 */
export function h(code: string) {
  return (event: SyntheticEvent) => {
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function("event", code);
      fn.call(event.currentTarget, event.nativeEvent);
    } catch (err) {
      console.error("Flowance handler failed:", code, err);
    }
  };
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-flowance="${src}"]`,
    );
    if (existing) {
      resolve();
      return;
    }
    const el = document.createElement("script");
    el.src = src;
    el.async = false;
    el.dataset.flowance = src;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(el);
  });
}

let booted = false;

/** Loads the vendor libraries and the Flowance app logic, once. */
export async function bootFlowance() {
  if (booted) return;
  booted = true;

  document.documentElement.setAttribute("dir", "rtl");
  document.documentElement.setAttribute("lang", "ar");
  if (!document.documentElement.hasAttribute("data-theme")) {
    document.documentElement.setAttribute("data-theme", "dark");
  }

  await loadScript(
    "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js",
  );
  await loadScript(
    "https://cdn.jsdelivr.net/npm/sortablejs@1.15.3/Sortable.min.js",
  );
  await loadScript("/flowance-app.js");
}
