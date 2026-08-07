import { h } from "@/lib/flowance-runtime";

export function QuickAdd() {
  return (
    <div className="quickadd" id="quickAdd">
      <button
        className="quickadd-mic"
        id="quickAddMic"
        type="button"
        aria-label="إضافة بالصوت"
        onClick={h("quickAddVoice()")}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0" />
          <path d="M12 18v3" />
        </svg>
      </button>

      <input
        className="quickadd-input"
        id="quickAddInput"
        type="text"
        inputMode="text"
        placeholder="اكتب بسرعة: 25 بنزين"
        autoComplete="off"
        onKeyDown={h("if(event.key==='Enter'){event.preventDefault();quickAddSubmit();}")}
      />

      <button
        className="quickadd-go"
        id="quickAddGo"
        type="button"
        aria-label="إضافة"
        onClick={h("quickAddSubmit()")}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>
  );
}
