import { h } from "@/lib/flowance-runtime";

export function SearchOverlay() {
  return (
    <div id="searchOverlay" className="search-overlay" style={{ display: 'none' }}>
      <div className="search-header">
        <button className="search-back-btn" onClick={h(`closeSearch()`)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <div className="search-input-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input className="search-input" id="searchInput" type="text" placeholder="ابحث عن مصروف..." onInput={h(`onSearchInput(this.value)`)} autoComplete="off" autocorrect="off" />
        </div>
      </div>
      <div className="search-results" id="searchResults">
        <div className="search-empty">ابدأ الكتابة للبحث في مصاريفك</div>
      </div>
    </div>
  );
}
