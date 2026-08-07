import { h } from "@/lib/flowance-runtime";

export function ModeTabs() {
  return (
    <div className="mode-tabs" id="modeTabs">
      <button className="mode-tab on" id="modeTabMonthly" type="button" onClick={h(`setMode('monthly')`)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="16" rx="3" />
          <path d="M8 3v4M16 3v4M3 10h18" />
        </svg>
        الالتزامات الشهرية
      </button>
      <button className="mode-tab" id="modeTabDaily" type="button" onClick={h(`setMode('daily')`)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
          <path d="M8 9h6M8 13h8M8 17h5" />
        </svg>
        المصاريف اليومية
      </button>
    </div>
  );
}
