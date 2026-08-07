/* eslint-disable @typescript-eslint/no-explicit-any */
const g = (): any => window as any;

export interface GroupTabData {
  id: string;
  label: string;
  color: string;
  active: boolean;
  noDelete?: boolean;
}

export function GroupTabs({
  tabs,
  manageMode,
  allActive,
  showDeleteAll,
}: {
  tabs: GroupTabData[];
  manageMode: boolean;
  allActive: boolean;
  showDeleteAll: boolean;
}) {
  const w = g();
  return (
    <>
      <button
        className={'gtab-manage-btn' + (manageMode ? ' active' : '')}
        title={manageMode ? 'تم' : 'إدارة المجموعات'}
        onClick={() => w.toggleManageMode()}
      >
        {manageMode ? (
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="2 8 6 12 14 4" />
          </svg>
        ) : (
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="8" r="1.2" /><circle cx="8" cy="3" r="1.2" /><circle cx="8" cy="13" r="1.2" />
          </svg>
        )}
      </button>

      {showDeleteAll && (
        <button className="gtab-del-all-btn" title="حذف كل المجموعات" onClick={() => w.deleteAllCategories()}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="2 4 14 4" />
            <path d="M12 4l-.8 9H4.8L4 4" />
            <path d="M6.5 4V3h3v1" />
          </svg>{' '}
          حذف الكل
        </button>
      )}

      <button
        className={'gtab' + (allActive ? ' on on-all' : '')}
        onClick={() => { if (!manageMode) w.filterGroup('all'); }}
      >
        الكل
      </button>

      {tabs.map((tab) => (
        <div className="gtab-wrap" key={tab.id}>
          <button
            className={'gtab' + (tab.active ? ' on' : '')}
            style={{ ['--gtab-color' as any]: tab.color }}
            onClick={() => { if (!manageMode) w.filterGroup(tab.id); }}
          >
            {tab.label}
          </button>
          {!tab.noDelete && (
            <span className="gtab-x" onClick={(e) => { e.stopPropagation(); w.deleteCategory(tab.id); }}>
              ×
            </span>
          )}
        </div>
      ))}
    </>
  );
}
