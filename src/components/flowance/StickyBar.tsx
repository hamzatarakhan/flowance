export function StickyBar() {
  return (
    <div className="sticky-bar" id="stickyBar">
      <div className="sticky-stat">
        <span className="sticky-label">دفعت اليوم</span>
        <span className="sticky-amount" id="stickyToday">0.000</span>
      </div>
      <div className="sticky-sep" />
      <div className="sticky-stat">
        <span className="sticky-label">من بداية الشهر</span>
        <span className="sticky-amount" id="stickyMonth">0.000</span>
      </div>
      <div className="sticky-sep" />
      <div className="sticky-stat">
        <span className="sticky-label">المتبقي عليّ</span>
        <span className="sticky-amount neg" id="stickyRemain">0.000</span>
      </div>
    </div>
  );
}
