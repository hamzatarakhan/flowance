import { h } from "@/lib/flowance-runtime";

export function HistoryView() {
  return (
    <div id="historyView" className="history-view" style={{ display: 'none' }}>
      <div className="history-view-header">
        <button className="history-view-back" onClick={h(`closeSnapshotView()`)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <span className="history-view-title" id="historyViewTitle"></span>
      </div>
      <div className="history-view-body" id="historyViewBody"></div>
    </div>
  );
}
