import type React from "react";
import { h } from "@/lib/flowance-runtime";

export function Panels() {
  return (
    <div className="panels" id="panelsArea">
          <div className="panel panel-main" id="panelMain">
            <div className="panel-head">
              <div>
                <div className="panel-title">المصاريف الشهرية الثابتة</div>
                <div className="panel-sub">التزامات شهرية متكررة</div>
              </div>
              <span className="cur-badge">JOD</span>
            </div>
            <div className="col-head">
              <span className="ch ch-chk"></span>
              <span className="ch ch-name">البند</span>
              <span className="ch ch-amt">المبلغ</span>
              <span className="ch ch-del"></span>
            </div>
            <div id="mainBody"></div>
            <button className="add-cat-btn" onClick={h(`addCategory()`)}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 3v10M3 8h10" /></svg>
              إضافة مجموعة
            </button>
            <div className="g-total" style={{ display: 'none' }}>
              <span className="g-label" id="grandTotalLabel">المجموع الكلي</span>
              <span className="g-amount" id="grandTotal">0.000 JOD</span>
            </div>
          </div>

          <div className="panel panel-misc" id="panelMisc">
            <div className="cat-section collapsed" id="sec-misc" style={{ '--cat-color': '#F2B040', '--cat-dim': 'rgba(242,176,64,0.08)' } as React.CSSProperties}>
              <div className="cat-head" onClick={h(`toggleCat('misc')`)} style={{ '--cat-color': '#F2B040', '--cat-dim': 'rgba(242,176,64,0.08)' } as React.CSSProperties}>
                <div className="cat-head-left">
                  <div className="cat-title-row">
                    <button className="cat-chkall-btn" id="chkall-misc" onClick={h(`toggleAllPaid('misc');event.stopPropagation()`)} title="تحديد الكل" style={{ display: 'none' }}>
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="2 8 6 12 14 4" /></svg>
                    </button>
                    <span className="cat-name" id="cattitle-misc" onClick={h(`editCatTitle('misc');event.stopPropagation()`)}>متفرقات الشهر</span>
                  </div>
                  <span className="cat-count" id="catcount-misc">لا يوجد بنود</span>
                </div>
                <div className="cat-head-right">
                  <svg className="cat-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 6 8 10 12 6" /></svg>
                </div>
              </div>
              <div className="cat-rows-wrap">
                <div id="rows-misc"></div>
                <button className="add-btn" onClick={h(`addRow('misc')`)}>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M8 3v10M3 8h10" />
                  </svg>
                  إضافة بند
                </button>
              </div>
            </div>
            <div className="g-total">
              <span className="g-label">إجمالي المتغير</span>
              <span className="g-amount" id="miscTotal">0.00 USD</span>
            </div>
          </div>
        </div>
  );
}
