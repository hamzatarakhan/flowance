/* eslint-disable @typescript-eslint/no-explicit-any */
const g = (): any => window as any;

export interface DailyItem {
  id: string;
  name: string;
  amount: number;
  date: string; // YYYY-MM-DD
}

export interface DailyDay {
  date: string;
  label: string;
  isToday: boolean;
  items: DailyItem[];
  total: number;
}

export function DailyView({ days, total, count }: { days: DailyDay[]; total: number; count: number }) {
  const w = g();
  const fmt = (n: number) => (w.f ? w.f(n, 3) : n);

  return (
    <>
      <div className="daily-top">
        <div className="daily-top-info">
          <span className="daily-top-label">مصاريف هذا الشهر</span>
          <span className="daily-top-amt">{fmt(total)} JOD</span>
          <span className="daily-top-count">{count} عملية</span>
        </div>
        <button className="daily-add-btn" onClick={() => w.dailyAdd()}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M8 3v10M3 8h10" />
          </svg>
          مصروف اليوم
        </button>
      </div>

      {days.length === 0 && (
        <div className="daily-empty">
          لا يوجد مصاريف بعد — اكتب بالأسفل مثلاً «25 بنزين» أو اضغط «مصروف اليوم»
        </div>
      )}

      {days.map((day) => (
        <div className="daily-day" key={day.date}>
          <div className="daily-day-head">
            <span className={'daily-day-label' + (day.isToday ? ' today' : '')}>
              {day.isToday ? 'اليوم · ' : ''}
              {day.label}
            </span>
            <span className="daily-day-total">{fmt(day.total)} JOD</span>
          </div>

          {day.items.map((item) => (
            <div className="daily-item" key={item.id}>
              <input
                className="daily-item-name"
                defaultValue={item.name}
                placeholder="اسم المصروف"
                onBlur={(e) => w.dailyUpdate(item.id, 'name', e.currentTarget.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
              />
              <input
                className="daily-item-amt"
                type="number"
                inputMode="decimal"
                step="0.001"
                defaultValue={item.amount}
                onBlur={(e) => w.dailyUpdate(item.id, 'amount', e.currentTarget.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
              />
              <input
                className="daily-item-date"
                type="date"
                defaultValue={item.date}
                title="تغيير التاريخ"
                onChange={(e) => w.dailyUpdate(item.id, 'date', e.currentTarget.value)}
              />
              <button className="daily-item-del" title="حذف" onClick={() => w.dailyDelete(item.id)}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="2 4 14 4" />
                  <path d="M12 4l-.8 9H4.8L4 4" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      ))}
    </>
  );
}
