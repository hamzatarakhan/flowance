import { useEffect, useState } from "react";
import { h } from "@/lib/flowance-runtime";

export function Header() {
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menu]);

  return (
    <header className="header">
      <div className="brand">
        <div className="brand-text">
          <span className="brand-name">Flowance</span>
          <span className="brand-month" id="monthLbl"></span>
        </div>
      </div>

      <div className="header-right">
        <button className="icon-btn" onClick={h(`openScanSheet('voice')`)} title="إضافة بالصوت" aria-label="إضافة بالصوت">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
            <path d="M19 10v2a7 7 0 01-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </button>

        <button className="icon-btn" onClick={h(`openSearch()`)} title="بحث" aria-label="بحث">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>

        <button className="icon-btn" onClick={h(`openHistorySheet()`)} title="سجل الشهور" aria-label="سجل الشهور">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </button>

        <div className="export-wrap" style={{ display: 'none' }}>
          <button className="icon-btn" id="exportBtn" onClick={h(`toggleExportMenu()`)} title="تصدير">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
          <div className="export-menu" id="exportMenu" style={{ display: 'none' }}>
            <button className="export-menu-item" onClick={h(`exportCSV();closeExportMenu()`)}>Excel</button>
            <button className="export-menu-item" onClick={h(`exportPDF();closeExportMenu()`)}>PDF</button>
          </div>
        </div>

        <div className="more-wrap">
          <button
            className={"icon-btn" + (menu ? " on" : "")}
            title="المزيد"
            aria-label="المزيد"
            aria-expanded={menu}
            onClick={(e) => { e.stopPropagation(); setMenu((v) => !v); }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <circle cx="5" cy="12" r="1.9" /><circle cx="12" cy="12" r="1.9" /><circle cx="19" cy="12" r="1.9" />
            </svg>
          </button>

          {menu && (
            <div className="more-menu" role="menu">
              <button className="more-item" role="menuitem" onClick={h(`openYearAnalysis()`)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                تحليل السنة
              </button>
              <button className="more-item" role="menuitem" onClick={h(`openScanSheet()`)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z" />
                  <path d="m14 7 3 3" /><path d="M5 6v4" /><path d="M19 14v4" />
                </svg>
                استيراد ذكي
              </button>
              <button className="more-item" role="menuitem" onClick={h(`toggleTheme()`)}>
                <svg id="themeIco" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
                تغيير المظهر
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
