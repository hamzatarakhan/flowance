export function LoadScreen() {
  return (
    <div id="loadScreen">
      <div className="load-logo">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
        </svg>
      </div>
      <div className="load-dots">
        <div className="load-dot"></div>
        <div className="load-dot"></div>
        <div className="load-dot"></div>
      </div>
      <div className="load-credit">POWERED BY <span>HAMZA TARAKHAN</span></div>
    </div>
  );
}
