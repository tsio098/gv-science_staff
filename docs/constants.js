/* constants.js — 静的な定数・ラベル整形ヘルパー。
 * 元 teacher-data.jsx の固定部分（科目メタ・表示順・整形関数）を本番用に抽出。
 * データ本体は api.js が GAS から取得して window.STUDENTS / window.DETAIL に流し込む。
 *
 * global: window
 */

// ── 科目メタ（5科目）。色・英名は固定（GAS は科目キーだけ返せばよい）──
const SUBJECT_META = {
  chemistry:    { key: 'chemistry',    label: '化学',     short: '化',   en: 'CHEMISTRY',   color: '#5F8159' },
  biology:      { key: 'biology',      label: '生物',     short: '生',   en: 'BIOLOGY',     color: '#5E7E96' },
  chem_basics:  { key: 'chem_basics',  label: '化学基礎', short: '化基', en: 'CHEM·BASIC',  color: '#C0773A' },
  bio_basics:   { key: 'bio_basics',   label: '生物基礎', short: '生基', en: 'BIO·BASIC',   color: '#8A9B5A' },
  earth_basics: { key: 'earth_basics', label: '地学基礎', short: '地基', en: 'EARTH·BASIC', color: '#9C6F94' },
};
const SUBJECT_ORDER = ['chemistry', 'biology', 'chem_basics', 'bio_basics', 'earth_basics'];

// ── ラベル整形 ───────────────────────────────────────────
function monthShort(ym) { return String(parseInt(ym.split('-')[1], 10)) + '月'; }      // "2026-04" -> "4月"
function dateShort(d) { const [, m, day] = d.split('/'); return `${parseInt(m, 10)}/${parseInt(day, 10)}`; } // "2026/04/03" -> "4/3"
function dateMD(d) { if (!d) return '–'; const [, m, day] = d.split('/'); return `${m}/${day}`; }            // "2026/04/03" -> "04/03"
function daysAgoLabel(days) {
  if (days == null) return '—';
  if (days <= 0) return '今日';
  if (days === 1) return '昨日';
  if (days < 7) return `${days}日前`;
  if (days < 31) return `${Math.floor(days / 7)}週間前`;
  return `${Math.floor(days / 30)}ヶ月前`;
}

// ── 欠席率の水準（良好 / やや多い / 多い）。しきい値はここで調整可。──
const ABS_WARN = 15; // この値以上で warn（やや多い）
const ABS_BAD = 30;  // この値以上で bad（多い）
function absLevel(v) {
  if (v == null || isNaN(v)) return null;
  if (v >= ABS_BAD) return 'bad';
  if (v >= ABS_WARN) return 'warn';
  return 'good';
}
function absFmt(v) { return (v == null || isNaN(v)) ? '–' : (Math.round(v * 10) / 10); } // 60 / 5.6 等

// データが届くまでの初期値（画面が STUDENTS.filter などで落ちないように）
window.STUDENTS = window.STUDENTS || [];
window.DETAIL = window.DETAIL || {};
window.HOMEROOMS = window.HOMEROOMS || [];

Object.assign(window, {
  SUBJECT_META, SUBJECT_ORDER,
  monthShort, dateShort, dateMD, daysAgoLabel,
  ABS_WARN, ABS_BAD, absLevel, absFmt,
});
