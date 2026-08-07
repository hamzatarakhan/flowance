import { h } from "@/lib/flowance-runtime";

export function Onboarding() {
  return (
    <div id="onboarding" className="ob-overlay" style={{ display: 'none' }}>
      <div className="ob-inner">
        <div className="ob-slides-wrap">

          {/* Slide 1: Welcome */}
          <div className="ob-slide ob-active">
            <div className="ob-icon-wrap c1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                <polyline points="16 7 22 7 22 13" />
              </svg>
            </div>
            <h2 className="ob-title">أهلاً في Flowance 👋</h2>
            <p className="ob-desc">تطبيقك الشخصي لتنظيم مصاريفك الشهرية وتتبّع ما دفعته — بكل سهولة وبدون تعقيد</p>
          </div>

          {/* Slide 2: Groups */}
          <div className="ob-slide">
            <div className="ob-icon-wrap c2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
            </div>
            <h2 className="ob-title">نظّم مصاريفك بمجموعات</h2>
            <p className="ob-desc">أنشئ مجموعات لكل نوع من مصاريفك مثل الفواتير، الاشتراكات، المصاريف الشخصية</p>
            <div className="ob-hint">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 3v10M3 8h10" /></svg>
              اضغط "إضافة مجموعة" للبدء
            </div>
          </div>

          {/* Slide 3: Items & Check */}
          <div className="ob-slide">
            <div className="ob-icon-wrap c3">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="ob-title">تتبّع ما دفعته ✓</h2>
            <p className="ob-desc">أضف بنود المصاريف داخل كل مجموعة، ثم اضغط الدائرة بجانب البند لتحديده كمدفوع</p>
            <div className="ob-hint">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /></svg>
              التطبيق يحسب المتبقي تلقائيًا
            </div>
          </div>

          {/* Slide 4: Budget */}
          <div className="ob-slide">
            <div className="ob-icon-wrap c4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <h2 className="ob-title">راقب ميزانيتك</h2>
            <p className="ob-desc">اضغط أيقونة التعديل ✏️ بجانب الميزانية لتحديدها، والشريط يعكس نسبة ما أنفقته لحظة بلحظة</p>
            <div className="ob-hint">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4z" /></svg>
              اضغط ✏️ لتعديل الميزانية
            </div>
          </div>

        </div>

        <div className="ob-footer">
          <div className="ob-dots" id="obDots">
            <div className="ob-dot active"></div>
            <div className="ob-dot"></div>
            <div className="ob-dot"></div>
            <div className="ob-dot"></div>
          </div>
          <div className="ob-btn-row">
            <button className="ob-skip" id="obSkip" onClick={h(`finishOnboarding()`)}>تخطي</button>
            <button className="ob-next" id="obNextBtn" onClick={h(`obNext()`)}>التالي</button>
          </div>
        </div>
      </div>
    </div>
  );
}
