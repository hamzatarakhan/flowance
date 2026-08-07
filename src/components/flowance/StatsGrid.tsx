export function StatsGrid() {
  return (
    <div className="stats-grid">
          <div className="stat-card fixed">
            <div className="stat-lbl">الثابت الشهري</div>
            <div className="stat-amt"><span id="sumFixed">0.000</span><span className="stat-cur">JOD</span></div>
          </div>
          <div className="stat-card variable">
            <div className="stat-lbl">المتغير الشهري</div>
            <div className="stat-amt"><span id="sumVar">0.00</span><span className="stat-cur">USD</span></div>
          </div>
          <div className="stat-card paid-c">
            <div className="stat-lbl">المدفوع ✓</div>
            <div className="stat-amt"><span id="sumPaid">0.000</span><span className="stat-cur">JOD</span></div>
            <div className="stat-sub" id="sumPaidCount">0 بند مدفوع</div>
          </div>
          <div className="stat-card combined">
            <div className="stat-lbl">المجموع الكلي</div>
            <div className="stat-amt"><span id="sumComb">0.000</span><span className="stat-cur">JOD</span></div>
          </div>
        </div>
  );
}
