import { getDayInfo, MIN_YEAR, MAX_YEAR } from './lunar.js';

const WEEK = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
const $ = (id) => document.getElementById(id);

const now = new Date();
let today = { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() };
let view = { y: today.y, m: today.m };
let selected = { ...today };

const same = (a, b) => a.y === b.y && a.m === b.m && a.d === b.d;
const daysInMonth = (y, m) => new Date(y, m, 0).getDate();

function cellLabel(info) {
  if (info.festivals.length) return { text: info.festivals[0], cls: 'fest' };
  if (info.term) return { text: info.term, cls: 'term' };
  if (!info.lunar) return { text: '', cls: '' };
  if (info.lunar.day === 1) return { text: info.lunar.monthName, cls: 'first' };
  return { text: info.lunar.dayName, cls: '' };
}

function renderDetail() {
  const { y, m, d } = selected;
  const info = getDayInfo(y, m, d);
  $('d-day').textContent = d;
  $('d-ym').textContent = `${y}年${m}月`;
  $('d-week').textContent = WEEK[new Date(y, m - 1, d).getDay()];
  if (info.lunar) {
    const l = info.lunar;
    $('d-lunar').textContent = `农历${l.monthName}${l.dayName}`;
    $('d-gz').textContent = `${l.yearGanZhi}年（${l.animal}年） ${l.dayGanZhi}日`;
  } else {
    $('d-lunar').textContent = '超出农历支持范围';
    $('d-gz').textContent = '';
  }
  const tags = $('d-tags');
  tags.replaceChildren();
  for (const t of [...info.festivals, ...(info.term ? [info.term] : [])]) {
    const span = document.createElement('span');
    span.className = 'tag';
    span.textContent = t;
    tags.append(span);
  }
}

function renderGrid() {
  const { y, m } = view;
  $('title').textContent = `${y}年${m}月`;
  const grid = $('grid');
  grid.replaceChildren();

  // 周一为一周首日
  const lead = (new Date(y, m - 1, 1).getDay() + 6) % 7;
  const total = Math.ceil((lead + daysInMonth(y, m)) / 7) * 7;

  for (let i = 0; i < total; i++) {
    const date = new Date(y, m - 1, 1 - lead + i);
    const cell = { y: date.getFullYear(), m: date.getMonth() + 1, d: date.getDate() };
    const info = getDayInfo(cell.y, cell.m, cell.d);
    const label = cellLabel(info);

    const btn = document.createElement('button');
    btn.className = 'cell';
    if (cell.m !== m) btn.classList.add('other');
    if (i % 7 >= 5) btn.classList.add('we');
    if (same(cell, today)) btn.classList.add('today');
    if (same(cell, selected)) btn.classList.add('selected');
    btn.setAttribute('aria-label', `${cell.m}月${cell.d}日 ${info.lunar ? '农历' + info.lunar.monthName + info.lunar.dayName : ''} ${label.text}`);

    const s = document.createElement('span');
    s.className = 's';
    s.textContent = cell.d;
    const l = document.createElement('span');
    l.className = `l ${label.cls}`;
    l.textContent = label.text;
    btn.append(s, l);

    btn.addEventListener('click', () => {
      selected = cell;
      if (cell.m !== m) view = { y: cell.y, m: cell.m };
      render();
    });
    grid.append(btn);
  }

  $('back-today').hidden = view.y === today.y && view.m === today.m && same(selected, today);
  $('prev').disabled = y === MIN_YEAR + 1 && m === 1;
  $('next').disabled = y === MAX_YEAR && m === 12;
}

function render() {
  renderDetail();
  renderGrid();
}

function shiftMonth(delta) {
  let { y, m } = view;
  m += delta;
  if (m < 1) { m = 12; y--; }
  if (m > 12) { m = 1; y++; }
  if (y <= MIN_YEAR || y > MAX_YEAR) return;
  view = { y, m };
  renderGrid();
}

function goToday() {
  view = { y: today.y, m: today.m };
  selected = { ...today };
  render();
}

// ---------- 年月快速选择 ----------
// 支持范围 1901-01 ~ 2100-12；年份视图每页 12 年
const FIRST_YEAR = MIN_YEAR + 1;
const picker = { open: false, mode: 'month', year: view.y, pageStart: 0 };
const pageStartOf = (y) => y - ((y - FIRST_YEAR) % 12);

function renderPicker() {
  const grid = $('p-grid');
  grid.replaceChildren();
  const addBtn = (text, { current, now, disabled, onClick }) => {
    const b = document.createElement('button');
    b.textContent = text;
    if (current) b.classList.add('current');
    if (now) b.classList.add('now');
    b.disabled = !!disabled;
    b.addEventListener('click', onClick);
    grid.append(b);
  };

  if (picker.mode === 'month') {
    $('p-title').textContent = `${picker.year}年`;
    $('p-title').setAttribute('aria-label', `${picker.year}年，点击选择年份`);
    $('p-prev').disabled = picker.year <= FIRST_YEAR;
    $('p-next').disabled = picker.year >= MAX_YEAR;
    for (let m = 1; m <= 12; m++) {
      addBtn(`${m}月`, {
        current: picker.year === view.y && m === view.m,
        now: picker.year === today.y && m === today.m,
        onClick: () => {
          view = { y: picker.year, m };
          closePicker();
          renderGrid();
        },
      });
    }
  } else {
    const start = picker.pageStart;
    const end = Math.min(start + 11, MAX_YEAR);
    $('p-title').textContent = `${start}–${end}`;
    $('p-title').setAttribute('aria-label', `${start}到${end}年`);
    $('p-prev').disabled = start <= FIRST_YEAR;
    $('p-next').disabled = start + 12 > MAX_YEAR;
    for (let y = start; y < start + 12; y++) {
      addBtn(`${y}`, {
        current: y === view.y,
        now: y === today.y,
        disabled: y > MAX_YEAR,
        onClick: () => {
          picker.year = y;
          picker.mode = 'month';
          renderPicker();
        },
      });
    }
  }
}

function openPicker() {
  Object.assign(picker, { open: true, mode: 'month', year: view.y, pageStart: pageStartOf(view.y) });
  $('picker').hidden = false;
  renderPicker();
}

function closePicker() {
  picker.open = false;
  $('picker').hidden = true;
}

$('p-title').addEventListener('click', () => {
  if (picker.mode === 'month') {
    picker.mode = 'year';
    picker.pageStart = pageStartOf(picker.year);
    renderPicker();
  }
});
$('p-prev').addEventListener('click', () => {
  if (picker.mode === 'month') picker.year = Math.max(FIRST_YEAR, picker.year - 1);
  else picker.pageStart = Math.max(FIRST_YEAR, picker.pageStart - 12);
  renderPicker();
});
$('p-next').addEventListener('click', () => {
  if (picker.mode === 'month') picker.year = Math.min(MAX_YEAR, picker.year + 1);
  else if (picker.pageStart + 12 <= MAX_YEAR) picker.pageStart += 12;
  renderPicker();
});
$('p-today').addEventListener('click', () => { closePicker(); goToday(); });
$('p-close').addEventListener('click', closePicker);

$('prev').addEventListener('click', () => shiftMonth(-1));
$('next').addEventListener('click', () => shiftMonth(1));
$('title').addEventListener('click', openPicker);
$('back-today').addEventListener('click', goToday);

document.addEventListener('keydown', (e) => {
  if (picker.open) {
    if (e.key === 'Escape') closePicker();
    return;
  }
  if (e.key === 'ArrowLeft') shiftMonth(-1);
  if (e.key === 'ArrowRight') shiftMonth(1);
});

// 左右滑动切换月份
let touchX = null;
const cal = document.querySelector('.calendar');
cal.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
cal.addEventListener('touchend', (e) => {
  if (touchX === null || picker.open) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 50) shiftMonth(dx < 0 ? 1 : -1);
  touchX = null;
});

// 跨过午夜或从后台恢复时刷新"今天"
function refreshToday() {
  const n = new Date();
  const t = { y: n.getFullYear(), m: n.getMonth() + 1, d: n.getDate() };
  if (!same(t, today)) {
    const wasOnToday = same(selected, today);
    today = t;
    if (wasOnToday) goToday(); else render();
  }
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshToday(); });
setInterval(refreshToday, 60 * 1000);

render();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((err) => console.warn('SW 注册失败', err));
  });
}
