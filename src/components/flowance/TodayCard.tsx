export function TodayCard() {
  return (
    <div className="today-card" id="todayCard" style={{ display: 'none' }}>
      <div className="today-head">
        <span className="today-lbl">صرف اليوم</span>
        <span className="today-date" id="todayDate"></span>
      </div>
      <div className="today-amt">
        <span className="today-num" id="todayNum">0.000</span>
        <span className="today-cur">JOD</span>
      </div>
      <div className="today-meta">
        <span id="todayCount">لا مصاريف اليوم</span>
        <span id="todayMonth"></span>
      </div>
    </div>
  );
}
