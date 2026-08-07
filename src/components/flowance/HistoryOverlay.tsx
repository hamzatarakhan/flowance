import { h } from "@/lib/flowance-runtime";

export function HistoryOverlay() {
  return (
    <div id="historyOverlay" className="history-overlay" style={{ display: 'none' }} onClick={h(`if(event.target===this)closeHistorySheet()`)}>
      <div className="history-sheet">
        <div className="scan-handle"></div>
        <div className="history-title-row">
          <span className="history-title">سجل الشهور</span>
          <button className="history-new-btn" onClick={h(`startNewMonth()`)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
            شهر جديد
          </button>
        </div>
        <div className="history-current-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
          الحالي: <span id="historyCurLabel"></span>
        </div>
        <div id="historyList"></div>
      </div>
    </div>
  );
}
