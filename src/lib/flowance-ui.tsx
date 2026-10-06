/* eslint-disable @typescript-eslint/no-explicit-any */
import { createRoot, type Root } from 'react-dom/client';
import { ListView } from '@/components/flowance/lv/ListView';
import type { LvCatData } from '@/components/flowance/lv/LvCategory';
import { GroupTabs, type GroupTabData } from '@/components/flowance/lv/GroupTabs';
import { DailyView, type DailyDay } from '@/components/flowance/lv/DailyView';

const roots = new WeakMap<Element, Root>();

function rootFor(el: Element): Root {
  let r = roots.get(el);
  if (!r) {
    el.innerHTML = '';
    r = createRoot(el);
    roots.set(el, r);
  }
  return r;
}

function renderSync(el: Element, node: React.ReactNode) {
  rootFor(el).render(node);
}

/**
 * Bridge that lets the legacy engine (public/flowance-app.js) render
 * its dynamic areas through real React components, so every element
 * stays editable from the source files.
 */
export function registerFlowanceUI() {
  (window as any).FlowanceUI = {
    listView(el: Element, cats: LvCatData[], showAddCat: boolean) {
      renderSync(el, <ListView cats={cats} showAddCat={showAddCat} />);
    },
    groupTabs(
      el: Element,
      tabs: GroupTabData[],
      manageMode: boolean,
      allActive: boolean,
      showDeleteAll: boolean,
      variant: 'chips' | 'actions' | 'right' | 'center' = 'chips',
    ) {
      renderSync(
        el,
        <GroupTabs tabs={tabs} manageMode={manageMode} allActive={allActive} showDeleteAll={showDeleteAll} variant={variant} />,
      );
    },
    dailyView(el: Element, days: DailyDay[], total: number, count: number, range = 'month', rangeLabel = 'هذا الشهر') {
      renderSync(el, <DailyView days={days} total={total} count={count} range={range} rangeLabel={rangeLabel} />);
    },

  };
}
