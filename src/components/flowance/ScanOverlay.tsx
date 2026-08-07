import { h } from "@/lib/flowance-runtime";

export function ScanOverlay() {
  return (
    <div id="scanOverlay" className="scan-overlay" style={{ display: 'none' }} onClick={h(`if(event.target===this)closeScanSheet()`)}>
      <div className="scan-sheet">
        <div className="scan-handle"></div>
        <div className="scan-title">استيراد ذكي</div>

        <div className="scan-tabs">
          <button className="scan-tab active" id="scanTabImg" onClick={h(`setScanMode('img')`)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '4px' }}><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></svg>
            صورة
          </button>
          <button className="scan-tab" id="scanTabTxt" onClick={h(`setScanMode('txt')`)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '4px' }}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
            نص
          </button>
          <button className="scan-tab" id="scanTabVoice" onClick={h(`setScanMode('voice')`)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '4px' }}><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
            صوت
          </button>
        </div>

        {/* Image panel */}
        <div id="scanImgPanel">
          <div className="scan-upload-area" id="scanDropZone" onClick={h(`document.getElementById('scanFileInput').click()`)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            اضغط لاختيار صورة<br />
            <span style={{ fontSize: '11px', color: 'var(--t-low)' }}>كشف حساب، فاتورة، أو أي صورة مصاريف</span>
          </div>
          <input type="file" id="scanFileInput" accept="image/*" style={{ display: 'none' }} onChange={h(`onScanFileSelected(this)`)} />
          <div className="scan-preview-wrap" id="scanPreviewWrap">
            <img id="scanPreviewImg" className="scan-preview-img" alt="preview" />
          <div className="scan-img-actions" id="scanImgActions">
            <button className="scan-img-btn" onClick={h(`document.getElementById('scanFileInput').click()`)} title="تغيير الصورة">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
            </button>
            <button className="scan-img-btn scan-img-btn--remove" onClick={h(`clearScanImage()`)} title="حذف الصورة">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>
            </button>
          </div>
        </div>
        </div>{/* /scanImgPanel */}

        {/* Text panel */}
        <div id="scanTxtPanel" style={{ display: 'none' }}>
          <textarea className="scan-textarea" id="scanTextInput" placeholder="الصق هنا نص كشف الحساب أو الفاتورة...&#10;&#10;مثال:&#10;جمعية 150&#10;بنزين 45&#10;نت 12&#10;مطعم 18.5" onInput={h(`updateScanBtn()`)}></textarea>
        </div>

        {/* Voice panel */}
        <div id="scanVoicePanel" style={{ display: 'none' }}>
          <div className="scan-voice-area" id="scanVoiceIdle">
            <button className="scan-voice-btn" id="scanVoiceBtn" onClick={h(`toggleVoiceRecording()`)} title="تسجيل صوتي">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                <path d="M19 10v2a7 7 0 01-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>
            <div className="scan-voice-timer" id="scanVoiceTimer">اضغط لبدء التسجيل</div>
            <div style={{ fontSize: '11px', color: 'var(--t-low)', marginTop: '4px' }}>قول البنود والمبالغ بصوتك، مثلاً: "بنزين ٤٥، أكل ٣٠"</div>
          </div>
          <div className="scan-voice-preview" id="scanVoicePreview" style={{ display: 'none' }}>
            <audio id="scanVoiceAudio" controls></audio>
            <div className="scan-voice-actions">
              <button className="scan-voice-action-btn" onClick={h(`clearVoiceRecording(true)`)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
                إعادة التسجيل
              </button>
              <button className="scan-voice-action-btn scan-voice-action-btn--danger" onClick={h(`clearVoiceRecording(false)`)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /></svg>
                حذف
              </button>
            </div>
          </div>
        </div>

        <button className="scan-analyze-btn" id="scanBtn" onClick={h(`runScan()`)} disabled>تحليل</button>

        <div className="scan-loader" id="scanLoader">
          <div className="scan-loader-steps">
            <div className="scan-loader-step" id="loaderStep1">
              <div className="scan-loader-step-icon" id="loaderIcon1"><div className="scan-dot-idle"></div></div>
              <div className="scan-loader-step-text">
                <div className="scan-loader-step-label">قراءة الصورة</div>
                <div className="scan-loader-step-sub">استخراج جميع البنود والمبالغ</div>
              </div>
            </div>
            <div className="scan-loader-step" id="loaderStep2">
              <div className="scan-loader-step-icon" id="loaderIcon2"><div className="scan-dot-idle"></div></div>
              <div className="scan-loader-step-text">
                <div className="scan-loader-step-label">التصنيف الذكي</div>
                <div className="scan-loader-step-sub">تنظيم البنود في مجموعات</div>
              </div>
            </div>
          </div>
        </div>

        <div className="scan-status" id="scanStatus"></div>

        <div className="scan-results" id="scanResults">
          <div className="scan-results-title">النتائج — راجع قبل الإضافة</div>
          <div id="scanResultsBody"></div>
          <button className="scan-apply-btn" onClick={h(`applyScanResults()`)}>إضافة للتطبيق</button>
        </div>
      </div>
    </div>
  );
}
