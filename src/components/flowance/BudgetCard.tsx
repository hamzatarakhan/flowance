import { h } from "@/lib/flowance-runtime";

export function BudgetCard() {
  return (
    <div className="budget-card">
          <div className="budget-top">
            <span className="budget-title">الميزانية الشهرية</span>
            <div className="budget-amt-wrap">
              <span className="budget-target" id="budgetLbl"></span>
              <button className="budget-edit-btn" onClick={h(`editBudget()`)} title="تعديل الميزانية">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            </div>
          </div>
          <div className="track">
            <div style={{ position: 'relative', height: '7px' }}>
              <div className="fill" id="fillBar"></div>
              <div className="fill-paid" id="fillPaid"></div>
            </div>
          </div>
          <div className="budget-foot">
            <span className="budget-used" id="budgetUsed"></span>
            <span className="budget-remain" id="budgetRemain"></span>
          </div>
        </div>
  );
}
