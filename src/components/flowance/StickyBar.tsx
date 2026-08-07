export function StickyBar() {
  return (
    <div className="sticky-bar" id="stickyBar">
      <div className="sticky-left">
        <span className="sticky-label">المجموع الكلي</span>
        <span className="sticky-amount" id="stickyAmt">0.000 JOD</span>
        <span className="sticky-paid" id="stickyPaid"></span>
      </div>
    </div>
  );
}
