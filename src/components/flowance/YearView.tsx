import { h } from "@/lib/flowance-runtime";

export function YearView() {
  return (
    <div id="yearView" className="history-view" style={{ display: 'none' }}>
      <div className="history-view-header">
        <button className="history-view-back" onClick={h(`closeYearAnalysis()`)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <span className="history-view-title">تحليل السنة</span>
      </div>
      <div className="ya-toolbar">
        <button className="ya-yr-btn" id="yaPrevBtn" onClick={h(`yaChangeYear(-1)`)} title="السنة السابقة">▶</button>
        <select className="ya-yr-select" id="yaYearSelect" onChange={h(`yaSelectYear(this.value)`)}></select>
        <button className="ya-yr-btn" id="yaNextBtn" onClick={h(`yaChangeYear(1)`)} title="السنة التالية">◀</button>
      </div>
      <div className="history-view-body" id="yaBody"></div>
    </div>
  );
}
