/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';

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

function Composer() {
  const w = g();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');

  const submit = () => {
    const amt = parseFloat(String(amount).replace(',', '.'));
    if (!name.trim() && !amt) return;
    w.dailyAdd(name.trim(), isNaN(amt) ? 0 : amt);
    setName('');
    setAmount('');
  };

  return (
    <div className="daily-composer">
      <input
        className="dc-name"
        value={name}
        placeholder="على شو صرفت؟"
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
      />
      <input
        className="dc-amt"
        value={amount}
        type="number"
        inputMode="decimal"
        step="0.001"
        placeholder="0.000"
        onChange={(e) => setAmount(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
      />
      <button className="dc-add" onClick={submit} title="إضافة">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
          <path d="M8 3v10M3 8h10" />
        </svg>
      </button>
    </div>
  );
}

function DailyRow({ item }: { item: DailyItem }) {
  const w = g();
  const [openDate, setOpenDate] = useState(false);

  return (
    <div className="daily-item">
      <div className="daily-item-main">
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
        <span className="daily-item-cur">JOD</span>
      </div>

      <div className="daily-item-actions">
        <button
          className={'daily-icon-btn' + (openDate ? ' on' : '')}
          title="تغيير التاريخ"
          onClick={() => setOpenDate((v) => !v)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="16" rx="3" />
            <path d="M8 3v4M16 3v4M3 10h18" />
          </svg>
        </button>
        <button className="daily-icon-btn del" title="حذف" onClick={() => w.dailyDelete(item.id)}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="2 4 14 4" />
            <path d="M12 4l-.8 9H4.8L4 4" />
          </svg>
        </button>
      </div>

      {openDate && (
        <input
          className="daily-item-date"
          type="date"
          defaultValue={item.date}
          onChange={(e) => { w.dailyUpdate(item.id, 'date', e.currentTarget.value); setOpenDate(false); }}
        />
      )}
      
    </div>
  );
}

const RANGES: { k: string; label: string }[] = [
  { k: 'today', label: 'اليوم' },
  { k: 'week', label: 'هذا الأسبوع' },
  { k: 'month', label: 'هذا الشهر' },
  { k: 'last30', label: 'آخر ٣٠ يوم' },
  { k: 'year', label: 'هذه السنة' },
  { k: 'all', label: 'الكل' },
];

export function DailyView({ days, total, count, range = 'month', rangeLabel = 'هذا الشهر' }: { days: DailyDay[]; total: number; count: number; range?: string; rangeLabel?: string }) {
  const w = g();
  const fmt = (n: number) => (w.f ? w.f(n, 3) : n);

  return (
    <>
      <div className="daily-ranges">
        {RANGES.map((r) => (
          <button
            key={r.k}
            className={'daily-range' + (r.k === range ? ' on' : '')}
            onClick={() => w.setDailyRange(r.k)}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="daily-top">
        <div className="daily-top-info">
          <span className="daily-top-label">مصاريف {rangeLabel}</span>
          <span className="daily-top-amt">{fmt(total)} JOD</span>
        </div>
        <span className="daily-top-count">{count} عملية</span>
      </div>


      <Composer />

      {days.length === 0 && (
        <div className="daily-empty">
          اكتب اسم المصروف والمبلغ فوق واضغط ＋ — أو استخدم الزر العائم للمايك
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
            <DailyRow key={item.id} item={item} />
          ))}
        </div>
      ))}
    </>
  );
}
