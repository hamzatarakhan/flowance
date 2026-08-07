import { h } from "@/lib/flowance-runtime";

export function MonthBar() {
  return (
    <div className="month-bar" style={{ display: 'none' }}>
          <div className="month-bar-info">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '13px', height: '13px', opacity: '.5' }}><rect x="2" y="2" width="12" height="12" rx="1.5" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="2" y1="6.5" x2="14" y2="6.5" /></svg>
            <span id="monthBarLabel"></span>
          </div>
          <button className="month-new-btn" onClick={h(`startNewMonth()`)}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M8 3v10M3 8h10" /></svg>
            شهر جديد
          </button>
        </div>
  );
}
