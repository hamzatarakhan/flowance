/* ════════════════════════════════════════
   IndexedDB — real browser database
   ════════════════════════════════════════ */
const DB = {
  _db: null,

  open() {
    return new Promise((res, rej) => {
      const req = indexedDB.open('flowance_v5', 1);
      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('state')) {
          db.createObjectStore('state', { keyPath: 'id' });
        }
      };
      req.onsuccess = e => { this._db = e.target.result; res(); };
      req.onerror   = e => rej(e);
    });
  },

  save(data) {
    return new Promise((res, rej) => {
      const tx    = this._db.transaction('state', 'readwrite');
      const store = tx.objectStore('state');
      store.put({ id: 'main', ...data });
      tx.oncomplete = res;
      tx.onerror    = rej;
    });
  },

  load() {
    return new Promise((res, rej) => {
      const tx    = this._db.transaction('state', 'readonly');
      const store = tx.objectStore('state');
      const req   = store.get('main');
      req.onsuccess = e => res(e.target.result || null);
      req.onerror   = rej;
    });
  }
};

/* ════════════════════════════════════════
   History DB — separate database for monthly snapshots
   ════════════════════════════════════════ */
const HISTORY_DB = {
  _db: null,

  open() {
    return new Promise((res, rej) => {
      const req = indexedDB.open('flowance_history_v2', 1);
      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('history')) {
          db.createObjectStore('history', { keyPath: 'key' });
        }
      };
      req.onsuccess = e => { this._db = e.target.result; res(); };
      req.onerror   = e => rej(e);
    });
  },

  saveSnapshot(key, data) {
    return new Promise((res, rej) => {
      const tx = this._db.transaction('history', 'readwrite');
      const obj = { key };
      Object.keys(data).forEach(k => { if (k !== 'id') obj[k] = data[k]; });
      tx.objectStore('history').put(obj);
      tx.oncomplete = res; tx.onerror = rej;
    });
  },

  loadSnapshot(key) {
    return new Promise((res, rej) => {
      const tx = this._db.transaction('history', 'readonly');
      const req = tx.objectStore('history').get(key);
      req.onsuccess = e => res(e.target.result || null);
      req.onerror = rej;
    });
  },

  listSnapshots() {
    return new Promise((res, rej) => {
      const tx = this._db.transaction('history', 'readonly');
      const req = tx.objectStore('history').getAll();
      req.onsuccess = e => res((e.target.result || []).sort((a,b)=>b.key.localeCompare(a.key)));
      req.onerror = rej;
    });
  },

  deleteSnapshot(key) {
    return new Promise((res, rej) => {
      const tx = this._db.transaction('history', 'readwrite');
      tx.objectStore('history').delete(key);
      tx.oncomplete = res; tx.onerror = rej;
    });
  }
};

/* ════════════════════════════════════════
   Default Data
   ════════════════════════════════════════ */

function _id() { return Math.random().toString(36).slice(2,9); }

const CAT_COLORS = [
  { color:'#4F8EF7', dim:'rgba(79,142,247,0.10)'  },
  { color:'#2DC9A2', dim:'rgba(45,201,162,0.10)'  },
  { color:'#A97CF8', dim:'rgba(169,124,248,0.10)' },
  { color:'#F2B040', dim:'rgba(242,176,64,0.10)'  },
  { color:'#FF7A9A', dim:'rgba(255,122,154,0.10)' },
  { color:'#38BDF8', dim:'rgba(56,189,248,0.10)'  },
];

const SEED = {
  budget: 0,
  salary: 0,
  onboarded: false,
  month_key: '',
  cats_order: [],
  cats: { misc: [] },
};

let S = null;

/* ════════════════════════════════════════
   Formatting
   ════════════════════════════════════════ */
function f(n, d) { return (+n||0).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}); }
function fJOD(n) { return f(n,3)+' JOD'; }
function fUSD(n) { return f(n,2)+' USD'; }
function esc(s)  { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

/* ════════════════════════════════════════
   Calculations
   ════════════════════════════════════════ */
function sub(id)       { return (S.cats[id]||[]).reduce((a,r)=>a+(+r.amount||0),0); }
function subPaid(id)   { return (S.cats[id]||[]).filter(r=>r.paid).reduce((a,r)=>a+(+r.amount||0),0); }
function catIds()      { return (S.cats_order||[]).map(c=>c.id); }
function grandTotal()  { return catIds().reduce((a,id)=>a+sub(id),0); }
function grandPaid()   { return catIds().reduce((a,id)=>a+subPaid(id),0); }
function paidCount()   { return catIds().reduce((a,id)=>a+(S.cats[id]||[]).filter(r=>r.paid).length,0); }
function totalCount()  { return catIds().reduce((a,id)=>a+(S.cats[id]||[]).length,0); }
function miscTotal()   { return sub('misc'); }

function updateInsights() {
  const card = document.getElementById('insightsCard');
  const total = grandTotal() + miscTotal();
  if (total <= 0) { card.style.display = 'none'; return; }
  card.style.display = '';

  // Build category segments (cats + misc)
  const segments = [];
  (S.cats_order || []).forEach(cat => {
    const amt = sub(cat.id);
    if (amt > 0) segments.push({
      name: S.labels?.[cat.id] || cat.name,
      amount: amt,
      color: CAT_COLORS[cat.colorIdx % CAT_COLORS.length]?.color || '#888'
    });
  });
  const mAmt = miscTotal();
  if (mAmt > 0) segments.push({ name: 'متفرقات', amount: mAmt, color: '#F2B040' });
  segments.sort((a, b) => b.amount - a.amount);

  // Donut SVG
  const R = 36, CX = 50, CY = 50, C = 2 * Math.PI * R;
  const GAP = segments.length > 1 ? 2 : 0;
  let cumulative = 0;
  const arcs = segments.map(seg => {
    const arcLen = Math.max(0, (seg.amount / total) * C - GAP);
    const offset = cumulative;
    cumulative += (seg.amount / total) * C;
    return `<circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="${seg.color}"
      stroke-width="13" stroke-dasharray="${arcLen} ${C}"
      stroke-dashoffset="${-offset}" stroke-linecap="butt"/>`;
  });
  document.getElementById('donutSvg').innerHTML =
    `<circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="var(--border)" stroke-width="13"/>${arcs.join('')}`;

  // Center: total amount
  document.getElementById('donutPct').textContent = f(total, 0);
  document.getElementById('donutLbl').textContent = 'JOD';

  // Top category
  const top = segments[0];
  document.getElementById('insTopCat').textContent = top.name;
  document.getElementById('insTopCatPct').textContent =
    f(top.amount, 3) + ' JOD  ·  ' + ((top.amount / total) * 100).toFixed(1) + '%';

  // Biggest single item
  let biggest = null;
  [...(S.cats_order || []).map(c => c.id), 'misc'].forEach(id => {
    (S.cats[id] || []).forEach(item => {
      if (!biggest || (+item.amount || 0) > biggest.amount)
        biggest = { name: item.name, amount: +item.amount || 0 };
    });
  });
  if (biggest && biggest.amount > 0) {
    document.getElementById('insBigItem').textContent = biggest.name;
    document.getElementById('insBigAmt').textContent = f(biggest.amount, 3) + ' JOD';
  }

  // Paid ratio bar
  const pc = paidCount(), tc = totalCount() + (S.cats.misc||[]).length;
  const upc = tc - pc;
  document.getElementById('insPaidFill').style.width = (tc > 0 ? (pc / tc) * 100 : 0) + '%';
  document.getElementById('insPaidLbl').textContent = pc + ' بند مدفوع';
  document.getElementById('insUnpaidLbl').textContent = upc + ' بند متبقي';

  // Legend with amounts + percentages
  const legend = document.getElementById('insLegend');
  legend.innerHTML = segments.map(s =>
    `<div class="ins-legend-item">
      <div class="ins-legend-dot" style="background:${s.color}"></div>
      <div class="ins-legend-text">
        <span class="ins-legend-name">${s.name}</span>
        <span class="ins-legend-meta">${f(s.amount,0)} JOD · ${((s.amount/total)*100).toFixed(1)}%</span>
      </div>
    </div>`
  ).join('');
}

/* ════════════════════════════════════════
   Number Counter Animation
   ════════════════════════════════════════ */
const _vals = {};
function animTo(id, toVal, dec, prefix='', suffix='') {
  const el = document.getElementById(id);
  if (!el) return;
  const fromVal = _vals[id] !== undefined ? _vals[id] : 0;
  _vals[id] = toVal;
  if (fromVal === toVal) { el.textContent = prefix + f(toVal, dec) + suffix; return; }

  const dur = 450, start = performance.now();
  const from = fromVal;
  const tick = (now) => {
    const p = Math.min((now - start) / dur, 1);
    const e = 1 - Math.pow(1 - p, 3);
    const cur = from + (toVal - from) * e;
    el.textContent = prefix + f(cur, dec) + suffix;
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = prefix + f(toVal, dec) + suffix;
  };
  requestAnimationFrame(tick);

  el.classList.remove('popping'); void el.offsetWidth; el.classList.add('popping');
}

/* ════════════════════════════════════════
   Render
   ════════════════════════════════════════ */
let _sortables = [];
function destroySortables() { _sortables.forEach(s => { try { s.destroy(); } catch(e){} }); _sortables = []; }

function initSortables() {
  if (typeof Sortable === 'undefined') return;
  destroySortables();

  const mainBody = document.getElementById('mainBody');
  if (mainBody) {
    _sortables.push(Sortable.create(mainBody, {
      animation: 200,
      handle: '.cat-drag-handle',
      ghostClass: 'sort-ghost',
      chosenClass: 'sort-chosen',
      dragClass: 'sort-drag',
      onEnd(evt) {
        if (evt.oldIndex === evt.newIndex) return;
        const moved = S.cats_order.splice(evt.oldIndex, 1)[0];
        S.cats_order.splice(evt.newIndex, 0, moved);
        DB.save(S);
        renderListView(); initLvSortables();
      }
    }));
  }

  (S.cats_order||[]).forEach(cat => {
    const el = document.getElementById('rows-'+cat.id);
    if (!el) return;
    _sortables.push(Sortable.create(el, {
      animation: 200,
      handle: '.drag-handle',
      ghostClass: 'sort-ghost',
      chosenClass: 'sort-chosen',
      dragClass: 'sort-drag',
      onEnd(evt) {
        if (evt.oldIndex === evt.newIndex) return;
        const arr = S.cats[cat.id];
        const moved = arr.splice(evt.oldIndex, 1)[0];
        arr.splice(evt.newIndex, 0, moved);
        DB.save(S); recalc();
        const lvWrap = document.querySelector(`#listViewArea .lv-cat[data-catid="${cat.id}"] .lv-items-wrap`);
        if (lvWrap) {
          const allItems = [...lvWrap.querySelectorAll('.lv-item')];
          const movedEl = allItems[evt.oldIndex];
          if (movedEl) {
            movedEl.remove();
            allItems.splice(evt.oldIndex, 1);
            const ref = allItems[evt.newIndex] || null;
            if (ref) lvWrap.insertBefore(movedEl, ref); else lvWrap.appendChild(movedEl);
          }
        }
      }
    }));
  });

  const miscEl = document.getElementById('rows-misc');
  if (miscEl) {
    _sortables.push(Sortable.create(miscEl, {
      animation: 200,
      handle: '.drag-handle',
      ghostClass: 'sort-ghost',
      chosenClass: 'sort-chosen',
      dragClass: 'sort-drag',
      onEnd(evt) {
        if (evt.oldIndex === evt.newIndex) return;
        const arr = S.cats.misc;
        const moved = arr.splice(evt.oldIndex, 1)[0];
        arr.splice(evt.newIndex, 0, moved);
        DB.save(S); recalc();
      }
    }));
  }
}

function render() {
  renderMain();
  renderMisc();
  recalc();
  renderListView();
  if (_viewMode === 'list') {
    document.getElementById('panelsArea').style.display = 'none';
    document.getElementById('listViewArea').style.display = 'block';
    initLvSortables();
  } else {
    document.getElementById('panelsArea').style.display = 'block';
    document.getElementById('listViewArea').style.display = 'none';
    filterGroup(_activeGroup);
    initSortables();
    initLvSortables();
  }
}

function renderMain() {
  const body = document.getElementById('mainBody');
  body.innerHTML = '';
  (S.cats_order||[]).forEach((cat) => {
    const pal   = CAT_COLORS[cat.colorIdx % CAT_COLORS.length] || CAT_COLORS[0];
    const label = S.labels?.[cat.id] || cat.name;
    const items = S.cats[cat.id] || [];
    const count = items.length;
    const countTxt = count === 0 ? 'لا يوجد بنود' : count + ' ' + (count === 1 ? 'بند' : 'بنود');
    const sec = document.createElement('div');
    sec.className = 'cat-section collapsed'; sec.id = 'sec-'+cat.id;
    sec.innerHTML = `
      <div class="cat-head" onclick="toggleCat('${cat.id}')" style="--cat-color:${pal.color};--cat-dim:${pal.dim}">
        <div class="cat-head-left">
          <div class="cat-title-row">
            <button class="cat-chkall-btn" id="chkall-${cat.id}" onclick="toggleAllPaid('${cat.id}');event.stopPropagation()" title="تحديد الكل" style="display:${count>0?'grid':'none'}">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="2 8 6 12 14 4"/></svg>
            </button>
            <span class="cat-name" id="cattitle-${cat.id}" onclick="editCatTitle('${cat.id}');event.stopPropagation()">${esc(label)}</span>
          </div>
          <span class="cat-count" id="catcount-${cat.id}">${countTxt}</span>
          <div class="cat-paid-bar" id="catpaidbar-${cat.id}"><div class="cat-paid-fill" id="catpaidfill-${cat.id}" style="width:0%"></div></div>
          <div class="cat-budget-row" id="catbudget-${cat.id}" style="${(cat.budget||0)>0?'':'display:none'}">
            <div class="cat-budget-track"><div class="cat-budget-fill" id="catbudgetfill-${cat.id}" style="width:0%"></div></div>
            <span class="cat-budget-lbl" id="catbudgetlbl-${cat.id}">0 / ${f(cat.budget||0,3)} JOD</span>
          </div>
        </div>
        <div class="cat-head-right">
          <button class="cat-del-btn" onclick="deleteCategory('${cat.id}');event.stopPropagation()" title="حذف المجموعة">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="2 4 14 4"/><path d="M12 4l-.8 9H4.8L4 4"/><path d="M6.5 4V3h3v1"/></svg>
          </button>
          <svg class="cat-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 6 8 10 12 6"/></svg>
          <span class="cat-drag-handle" onclick="event.stopPropagation()">
            <svg viewBox="0 0 16 16" fill="currentColor"><circle cx="5.5" cy="4" r="1.2"/><circle cx="10.5" cy="4" r="1.2"/><circle cx="5.5" cy="8" r="1.2"/><circle cx="10.5" cy="8" r="1.2"/><circle cx="5.5" cy="12" r="1.2"/><circle cx="10.5" cy="12" r="1.2"/></svg>
          </span>
        </div>
      </div>
      <div class="cat-rows-wrap">
        <div id="rows-${cat.id}"></div>
        <button class="add-btn" onclick="addRow('${cat.id}')">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 3v10M3 8h10"/></svg>
          إضافة بند
        </button>
      </div>`;
    body.appendChild(sec);
    const rowsEl = sec.querySelector('#rows-'+cat.id);
    items.forEach((item, i) => {
      const row = makeRow(item, cat.id, cat.dec||3);
      row.style.animationDelay = (i * 35)+'ms';
      rowsEl.appendChild(row);
    });
  });
}

function renderMisc() {
  const c = document.getElementById('rows-misc');
  c.innerHTML = '';
  (S.cats.misc||[]).forEach((item, i) => {
    const row = makeRow(item, 'misc', 2);
    row.style.animationDelay = (i * 35)+'ms';
    c.appendChild(row);
  });
}

function makeRow(item, catId, dec) {
  const row = document.createElement('div');
  row.className = 'e-row' + (item.paid ? ' paid' : '');
  row.dataset.id = item.id;

  const chk = document.createElement('div');
  chk.className = 'check-wrap' + (item.paid ? ' chk' : '');
  chk.innerHTML = `<svg class="check-icon" viewBox="0 0 12 12" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="1.5 6 4.5 9 10.5 3"/></svg>`;
  chk.addEventListener('click', () => togglePaid(item.id, catId));

  const content = document.createElement('div');
  content.className = 'row-content';
  content.onclick = () => startEdit(content.querySelector('.row-name'), item.id, catId, 'name');

  const nameEl = document.createElement('span');
  nameEl.className = 'row-name';
  nameEl.textContent = item.name;

  const amtEl = document.createElement('span');
  amtEl.className = 'row-amt';
  amtEl.dataset.field = 'amount';
  amtEl.textContent = f(item.amount, dec) + ' ' + (catId === 'misc' ? 'USD' : 'JOD');
  amtEl.onclick = (e) => { e.stopPropagation(); startEdit(amtEl, item.id, catId, 'amount'); };

  content.appendChild(nameEl);
  content.appendChild(amtEl);

  const delBtn = document.createElement('button');
  delBtn.className = 'del-btn';
  delBtn.title = 'حذف';
  delBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>`;
  delBtn.onclick = () => delRow(item.id, catId);

  const dragH = document.createElement('span');
  dragH.className = 'drag-handle';
  dragH.innerHTML = `<svg viewBox="0 0 16 16" fill="currentColor"><circle cx="5.5" cy="4" r="1.2"/><circle cx="10.5" cy="4" r="1.2"/><circle cx="5.5" cy="8" r="1.2"/><circle cx="10.5" cy="8" r="1.2"/><circle cx="5.5" cy="12" r="1.2"/><circle cx="10.5" cy="12" r="1.2"/></svg>`;

  const recBtn = document.createElement('button');
  recBtn.className = 'recurring-btn' + (item.recurring ? ' on' : '');
  recBtn.title = item.recurring ? 'إيقاف التكرار الشهري' : 'تكرار شهري';
  recBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>`;
  recBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleRecurring(item.id, catId); });
  if (item.recurring) row.classList.add('recurring');

  const moveBtn = document.createElement('button');
  moveBtn.className = 'move-btn';
  moveBtn.title = 'نقل إلى مجموعة';
  moveBtn.innerHTML = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8h10"/><polyline points="8 4 12 8 8 12"/></svg>`;
  moveBtn.addEventListener('click', (e) => { e.stopPropagation(); showMoveSheet(item.id, catId); });

  row.appendChild(dragH);
  row.appendChild(chk);
  row.appendChild(content);
  row.appendChild(recBtn);
  row.appendChild(moveBtn);
  row.appendChild(delBtn);
  return row;
}

/* ════════════════════════════════════════
   Toggle Paid
   ════════════════════════════════════════ */
function toggleAllPaid(catId) {
  const items = S.cats[catId] || [];
  if (!items.length) return;
  const allPaid = items.every(r => r.paid);
  items.forEach(r => r.paid = !allPaid);
  DB.save(S);
  render();
}

function togglePaid(itemId, catId) {
  const item = (S.cats[catId]||[]).find(r=>r.id===itemId);
  if (!item) return;
  item.paid = !item.paid;
  DB.save(S);

  const row = document.querySelector(`[data-id="${itemId}"]`);
  if (row) {
    const chk = row.querySelector('.check-wrap');
    if (item.paid) {
      chk.classList.add('chk');
      row.classList.add('paid');
      void row.offsetWidth;
      row.classList.add('paid-anim');
      row.addEventListener('animationend', () => row.classList.remove('paid-anim'), {once:true});
    } else {
      chk.classList.remove('chk');
      row.classList.remove('paid');
    }
  }
  const lvRow = document.getElementById('lv-item-' + itemId);
  if (lvRow) lvRow.classList.toggle('paid', item.paid);
  recalc();
}

/* ════════════════════════════════════════
   Inline Edit
   ════════════════════════════════════════ */
let activeEdit = null;

function toWestern(str) {
  return String(str)
    .replace(/[٠١٢٣٤٥٦٧٨٩]/g, d => d.charCodeAt(0) - 0x0660)
    .replace(/[۰۱۲۳۴۵۶۷۸۹]/g, d => d.charCodeAt(0) - 0x06F0);
}

function applyArabicNums(inp) {
  inp.addEventListener('input', () => {
    const v = toWestern(inp.value);
    if (v !== inp.value) { inp.value = v; }
  });
}

function startEdit(el, itemId, catId, field) {
  if (activeEdit) commitEdit();
  const isNum = field === 'amount';
  const item  = (S.cats[catId]||[]).find(r=>r.id===itemId);
  const dec   = catId === 'misc' ? 2 : 3;
  const inp   = document.createElement('input');
  inp.className = 'i-input ' + (isNum ? 'num' : 'str');
  inp.type  = isNum ? 'text' : 'text';
  inp.inputMode = isNum ? 'decimal' : 'text';
  inp.value = isNum ? item.amount : item.name;
  if (isNum) applyArabicNums(inp);
  activeEdit = {el, itemId, catId, field, inp, dec, mode: 'cards'};
  el.replaceWith(inp);
  inp.focus(); if (!isNum) inp.select();
  inp.addEventListener('blur',    commitEdit);
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault(); commitEdit();
      if (field === 'name') {
        const row = document.querySelector(`#rows-${catId} .e-row[data-id="${itemId}"]`);
        const amtEl = row && row.querySelector('.row-amt');
        if (amtEl) amtEl.click();
      }
    }
    if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
    if (e.key === 'Tab') {
      e.preventDefault(); commitEdit();
      const rows = [...document.querySelectorAll(`#rows-${catId} .e-row`)];
      const cur  = rows.find(r=>r.dataset.id===itemId);
      const nxt  = rows[rows.indexOf(cur)+1];
      if (nxt) { const e2 = field==='name'?nxt.querySelector('.row-name'):nxt.querySelector('.row-amt'); if(e2) e2.click(); }
    }
  });
}

function lvStartEdit(el, itemId, catId, field) {
  if (activeEdit) commitEdit();
  const isNum = field === 'amount';
  const item  = (S.cats[catId]||[]).find(r=>r.id===itemId);
  if (!item) return;
  const dec = catId === 'misc' ? 2 : 3;
  const inp = document.createElement('input');
  inp.className = 'lv-i-input ' + (isNum ? 'num' : 'str');
  inp.type = 'text';
  inp.inputMode = isNum ? 'decimal' : 'text';
  inp.value = isNum ? item.amount : item.name;
  if (isNum) { inp.dir = 'ltr'; applyArabicNums(inp); }
  activeEdit = {el, itemId, catId, field, inp, dec, mode: 'lv'};
  el.replaceWith(inp);
  inp.focus(); if (!isNum) inp.select();
  inp.addEventListener('blur',    commitEdit);
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault(); commitEdit();
      if (field === 'name') {
        const row = document.getElementById('lv-item-' + itemId);
        const amtEl = row && row.querySelector('.lv-item-amt');
        if (amtEl) amtEl.click();
      }
    }
    if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
    if (e.key === 'Tab') {
      e.preventDefault(); commitEdit();
      const row = document.getElementById('lv-item-' + itemId);
      if (!row) return;
      const sibling = row.nextElementSibling;
      if (sibling && sibling.classList.contains('lv-item')) {
        const nextItem = (S.cats[catId]||[]).find(r => r.id === sibling.id.replace('lv-item-',''));
        if (nextItem) {
          const nextEl = sibling.querySelector(field === 'name' ? '.lv-item-name' : '.lv-item-amt');
          if (nextEl) nextEl.click();
        }
      }
    }
  });
}

function makeAmtText(amount, dec, catId) {
  return f(amount, dec) + ' ' + (catId === 'misc' ? 'USD' : 'JOD');
}

function commitEdit() {
  if (!activeEdit) return;
  const {itemId, catId, field, inp, dec, mode} = activeEdit; activeEdit = null;
  if (!inp.parentNode) return;
  const item = (S.cats[catId]||[]).find(r=>r.id===itemId);
  if (!item) { inp.remove(); return; }
  if (field === 'amount') { const v = parseFloat(toWestern(inp.value)); if (!isNaN(v) && v >= 0) item.amount = v; }
  else { const v = inp.value.trim(); if (v) item.name = v; }
  DB.save(S);
  const neo = document.createElement('span');
  if (mode === 'lv') {
    neo.className = field === 'name' ? 'lv-item-name' : 'lv-item-amt';
    neo.textContent = field === 'amount' ? f(item.amount, dec) : item.name;
    neo.onclick = () => lvStartEdit(neo, itemId, catId, field);
    // also sync hidden card view span
    const cardRow = document.querySelector(`[data-id="${itemId}"]`);
    if (cardRow) {
      const cardEl = field === 'name' ? cardRow.querySelector('.row-name') : cardRow.querySelector('.row-amt');
      if (cardEl) cardEl.textContent = field === 'amount' ? makeAmtText(item.amount, dec, catId) : item.name;
    }
  } else {
    neo.className = field === 'name' ? 'row-name' : 'row-amt';
    neo.textContent = field === 'amount' ? makeAmtText(item.amount, dec, catId) : item.name;
    neo.onclick = field === 'amount' ? (e) => { e.stopPropagation(); startEdit(neo, itemId, catId, field); } : null;
    // sync hidden list view span
    const lvRow = document.getElementById('lv-item-' + itemId);
    if (lvRow) {
      const lvEl = field === 'name' ? lvRow.querySelector('.lv-item-name') : lvRow.querySelector('.lv-item-amt');
      if (lvEl) {
        lvEl.textContent = field === 'amount' ? f(item.amount, dec) : item.name;
      }
    }
  }
  inp.replaceWith(neo);
  recalc();
}

function cancelEdit() {
  if (!activeEdit) return;
  const {itemId, catId, field, inp, dec, mode} = activeEdit; activeEdit = null;
  if (!inp.parentNode) return;
  const item = (S.cats[catId]||[]).find(r=>r.id===itemId);
  const neo  = document.createElement('span');
  if (mode === 'lv') {
    neo.className = field === 'name' ? 'lv-item-name' : 'lv-item-amt';
    neo.textContent = field === 'amount' ? f(item.amount, dec) : item.name;
    neo.onclick = () => lvStartEdit(neo, itemId, catId, field);
  } else {
    neo.className = field === 'name' ? 'row-name' : 'row-amt';
    neo.textContent = field === 'amount' ? makeAmtText(item.amount, dec, catId) : item.name;
    neo.onclick = field === 'amount' ? (e) => { e.stopPropagation(); startEdit(neo, itemId, catId, field); } : null;
  }
  inp.replaceWith(neo);
}

/* ════════════════════════════════════════
   Add / Delete
   ════════════════════════════════════════ */
function addRow(catId) {
  const item = {id:_id(), name:'بند جديد', amount:0, paid:false};
  S.cats[catId].push(item); DB.save(S);

  const dec = catId === 'misc' ? 2 : ((S.cats_order||[]).find(c=>c.id===catId)?.dec || 3);

  if (_viewMode === 'list') {
    const lvSec = document.querySelector(`#listViewArea .lv-cat[data-catid="${catId}"]`);
    if (lvSec) {
      const em = lvSec.querySelector('.lv-empty');
      if (em) em.remove();
      const wrap = lvSec.querySelector('.lv-items-wrap');
      const newRow = _lvBuildItem(item, catId, dec);
      if (wrap) wrap.appendChild(newRow);
      else lvSec.appendChild(newRow);
      const sortInst = _lvSortables.find(s => s.el === wrap);
      if (!sortInst && wrap) _lvInitItemSortable(wrap, catId);
      const nameSpan = newRow.querySelector('.lv-item-name');
      if (nameSpan) lvStartEdit(nameSpan, item.id, catId, 'name');
    }
    // Also add to hidden card view
    const cardContainer = document.getElementById('rows-' + catId);
    if (cardContainer) cardContainer.appendChild(makeRow(item, catId, dec));
    recalc();
    return;
  }

  const c = document.getElementById('rows-'+catId);
  const row = makeRow(item, catId, dec);
  c.appendChild(row); recalc();
  const n = row.querySelector('.row-name');
  if (n) startEdit(n, item.id, catId, 'name');
  // Also add to hidden list view
  const lvSec = document.querySelector(`#listViewArea .lv-cat[data-catid="${catId}"]`);
  if (lvSec) {
    lvSec.querySelector('.lv-empty')?.remove();
    const wrap = lvSec.querySelector('.lv-items-wrap');
    if (wrap) wrap.appendChild(_lvBuildItem(item, catId, dec));
  }
}

function showMoveSheet(itemId, fromCatId) {
  const allCats = [
    ...(S.cats_order || []).map(c => ({ id: c.id, name: S.labels?.[c.id] || c.name, colorIdx: c.colorIdx })),
    { id: 'misc', name: S.labels?.misc || 'متفرقات', colorIdx: -1 }
  ].filter(c => c.id !== fromCatId);

  if (!allCats.length) { toast('لا توجد مجموعات أخرى للنقل إليها', 'var(--c-var)'); return; }

  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.innerHTML = `
    <div class="confirm-sheet" style="padding-bottom:env(safe-area-inset-bottom,12px)">
      <p class="confirm-msg" style="margin-bottom:4px">نقل البند إلى</p>
      <div class="move-cats-list"></div>
      <button class="confirm-no" style="margin-top:8px;width:100%">إلغاء</button>
    </div>`;
  const list = overlay.querySelector('.move-cats-list');
  allCats.forEach(cat => {
    const pal = cat.id === 'misc' ? { color: '#F2B040' } : (CAT_COLORS[cat.colorIdx % CAT_COLORS.length] || CAT_COLORS[0]);
    const btn = document.createElement('button');
    btn.className = 'move-cat-option';
    btn.innerHTML = `<span class="move-cat-dot" style="background:${pal.color}"></span>${esc(cat.name)}`;
    btn.onclick = () => {
      overlay.remove();
      const item = (S.cats[fromCatId] || []).find(r => r.id === itemId);
      if (!item) return;
      S.cats[fromCatId] = (S.cats[fromCatId] || []).filter(r => r.id !== itemId);
      if (!S.cats[cat.id]) S.cats[cat.id] = [];
      S.cats[cat.id].push(item);
      DB.save(S);
      render(); renderGroupTabs();
      toast(`تم نقل "${item.name}" إلى ${cat.name}`, 'var(--c-ok)');
    };
    list.appendChild(btn);
  });
  overlay.querySelector('.confirm-no').onclick = () => overlay.remove();
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
  document.body.appendChild(overlay);
}

function delRow(itemId, catId) {
  const arr = S.cats[catId];
  const idx = arr.findIndex(r=>r.id===itemId);
  if (idx === -1) return;
  const item = arr[idx];
  const rowEl = document.querySelector(`[data-id="${itemId}"]`);
  if (rowEl) { rowEl.classList.add('dying'); setTimeout(()=>rowEl.remove(), 260); }
  const lvRowEl = document.getElementById('lv-item-' + itemId);
  if (lvRowEl) lvRowEl.remove();
  arr.splice(idx,1); DB.save(S); recalc();
  showUndo(item.name, () => {
    arr.splice(idx, 0, item); DB.save(S);
    const c   = document.getElementById('rows-'+catId);
    const dec = catId==='misc'?2:3;
    const neo = makeRow(item, catId, dec);
    if (idx < c.children.length) c.insertBefore(neo, c.children[idx]); else c.appendChild(neo);
    const lvSec = document.querySelector(`#listViewArea .lv-cat[data-catid="${catId}"]`);
    if (lvSec) {
      const wrap = lvSec.querySelector('.lv-items-wrap');
      if (wrap) {
        const lvNeo = _lvBuildItem(item, catId, dec);
        if (idx < wrap.children.length) wrap.insertBefore(lvNeo, wrap.children[idx]); else wrap.appendChild(lvNeo);
      }
    }
    recalc();
  });
}

/* ════════════════════════════════════════
   Recalc + Animate
   ════════════════════════════════════════ */
function recalc() {
  (S.cats_order||[]).forEach(cat => {
    const s   = sub(cat.id);
    const sp  = subPaid(cat.id);
    const cnt = (S.cats[cat.id]||[]).filter(r=>r.paid).length;
    const tot = (S.cats[cat.id]||[]).length;
    const rem = s - sp;

    const countEl = document.getElementById('catcount-'+cat.id);
    if (countEl) {
      const dec = cat.dec || 3;
      if (tot === 0) {
        countEl.textContent = 'لا يوجد بنود';
      } else if (sp > 0) {
        countEl.textContent = `${tot} بند  •  ${f(s, dec)} JOD  •  ${f(sp, dec)} مدفوع`;
      } else {
        countEl.textContent = `${tot} بند  •  ${f(s, dec)} JOD`;
      }
    }
    const chkAllBtn = document.getElementById('chkall-'+cat.id);
    if (chkAllBtn) {
      const allPaid = tot > 0 && cnt === tot;
      chkAllBtn.style.display = tot > 0 ? 'grid' : 'none';
      chkAllBtn.classList.toggle('all-done', allPaid);
    }

    // Budget bar per category
    const budgetRow  = document.getElementById('catbudget-'+cat.id);
    const budgetFill = document.getElementById('catbudgetfill-'+cat.id);
    const budgetLbl  = document.getElementById('catbudgetlbl-'+cat.id);
    const catBudget  = cat.budget || 0;
    if (budgetRow) {
      if (catBudget > 0) {
        budgetRow.style.display = '';
        const pct   = Math.min(100, (s / catBudget) * 100);
        const state = pct >= 100 ? ' over' : pct >= 80 ? ' warn' : '';
        if (budgetFill) { budgetFill.style.width = pct+'%'; budgetFill.className = 'cat-budget-fill'+state; }
        if (budgetLbl)  { budgetLbl.className = 'cat-budget-lbl'+state; budgetLbl.textContent = f(s,3)+' / '+f(catBudget,3)+' JOD'; }
      } else {
        budgetRow.style.display = 'none';
      }
    }

    const paidFill = document.getElementById('catpaidfill-'+cat.id);
    if (paidFill) {
      const paidPct = tot > 0 ? Math.round(cnt / tot * 100) : 0;
      paidFill.style.width = paidPct + '%';
    }
  });

  const ms   = miscTotal();
  const msp  = subPaid('misc');
  const mrem = ms - msp;
  const mpc  = (S.cats.misc||[]).filter(r=>r.paid).length;
  const mpt  = (S.cats.misc||[]).length;
  const mcc = document.getElementById('catcount-misc');
  if (mcc) {
    if (mpt === 0) {
      mcc.textContent = 'لا يوجد بنود';
    } else if (msp > 0) {
      mcc.textContent = `${mpt} بند  •  ${f(ms, 2)} USD  •  ${f(msp, 2)} مدفوع`;
    } else {
      mcc.textContent = `${mpt} بند  •  ${f(ms, 2)} USD`;
    }
  }
  const mChkAll = document.getElementById('chkall-misc');
  if (mChkAll) {
    const allPaid = mpt > 0 && mpc === mpt;
    mChkAll.style.display = mpt > 0 ? 'grid' : 'none';
    mChkAll.classList.toggle('all-done', allPaid);
  }
  const miscPaidFill = document.getElementById('catpaidfill-misc');
  if (miscPaidFill) {
    const paidPct = mpt > 0 ? Math.round(mpc / mpt * 100) : 0;
    miscPaidFill.style.width = paidPct + '%';
  }

  const grand = grandTotal();
  const paid  = grandPaid();
  const pc    = paidCount();
  const tc    = totalCount();
  const bgt   = S.budget ?? 0;
  const pct   = Math.min(100, (grand/bgt)*100);
  const pctP  = Math.min(100, (paid/bgt)*100);

  updateFilteredTotal();
  updateInsights();
  animTo('miscTotal',  ms,    2, '', ' USD');
  animTo('sumFixed',   grand, 3);
  animTo('sumVar',     ms,    2);
  animTo('sumPaid',    paid,  3);
  animTo('sumComb',    grand, 3);

  const sc = document.getElementById('sumPaidCount');
  if (sc) sc.textContent = pc + ' من ' + tc + ' بند مدفوع';

  const bar  = document.getElementById('fillBar');
  const barP = document.getElementById('fillPaid');
  if (bar)  { bar.style.width = pct+'%'; bar.style.background = pct>90?'linear-gradient(90deg,#E05454,#F0A030)':'linear-gradient(90deg,var(--c-ess),var(--c-per))'; }
  if (barP) { barP.style.width = pctP+'%'; }

  const ul = document.getElementById('budgetUsed'); if(ul) ul.textContent = fJOD(grand)+' مستخدم';
  const bgt2 = S.budget ?? 0;
  const remain = bgt2 - grand;
  const rl = document.getElementById('budgetRemain');
  if (rl) {
    rl.textContent = remain >= 0 ? 'متبقي '+fJOD(remain) : 'تجاوز '+fJOD(Math.abs(remain));
    rl.className = 'budget-remain' + (remain < 0 ? ' over' : '');
  }

  const salary = S.salary || 0;
  const remaining = salary - grand;
  const salNum = document.getElementById('salaryNum');
  if (salNum) salNum.textContent = salary > 0 ? f(salary,3) : '0.000';
  const salSub = document.getElementById('salarySub');
  if (salSub) salSub.textContent = salary > 0 ? 'راتبك الشهري المُدخل' : 'اضغط لإدخال راتبك';
  const remNum = document.getElementById('remainingNum');
  const remCur = document.getElementById('remainingCur');
  const remSub = document.getElementById('remainingSub');
  if (remNum) {
    if (salary <= 0) {
      remNum.textContent = '—'; remNum.className = 'remaining-val zero';
      if (remCur) remCur.style.display='none';
      if (remSub) remSub.textContent = '';
    } else {
      remNum.textContent = f(Math.abs(remaining), 3);
      remNum.className = 'remaining-val ' + (remaining >= 0 ? 'pos' : 'neg');
      if (remCur) remCur.style.display='inline';
      if (remSub) remSub.textContent = remaining >= 0
        ? '✓ وفّرت '+f(remaining,3)+' JOD هذا الشهر'
        : '⚠ تجاوزت راتبك بـ '+f(Math.abs(remaining),3)+' JOD';
    }
  }

  const sa  = document.getElementById('stickyAmt');  if(sa)  sa.textContent  = fJOD(grand);
  const sp2 = document.getElementById('stickyPaid'); if(sp2) sp2.textContent = pc > 0 ? '✓ '+fJOD(paid)+' مدفوع' : '';
}

/* ════════════════════════════════════════
   Toast / Undo
   ════════════════════════════════════════ */
function showUndo(name, fn) {
  const box = document.getElementById('toasts');
  const t   = document.createElement('div'); t.className = 'toast';
  t.innerHTML = `<span class="toast-msg">تم حذف <strong>${esc(name)}</strong></span>
                 <button class="undo-btn">تراجع</button>
                 <div class="t-bar" style="width:100%"></div>`;
  let gone = false;
  const rm = () => { if(gone)return; gone=true; t.classList.add('out'); setTimeout(()=>t.remove(),240); };
  t.querySelector('.undo-btn').addEventListener('click', () => { fn(); toast('تم استرجاع "'+name+'"'); rm(); });
  setTimeout(() => t.querySelector('.t-bar').style.width = '0%', 30);
  setTimeout(rm, 5000);
  box.appendChild(t);
}

function toast(msg, color) {
  const box = document.getElementById('toasts');
  const t   = document.createElement('div'); t.className = 'toast';
  t.innerHTML = `<span class="toast-msg">${esc(msg)}</span>`;
  if (color) t.style.borderColor = color;
  box.appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(()=>t.remove(),240); }, 2400);
}

/* ════════════════════════════════════════
   Theme
   ════════════════════════════════════════ */
function toggleTheme() {
  const dark = document.documentElement.dataset.theme === 'dark';
  document.documentElement.dataset.theme = dark ? 'light' : 'dark';
  updateThemeIcon(!dark);
  localStorage.setItem('ftheme_ar', document.documentElement.dataset.theme);
}
function updateThemeIcon(isDark) {
  const ico = document.getElementById('themeIco');
  if (isDark) ico.innerHTML=`<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`;
  else ico.innerHTML=`<path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"/>`;
}
function initTheme() {
  const t = localStorage.getItem('ftheme_ar');
  if (t) { document.documentElement.dataset.theme = t; updateThemeIcon(t==='dark'); }
}

/* ════════════════════════════════════════
   Tabs
   ════════════════════════════════════════ */
/* ════════════════════════════════════════
   Confirm Sheet
   ════════════════════════════════════════ */
function showConfirm(msg, label, onYes) {
  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.innerHTML = `
    <div class="confirm-sheet">
      <p class="confirm-msg">${msg}</p>
      <div class="confirm-btns">
        <button class="confirm-yes">${label}</button>
        <button class="confirm-no">إلغاء</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('.confirm-yes').onclick = () => { overlay.remove(); onYes(); };
  overlay.querySelector('.confirm-no').onclick  = () => overlay.remove();
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
}

/* ════════════════════════════════════════
   Category Management
   ════════════════════════════════════════ */
function addCategory() {
  const id = _id();
  const colorIdx = (S.cats_order||[]).length % CAT_COLORS.length;
  const cat = { id, name:'مجموعة جديدة', dec:3, colorIdx };
  if (!S.cats_order) S.cats_order = [];
  S.cats_order.push(cat);
  S.cats[id] = [];
  if (!S.labels) S.labels = {};
  S.labels[id] = cat.name;
  DB.save(S);
  _activeGroup = 'all';
  render();
  renderGroupTabs();
  setTimeout(() => editCatTitle(id), 40);
}

function deleteCategory(catId) {
  const cat = (S.cats_order||[]).find(c=>c.id===catId);
  const name = cat ? (S.labels?.[catId] || cat.name) : catId;
  const count = (S.cats[catId]||[]).length;
  const detail = count > 0 ? ` (${count} بند)` : '';
  showConfirm(`حذف مجموعة "${name}"${detail}؟`, 'حذف', () => {
    S.cats_order = (S.cats_order||[]).filter(c=>c.id!==catId);
    delete S.cats[catId];
    delete S.labels?.[catId];
    if (_activeGroup === catId) _activeGroup = 'all';
    DB.save(S);
    render();
    renderGroupTabs();
    toast('تم حذف "'+name+'"', 'var(--c-danger)');
  });
}

function toggleCat(catId) {
  const sec = document.getElementById('sec-' + catId);
  if (sec) sec.classList.toggle('collapsed');
}

function switchTab(tab, btn) {
  document.querySelectorAll('.tab').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  const main   = document.getElementById('panelMain');
  const misc   = document.getElementById('panelMisc');
  const sticky = document.getElementById('stickyBar');
  const gt     = document.getElementById('groupTabs');
  if (tab==='main') {
    main.classList.remove('m-hide'); misc.classList.remove('m-show'); sticky.style.display='flex';
    if (gt) gt.classList.remove('hidden');
  } else {
    main.classList.add('m-hide'); misc.classList.add('m-show'); sticky.style.display='none';
    if (gt) gt.classList.add('hidden');
  }
}

/* ════════════════════════════════════════
   Group Filter Chips
   ════════════════════════════════════════ */
let _activeGroup = 'all';
let _manageMode = false;
let _viewMode = 'cards';

function toggleManageMode() {
  _manageMode = !_manageMode;
  renderGroupTabs();
}

function deleteAllCategories() {
  const count = (S.cats_order||[]).length;
  if (!count) return;
  showConfirm(`حذف جميع المجموعات (${count})؟ سيتم حذف كل البنود أيضاً.`, 'حذف الكل', () => {
    (S.cats_order||[]).forEach(c => { delete S.cats[c.id]; delete S.labels?.[c.id]; });
    S.cats_order = [];
    if (_activeGroup !== 'all' && _activeGroup !== 'misc') _activeGroup = 'all';
    DB.save(S);
    _manageMode = false;
    renderMain();
    renderGroupTabs();
    recalc();
    toast('تم حذف جميع المجموعات', 'var(--c-danger)');
  });
}

function renderGroupTabs() {
  const container = document.getElementById('groupTabs');
  if (!container || !window.FlowanceUI) return;
  container.classList.toggle('manage-mode', _manageMode);
  const tabs = (S.cats_order || []).map(cat => ({
    id: cat.id,
    label: S.labels?.[cat.id] || cat.name,
    color: (CAT_COLORS[cat.colorIdx % CAT_COLORS.length] || CAT_COLORS[0]).color,
    active: _activeGroup === cat.id
  }));
  window.FlowanceUI.groupTabs(
    container,
    tabs,
    _manageMode,
    _activeGroup === 'all',
    _manageMode && (S.cats_order || []).length > 0
  );
}

function updateFilteredTotal() {
  const lbl = document.getElementById('grandTotalLabel');
  if (!lbl) return;
  if (_activeGroup === 'all') {
    lbl.textContent = 'المجموع الكلي';
    animTo('grandTotal', grandTotal(), 3, '', ' JOD');
  } else if (_activeGroup === 'misc') {
    // misc panel has its own total bar — nothing to update here
  } else {
    const cat = (S.cats_order||[]).find(c => c.id === _activeGroup);
    const label = (cat && (S.labels?.[cat.id] || cat.name)) || _activeGroup;
    lbl.textContent = 'مجموع ' + label;
    animTo('grandTotal', sub(_activeGroup), 3, '', ' JOD');
  }
}

function filterGroup(id) {
  _activeGroup = id;
  renderGroupTabs();
  if (_viewMode === 'list') {
    renderListView();
    updateFilteredTotal();
    return;
  }
  const main = document.getElementById('panelMain');
  const misc = document.getElementById('panelMisc');
  if (id === 'all') {
    main.style.display = ''; misc.style.display = 'none';
    document.querySelectorAll('#mainBody .cat-section').forEach(s => s.style.display = '');
  } else if (id === 'misc') {
    main.style.display = 'none'; misc.style.display = '';
  } else {
    main.style.display = ''; misc.style.display = 'none';
    document.querySelectorAll('#mainBody .cat-section').forEach(s => {
      s.style.display = s.id === 'sec-' + id ? '' : 'none';
    });
  }
  updateFilteredTotal();
}

/* ════════════════════════════════════════
   View Toggle (Cards / List)
   ════════════════════════════════════════ */
function switchView(mode) {
  _viewMode = mode;
  const panels = document.getElementById('panelsArea');
  const listArea = document.getElementById('listViewArea');
  document.querySelectorAll('.view-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.view === mode)
  );
  if (mode === 'list') {
    panels.style.display = 'none';
    listArea.style.display = 'block';
    // List view already built by render(); just ensure sortables are active
    initLvSortables();
  } else {
    panels.style.display = 'block';
    listArea.style.display = 'none';
    filterGroup(_activeGroup);
  }
}

function renderListView() {
  const wrap = document.getElementById('listViewArea');
  if (!wrap || !window.FlowanceUI) return;

  const catsToShow = _activeGroup === 'misc' ? []
    : _activeGroup === 'all' ? (S.cats_order || [])
    : (S.cats_order || []).filter(c => c.id === _activeGroup);

  const cats = catsToShow.map(cat => ({
    id: cat.id,
    color: (CAT_COLORS[cat.colorIdx % CAT_COLORS.length] || CAT_COLORS[0]).color,
    label: S.labels?.[cat.id] || cat.name,
    items: S.cats[cat.id] || [],
    total: sub(cat.id),
    dec: cat.dec || 3,
    isMisc: false
  }));

  if (_activeGroup === 'all' || _activeGroup === 'misc') {
    cats.push({
      id: 'misc',
      color: '#F2B040',
      label: 'متفرقات الشهر',
      items: S.cats.misc || [],
      total: miscTotal(),
      dec: 2,
      isMisc: true
    });
  }

  window.FlowanceUI.listView(wrap, cats, _activeGroup === 'all');
}

/* ════════════════════════════════════════
   List View Sortables
   ════════════════════════════════════════ */
let _lvSortables = [];

function _lvInitItemSortable(wrapEl, catId) {
  const inst = Sortable.create(wrapEl, {
    animation: 200,
    handle: '.lv-drag',
    group: 'lv-items',
    ghostClass: 'sort-ghost',
    chosenClass: 'sort-chosen',
    onEnd(evt) {
      const fromWrap  = evt.from;
      const toWrap    = evt.to;
      const fromCatId = fromWrap.closest('.lv-cat')?.dataset.catid;
      const toCatId   = toWrap.closest('.lv-cat')?.dataset.catid;
      if (!fromCatId || !toCatId) return;
      const itemId = evt.item.id.replace('lv-item-', '');

      if (fromCatId === toCatId) {
        const arr    = S.cats[fromCatId] || [];
        const moved  = arr.splice(evt.oldIndex, 1)[0];
        arr.splice(evt.newIndex, 0, moved);
      } else {
        const fromArr = S.cats[fromCatId] || [];
        const item    = fromArr.find(r => r.id === itemId);
        if (!item) return;
        S.cats[fromCatId] = fromArr.filter(r => r.id !== itemId);
        if (!S.cats[toCatId]) S.cats[toCatId] = [];
        S.cats[toCatId].splice(evt.newIndex, 0, item);
        // Show/hide empty labels
        const fromSec = fromWrap.closest('.lv-cat');
        if (fromSec && !S.cats[fromCatId].length) {
          const em = document.createElement('div');
          em.className = 'lv-empty'; em.textContent = 'لا يوجد بنود';
          fromSec.insertBefore(em, fromWrap);
        }
        const toSec = toWrap.closest('.lv-cat');
        if (toSec) toSec.querySelector('.lv-empty')?.remove();
        toast(`تم نقل "${item.name}"`, 'var(--c-ok)');
      }
      DB.save(S);
      recalc();
      if (fromCatId === toCatId) {
        // Sync card view item order within category
        const cardWrap = document.getElementById('rows-' + fromCatId);
        if (cardWrap) {
          const allCards = [...cardWrap.querySelectorAll('.e-row')];
          const movedCard = allCards[evt.oldIndex];
          if (movedCard) {
            movedCard.remove();
            allCards.splice(evt.oldIndex, 1);
            const ref = allCards[evt.newIndex] || null;
            if (ref) cardWrap.insertBefore(movedCard, ref); else cardWrap.appendChild(movedCard);
          }
        }
      } else {
        // Cross-category: rebuild card view for affected categories
        renderMain(); renderMisc();
      }
    }
  });
  _lvSortables.push(inst);
  return inst;
}

function initLvSortables() {
  _lvSortables.forEach(s => { try { s.destroy(); } catch(e){} });
  _lvSortables = [];

  // Category-level reorder
  const wrap = document.getElementById('listViewArea');
  if (wrap) {
    _lvSortables.push(Sortable.create(wrap, {
      animation: 200,
      handle: '.lv-cat-drag',
      draggable: '.lv-cat',
      ghostClass: 'sort-ghost',
      chosenClass: 'sort-chosen',
      onEnd() {
        const newOrder = [...wrap.querySelectorAll('.lv-cat')]
          .map(s => s.dataset.catid)
          .filter(id => id && id !== 'misc');
        S.cats_order = newOrder.map(id => S.cats_order.find(c => c.id === id)).filter(Boolean);
        DB.save(S);
        renderMain(); renderGroupTabs(); recalc();
      }
    }));
  }

  // Item-level reorder + cross-category drag
  document.querySelectorAll('#listViewArea .lv-items-wrap').forEach(wrapEl => {
    const catId = wrapEl.closest('.lv-cat')?.dataset.catid;
    if (catId) _lvInitItemSortable(wrapEl, catId);
  });
}

function lvTogglePaid(itemId, catId) {
  const arr  = S.cats[catId] || [];
  const item = arr.find(r => r.id === itemId);
  if (!item) return;
  item.paid = !item.paid;
  DB.save(S);
  const lvRow = document.getElementById('lv-item-' + itemId);
  if (lvRow) lvRow.classList.toggle('paid', item.paid);
  const cardRow = document.querySelector(`[data-id="${itemId}"]`);
  if (cardRow) {
    const chk = cardRow.querySelector('.check-wrap');
    if (item.paid) { chk?.classList.add('chk'); cardRow.classList.add('paid'); }
    else { chk?.classList.remove('chk'); cardRow.classList.remove('paid'); }
  }
  recalc();
}

function lvDeleteItem(itemId, catId) {
  showConfirm('حذف البند؟', 'حذف', () => {
    S.cats[catId] = (S.cats[catId] || []).filter(r => r.id !== itemId);
    DB.save(S);
    document.getElementById('lv-item-' + itemId)?.remove();
    document.querySelector(`[data-id="${itemId}"]`)?.remove();
    recalc();
  });
}

function lvEditItem(itemId, catId) {
  const arr  = S.cats[catId] || [];
  const item = arr.find(r => r.id === itemId);
  if (!item) return;
  const dec = catId === 'misc' ? 2 : ((S.cats_order||[]).find(c => c.id === catId)?.dec || 3);

  const sheet = document.getElementById('bottomSheet');
  const cont  = document.getElementById('sheetContent');
  sheet.classList.add('open');

  cont.innerHTML = `
    <div class="sheet-handle"></div>
    <div class="sheet-title">تعديل البند</div>
    <div class="item-edit-sheet">
      <div class="item-edit-field">
        <label>اسم البند</label>
        <input id="lvEditName" type="text" value="${esc(item.name||'')}" placeholder="اسم البند" dir="auto" />
      </div>
      <div class="item-edit-field">
        <label>المبلغ</label>
        <input id="lvEditAmt" type="text" inputmode="decimal" value="${item.amount||0}" dir="ltr" />
      </div>
      <button class="item-edit-save" onclick="lvSaveEdit('${itemId}','${catId}')">حفظ</button>
    </div>`;

  setTimeout(() => {
    const inp = document.getElementById('lvEditName');
    if (inp) { inp.focus(); inp.select(); }
  }, 80);
}

function lvSaveEdit(itemId, catId) {
  const nameEl = document.getElementById('lvEditName');
  const amtEl  = document.getElementById('lvEditAmt');
  const arr    = S.cats[catId] || [];
  const item   = arr.find(r => r.id === itemId);
  if (!item || !nameEl || !amtEl) return;

  const newName = nameEl.value.trim();
  const newAmt  = parseFloat(toWestern(amtEl.value));
  if (newName) item.name = newName;
  if (!isNaN(newAmt) && newAmt >= 0) item.amount = newAmt;
  DB.save(S);

  document.getElementById('bottomSheet')?.classList.remove('open');
  renderListView();
  recalc();
}

/* ════════════════════════════════════════
   Budget Edit
   ════════════════════════════════════════ */
function editBudget() {
  const lbl = document.getElementById('budgetLbl');
  if (!lbl || lbl.querySelector('input')) return;
  const orig = fJOD(S.budget ?? 0);
  const inp = document.createElement('input');
  inp.type = 'text'; inp.inputMode = 'decimal';
  inp.value = S.budget ?? 0;
  inp.className = 'i-input num';
  inp.style.cssText = 'width:110px;font-size:16px;';
  applyArabicNums(inp);
  inp.dir = 'ltr';
  lbl.textContent = '';
  lbl.appendChild(inp);
  inp.focus(); inp.select();
  function commit() {
    const n = parseFloat(toWestern(inp.value));
    if (!isNaN(n) && n > 0) { S.budget = n; DB.save(S); }
    lbl.textContent = fJOD(S.budget ?? 0);
    recalc();
  }
  inp.addEventListener('blur', commit);
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter')  { e.preventDefault(); inp.blur(); }
    if (e.key === 'Escape') { e.preventDefault(); lbl.textContent = orig; }
  });
}

/* ════════════════════════════════════════
   Salary Edit
   ════════════════════════════════════════ */
function editSalary() {
  const cur = S.salary || 0;
  const salaryVal = document.getElementById('salaryVal');
  if (!salaryVal || salaryVal.querySelector('input')) return;

  const inp = document.createElement('input');
  inp.type = 'text'; inp.inputMode = 'decimal';
  inp.value = cur > 0 ? cur : '';
  inp.placeholder = 'مثال: 2500';
  applyArabicNums(inp);
  inp.className = 'i-input num';
  inp.style.cssText = 'width:130px;font-size:17px;';
  inp.dir = 'ltr';

  const orig = salaryVal.innerHTML;
  salaryVal.innerHTML = '';
  salaryVal.appendChild(inp);
  inp.focus(); inp.select();

  const commit = () => {
    const v = parseFloat(toWestern(inp.value));
    S.salary = (!isNaN(v) && v >= 0) ? v : 0;
    DB.save(S);
    salaryVal.innerHTML = orig;
    const sn = document.getElementById('salaryNum');
    if (sn) sn.textContent = f(S.salary, 3);
    recalc();
    if (S.salary > 0) toast('تم حفظ الراتب: '+fJOD(S.salary), 'var(--c-day-bd)');
  };

  inp.addEventListener('blur', commit);
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter')  { e.preventDefault(); inp.blur(); }
    if (e.key === 'Escape') { e.preventDefault(); salaryVal.innerHTML = orig; }
  });
}

/* ════════════════════════════════════════
   Edit Category Title
   ════════════════════════════════════════ */
function editCatTitle(catId) {
  // In list view, find the lv-cat-name span and edit it in-place
  if (_viewMode === 'list') {
    const lvSec = document.querySelector(`#listViewArea .lv-cat[data-catid="${catId}"]`);
    const lvEl = lvSec ? lvSec.querySelector('.lv-cat-name') : null;
    if (lvEl && !lvEl.querySelector('input')) {
      const cur = lvEl.textContent.trim();
      const catMeta = (S.cats_order||[]).find(c=>c.id===catId);
      const catColor = catMeta ? CAT_COLORS[catMeta.colorIdx % CAT_COLORS.length].color : (catId==='misc'?'#F2B040':'#4F8EF7');
      const inp = document.createElement('input');
      inp.type = 'text'; inp.value = cur;
      inp.style.cssText = `background:transparent;border:none;border-bottom:1.5px solid ${catColor};color:${catColor};font-family:inherit;font-size:12px;font-weight:700;width:100%;outline:none;padding:0;`;
      lvEl.textContent = '';
      lvEl.appendChild(inp);
      inp.focus(); inp.select();
      const commit = () => {
        const v = inp.value.trim();
        const label = v || cur;
        if (!S.labels) S.labels = {};
        S.labels[catId] = label;
        DB.save(S);
        lvEl.textContent = label;
        lvEl.onclick = () => editCatTitle(catId);
        renderGroupTabs();
        // also update hidden card view element
        const cardEl = document.getElementById('cattitle-'+catId);
        if (cardEl) cardEl.textContent = label;
        toast('تم تعديل الاسم: "'+label+'"', catColor);
      };
      inp.addEventListener('blur', commit);
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter')  { e.preventDefault(); inp.blur(); }
        if (e.key === 'Escape') { e.preventDefault(); lvEl.textContent = cur; }
      });
      return;
    }
  }

  const el = document.getElementById('cattitle-'+catId);
  if (!el || el.querySelector('input')) return;

  const cur = el.textContent.trim();
  const inp = document.createElement('input');
  inp.type = 'text'; inp.value = cur;
  inp.className = 'cat-title-input';

  const catMeta = (S.cats_order||[]).find(c=>c.id===catId);
  const catColor = catMeta ? CAT_COLORS[catMeta.colorIdx % CAT_COLORS.length].color : (catId==='misc'?'#F2B040':'#4F8EF7');
  inp.style.color = catColor;
  inp.style.borderColor = catColor;
  inp.style.boxShadow = `0 0 0 2px ${catColor}33`;

  el.replaceWith(inp);
  inp.focus(); inp.select();

  const commit = () => {
    const v = inp.value.trim();
    const label = v || cur;
    if (!S.labels) S.labels = {};
    S.labels[catId] = label;
    DB.save(S);
    const neo = document.createElement('span');
    neo.className = 'cat-name'; neo.id = 'cattitle-'+catId;
    neo.textContent = label;
    neo.onclick = () => editCatTitle(catId);
    inp.replaceWith(neo);
    renderGroupTabs();
    // also sync list view category name
    const lvNameEl = document.querySelector(`#listViewArea .lv-cat[data-catid="${catId}"] .lv-cat-name`);
    if (lvNameEl && !lvNameEl.querySelector('input')) lvNameEl.textContent = label;
    toast('تم تعديل الاسم: "'+label+'"', catColor);
  };

  inp.addEventListener('blur', commit);
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter')  { e.preventDefault(); inp.blur(); }
    if (e.key === 'Escape') { e.preventDefault();
      const neo = document.createElement('span');
      neo.className = 'cat-name'; neo.id = 'cattitle-'+catId;
      neo.textContent = cur; neo.onclick = () => editCatTitle(catId);
      inp.replaceWith(neo);
    }
  });
}

/* ════════════════════════════════════════
   Export CSV
   ════════════════════════════════════════ */
/* ════════════════════════════════════════
   SCAN / AI IMPORT
   ════════════════════════════════════════ */


let _scanData = null;

async function transcribeVoice(blob) {
  const ext = blob.type.includes('mp4') ? 'm4a' : blob.type.includes('ogg') ? 'ogg' : blob.type.includes('wav') ? 'wav' : 'webm';
  const form = new FormData();
  form.append('file', blob, `voice.${ext}`);
  form.append('model', 'whisper-1');
  form.append('language', 'ar');
  const r = await fetch('/api/transcribe', { method: 'POST', body: form });
  const d = await r.json();
  if (!r.ok) throw new Error(d?.error || `خطأ ${r.status}`);
  return d.text || '';
}

let _voiceTranscriptDirty = false;

function onVoiceTranscriptInput() {
  _voiceTranscriptDirty = true;
  updateScanBtn();
}

function showVoiceTranscript(text) {
  const wrap = document.getElementById('scanVoiceTranscriptWrap');
  const box  = document.getElementById('scanVoiceTranscript');
  if (!wrap || !box) return;
  box.value = text;
  wrap.style.display = 'block';
}

function hideVoiceTranscript() {
  const wrap = document.getElementById('scanVoiceTranscriptWrap');
  const box  = document.getElementById('scanVoiceTranscript');
  _voiceTranscriptDirty = false;
  if (box) box.value = '';
  if (wrap) wrap.style.display = 'none';
}

async function runVoiceExtraction(aiCall) {
  const box = document.getElementById('scanVoiceTranscript');
  const edited = (box?.value || '').trim();
  let transcript;
  if (_voiceTranscriptDirty && edited) {
    transcript = edited;
  } else {
    if (!_voiceBlob) throw new Error('الرجاء تسجيل صوت أولاً');
    transcript = await transcribeVoice(_voiceBlob);
    showVoiceTranscript(transcript);
    _voiceTranscriptDirty = false;
  }
  if (!transcript.trim()) throw new Error('لم يتم التعرف على أي كلام، حاول التسجيل مرة أخرى');
  const prompt = 'You are an expert Arabic expense extractor. Extract EVERY single expense item mentioned in the spoken transcript below.\n\n'
    + 'RULES:\n'
    + '- Extract ALL items mentioned with a name and/or amount — miss nothing\n'
    + '- The "name" field: clean Arabic/English name only, no numbers, no symbols\n'
    + '- The "amount" field: numeric value only (convert Arabic-Indic ٠١٢٣٤٥٦٧٨٩ and spoken numbers to Western digits)\n'
    + '- If amount is missing or unclear, use 0\n'
    + '- Return ONLY valid JSON, no markdown, no explanation\n\n'
    + 'Format: {"items":[{"name":"...","amount":0.00}]}\n\n'
    + 'Transcript:\n' + transcript;
  return await aiCall(prompt);
}

function openScanSheet(mode) {
  document.getElementById('scanOverlay').style.display = 'flex';
  if (mode) setScanMode(mode);
  updateScanBtn();
}

function closeScanSheet() {
  document.getElementById('scanOverlay').style.display = 'none';
  document.getElementById('scanResults').style.display = 'none';
  document.getElementById('scanStatus').textContent = '';
  document.getElementById('scanLoader').classList.remove('active');
  const ti = document.getElementById('scanTextInput');
  if (ti) ti.value = '';
  if (_voiceRecorder && _voiceRecorder.state === 'recording') _voiceRecorder.stop();
  clearVoiceRecording(false);
  _scanData = null;
  setScanMode('img');
}


let _scanMode = 'img';

function setScanMode(mode) {
  _scanMode = mode;
  document.getElementById('scanImgPanel').style.display = mode === 'img' ? '' : 'none';
  document.getElementById('scanTxtPanel').style.display = mode === 'txt' ? '' : 'none';
  document.getElementById('scanVoicePanel').style.display = mode === 'voice' ? '' : 'none';
  document.getElementById('scanTabImg').classList.toggle('active', mode === 'img');
  document.getElementById('scanTabTxt').classList.toggle('active', mode === 'txt');
  document.getElementById('scanTabVoice').classList.toggle('active', mode === 'voice');
  updateScanBtn();
}

function updateScanBtn() {
  const hasImg = document.getElementById('scanPreviewWrap').style.display === 'block';
  const hasTxt = (document.getElementById('scanTextInput')?.value || '').trim().length > 5;
  const hasVoice = !!_voiceBlob || (_voiceTranscriptDirty && (document.getElementById('scanVoiceTranscript')?.value || '').trim().length > 2);
  const hasContent = _scanMode === 'img' ? hasImg : _scanMode === 'txt' ? hasTxt : hasVoice;
  document.getElementById('scanBtn').disabled = !hasContent;
}

/* ── Voice recording ── */
let _voiceBlob = null, _voiceRecorder = null, _voiceStream = null, _voiceTimerInt = null, _voiceStartTs = 0;
let _voiceAudioCtx = null, _voiceSource = null, _voiceProcessor = null, _voicePcm = [];

function _voiceFmtTime(ms) {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
}

async function toggleVoiceRecording() {
  if (_voiceRecorder && _voiceRecorder.state === 'recording') { await stopVoiceRecording(); return; }
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (e) {
    toast('لم يتم السماح بالوصول للمايكروفون', 'var(--c-danger)');
    return;
  }
  _voiceStream = stream;
  _voicePcm = [];
  _voiceAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  await _voiceAudioCtx.resume();
  _voiceSource = _voiceAudioCtx.createMediaStreamSource(stream);
  _voiceProcessor = _voiceAudioCtx.createScriptProcessor(4096, 1, 1);
  _voiceProcessor.onaudioprocess = e => _voicePcm.push(new Float32Array(e.inputBuffer.getChannelData(0)));
  _voiceSource.connect(_voiceProcessor);
  _voiceProcessor.connect(_voiceAudioCtx.destination);
  _voiceRecorder = { state: 'recording', stop: stopVoiceRecording };
  _voiceStartTs = Date.now();
  document.getElementById('scanVoiceBtn').classList.add('recording');
  document.getElementById('scanVoiceTimer').textContent = '00:00 — اضغط للإيقاف';
  _voiceTimerInt = setInterval(() => {
    document.getElementById('scanVoiceTimer').textContent = _voiceFmtTime(Date.now() - _voiceStartTs) + ' — اضغط للإيقاف';
  }, 300);
}

function _encodeVoiceWav(chunks, inputRate) {
  const inputLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const input = new Float32Array(inputLength);
  let offset = 0;
  chunks.forEach(chunk => { input.set(chunk, offset); offset += chunk.length; });
  const outputRate = 16000;
  const ratio = inputRate / outputRate;
  const outputLength = Math.max(0, Math.floor(input.length / ratio));
  const buffer = new ArrayBuffer(44 + outputLength * 2);
  const view = new DataView(buffer);
  const text = (at, value) => { for (let i = 0; i < value.length; i++) view.setUint8(at + i, value.charCodeAt(i)); };
  text(0, 'RIFF'); view.setUint32(4, 36 + outputLength * 2, true); text(8, 'WAVE');
  text(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, 1, true); view.setUint32(24, outputRate, true);
  view.setUint32(28, outputRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  text(36, 'data'); view.setUint32(40, outputLength * 2, true);
  for (let i = 0; i < outputLength; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.max(start + 1, Math.floor((i + 1) * ratio));
    let sample = 0;
    for (let j = start; j < end && j < input.length; j++) sample += input[j];
    sample = Math.max(-1, Math.min(1, sample / (end - start)));
    view.setInt16(44 + i * 2, sample < 0 ? sample * 32768 : sample * 32767, true);
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

async function stopVoiceRecording() {
  if (!_voiceRecorder || _voiceRecorder.state !== 'recording') return;
  _voiceRecorder.state = 'inactive';
  clearInterval(_voiceTimerInt);
  _voiceStream?.getTracks().forEach(t => t.stop());
  _voiceProcessor?.disconnect();
  _voiceSource?.disconnect();
  const sampleRate = _voiceAudioCtx?.sampleRate || 48000;
  _voiceBlob = _encodeVoiceWav(_voicePcm, sampleRate);
  await _voiceAudioCtx?.close();
  _voiceAudioCtx = _voiceSource = _voiceProcessor = null;
  _voicePcm = [];
  document.getElementById('scanVoiceBtn')?.classList.remove('recording');
  if (_voiceBlob.size < 2048) {
    _voiceBlob = null;
    toast('التسجيل فارغ أو قصير جداً، حاول مرة أخرى', 'var(--c-danger)');
    updateScanBtn();
    return;
  }
  const audio = document.getElementById('scanVoiceAudio');
  audio.src = URL.createObjectURL(_voiceBlob);
  document.getElementById('scanVoiceIdle').style.display = 'none';
  document.getElementById('scanVoicePreview').style.display = 'flex';
  updateScanBtn();
}

function clearVoiceRecording(reRecord) {
  const audio = document.getElementById('scanVoiceAudio');
  if (audio && audio.src) { URL.revokeObjectURL(audio.src); audio.src = ''; }
  hideVoiceTranscript();
  _voiceBlob = null;
  _voiceStream?.getTracks().forEach(t => t.stop());
  _voiceProcessor?.disconnect();
  _voiceSource?.disconnect();
  if (_voiceAudioCtx && _voiceAudioCtx.state !== 'closed') _voiceAudioCtx.close();
  _voiceAudioCtx = _voiceSource = _voiceProcessor = null;
  _voicePcm = [];
  document.getElementById('scanVoicePreview').style.display = 'none';
  document.getElementById('scanVoiceIdle').style.display = '';
  document.getElementById('scanVoiceBtn')?.classList.remove('recording');
  const timerEl = document.getElementById('scanVoiceTimer');
  if (timerEl) timerEl.textContent = 'اضغط لبدء التسجيل';
  updateScanBtn();
  if (reRecord) toggleVoiceRecording();
}

function onScanFileSelected(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const img = document.getElementById('scanPreviewImg');
    img.src = e.target.result;
    document.getElementById('scanPreviewWrap').style.display = 'block';
    document.getElementById('scanDropZone').style.display = 'none';
    img._base64 = e.target.result.split(',')[1];
    img._mime  = file.type || 'image/jpeg';
    updateScanBtn();
  };
  reader.readAsDataURL(file);
}

function clearScanImage() {
  const img = document.getElementById('scanPreviewImg');
  img.src = '';
  img._base64 = null;
  img._mime = null;
  document.getElementById('scanPreviewWrap').style.display = 'none';
  document.getElementById('scanDropZone').style.display = '';
  document.getElementById('scanFileInput').value = '';
  updateScanBtn();
}

async function runScan() {
  const img    = document.getElementById('scanPreviewImg');
  const status = document.getElementById('scanStatus');
  const btn    = document.getElementById('scanBtn');

  btn.disabled = true;
  status.className = 'scan-status';
  status.textContent = '';
  document.getElementById('scanResults').style.display = 'none';

  const loader = document.getElementById('scanLoader');
  const setStep = (step) => {
    [1,2].forEach(i => {
      const el = document.getElementById(`loaderStep${i}`);
      const ico = document.getElementById(`loaderIcon${i}`);
      if (i < step) {
        el.className = 'scan-loader-step step-done';
        ico.innerHTML = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="3 8 6 12 13 4"/></svg>`;
      } else if (i === step) {
        el.className = 'scan-loader-step step-active';
        ico.innerHTML = `<div class="scan-spin"></div>`;
      } else {
        el.className = 'scan-loader-step';
        ico.innerHTML = `<div class="scan-dot-idle"></div>`;
      }
    });
  };
  loader.classList.add('active');
  // Update step 1 label based on mode
  const step1Label = document.querySelector('#loaderStep1 .scan-loader-step-label');
  const step1Sub   = document.querySelector('#loaderStep1 .scan-loader-step-sub');
  if (_scanMode === 'txt') {
    step1Label.textContent = 'قراءة النص';
    step1Sub.textContent   = 'استخراج جميع البنود والمبالغ';
  } else if (_scanMode === 'voice') {
    step1Label.textContent = 'تحويل الصوت إلى نص';
    step1Sub.textContent   = 'الاستماع للتسجيل واستخراج البنود';
  } else {
    step1Label.textContent = 'قراءة الصورة';
    step1Sub.textContent   = 'استخراج جميع البنود والمبالغ';
  }
  setStep(1);

  const aiCall = async (prompt, imgData) => {
    const content = imgData
      ? [{ type: 'image_url', image_url: { url: `data:${imgData.mime};base64,${imgData.base64}`, detail: 'high' } }, { type: 'text', text: prompt }]
      : prompt;
    const r = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content }] })
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d?.error || `خطأ ${r.status}`);
    return d.text || '';
  };

  try {
    // ── Step 1: extract flat list from image or text ───────────────────
    let rawText;
    if (_scanMode === 'txt') {
      const inputTxt = document.getElementById('scanTextInput').value.trim();
      if (!inputTxt) throw new Error('الرجاء إدخال نص أولاً');
      rawText = await aiCall(`You are an expert Arabic expense extractor. Extract EVERY single expense item from the text below.

RULES:
- Extract ALL lines that have a name and/or amount — miss nothing
- The "name" field: clean Arabic/English name only, no numbers, no symbols
- The "amount" field: numeric value only (convert Arabic-Indic ٠١٢٣٤٥٦٧٨٩ to Western digits)
- If amount is missing or unclear, use 0
- Do NOT skip any line, even if it looks like a header or total
- Return ONLY valid JSON, no markdown, no explanation

Format: {"items":[{"name":"...","amount":0.00}]}

Text:
${inputTxt}`);
    } else if (_scanMode === 'voice') {
      rawText = await runVoiceExtraction(aiCall);
    } else {
      rawText = await aiCall(
        `You are an expert Arabic expense extractor with perfect OCR ability. Read this expense image carefully.

RULES:
- Extract EVERY SINGLE line item visible in the image — miss absolutely nothing
- Read both Arabic and English text
- Convert Arabic-Indic numerals (٠١٢٣٤٥٦٧٨٩) to Western digits
- The "name" field: clean item name only, no numbers
- The "amount" field: the numeric amount for that item
- Include ALL rows: expenses, fees, subscriptions, utilities, transport, food, etc.
- If amount is unclear, use 0
- Return ONLY valid JSON, no markdown, no explanation

Format: {"items":[{"name":"...","amount":0.00}]}`,
        { mime: img._mime, base64: img._base64 }
      );
    }

    const rawMatch = rawText.match(/\{[\s\S]*\}/);
    if (!rawMatch) throw new Error('تعذّر قراءة البنود');
    const { items } = JSON.parse(rawMatch[0]);
    if (!Array.isArray(items) || items.length === 0) throw new Error('لم يتم العثور على بنود');

    // ── Step 2: categorize the flat list ─────────────────────────────
    setStep(2);
    const catText = await aiCall(`أنت مساعد مالي شخصي محترف. مهمتك تصنيف قائمة مصاريف إلى مجموعات منطقية بأسماء واقعية وطبيعية بالعربي.

تعليمات التصنيف:
- اقرأ كل البنود أولاً وافهم طبيعتها، ثم قرر التصنيف المناسب
- اسم كل مجموعة يجب أن يعبّر بدقة عن البنود اللي فيها — مش أسماء عامة
- استخدم أسماء طبيعية يستخدمها الناس فعلاً في حياتهم اليومية، مثل:
  "أقساط السيارة والبنزين" لو فيه قسط + بنزين
  "فاتورة الكهرباء والمياه" لو فيه كهرباء + ماء
  "مصاريف الأكل والمطاعم" لو فيه أكل ومطاعم
  "اشتراكات الترفيه" لو فيه نتفليكس وسبوتيفاي
  "مصاريف الأطفال والمدرسة" لو فيه مصاريف تعليمية للأطفال
  "الإيجار والسكن" لو فيه إيجار
  لا تستخدم "متفرقات" إلا كآخر خيار لما فعلاً ما في مكان ثاني
- لا تجبر التقسيم — لو 3 بنود من نوع مختلف وكل واحد وحده، اجمعهم في مجموعة واحدة تصفهم كلهم
- كل بند يظهر في مجموعة واحدة فقط — لا حذف ولا تكرار
- احتفظ بالاسم والمبلغ الأصلي لكل بند بدون تعديل
- أرجع JSON فقط بدون أي شرح أو ماركداون

البنود:
${items.map((it,i) => `${i+1}. ${it.name} — ${it.amount}`).join('\n')}

الصيغة المطلوبة: {"groups":[{"name":"اسم المجموعة","items":[{"name":"...","amount":0.00}]}]}`);

    const catMatch = catText.match(/\{[\s\S]*\}/);
    if (!catMatch) throw new Error('تعذّر تصنيف البنود');

    _scanData = JSON.parse(catMatch[0]);
    if (!Array.isArray(_scanData.groups) || _scanData.groups.length === 0) throw new Error('لا توجد مجموعات في النتيجة');

    setStep(3);
    const totalItems = _scanData.groups.reduce((s, g) => s + (g.items||[]).length, 0);
    loader.classList.remove('active');
    renderScanPreview(_scanData);
    status.textContent = `✓ ${totalItems} بند في ${_scanData.groups.length} مجموعة`;
  } catch(e) {
    loader.classList.remove('active');
    status.className = 'scan-status err';
    status.textContent = '✗ ' + (e.message || 'حدث خطأ');
    _scanData = null;
  } finally {
    btn.disabled = false;
  }
}

const DRAG_DOTS = `<svg viewBox="0 0 16 16" fill="currentColor"><circle cx="5.5" cy="4" r="1.2"/><circle cx="10.5" cy="4" r="1.2"/><circle cx="5.5" cy="8" r="1.2"/><circle cx="10.5" cy="8" r="1.2"/><circle cx="5.5" cy="12" r="1.2"/><circle cx="10.5" cy="12" r="1.2"/></svg>`;
const TRASH_ICO = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="2 4 14 4"/><path d="M12 4l-.8 9H4.8L4 4"/><path d="M6.5 4V3h3v1"/></svg>`;

let _scanSortables = [];

function renderScanPreview(data) {
  const body = document.getElementById('scanResultsBody');
  body.innerHTML = '';
  _scanSortables.forEach(s => { try { s.destroy(); } catch(e){} });
  _scanSortables = [];

  data.groups.forEach((g, gIdx) => {
    g.items = g.items || [];
    const card = document.createElement('div');
    card.className = 'scan-group-card';
    card.style.marginBottom = '12px';
    card.dataset.gidx = gIdx;

    // — header —
    const head = document.createElement('div');
    head.className = 'scan-group-head';
    head.innerHTML = `
      <span class="scan-group-drag">${DRAG_DOTS}</span>
      <input class="scan-group-title-input" value="${esc(g.name)}" placeholder="اسم المجموعة">
      <span class="scan-group-meta" id="scan-meta-${gIdx}"></span>
      <button class="scan-group-del" title="حذف المجموعة">${TRASH_ICO}</button>`;
    head.querySelector('.scan-group-title-input').addEventListener('input', e => {
      _scanData.groups[gIdx].name = e.target.value;
    });
    head.querySelector('.scan-group-del').addEventListener('click', () => deleteScanGroup(gIdx));
    card.appendChild(head);

    // — destination (new group / existing group) —
    const dest = document.createElement('div');
    dest.className = 'scan-group-dest';
    const opts = (S.cats_order || [])
      .map(c => `<option value="${esc(c.id)}"${g.targetId === c.id ? ' selected' : ''}>${esc((S.labels && S.labels[c.id]) || c.name || 'مجموعة')}</option>`)
      .join('');
    dest.innerHTML = `
      <span class="scan-group-dest-label">الوجهة</span>
      <select class="scan-group-dest-select">
        <option value=""${g.targetId ? '' : ' selected'}>➕ مجموعة جديدة</option>
        ${opts}
      </select>`;
    const sel = dest.querySelector('.scan-group-dest-select');
    const syncDest = () => {
      const titleInput = head.querySelector('.scan-group-title-input');
      titleInput.disabled = !!_scanData.groups[gIdx].targetId;
      titleInput.style.opacity = titleInput.disabled ? '.5' : '';
    };
    sel.addEventListener('change', e => {
      _scanData.groups[gIdx].targetId = e.target.value || null;
      syncDest();
    });
    syncDest();
    card.appendChild(dest);

    // — items —
    const itemsWrap = document.createElement('div');
    itemsWrap.id = `scan-items-${gIdx}`;
    g.items.forEach((it, iIdx) => itemsWrap.appendChild(makeScanItemRow(gIdx, iIdx, it)));
    card.appendChild(itemsWrap);

    // — add item —
    const addBtn = document.createElement('button');
    addBtn.className = 'scan-add-item-btn';
    addBtn.textContent = '+ إضافة بند';
    addBtn.addEventListener('click', () => addScanItem(gIdx));
    card.appendChild(addBtn);

    body.appendChild(card);
    updateScanMeta(gIdx);

    // sortable items
    if (typeof Sortable !== 'undefined') {
      _scanSortables.push(Sortable.create(itemsWrap, {
        animation: 150, handle: '.scan-item-drag', ghostClass: 'sort-ghost',
        onEnd(evt) {
          if (evt.oldIndex === evt.newIndex) return;
          const arr = _scanData.groups[gIdx].items;
          arr.splice(evt.newIndex, 0, arr.splice(evt.oldIndex, 1)[0]);
          updateScanMeta(gIdx);
        }
      }));
    }
  });

  // sortable groups
  if (typeof Sortable !== 'undefined') {
    _scanSortables.push(Sortable.create(body, {
      animation: 150, handle: '.scan-group-drag', ghostClass: 'sort-ghost',
      onEnd(evt) {
        if (evt.oldIndex === evt.newIndex) return;
        _scanData.groups.splice(evt.newIndex, 0, _scanData.groups.splice(evt.oldIndex, 1)[0]);
        renderScanPreview(_scanData);
      }
    }));
  }

  document.getElementById('scanResults').style.display = 'flex';
}

function makeScanItemRow(gIdx, iIdx, it) {
  const row = document.createElement('div');
  row.className = 'scan-item-row';
  row.dataset.iidx = iIdx;
  row.innerHTML = `
    <span class="scan-item-drag">${DRAG_DOTS}</span>
    <input class="scan-item-name-input" value="${esc(it.name)}" placeholder="اسم البند">
    <input class="scan-item-amt-input" value="${(+it.amount||0).toFixed(2)}" inputmode="decimal" placeholder="0.00">
    <button class="scan-item-del">${TRASH_ICO}</button>`;
  row.querySelector('.scan-item-name-input').addEventListener('input', e => {
    _scanData.groups[gIdx].items[iIdx].name = e.target.value;
  });
  row.querySelector('.scan-item-amt-input').addEventListener('input', e => {
    const v = parseFloat(toWestern(e.target.value)) || 0;
    _scanData.groups[gIdx].items[iIdx].amount = v;
    updateScanMeta(gIdx);
  });
  row.querySelector('.scan-item-del').addEventListener('click', () => deleteScanItem(gIdx, iIdx));
  return row;
}

function updateScanMeta(gIdx) {
  const g = _scanData.groups[gIdx];
  const items = g.items || [];
  const total = items.reduce((s, it) => s + (+it.amount || 0), 0);
  const el = document.getElementById(`scan-meta-${gIdx}`);
  if (el) el.textContent = `${items.length} بند · ${total.toFixed(2)}`;
}

function deleteScanGroup(gIdx) {
  _scanData.groups.splice(gIdx, 1);
  renderScanPreview(_scanData);
}

function deleteScanItem(gIdx, iIdx) {
  _scanData.groups[gIdx].items.splice(iIdx, 1);
  const wrap = document.getElementById(`scan-items-${gIdx}`);
  if (wrap) {
    const rows = wrap.querySelectorAll('.scan-item-row');
    rows[iIdx]?.remove();
    // re-index remaining rows
    wrap.querySelectorAll('.scan-item-row').forEach((r, i) => r.dataset.iidx = i);
  }
  updateScanMeta(gIdx);
}

function addScanItem(gIdx) {
  const newItem = { name: '', amount: 0 };
  _scanData.groups[gIdx].items.push(newItem);
  const iIdx = _scanData.groups[gIdx].items.length - 1;
  const wrap = document.getElementById(`scan-items-${gIdx}`);
  if (wrap) {
    const row = makeScanItemRow(gIdx, iIdx, newItem);
    wrap.appendChild(row);
    row.querySelector('.scan-item-name-input').focus();
  }
  updateScanMeta(gIdx);
}

function applyScanResults() {
  if (!_scanData?.groups) return;
  const COLORS = CAT_COLORS;
  let colorIdx = S.cats_order.length % COLORS.length;

  _scanData.groups.forEach(g => {
    const id = 'g' + Date.now() + Math.random().toString(36).slice(2,5);
    S.cats[id] = (g.items||[]).map(it => ({
      id: 'r' + Date.now() + Math.random().toString(36).slice(2,5),
      name: it.name || 'بند',
      amount: parseFloat(toWestern(String(it.amount))) || 0,
      paid: false
    }));
    S.cats_order.push({ id, name: g.name, colorIdx: colorIdx % COLORS.length });
    S.labels = S.labels || {};
    S.labels[id] = g.name;
    colorIdx++;
  });

  DB.save(S);
  render();
  closeScanSheet();
  toast(`✓ تمت إضافة ${_scanData.groups.length} مجموعة`, 'var(--c-paid)');
}

function exportCSV() {
  if (typeof XLSX === 'undefined') { toast('جاري تحميل المكتبة...', 'var(--t-low)'); return; }

  const now    = new Date();
  const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  const monthName = months[now.getMonth()] + ' ' + now.getFullYear();
  const wb = XLSX.utils.book_new();

  /* ── Helper: styled cell ── */
  const C = (v, bold, bg, color, numFmt) => ({
    v, t: typeof v === 'number' ? 'n' : 's',
    s: {
      font:      { bold: !!bold, color: { rgb: color||'111126' }, name:'Calibri', sz:11 },
      fill:      bg ? { patternType:'solid', fgColor:{ rgb: bg } } : undefined,
      alignment: { horizontal: typeof v==='number' ? 'right' : 'right', vertical:'center', wrapText: false },
      numFmt:    numFmt || (typeof v === 'number' ? '#,##0.000' : undefined),
      border:    { bottom:{ style:'thin', color:{ rgb:'CCCCDD' } } }
    }
  });

  /* ══════════════════════════
     SHEET 1 — ملخص الشهر
  ══════════════════════════ */
  const bgt      = S.budget ?? 0;
  const grand    = grandTotal();
  const paid     = grandPaid();
  const ms       = miscTotal();
  const rem      = bgt - grand;
  const pct      = bgt > 0 ? (grand / bgt * 100) : 0;

  const sumRows = [
    [ C('Flowance — تقرير مالي شهري', true, '0D0D1C', 'EEEEF5'), C(''), C('') ],
    [ C(monthName, false, '171730', '9696C8'), C(''), C('') ],
    [ C(''), C(''), C('') ],
    [ C('البيان', true, '1A1A36', '9696C8'), C('المبلغ', true, '1A1A36', '9696C8'), C('العملة', true, '1A1A36', '9696C8') ],
    [ C('الميزانية الشهرية', true), C(bgt, true, null, '111126'), C('JOD') ],
    [ C('إجمالي المصاريف'), C(grand), C('JOD') ],
    [ C('المدفوع حتى الآن'), C(paid, false, '0C2A1F', '2DC9A2'), C('JOD') ],
    [ C('غير المدفوع'), C(grand - paid, false, '2A0C0C', 'FF7070'), C('JOD') ],
    [ C('المتبقي من الميزانية'), C(rem, false, rem >= 0 ? '0C2A1F' : '2A0C0C', rem >= 0 ? '2DC9A2' : 'FF7070'), C('JOD') ],
    [ C('إجمالي المتغير (USD)'), C(ms, false, null, '111126', '#,##0.00'), C('USD') ],
    [ C(''), C(''), C('') ],
    [ C('نسبة الإنفاق'), C(+(pct.toFixed(1)), false, null, '111126', '0.0"%"'), C('من الميزانية') ],
  ];

  const ws1 = XLSX.utils.aoa_to_sheet(sumRows);
  ws1['!cols']  = [{wch:32},{wch:16},{wch:10}];
  ws1['!rows']  = [{hpt:28},{hpt:20},{hpt:8},{hpt:22}];
  ws1['!merges']= [{s:{r:0,c:0},e:{r:0,c:2}},{s:{r:1,c:0},e:{r:1,c:2}}];
  XLSX.utils.book_append_sheet(wb, ws1, 'ملخص الشهر');

  /* ══════════════════════════
     SHEET 2 — تفاصيل المصاريف
  ══════════════════════════ */
  const detRows = [
    [ C('المجموعة', true, '1A1A36', '9696C8'), C('البند', true, '1A1A36', '9696C8'),
      C('المبلغ', true, '1A1A36', '9696C8'), C('العملة', true, '1A1A36', '9696C8'),
      C('الحالة', true, '1A1A36', '9696C8') ]
  ];

  const catColors = ['0D1A2E','0D2218','1A0D2E','2A1A05','2A0D1A','051A2A'];

  (S.cats_order||[]).forEach((cat, ci) => {
    const label  = S.labels?.[cat.id] || cat.name;
    const rowBg  = catColors[cat.colorIdx % catColors.length];
    const items  = S.cats[cat.id] || [];
    items.forEach(item => {
      const paid = item.paid;
      const bg   = paid ? '0A2218' : null;
      const tc   = paid ? '2DC9A2' : '111126';
      detRows.push([
        C(label,      false, bg, paid ? '2DC9A2' : '9696C8'),
        C(item.name,  false, bg, tc),
        C(+item.amount, false, bg, tc),
        C('JOD',      false, bg, tc),
        C(paid ? '✓ مدفوع' : '—', false, bg, tc),
      ]);
    });
    if (items.length) {
      const catTotal = sub(cat.id);
      const catPaid  = subPaid(cat.id);
      detRows.push([
        C('مجموع: '+label, true, '111126', '7272AA'),
        C(''),
        C(catTotal, true, '111126', '7272AA'),
        C('JOD', true, '111126', '7272AA'),
        C(catPaid > 0 ? `مدفوع ${f(catPaid,3)}` : '', false, '111126', '2DC9A2'),
      ]);
      detRows.push([C(''),C(''),C(''),C(''),C('')]);
    }
  });

  // Misc
  const miscItems = S.cats.misc || [];
  if (miscItems.length) {
    const miscLabel = S.labels?.misc || 'متفرقات';
    miscItems.forEach(item => {
      const paid = item.paid;
      const bg   = paid ? '0A2218' : null;
      const tc   = paid ? '2DC9A2' : '111126';
      detRows.push([
        C(miscLabel, false, bg, paid ? '2DC9A2' : 'F2B040'),
        C(item.name, false, bg, tc),
        C(+item.amount, false, bg, tc, '#,##0.00'),
        C('USD',    false, bg, tc),
        C(paid ? '✓ مدفوع' : '—', false, bg, tc),
      ]);
    });
    detRows.push([
      C('مجموع: '+miscLabel, true, '111126', '7272AA'), C(''),
      C(ms, true, '111126', '7272AA', '#,##0.00'), C('USD', true, '111126', '7272AA'), C(''),
    ]);
  }

  const ws2 = XLSX.utils.aoa_to_sheet(detRows);
  ws2['!cols'] = [{wch:26},{wch:26},{wch:14},{wch:8},{wch:16}];
  XLSX.utils.book_append_sheet(wb, ws2, 'تفاصيل المصاريف');

  /* ── Export ── */
  const fname = `flowance-${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}.xlsx`;
  XLSX.writeFile(wb, fname);
  toast('تم تصدير ملف Excel ✓', 'var(--c-day-bd)');
}

/* ════════════════════════════════════════
   Month Label
   ════════════════════════════════════════ */
const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}
function monthKeyToLabel(key) {
  if (!key) return '';
  const [y, m] = key.split('-');
  return MONTHS_AR[parseInt(m,10)-1] + ' ' + y;
}
function initMonth() {
  const d = new Date();
  document.getElementById('monthLbl').textContent = MONTHS_AR[d.getMonth()] + ' ' + d.getFullYear();
}
function updateMonthLabel() {
  const key = S?.month_key || currentMonthKey();
  const label = monthKeyToLabel(key);
  document.getElementById('monthLbl').textContent = label;
  const bar = document.getElementById('monthBarLabel');
  if (bar) bar.textContent = label;
}

/* ════════════════════════════════════════
   Monthly History
   ════════════════════════════════════════ */
let _viewSnap = null;
let _snapOrigin = 'history';

async function openHistorySheet() {
  const overlay = document.getElementById('historyOverlay');
  overlay.style.display = 'flex';
  const listEl = document.getElementById('historyList');
  listEl.innerHTML = '<div class="history-empty">جاري التحميل...</div>';
  const curKey = S.month_key || currentMonthKey();
  document.getElementById('historyCurLabel').textContent = monthKeyToLabel(curKey);
  const snapshots = await HISTORY_DB.listSnapshots();
  if (!snapshots.length) {
    listEl.innerHTML = '<div class="history-empty">لا يوجد شهور محفوظة بعد<br><span style="font-size:11px;opacity:.6">اضغط "شهر جديد" لحفظ الشهر الحالي</span></div>';
    return;
  }
  listEl.innerHTML = '';
  snapshots.forEach(snap => {
    const catTot  = (snap.cats_order||[]).reduce((a,c)=>a+(snap.cats[c.id]||[]).reduce((s,r)=>s+(+r.amount||0),0),0);
    const catPaid = (snap.cats_order||[]).reduce((a,c)=>a+(snap.cats[c.id]||[]).filter(r=>r.paid).reduce((s,r)=>s+(+r.amount||0),0),0);
    const itemCnt = (snap.cats_order||[]).reduce((a,c)=>a+(snap.cats[c.id]||[]).length,0);
    const item = document.createElement('div');
    item.className = 'history-month-item';
    item.innerHTML = `
      <div class="history-month-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </div>
      <div class="history-month-info">
        <div class="history-month-name">${monthKeyToLabel(snap.key)}</div>
        <div class="history-month-meta">${itemCnt} بند · ${f(catPaid,3)} JOD مدفوع</div>
      </div>
      <div class="history-month-total">${f(catTot,3)}</div>
      <button class="history-month-del" title="حذف" onclick="deleteHistorySnap('${snap.key}',event)">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="2 4 14 4"/><path d="M12 4l-.8 9H4.8L4 4"/><path d="M6 4V3h4v1"/></svg>
      </button>`;
    item.addEventListener('click', () => { _snapOrigin = 'history'; openSnapshotView(snap); });
    listEl.appendChild(item);
  });
}

function closeHistorySheet() {
  document.getElementById('historyOverlay').style.display = 'none';
}

async function deleteHistorySnap(key, e) {
  e.stopPropagation();
  showConfirm(`حذف سجل ${monthKeyToLabel(key)}؟`, 'حذف', async () => {
    await HISTORY_DB.deleteSnapshot(key);
    toast('تم حذف السجل', 'var(--c-danger)');
    openHistorySheet();
  });
}

function openSnapshotView(snap) {
  _viewSnap = snap;
  closeHistorySheet();
  document.getElementById('yearView').style.display = 'none';
  const view = document.getElementById('historyView');
  view.style.display = 'flex';
  document.getElementById('historyViewTitle').textContent = monthKeyToLabel(snap.key);
  const body = document.getElementById('historyViewBody');
  body.innerHTML = '';

  const miscItems = snap.cats?.misc || [];
  const grandTot  = (snap.cats_order||[]).reduce((a,c)=>a+(snap.cats[c.id]||[]).reduce((s,r)=>s+(+r.amount||0),0),0)
                  + miscItems.reduce((s,r)=>s+(+r.amount||0),0);
  const grandPaid = (snap.cats_order||[]).reduce((a,c)=>a+(snap.cats[c.id]||[]).filter(r=>r.paid).reduce((s,r)=>s+(+r.amount||0),0),0)
                  + miscItems.filter(r=>r.paid).reduce((s,r)=>s+(+r.amount||0),0);
  const bgt       = snap.budget || 0;
  const sal       = snap.salary || 0;
  const remaining = sal > 0 ? sal - grandTot : null;

  // ── Hero (same as main view) ───────────────────────────────────────
  const hero = document.createElement('div');
  hero.className = 'hero-card';
  hero.innerHTML = `
    <div class="hero-divider">
      <div class="hero-col" style="padding-right:0;padding-left:16px;">
        <div class="hero-lbl">الراتب الشهري</div>
        <span class="salary-val" style="cursor:default">
          <span style="font-family:'IBM Plex Mono',monospace;font-size:22px;font-weight:700">${sal>0?f(sal,3):'—'}</span>
          ${sal>0?'<span class="salary-cur">JOD</span>':''}
        </span>
      </div>
      <div class="hero-col" style="padding-right:16px;padding-left:0;">
        <div class="hero-lbl">المتبقي بعد المصاريف</div>
        <div style="display:flex;align-items:baseline;gap:5px;margin-top:2px;">
          <span class="remaining-val ${remaining===null?'zero':remaining<0?'neg':''}" style="cursor:default">
            ${remaining===null?'—':f(Math.abs(remaining),3)}
          </span>
          ${remaining!==null?'<span class="salary-cur">JOD</span>':''}
        </div>
        <span class="hero-sub" style="color:${remaining!==null&&remaining<0?'var(--c-danger)':''}">
          ${remaining!==null&&remaining<0?'تجاوز الراتب':''}
        </span>
      </div>
    </div>`;
  body.appendChild(hero);

  // ── Stats grid ────────────────────────────────────────────────────
  const stats = document.createElement('div');
  stats.className = 'stats-grid';
  const unpaid = grandTot - grandPaid;
  const paidCntAll = (snap.cats_order||[]).reduce((a,c)=>a+(snap.cats[c.id]||[]).filter(r=>r.paid).length,0)
                   + miscItems.filter(r=>r.paid).length;
  stats.innerHTML = `
    <div class="stat-card paid-c">
      <div class="stat-lbl">المدفوع ✓</div>
      <div class="stat-amt"><span>${f(grandPaid,3)}</span><span class="stat-cur">JOD</span></div>
      <div class="stat-sub">${paidCntAll} بند مدفوع</div>
    </div>
    <div class="stat-card combined">
      <div class="stat-lbl">المجموع الكلي</div>
      <div class="stat-amt"><span>${f(grandTot,3)}</span><span class="stat-cur">JOD</span></div>
    </div>
    <div class="stat-card" style="background:var(--bg-card);border:1px solid var(--border)">
      <div class="stat-lbl">غير مدفوع</div>
      <div class="stat-amt" style="color:${unpaid>0?'var(--c-danger)':'var(--c-ok)'}"><span>${f(unpaid,3)}</span><span class="stat-cur">JOD</span></div>
    </div>
    <div class="stat-card" style="background:var(--bg-card);border:1px solid var(--border)">
      <div class="stat-lbl">عدد البنود</div>
      <div class="stat-amt"><span>${(snap.cats_order||[]).reduce((a,c)=>a+(snap.cats[c.id]||[]).length,0)+miscItems.length}</span></div>
    </div>`;
  body.appendChild(stats);

  // ── Budget bar ────────────────────────────────────────────────────
  if (bgt > 0) {
    const bgtPct  = Math.min(grandTot / bgt * 100, 100).toFixed(1);
    const bgtOver = grandTot > bgt;
    const bgtCard = document.createElement('div');
    bgtCard.className = 'budget-card';
    bgtCard.innerHTML = `
      <div class="budget-top">
        <span class="budget-title">الميزانية الشهرية</span>
        <span class="budget-amt" style="color:${bgtOver?'var(--c-danger)':'var(--t-mid)'}">${f(grandTot,3)} / ${f(bgt,3)} JOD</span>
      </div>
      <div class="budget-track"><div class="budget-fill" style="width:${bgtPct}%;background:${bgtOver?'var(--c-danger)':'var(--c-ess)'}"></div></div>
      <div class="budget-sub">${bgtOver?'⚠ تجاوزت الميزانية بـ '+f(grandTot-bgt,3)+' JOD':'متبقي '+f(bgt-grandTot,3)+' JOD'}</div>`;
    body.appendChild(bgtCard);
  }

  // ── Divider ───────────────────────────────────────────────────────
  const panel = document.createElement('div');
  panel.className = 'panel panel-main';
  panel.style.cssText = 'margin:0 12px;';
  panel.innerHTML = `
    <div class="panel-head">
      <div><div class="panel-title">مصاريف ${monthKeyToLabel(snap.key)}</div></div>
      <span class="cur-badge">JOD</span>
    </div>
    <div class="col-head">
      <span class="ch ch-chk"></span>
      <span class="ch ch-name">البند</span>
      <span class="ch ch-amt">المبلغ</span>
    </div>`;
  body.appendChild(panel);

  // ── Categories (same structure, read-only) ─────────────────────────
  const catsWrap = document.createElement('div');
  catsWrap.style.cssText = 'padding: 0 12px 32px; display:flex; flex-direction:column; gap:10px;';

  const renderSnapCat = (label, colorStyle, dimStyle, items, catBudget) => {
    if (!items.length) return;
    const total   = items.reduce((a,r)=>a+(+r.amount||0),0);
    const paidCnt = items.filter(r=>r.paid).length;
    const sec     = document.createElement('div');
    sec.className = 'cat-section';
    const catBgtPct = (catBudget||0)>0 ? Math.min(total/catBudget*100,100).toFixed(1) : 0;
    sec.innerHTML = `
      <div class="cat-head" style="--cat-color:${colorStyle};--cat-dim:${dimStyle}">
        <div class="cat-head-left">
          <div class="cat-title-row"><span class="cat-name">${esc(label)}</span></div>
          <span class="cat-count">${paidCnt}/${items.length} مدفوع · ${fJOD(total)}</span>
          ${(catBudget||0)>0?`<div class="cat-budget-row">
            <div class="cat-budget-track"><div class="cat-budget-fill" style="width:${catBgtPct}%"></div></div>
            <span class="cat-budget-lbl">${f(total,3)} / ${f(catBudget,3)} JOD</span>
          </div>`:''}
        </div>
      </div>
      <div class="cat-rows-wrap" style="pointer-events:none"><div class="snap-rows-inner"></div></div>`;
    const rowsEl = sec.querySelector('.snap-rows-inner');
    items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'e-row' + (item.paid?' paid':'');
      row.innerHTML = `
        <div class="check-wrap${item.paid?' chk':''}">
          <svg class="check-icon" viewBox="0 0 12 12" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><polyline points="1.5 6 4.5 9 10.5 3"/></svg>
        </div>
        <div class="row-content">
          <span class="row-name">${esc(item.name)}</span>
          ${item.recurring?'<span class="row-rec-ico">↺</span>':''}
          <span class="row-amt">${fJOD(+item.amount||0)}</span>
        </div>`;
      rowsEl.appendChild(row);
    });
    catsWrap.appendChild(sec);
  };

  (snap.cats_order||[]).forEach(cat => {
    const pal = CAT_COLORS[cat.colorIdx % CAT_COLORS.length] || CAT_COLORS[0];
    renderSnapCat(snap.labels?.[cat.id]||cat.name, pal.color, pal.dim, snap.cats[cat.id]||[], cat.budget);
  });
  renderSnapCat(snap.labels?.misc||'متفرقات', '#F2B040', '#F2B04022', miscItems, 0);
  body.appendChild(catsWrap);
}

function closeSnapshotView() {
  document.getElementById('historyView').style.display = 'none';
  _viewSnap = null;
  if (_snapOrigin === 'year') {
    document.getElementById('yearView').style.display = 'flex';
  } else {
    openHistorySheet();
  }
}

/* ════════════════════════════════════════
   Yearly Analysis
   ════════════════════════════════════════ */
let _yaYear = null;
let _yaYears = [];

async function openYearAnalysis() {
  const snapshots = await HISTORY_DB.listSnapshots();
  const years = new Set(snapshots.map(s => s.key.slice(0,4)));
  if (S.month_key) years.add(S.month_key.slice(0,4));
  _yaYears = [...years].sort();
  if (!_yaYears.length) { toast('لا توجد بيانات كافية بعد', 'var(--c-danger)'); return; }
  _yaYear = S.month_key ? S.month_key.slice(0,4) : _yaYears[_yaYears.length-1];
  document.getElementById('yearView').style.display = 'flex';
  await renderYearAnalysis();
}

function closeYearAnalysis() {
  document.getElementById('yearView').style.display = 'none';
}

function yaChangeYear(dir) {
  const idx = _yaYears.indexOf(_yaYear) + dir;
  if (idx < 0 || idx >= _yaYears.length) return;
  _yaYear = _yaYears[idx];
  renderYearAnalysis();
}

function yaSelectYear(y) {
  _yaYear = y;
  renderYearAnalysis();
}

function _yaOpenMonth(key, data) {
  _snapOrigin = 'year';
  openSnapshotView({ ...data, key });
}

async function _yaGetMonthData(key) {
  if (key === S.month_key) return S;
  return await HISTORY_DB.loadSnapshot(key);
}

function _yaTotals(data) {
  if (!data) return null;
  let total = 0, paid = 0;
  (data.cats_order||[]).forEach(cat => (data.cats[cat.id]||[]).forEach(r => {
    total += (+r.amount||0); if (r.paid) paid += (+r.amount||0);
  }));
  (data.cats?.misc||[]).forEach(r => { total += (+r.amount||0); if (r.paid) paid += (+r.amount||0); });
  const salary = +data.salary || 0;
  const budget = +data.budget || 0;
  const saved  = salary > 0 ? salary - total : null;
  return { total, paid, salary, budget, saved };
}

async function renderYearAnalysis() {
  const idx = _yaYears.indexOf(_yaYear);
  document.getElementById('yaPrevBtn').disabled = idx <= 0;
  document.getElementById('yaNextBtn').disabled = idx >= _yaYears.length-1;
  const sel = document.getElementById('yaYearSelect');
  sel.innerHTML = _yaYears.slice().reverse().map(y => `<option value="${y}"${y===_yaYear?' selected':''}>${y}</option>`).join('');

  const months = [];
  for (let m = 1; m <= 12; m++) {
    const key = `${_yaYear}-${String(m).padStart(2,'0')}`;
    const data = await _yaGetMonthData(key);
    months.push({ key, m, data, tot: _yaTotals(data) });
  }
  const withData = months.filter(x => x.tot);
  const body = document.getElementById('yaBody');
  body.innerHTML = '';

  if (!withData.length) {
    body.innerHTML = '<div class="ya-empty">لا توجد بيانات لهذه السنة</div>';
    return;
  }

  const yearTotal = withData.reduce((a,x)=>a+x.tot.total,0);
  const yearPaid  = withData.reduce((a,x)=>a+x.tot.paid,0);
  const yearUnpaid = yearTotal - yearPaid;
  const avg = yearTotal / withData.length;
  const top = withData.reduce((a,x)=> x.tot.total > a.tot.total ? x : a, withData[0]);
  const low = withData.reduce((a,x)=> x.tot.total < a.tot.total ? x : a, withData[0]);

  const secTitle = (t) => { const h = document.createElement('div'); h.style.cssText='margin:14px 16px 2px;font-size:13px;font-weight:700;color:var(--t-mid)'; h.textContent = t; return h; };

  body.appendChild(secTitle('نظرة عامة'));
  const stats = document.createElement('div');
  stats.className = 'stats-grid';
  stats.innerHTML = `
    <div class="stat-card combined">
      <div class="stat-lbl">إجمالي السنة</div>
      <div class="stat-amt"><span>${f(yearTotal,3)}</span><span class="stat-cur">JOD</span></div>
    </div>
    <div class="stat-card paid-c">
      <div class="stat-lbl">المدفوع ✓</div>
      <div class="stat-amt"><span>${f(yearPaid,3)}</span><span class="stat-cur">JOD</span></div>
    </div>
    <div class="stat-card" style="background:var(--bg-card);border:1px solid var(--border)">
      <div class="stat-lbl">غير مدفوع</div>
      <div class="stat-amt" style="color:${yearUnpaid>0?'var(--c-danger)':'var(--c-day)'}"><span>${f(yearUnpaid,3)}</span><span class="stat-cur">JOD</span></div>
    </div>
    <div class="stat-card" style="background:var(--bg-card);border:1px solid var(--border)">
      <div class="stat-lbl">متوسط الشهر</div>
      <div class="stat-amt"><span>${f(avg,3)}</span><span class="stat-cur">JOD</span></div>
    </div>
    <div class="stat-card" style="background:var(--bg-card);border:1px solid var(--border)">
      <div class="stat-lbl">أعلى شهر</div>
      <div class="stat-amt" style="font-size:13px">${MONTHS_AR[top.m-1]}</div>
      <div class="stat-sub">${f(top.tot.total,3)} JOD</div>
    </div>
    <div class="stat-card" style="background:var(--bg-card);border:1px solid var(--border)">
      <div class="stat-lbl">أقل شهر</div>
      <div class="stat-amt" style="font-size:13px">${MONTHS_AR[low.m-1]}</div>
      <div class="stat-sub">${f(low.tot.total,3)} JOD</div>
    </div>`;
  body.appendChild(stats);

  // ── Savings ───────────────────────────────────────────────────────
  const withIncome = withData.filter(x => x.tot.saved !== null);
  if (withIncome.length) {
    const yearIncome = withIncome.reduce((a,x)=>a+x.tot.salary,0);
    const yearSaved  = withIncome.reduce((a,x)=>a+x.tot.saved,0);
    const savingsRate = yearIncome > 0 ? (yearSaved/yearIncome*100) : 0;
    const bestSave = withIncome.reduce((a,x)=> x.tot.saved > a.tot.saved ? x : a, withIncome[0]);

    body.appendChild(secTitle('التوفير'));
    const savStats = document.createElement('div');
    savStats.className = 'stats-grid';
    savStats.innerHTML = `
      <div class="stat-card" style="background:var(--bg-card);border:1px solid var(--border)">
        <div class="stat-lbl">إجمالي الدخل</div>
        <div class="stat-amt"><span>${f(yearIncome,3)}</span><span class="stat-cur">JOD</span></div>
      </div>
      <div class="stat-card" style="background:var(--bg-card);border:1px solid var(--border)">
        <div class="stat-lbl">إجمالي التوفير</div>
        <div class="stat-amt" style="color:${yearSaved>=0?'var(--c-day)':'var(--c-danger)'}"><span>${f(Math.abs(yearSaved),3)}</span><span class="stat-cur">JOD</span></div>
      </div>
      <div class="stat-card" style="background:var(--bg-card);border:1px solid var(--border)">
        <div class="stat-lbl">نسبة التوفير</div>
        <div class="stat-amt" style="color:${savingsRate>=0?'var(--c-day)':'var(--c-danger)'}">${savingsRate.toFixed(1)}%</div>
      </div>
      <div class="stat-card" style="background:var(--bg-card);border:1px solid var(--border)">
        <div class="stat-lbl">أفضل شهر توفير</div>
        <div class="stat-amt" style="font-size:13px">${MONTHS_AR[bestSave.m-1]}</div>
        <div class="stat-sub">${f(bestSave.tot.saved,3)} JOD</div>
      </div>`;
    body.appendChild(savStats);

    const maxAbsSaved = Math.max(...withIncome.map(x=>Math.abs(x.tot.saved)), 1);
    const savPanel = document.createElement('div');
    savPanel.className = 'panel panel-main';
    savPanel.style.cssText = 'margin:12px 12px 0;';
    savPanel.innerHTML = '<div class="panel-head"><div class="panel-title">التوفير الشهري</div></div>';
    const savWrap = document.createElement('div');
    savWrap.style.cssText = 'padding:4px 14px 14px;';
    withIncome.forEach(x => {
      const pos = x.tot.saved >= 0;
      const color = pos ? 'var(--c-day)' : 'var(--c-danger)';
      const row = document.createElement('div');
      row.className = 'ya-cat-row';
      row.style.cursor = 'pointer';
      row.innerHTML = `
        <span class="ya-cat-dot" style="background:${color}"></span>
        <span class="ya-cat-name">${MONTHS_AR[x.m-1]}</span>
        <div class="ya-cat-track"><div class="ya-cat-fill" style="width:${(Math.abs(x.tot.saved)/maxAbsSaved*100).toFixed(1)}%;background:${color}"></div></div>
        <span class="ya-cat-amt" style="color:${color}">${pos?'+':'-'}${f(Math.abs(x.tot.saved),3)} JOD</span>`;
      row.addEventListener('click', () => _yaOpenMonth(x.key, x.data));
      savWrap.appendChild(row);
    });
    savPanel.appendChild(savWrap);
    body.appendChild(savPanel);
  }


  const maxTot = Math.max(...withData.map(x=>x.tot.total), 1);
  const chart = document.createElement('div');
  chart.className = 'ya-chart';
  months.forEach(x => {
    const h = x.tot ? Math.max((x.tot.total / maxTot) * 100, x.tot.total>0?4:0) : 100;
    const isCur = x.key === S.month_key;
    const col = document.createElement('div');
    col.className = 'ya-bar-col';
    col.innerHTML = `
      <div class="ya-bar${x.tot?(isCur?' cur':''):' empty'}" style="height:${h}%" title="${MONTHS_AR[x.m-1]}: ${x.tot?f(x.tot.total,3)+' JOD':'لا يوجد بيانات'}"></div>
      <span class="ya-bar-lbl">${x.m}</span>`;
    if (x.tot) { col.style.cursor = 'pointer'; col.addEventListener('click', () => _yaOpenMonth(x.key, x.data)); }
    chart.appendChild(col);
  });
  const chartPanel = document.createElement('div');
  chartPanel.className = 'panel panel-main';
  chartPanel.style.cssText = 'margin:14px 12px 0;';
  chartPanel.innerHTML = '<div class="panel-head"><div class="panel-title">المصروف الشهري</div></div>';
  chartPanel.appendChild(chart);
  body.appendChild(chartPanel);

  const listPanel = document.createElement('div');
  listPanel.className = 'panel panel-main';
  listPanel.style.cssText = 'margin:12px 12px 0;';
  listPanel.innerHTML = '<div class="panel-head"><div class="panel-title">تفاصيل الشهور</div></div>';
  const listWrap = document.createElement('div');
  listWrap.style.cssText = 'padding:4px 10px 10px;';
  withData.forEach(x => {
    const isCur = x.key === S.month_key;
    const itemCnt = (x.data.cats_order||[]).reduce((a,c)=>a+(x.data.cats[c.id]||[]).length,0) + (x.data.cats?.misc||[]).length;
    const row = document.createElement('div');
    row.className = 'history-month-item';
    row.innerHTML = `
      <div class="history-month-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </div>
      <div class="history-month-info">
        <div class="history-month-name">${MONTHS_AR[x.m-1]}${isCur?' · الحالي':''}</div>
        <div class="history-month-meta">${itemCnt} بند · ${f(x.tot.paid,3)} JOD مدفوع${x.tot.saved!==null?` · ${x.tot.saved>=0?'وفرت':'تجاوزت'} ${f(Math.abs(x.tot.saved),3)} JOD`:''}</div>
      </div>
      <div class="history-month-total">${f(x.tot.total,3)}</div>`;
    row.addEventListener('click', () => _yaOpenMonth(x.key, x.data));
    listWrap.appendChild(row);
  });
  listPanel.appendChild(listWrap);
  body.appendChild(listPanel);

  const catTotals = {}, catColor = {}, topItems = [];
  withData.forEach(x => {
    const d = x.data;
    (d.cats_order||[]).forEach(cat => {
      const label = d.labels?.[cat.id] || cat.name;
      const color = (CAT_COLORS[cat.colorIdx % CAT_COLORS.length] || CAT_COLORS[0]).color;
      const items = d.cats[cat.id]||[];
      const amt = items.reduce((s,r)=>s+(+r.amount||0),0);
      if (amt > 0) {
        catTotals[label] = (catTotals[label]||0) + amt;
        if (!catColor[label]) catColor[label] = color;
      }
      items.forEach(r => { if ((+r.amount||0) > 0) topItems.push({ name:r.name, amount:+r.amount, cat:label, color, key:x.key, m:x.m, data:x.data }); });
    });
    const miscItems = d.cats?.misc||[];
    const miscAmt = miscItems.reduce((s,r)=>s+(+r.amount||0),0);
    if (miscAmt > 0) {
      const label = d.labels?.misc || 'متفرقات';
      catTotals[label] = (catTotals[label]||0) + miscAmt;
      if (!catColor[label]) catColor[label] = '#F2B040';
    }
    miscItems.forEach(r => { if ((+r.amount||0) > 0) topItems.push({ name:r.name, amount:+r.amount, cat:d.labels?.misc||'متفرقات', color:'#F2B040', key:x.key, m:x.m, data:x.data }); });
  });
  const catEntries = Object.entries(catTotals).sort((a,b)=>b[1]-a[1]);
  if (catEntries.length) {
    body.appendChild(secTitle('توزيع الفئات خلال السنة'));
    const catPanel = document.createElement('div');
    catPanel.className = 'panel panel-main';
    catPanel.style.cssText = 'margin:0 12px;';
    const wrap = document.createElement('div');
    wrap.style.cssText = 'padding:4px 14px 14px;';
    const catMax = catEntries[0][1] || 1;
    catEntries.forEach(([label, amt]) => {
      const row = document.createElement('div');
      row.className = 'ya-cat-row';
      row.innerHTML = `
        <span class="ya-cat-dot" style="background:${catColor[label]||'#888'}"></span>
        <span class="ya-cat-name">${esc(label)}</span>
        <div class="ya-cat-track"><div class="ya-cat-fill" style="width:${(amt/catMax*100).toFixed(1)}%;background:${catColor[label]||'#888'}"></div></div>
        <span class="ya-cat-amt">${f(amt,3)} JOD <span style="opacity:.55">${(amt/yearTotal*100).toFixed(0)}%</span></span>`;
      wrap.appendChild(row);
    });
    catPanel.appendChild(wrap);
    body.appendChild(catPanel);
  }

  topItems.sort((a,b)=>b.amount-a.amount);
  if (topItems.length) {
    body.appendChild(secTitle('أكبر المصاريف'));
    const topPanel = document.createElement('div');
    topPanel.className = 'panel panel-main';
    topPanel.style.cssText = 'margin:0 12px 32px;';
    const topWrap = document.createElement('div');
    topWrap.style.cssText = 'padding:2px 14px 8px;';
    topItems.slice(0,10).forEach((it,i) => {
      const row = document.createElement('div');
      row.className = 'ya-top-row';
      row.innerHTML = `
        <span class="ya-top-rank">${i+1}</span>
        <span class="ya-top-dot" style="background:${it.color}"></span>
        <div class="ya-top-info">
          <div class="ya-top-name">${esc(it.name)}</div>
          <div class="ya-top-meta">${esc(it.cat)} · ${MONTHS_AR[it.m-1]}</div>
        </div>
        <span class="ya-top-amt">${f(it.amount,3)} JOD</span>`;
      row.addEventListener('click', () => _yaOpenMonth(it.key, it.data));
      topWrap.appendChild(row);
    });
    topPanel.appendChild(topWrap);
    body.appendChild(topPanel);
  }
}

async function rolloverMonth(curKey, newKey) {
  // Save current month snapshot
  const snap = {};
  Object.keys(S).forEach(k => { if (k!=='id') snap[k]=S[k]; });
  await HISTORY_DB.saveSnapshot(curKey, snap);

  // Build new state: keep categories, only recurring items
  const newCats = { misc: [] };
  const newCatsOrder = (S.cats_order||[]).map(cat=>({...cat}));
  newCatsOrder.forEach(cat => {
    newCats[cat.id] = (S.cats[cat.id]||[])
      .filter(it=>it.recurring)
      .map(it=>({...it, id:_id(), paid:false}));
  });
  newCats.misc = (S.cats.misc||[])
    .filter(it=>it.recurring)
    .map(it=>({...it, id:_id(), paid:false}));

  S = {
    budget: S.budget,
    salary: S.salary,
    onboarded: true,
    month_key: newKey,
    cats_order: newCatsOrder,
    cats: newCats,
    labels: {...(S.labels||{})},
  };
  await DB.save(S);
}

function nextMonthKey(curKey) {
  const [y, m] = curKey.split('-').map(Number);
  const nm = m===12?1:m+1, ny = m===12?y+1:y;
  return `${ny}-${String(nm).padStart(2,'0')}`;
}

async function checkMonthRollover() {
  if (activeEdit) return; // don't yank the state out from under an in-progress edit
  const nowKey = currentMonthKey();
  if (S.month_key && S.month_key !== nowKey) {
    const endedLabel = monthKeyToLabel(S.month_key);
    await rolloverMonth(S.month_key, nowKey);
    updateMonthLabel();
    render();
    toast(`✓ تم حفظ ${endedLabel} وبدء ${monthKeyToLabel(nowKey)}`, 'var(--c-day-bd)');
  }
}

// ponytail: one-time dev fixture, not a real feature — delete this + its boot() call once test data isn't needed
async function _devSeedYearsIfEmpty() {
  if (localStorage.getItem('flowance_dev_seeded')) return; // ran once already, skip

  const item = (name, min, max, paidChance, recurring) => ({
    id: _id(), name,
    amount: +(min + Math.random() * (max - min)).toFixed(3),
    paid: Math.random() < paidChance,
    ...(recurring ? { recurring: true } : {})
  });
  const catsOrder = () => [
    { id: 'housing',   name: 'سكن',                dec: 3, colorIdx: 0, budget: 400 },
    { id: 'transport', name: 'مواصلات',            dec: 3, colorIdx: 1, budget: 150 },
    { id: 'food',      name: 'أكل',                dec: 3, colorIdx: 2, budget: 250 },
    { id: 'shopping',  name: 'تسوق',               dec: 3, colorIdx: 3, budget: 120 },
    { id: 'bills',     name: 'فواتير واشتراكات',   dec: 3, colorIdx: 4, budget: 80  },
  ];
  const monthData = (paidBias) => ({
    cats_order: catsOrder(),
    cats: {
      housing:   [ item('إيجار الشقة', 280, 320, paidBias, true), item('كهرباء', 25, 45, paidBias), item('ماء', 8, 15, paidBias), item('انترنت', 20, 25, paidBias, true) ],
      transport: [ item('بنزين', 40, 70, paidBias), item('صيانة سيارة', 0, 60, paidBias*0.5), item('تأمين', 25, 25, paidBias) ],
      food:      [ item('سوبرماركت', 90, 140, paidBias), item('مطاعم', 30, 90, paidBias), item('توصيل طلبات', 10, 40, paidBias) ],
      shopping:  [ item('ملابس', 0, 80, paidBias*0.5), item('إلكترونيات', 0, 100, paidBias*0.3) ],
      bills:     [ item('جوال', 15, 15, paidBias, true), item('نتفلكس', 6, 6, paidBias, true), item('جيم', 25, 25, paidBias) ],
      misc:      [ item('صيدلية', 0, 30, paidBias*0.7), item('هدايا', 0, 50, paidBias*0.5) ],
    },
    labels: {},
    budget: 900,
    salary: Math.round(1100 + (Math.random()*100 - 50)),
    onboarded: true,
  });

  const curKey = S.month_key || currentMonthKey();
  const now = new Date();
  for (let i = 26; i >= 1; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    if (key === curKey) continue;
    await HISTORY_DB.saveSnapshot(key, monthData(0.9));
  }

  const cur = monthData(0.4);
  S.cats_order = cur.cats_order;
  S.cats = cur.cats;
  S.labels = {};
  S.budget = cur.budget;
  S.salary = cur.salary;
  S.onboarded = true;
  await DB.save(S);
  localStorage.setItem('flowance_dev_seeded', '1');
  toast('✓ تمت إضافة بيانات تجريبية لأكثر من سنتين', 'var(--c-day-bd)');
}

async function startNewMonth() {
  const curKey = S.month_key || currentMonthKey();
  const recurCount = Object.values(S.cats).reduce((a,arr)=>a+arr.filter(r=>r.recurring).length,0);
  showConfirm(
    `حفظ ${monthKeyToLabel(curKey)} وبدء شهر جديد؟\n${recurCount>0?recurCount+' بند متكرر سيُنقل تلقائياً.':''}`,
    'شهر جديد',
    async () => {
      const newKey = nextMonthKey(curKey);
      await rolloverMonth(curKey, newKey);
      closeHistorySheet();
      updateMonthLabel();
      render();
      const carried = Object.values(S.cats).reduce((a,arr)=>a+arr.length,0);
      toast(`✓ شهر ${monthKeyToLabel(newKey)} — ${carried} بند متكرر`, 'var(--c-day-bd)');
    }
  );
}

/* ════════════════════════════════════════
   Budget per Category
   ════════════════════════════════════════ */
function editCatBudget(catId) {
  const cat = (S.cats_order||[]).find(c=>c.id===catId);
  if (!cat) return;
  const lbl = document.getElementById('catbudgetlbl-'+catId);
  if (!lbl || lbl.querySelector('input')) return;

  const inp = document.createElement('input');
  inp.type = 'text'; inp.inputMode = 'decimal';
  inp.value = (cat.budget||0) > 0 ? cat.budget : '';
  inp.placeholder = '0 = بدون حد';
  inp.className = 'i-input num';
  inp.style.cssText = 'width:100px;font-size:12px;padding:3px 8px;height:22px;';
  inp.dir = 'ltr';
  applyArabicNums(inp);

  const origHtml = lbl.innerHTML;
  lbl.textContent = '';
  lbl.appendChild(inp);
  inp.focus(); inp.select();

  const commit = () => {
    const v = parseFloat(toWestern(inp.value));
    cat.budget = (!isNaN(v) && v > 0) ? v : 0;
    DB.save(S);
    lbl.innerHTML = origHtml;
    recalc();
    const row = document.getElementById('catbudget-'+catId);
    if (row) row.style.display = cat.budget>0?'':'none';
  };
  inp.addEventListener('blur', commit);
  inp.addEventListener('keydown', e => {
    if (e.key==='Enter') { e.preventDefault(); inp.blur(); }
    if (e.key==='Escape') { e.preventDefault(); lbl.innerHTML = origHtml; }
  });
}

/* ════════════════════════════════════════
   Recurring Items
   ════════════════════════════════════════ */
function toggleRecurring(itemId, catId) {
  const item = (S.cats[catId]||[]).find(r=>r.id===itemId);
  if (!item) return;
  item.recurring = !item.recurring;
  DB.save(S);
  const row = document.querySelector(`[data-id="${itemId}"]`);
  if (row) {
    const btn = row.querySelector('.recurring-btn');
    if (btn) { btn.classList.toggle('on', item.recurring); btn.title = item.recurring?'إيقاف التكرار الشهري':'تكرار شهري'; }
    row.classList.toggle('recurring', item.recurring);
  }
  const lvRow = document.getElementById('lv-item-' + itemId);
  if (lvRow) {
    lvRow.classList.toggle('recurring', item.recurring);
    const lvBtn = lvRow.querySelector('.lv-item-rec');
    if (lvBtn) { lvBtn.classList.toggle('on', item.recurring); lvBtn.title = item.recurring ? 'إيقاف التكرار الشهري' : 'تكرار شهري'; }
  }
  toast(item.recurring?'↺ سيتكرر الشهر القادم تلقائياً':'تم إيقاف التكرار', item.recurring?'var(--c-ess-bd)':'');
}

/* ════════════════════════════════════════
   Search
   ════════════════════════════════════════ */
function openSearch() {
  document.getElementById('searchOverlay').style.display = 'flex';
  const inp = document.getElementById('searchInput');
  inp.value = '';
  document.getElementById('searchResults').innerHTML = '<div class="search-empty">ابدأ الكتابة للبحث في مصاريفك</div>';
  setTimeout(()=>inp.focus(),80);
}

function closeSearch() {
  document.getElementById('searchOverlay').style.display = 'none';
}

function onSearchInput(val) {
  const q = val.trim();
  const resultsEl = document.getElementById('searchResults');
  if (!q) { resultsEl.innerHTML='<div class="search-empty">ابدأ الكتابة للبحث في مصاريفك</div>'; return; }

  const hl = (text, q) => {
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx===-1) return esc(text);
    return esc(text.slice(0,idx))+'<mark>'+esc(text.slice(idx,idx+q.length))+'</mark>'+esc(text.slice(idx+q.length));
  };

  const groups = [];
  const allCatIds = [...(S.cats_order||[]).map(c=>c.id),'misc'];
  allCatIds.forEach(catId => {
    const cat   = catId==='misc'?null:(S.cats_order||[]).find(c=>c.id===catId);
    const label = catId==='misc'?'متفرقات':(S.labels?.[catId]||cat?.name||'');
    const color = catId==='misc'?'#F2B040':(CAT_COLORS[(cat?.colorIdx||0)%CAT_COLORS.length]?.color||'#888');
    const dec   = catId==='misc'?2:3;
    const cur   = catId==='misc'?'USD':'JOD';
    const hits  = (S.cats[catId]||[]).filter(item=>item.name.toLowerCase().includes(q.toLowerCase()));
    if (hits.length) groups.push({label, color, catId, hits, dec, cur});
  });

  if (!groups.length) { resultsEl.innerHTML=`<div class="search-empty">لا نتائج لـ "<strong>${esc(q)}</strong>"</div>`; return; }

  resultsEl.innerHTML = groups.map(g=>`
    <div class="search-cat-label" style="color:${g.color}">${esc(g.label)}</div>
    ${g.hits.map(item=>`
    <div class="search-hit" onclick="jumpToItem('${item.id}','${g.catId}')">
      <div class="search-hit-dot" style="background:${g.color}"></div>
      <div class="search-hit-body">
        <div class="search-hit-name">${hl(item.name,q)}</div>
        <div class="search-hit-cat">${esc(g.label)}${item.recurring?' · ↺':''}</div>
      </div>
      <div class="search-hit-amt">${f(item.amount,g.dec)} ${g.cur}</div>
    </div>`).join('')}
  `).join('');
}

function jumpToItem(itemId, catId) {
  closeSearch();
  if (catId==='misc') { filterGroup('misc'); }
  else {
    filterGroup(catId);
    const sec = document.getElementById('sec-'+catId);
    if (sec?.classList.contains('collapsed')) sec.classList.remove('collapsed');
  }
  setTimeout(()=>{
    const row = document.querySelector(`[data-id="${itemId}"]`);
    if (row) {
      row.scrollIntoView({behavior:'smooth',block:'center'});
      row.classList.add('paid-anim');
      setTimeout(()=>row.classList.remove('paid-anim'),600);
    }
  },180);
}

/* ════════════════════════════════════════
   Export Menu
   ════════════════════════════════════════ */
function toggleExportMenu() {
  const menu = document.getElementById('exportMenu');
  if (menu) menu.style.display = menu.style.display==='none'?'block':'none';
}
function closeExportMenu() {
  const menu = document.getElementById('exportMenu');
  if (menu) menu.style.display = 'none';
}
document.addEventListener('click', e => {
  const btn  = document.getElementById('exportBtn');
  const menu = document.getElementById('exportMenu');
  if (menu && btn && !btn.contains(e.target) && !menu.contains(e.target)) menu.style.display = 'none';
});

function exportPDF() {
  const key = S.month_key || currentMonthKey();
  const monthName = monthKeyToLabel(key);
  const grand = grandTotal(), paid = grandPaid(), bgt = S.budget||0;
  let rows = '';
  (S.cats_order||[]).forEach(cat => {
    const label = S.labels?.[cat.id]||cat.name;
    const items = S.cats[cat.id]||[];
    if (!items.length) return;
    rows += `<tr class="cat-hdr"><td colspan="3">${label}</td><td>${f(sub(cat.id),3)} JOD</td></tr>`;
    items.forEach(it=>{
      rows += `<tr class="${it.paid?'paid':''}"><td style="color:${it.paid?'#17A880':'#bbb'}">${it.paid?'✓':'○'}</td><td>${it.name}${it.recurring?' <span style="color:#4F8EF7;font-size:10px">↺</span>':''}</td><td></td><td>${f(+it.amount||0,3)} JOD</td></tr>`;
    });
  });
  const html=`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>Flowance — ${monthName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
  <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Cairo',sans-serif;color:#111;background:#fff;padding:28px;font-size:13px}
  h1{font-size:20px;font-weight:800;margin-bottom:3px}
  .sub{color:#888;font-size:12px;margin-bottom:20px}
  .summary{display:flex;gap:14px;margin-bottom:22px}
  .sum-box{border:1px solid #e0e0e0;border-radius:8px;padding:12px 16px;flex:1}
  .sum-label{font-size:9px;text-transform:uppercase;letter-spacing:.07em;color:#999;margin-bottom:4px}
  .sum-val{font-size:16px;font-weight:800}
  table{width:100%;border-collapse:collapse}
  th{background:#f5f5f5;font-size:9px;letter-spacing:.06em;text-transform:uppercase;color:#666;padding:8px 10px;text-align:right;border-bottom:2px solid #e0e0e0}
  td{padding:8px 10px;border-bottom:1px solid #f0f0f0;text-align:right}
  tr.cat-hdr td{background:#f8f8ff;font-weight:700;font-size:12px}
  tr.paid td{color:#17A880}
  @media print{body{padding:0}}</style>
  </head><body>
  <h1>Flowance — تقرير مالي</h1><div class="sub">${monthName}</div>
  <div class="summary">
    <div class="sum-box"><div class="sum-label">الإجمالي</div><div class="sum-val">${f(grand,3)} JOD</div></div>
    <div class="sum-box"><div class="sum-label">المدفوع</div><div class="sum-val" style="color:#17A880">${f(paid,3)} JOD</div></div>
    ${bgt>0?`<div class="sum-box"><div class="sum-label">الميزانية</div><div class="sum-val" style="${grand>bgt?'color:#E84040':''}">${f(bgt,3)} JOD</div></div>`:''}
  </div>
  <table><thead><tr><th width="28"></th><th>البند</th><th width="22"></th><th width="130">المبلغ</th></tr></thead>
  <tbody>${rows}</tbody></table>
  <script>window.onload=()=>{window.print()}<\/script>
  </body></html>`;
  const win = window.open('','_blank');
  if (win) { win.document.write(html); win.document.close(); }
}

/* ════════════════════════════════════════
   Boot
   ════════════════════════════════════════ */
async function boot() {
  initTheme();
  initMonth();

  await DB.open();
  await HISTORY_DB.open();
  const saved = await DB.load();

  if (saved) {
    S = saved;
    delete S.id;
    if (S.salary === undefined) S.salary = 0;
    if (!S.labels) S.labels = {};
    if (!S.cats_order) S.cats_order = [];
    if (!S.cats) S.cats = { misc: [] };
    if (!S.cats.misc) S.cats.misc = [];
    if (!S.month_key) S.month_key = currentMonthKey();
    Object.keys(S.cats).forEach(catId => {
      S.cats[catId].forEach(item => { if (item.paid === undefined) item.paid = false; });
    });
  } else {
    S = JSON.parse(JSON.stringify(SEED));
    S.month_key = currentMonthKey();
    await DB.save(S);
  }

  await checkMonthRollover();
  await _devSeedYearsIfEmpty();

  document.getElementById('budgetLbl').textContent = fJOD(S.budget ?? 0);
  updateMonthLabel();
  render();

  setInterval(checkMonthRollover, 5 * 60 * 1000); // catches rollover if tab stays open across midnight

  const ls = document.getElementById('loadScreen');
  ls.classList.add('hide');
  setTimeout(() => {
    ls.remove();
    if (!S.onboarded) showOnboarding();
  }, 400);
}

/* ════════════════════════════════════════
   Onboarding
   ════════════════════════════════════════ */
let _obCur = 0;
const _obTotal = 4;

function showOnboarding() {
  const ob = document.getElementById('onboarding');
  ob.style.display = 'flex';
  requestAnimationFrame(() => ob.style.opacity = '1');
}

function obNext() {
  const slides = document.querySelectorAll('.ob-slide');
  const dots   = document.querySelectorAll('.ob-dot');
  const prev   = _obCur;
  _obCur++;
  if (_obCur >= _obTotal) { finishOnboarding(); return; }
  slides[prev].classList.remove('ob-active');
  slides[prev].classList.add('ob-out');
  setTimeout(() => slides[prev].classList.remove('ob-out'), 400);
  slides[_obCur].classList.add('ob-active');
  dots.forEach((d, i) => d.classList.toggle('active', i === _obCur));
  document.getElementById('obNextBtn').textContent = _obCur === _obTotal - 1 ? 'ابدأ الآن 🚀' : 'التالي';
  document.getElementById('obSkip').style.visibility = _obCur === _obTotal - 1 ? 'hidden' : 'visible';
}

function finishOnboarding() {
  S.onboarded = true; DB.save(S);
  const ob = document.getElementById('onboarding');
  ob.classList.add('ob-exit');
  setTimeout(() => ob.remove(), 420);
}

boot();