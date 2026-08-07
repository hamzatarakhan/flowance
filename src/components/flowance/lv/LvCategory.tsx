/* eslint-disable @typescript-eslint/no-explicit-any */
import { LvItem, type LvItemData } from './LvItem';

const g = (): any => window as any;

export interface LvCatData {
  id: string;
  color: string;
  label: string;
  items: LvItemData[];
  total: number;
  dec: number;
  isMisc: boolean;
}

export function LvCategory({ cat }: { cat: LvCatData }) {
  const w = g();
  const { id, color, label, items, total, dec, isMisc } = cat;
  const paidCnt = items.filter((r) => r.paid).length;
  const paidPct = items.length > 0 ? Math.round((paidCnt / items.length) * 100) : 0;
  const allPaid = items.length > 0 && paidCnt === items.length;
  const currency = isMisc ? 'USD' : 'JOD';

  return (
    <div className="lv-cat" data-catid={id} style={{ ['--cat-color' as any]: color }}>
      <div className="lv-cat-head">
        <button
          className={'lv-cat-chkall' + (allPaid ? ' all-done' : '')}
          title="تحديد الكل"
          style={{ display: items.length > 0 ? '' : 'none' }}
          onClick={() => w.toggleAllPaid(id)}
        >
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="2 8 6 12 14 4" />
          </svg>
        </button>

        <div className="lv-cat-dot" />

        <span className="lv-cat-name" onClick={() => w.editCatTitle(isMisc ? 'misc' : id)}>
          {label}
        </span>

        <span className="lv-cat-paid" style={{ display: paidCnt > 0 ? '' : 'none' }}>
          {paidCnt}/{items.length} ✓
        </span>

        <span className="lv-cat-total">
          {items.length > 0 ? `${w.f ? w.f(total, dec) : total} ${currency}` : '—'}
        </span>

        {!isMisc && (
          <button className="lv-cat-del" title="حذف المجموعة" onClick={() => w.deleteCategory(id)}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="2 4 14 4" />
              <path d="M12 4l-.8 9H4.8L4 4" />
              <path d="M6.5 4V3h3v1" />
            </svg>
          </button>
        )}

        <button className="lv-cat-add" title="إضافة بند" onClick={() => w.addRow(id)}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M8 3v10M3 8h10" />
          </svg>
        </button>

        {!isMisc && (
          <span className="lv-cat-drag">
            <svg viewBox="0 0 16 16" fill="currentColor">
              <circle cx="5" cy="3.5" r="1.2" /><circle cx="11" cy="3.5" r="1.2" />
              <circle cx="5" cy="8" r="1.2" /><circle cx="11" cy="8" r="1.2" />
              <circle cx="5" cy="12.5" r="1.2" /><circle cx="11" cy="12.5" r="1.2" />
            </svg>
          </span>
        )}
      </div>

      <div className="lv-paid-bar">
        <div className="lv-paid-fill" style={{ width: paidPct + '%' }} />
      </div>

      {items.length === 0 && <div className="lv-empty">لا يوجد بنود</div>}

      <div className="lv-items-wrap">
        {items.map((item) => (
          <LvItem key={item.id} item={item} catId={id} dec={dec} />
        ))}
      </div>
    </div>
  );
}
