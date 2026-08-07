/* eslint-disable @typescript-eslint/no-explicit-any */
import { LvCategory, type LvCatData } from './LvCategory';

const g = (): any => window as any;

export function ListView({ cats, showAddCat }: { cats: LvCatData[]; showAddCat: boolean }) {
  const w = g();
  return (
    <>
      {cats.map((cat) => (
        <LvCategory key={cat.id} cat={cat} />
      ))}

      {showAddCat && (
        <button className="lv-add-cat-btn" onClick={() => w.addCategory()}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M8 3v10M3 8h10" />
          </svg>{' '}
          إضافة مجموعة
        </button>
      )}
    </>
  );
}
