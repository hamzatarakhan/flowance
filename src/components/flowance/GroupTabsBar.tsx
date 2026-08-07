import { h } from "@/lib/flowance-runtime";

export function GroupTabsBar() {
  return (
    <div className="group-tabs-bar">
          <div className="group-tabs" id="groupTabs"></div>
          <div className="view-toggle">
            <button className="view-btn active" data-view="cards" onClick={h(`switchView('cards')`)} title="عرض البطاقات">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="1" width="6" height="6" rx="1.5" /><rect x="9" y="1" width="6" height="6" rx="1.5" />
                <rect x="1" y="9" width="6" height="6" rx="1.5" /><rect x="9" y="9" width="6" height="6" rx="1.5" />
              </svg>
            </button>
            <button className="view-btn" data-view="list" onClick={h(`switchView('list')`)} title="عرض القائمة">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="4" x2="13" y2="4" /><line x1="3" y1="8" x2="13" y2="8" /><line x1="3" y1="12" x2="13" y2="12" />
              </svg>
            </button>
          </div>
        </div>
  );
}
