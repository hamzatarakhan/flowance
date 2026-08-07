import { h } from "@/lib/flowance-runtime";

export function HeroCard() {
  return (
    <div className="hero-card">
          <div className="hero-divider">
            <div className="hero-col" style={{ paddingRight: '0', paddingLeft: '16px' }}>
              <div className="hero-lbl">الراتب الشهري</div>
              <span className="salary-val" id="salaryVal" onClick={h(`editSalary()`)}>
                <span id="salaryNum">0.000</span>
                <span className="salary-cur">JOD</span>
                <span className="edit-hint">تعديل</span>
              </span>
              <span className="hero-sub" id="salarySub">اضغط لإدخال راتبك</span>
            </div>
            <div className="hero-col" style={{ paddingRight: '16px', paddingLeft: '0' }}>
              <div className="hero-lbl">المتبقي بعد المصاريف</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', marginTop: '2px' }}>
                <span className="remaining-val zero" id="remainingNum">—</span>
                <span className="salary-cur" id="remainingCur" style={{ display: 'none' }}>JOD</span>
              </div>
              <span className="hero-sub" id="remainingSub"></span>
            </div>
          </div>
        </div>
  );
}
