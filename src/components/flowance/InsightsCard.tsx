export function InsightsCard() {
  return (
    <div className="insights-card" id="insightsCard" style={{ display: 'none' }}>
      <div className="ins-top">
        <div className="ins-donut-wrap">
          <svg className="ins-donut-svg" viewBox="0 0 100 100" id="donutSvg">
            <circle cx="50" cy="50" r="36" fill="none" stroke="var(--border)" strokeWidth="13" />
          </svg>
          <div className="ins-donut-center">
            <span className="ins-donut-pct" id="donutPct">—</span>
            <span className="ins-donut-lbl" id="donutLbl">إجمالي</span>
          </div>
        </div>
        <div className="ins-kpis">
          <div className="ins-kpi">
            <div className="ins-kpi-label">أعلى فئة إنفاقاً</div>
            <div className="ins-kpi-val" id="insTopCat">—</div>
            <div className="ins-kpi-sub" id="insTopCatPct"></div>
          </div>
          <div className="ins-kpi-sep"></div>
          <div className="ins-kpi">
            <div className="ins-kpi-label">أكبر مصروف</div>
            <div className="ins-kpi-val" id="insBigItem">—</div>
            <div className="ins-kpi-sub" id="insBigAmt"></div>
          </div>
        </div>
      </div>

      <div className="ins-details">
        <div className="ins-paid-row">
          <div className="ins-paid-meta">
            <span className="ins-paid-yes" id="insPaidLbl">٠ مدفوع</span>
            <span className="ins-paid-no" id="insUnpaidLbl">٠ متبقي</span>
          </div>
          <div className="ins-paid-track"><div className="ins-paid-fill" id="insPaidFill"></div></div>
        </div>
        <div className="ins-legend" id="insLegend"></div>
      </div>
    </div>
  );
}
