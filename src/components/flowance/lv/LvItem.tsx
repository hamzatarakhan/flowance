const g = () => window as unknown as Record<string, any>;

export interface LvItemData {
  id: string;
  name: string;
  amount: number;
  paid?: boolean;
  recurring?: boolean;
}

export function LvItem({ item, catId, dec }: { item: LvItemData; catId: string; dec: number }) {
  const w = g();
  const stop = (fn: () => void) => (e: React.MouseEvent) => { e.stopPropagation(); fn(); };
  return (
    <div
      className={'lv-item' + (item.paid ? ' paid' : '') + (item.recurring ? ' recurring' : '')}
      id={'lv-item-' + item.id}
    >
      <div className="lv-chk" onClick={stop(() => w.lvTogglePaid(item.id, catId))}>
        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="2 8 6 12 14 4" />
        </svg>
      </div>

      <span
        className="lv-item-name"
        onClick={(e) => { e.stopPropagation(); w.lvStartEdit(e.currentTarget, item.id, catId, 'name'); }}
      >
        {item.name || '—'}
      </span>

      <span
        className="lv-item-amt"
        onClick={(e) => { e.stopPropagation(); w.lvStartEdit(e.currentTarget, item.id, catId, 'amount'); }}
      >
        {w.f ? w.f(item.amount || 0, dec) : item.amount}
      </span>

      <button
        className={'lv-item-rec' + (item.recurring ? ' on' : '')}
        title={item.recurring ? 'إيقاف التكرار الشهري' : 'تكرار شهري'}
        onClick={stop(() => w.toggleRecurring(item.id, catId))}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="17 1 21 5 17 9" />
          <path d="M3 11V9a4 4 0 014-4h14" />
          <polyline points="7 23 3 19 7 15" />
          <path d="M21 13v2a4 4 0 01-4 4H3" />
        </svg>
      </button>

      <button className="lv-item-move" title="نقل إلى مجموعة" onClick={stop(() => w.showMoveSheet(item.id, catId))}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 8h10" />
          <polyline points="8 4 12 8 8 12" />
        </svg>
      </button>

      <button className="lv-item-del" title="حذف" onClick={stop(() => w.lvDeleteItem(item.id, catId))}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polyline points="2 4 14 4" />
          <path d="M12 4l-.8 9H4.8L4 4" />
        </svg>
      </button>

      <span className="lv-drag">
        <svg viewBox="0 0 16 16" fill="currentColor">
          <circle cx="5" cy="3.5" r="1.2" /><circle cx="11" cy="3.5" r="1.2" />
          <circle cx="5" cy="8" r="1.2" /><circle cx="11" cy="8" r="1.2" />
          <circle cx="5" cy="12.5" r="1.2" /><circle cx="11" cy="12.5" r="1.2" />
        </svg>
      </span>
    </div>
  );
}
