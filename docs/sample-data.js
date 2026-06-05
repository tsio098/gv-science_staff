/* sample-data.js — GAS_ENDPOINT 未設定時のデモ用データ（元 teacher-data.jsx）。
   本番で実データに接続するときは web/config.js に GAS_ENDPOINT を設定すれば
   このファイルは参照されません（IIFE で隔離してあり、定数は外に漏れません）。
   global: window */
(function(){
/* teacher-data.jsx — demo data for the TEACHER dashboard.

   先生用「生徒成績一覧」。ブリーフ §3 のデータ構造を踏襲し、
   フロントが扱う2種を生成する:
     ① students  : 全生徒の軽量サマリー（一覧描画用）
     ② detail     : 生徒1人分の全履修科目データ（個人詳細用 / 欠測月 null 入り）

   全データを決定論的に生成（シード固定）するので、再読込でも安定する。
   ★ 欠測月（null）を意図的に混ぜてある — §7-2「欠測月を詰めて連続線にする」
      挙動を実データで確認できる。

   global: window */

// ── seeded PRNG (mulberry32) ───────────────────────────────
function mul32(seed) {
  let s = seed >>> 0;
  return function () {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const r1 = (v) => Math.round(v * 10) / 10;

// デモ用の擬似欠席率（%）。120 のうち >100 は「データなし(null)」として再現。
function sampleAbs(seed, s) {
  const i = ['chemistry', 'biology', 'chem_basics', 'bio_basics', 'earth_basics'].indexOf(s);
  const v = (seed * 37 + i * 53) % 120;
  return v > 100 ? null : r1(v);
}

// 6 観測月（演習の月次平均）。欠測を混ぜるための余裕をもって 6 ヶ月。
const MONTHS = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'];

// ── 科目メタ（5科目）─────────────────────────────────────
const SUBJECT_META = {
  chemistry:    { key: 'chemistry',    label: '化学',     short: '化', en: 'CHEMISTRY',   color: '#5F8159' },
  biology:      { key: 'biology',      label: '生物',     short: '生', en: 'BIOLOGY',     color: '#5E7E96' },
  chem_basics:  { key: 'chem_basics',  label: '化学基礎', short: '化基', en: 'CHEM·BASIC',  color: '#C0773A' },
  bio_basics:   { key: 'bio_basics',   label: '生物基礎', short: '生基', en: 'BIO·BASIC',   color: '#8A9B5A' },
  earth_basics: { key: 'earth_basics', label: '地学基礎', short: '地基', en: 'EARTH·BASIC', color: '#9C6F94' },
};
const SUBJECT_ORDER = ['chemistry', 'biology', 'chem_basics', 'bio_basics', 'earth_basics'];

const FIELDS = {
  chemistry: [
    '物質の構成', '原子の構造', '化学結合と結晶', '物質量と化学反応式', '酸と塩基',
    '酸化還元', '電池と電気分解', '反応と熱・光', '反応速度', '化学平衡',
    '気体の性質', '溶液の性質', '無機 · 非金属', '無機 · 金属', '脂肪族化合物',
    '芳香族化合物', '有機構造決定', '高分子化合物', '糖・アミノ酸', '化学と生活',
  ],
  biology: [
    '細胞と組織', '代謝と酵素', '光合成と呼吸', '遺伝情報とDNA', '遺伝子の発現',
    '体内環境の維持', '免疫', '神経と行動', '生態系', '進化と系統',
  ],
  chem_basics: [
    '物質の成分', '原子とイオン', '化学結合', '物質量と濃度',
    '化学反応式', '酸と塩基', '中和反応', '酸化還元',
  ],
  bio_basics: [
    '細胞と分裂', '遺伝子とDNA', '体内環境', '自律神経とホルモン',
    '免疫', '植生と遷移', 'バイオームと気候', '生態系と物質循環',
  ],
  earth_basics: [
    '地球の構造', 'プレートと地震', '火山と火成岩', '地層と化石',
    '大気と海洋', '天気の変化', '宇宙と太陽系', '自然環境と災害',
  ],
};

// ── 科目の試験名プール ──────────────────────────────────
const TEST_POOL = {
  chemistry:    ['駿台青パック', 'Z会 第', '河合 第', '東進センター', '駿台 第', '進研模試', '校内テスト'],
  biology:      ['進研模試', 'Z会 第', '河合 第', '駿台 第', '東進センター', '校内テスト'],
  chem_basics:  ['校内テスト', '共通形式 ', '進研模試', 'Z会 第', '河合 共通'],
  bio_basics:   ['校内テスト', '共通形式 ', '進研模試', 'ベネッセ', '河合 共通'],
  earth_basics: ['校内テスト', '共通形式 ', '進研模試', '河合 共通'],
};

// ════════════════════════════════════════════════════════
// 全国一斉模試（共通テスト型マーク模試） — マーク模試(フォーム)シート由来
//   列構成は共通テスト準拠：国語/英語/数学(IA・IIB)/理科3科目/社会2科目/合計点。
//   志望校（シート I列）は時系列で複数記録され、最新（最下行）を採用する。
// ════════════════════════════════════════════════════════

// gv=true は「英数のみ」の校内マーク模試（国語・理科・社会は未受験）
const MOCK_SCHEDULE = [
  { date: '2025/02/12', name: '早期対策模試2月',          full: true },
  { date: '2025/05/03', name: '第1回GV模試',              full: false },
  { date: '2025/05/21', name: '河合 共通テスト模試5月',    full: true },
  { date: '2025/06/07', name: '進研 共通テスト模試6月',    full: true },
  { date: '2025/08/03', name: '駿台 共通テスト模試8月',    full: true },
  { date: '2025/08/16', name: 'GV模試8月',               full: false },
  { date: '2025/09/26', name: '河合 共通テスト模試9月',    full: true },
  { date: '2025/10/24', name: '駿台 共通テスト模試10月',   full: true },
  { date: '2025/11/06', name: 'ベネッセ 共テ模試11月',    full: true },
  { date: '2025/11/10', name: 'ベネッセ・駿台共テ模試',   full: true },
  { date: '2025/11/25', name: '河合_共通テスト本番レベル', full: true },
];

const RIKA_OPTIONS = ['生物基礎', '化学基礎', '地学基礎', '物理基礎'];
const SHAKAI_OPTIONS = ['公共、政治/経済', '歴史総合、日本史探究', '歴史総合、世界史探究', '公共、倫理'];
const NOT_TAKEN = '受験していない';

// 志望校プール（理系・GV Science の生徒層に合わせる）
const ASPIRATIONS = [
  '北海道大学 水産学部', '東北大学 農学部', '筑波大学 生命環境学群',
  '千葉大学 薬学部', '東京農工大学 農学部', '名古屋大学 理学部',
  '大阪大学 理学部', '神戸大学 理学部', '岡山大学 薬学部',
  '広島大学 生物生産学部', '横浜国立大学 理工学部', '東京理科大学 薬学部',
];

// マーク模試の履歴を生成（合計点は成分の素点合計＝シート内で内部整合）
function genMockExams(seed, grade) {
  const rnd = mul32(seed + 4242);
  // 学年で受験回数が変わる（高3ほど多い）
  const n = grade === '高3' ? 8 + Math.floor(rnd() * 4)
          : grade === '高2' ? 4 + Math.floor(rnd() * 3)
          : 2 + Math.floor(rnd() * 2);
  const sched = MOCK_SCHEDULE.slice(0, Math.min(n, MOCK_SCHEDULE.length));

  // 履修する理科・社会（生徒ごとに固定）
  const rikaA = RIKA_OPTIONS[Math.floor(rnd() * RIKA_OPTIONS.length)];
  let rikaB = RIKA_OPTIONS[Math.floor(rnd() * RIKA_OPTIONS.length)];
  while (rikaB === rikaA) rikaB = RIKA_OPTIONS[Math.floor(rnd() * RIKA_OPTIONS.length)];
  const shaA = SHAKAI_OPTIONS[Math.floor(rnd() * SHAKAI_OPTIONS.length)];
  const twoShakai = rnd() < 0.55;
  let shaB = SHAKAI_OPTIONS[Math.floor(rnd() * SHAKAI_OPTIONS.length)];
  while (shaB === shaA) shaB = SHAKAI_OPTIONS[Math.floor(rnd() * SHAKAI_OPTIONS.length)];

  // 実力ベース（得点率）と科目別の得意/苦手
  const base = 0.42 + rnd() * 0.32;
  const skill = { ko: base + (rnd() - 0.5) * 0.18, en: base + (rnd() - 0.5) * 0.18, ma: base + (rnd() - 0.5) * 0.2, ri: base + (rnd() - 0.5) * 0.16, sh: base + (rnd() - 0.5) * 0.16, jo: base + (rnd() - 0.5) * 0.18 };
  const sc = (sk, max, i) => Math.round(clamp(sk + i * 0.012 + (rnd() - 0.5) * 0.13, 0.08, 0.97) * max);
  const iibStart = Math.floor(rnd() * 3); // 数IIB の履修開始回（それ以前は空欄）

  const exams = sched.map((s, i) => {
    if (!s.full) {
      // GV模試＝英数のみ
      const w = sc(skill.en, 100, i), l = sc(skill.en, 100, i);
      const ia = sc(skill.ma, 100, i);
      const iib = i >= iibStart ? sc(skill.ma, 100, i) : null;
      const total = w + l + ia + (iib || 0);
      return {
        date: s.date, name: s.name, full: false,
        kokugo: null, eigo: { w, l, total: w + l },
        math: { ia, iib },
        rika: [{ name: NOT_TAKEN, score: null }, { name: NOT_TAKEN, score: null }, { name: NOT_TAKEN, score: null }],
        shakai: [{ name: NOT_TAKEN, score: null }, { name: NOT_TAKEN, score: null }],
        joho: null,
        total,
      };
    }
    const gendai = sc(skill.ko, 110, i), koten = sc(skill.ko, 50, i), kanbun = sc(skill.ko, 50, i);
    const w = sc(skill.en, 100, i), l = sc(skill.en, 100, i);
    const ia = sc(skill.ma, 100, i);
    const iib = i >= iibStart ? sc(skill.ma, 100, i) : null;
    const riA = sc(skill.ri, 50, i), riB = sc(skill.ri, 50, i);
    const shAsc = sc(skill.sh, 100, i);
    const shBsc = twoShakai ? sc(skill.sh, 100, i) : null;
    const joho = sc(skill.jo, 100, i);
    const kTotal = gendai + koten + kanbun;
    const total = kTotal + (w + l) + ia + (iib || 0) + riA + riB + shAsc + (shBsc || 0) + joho;
    return {
      date: s.date, name: s.name, full: true,
      kokugo: { gendai, koten, kanbun, total: kTotal },
      eigo: { w, l, total: w + l },
      math: { ia, iib },
      rika: [{ name: rikaA, score: riA }, { name: rikaB, score: riB }, { name: NOT_TAKEN, score: null }],
      shakai: [{ name: shaA, score: shAsc }, twoShakai ? { name: shaB, score: shBsc } : { name: NOT_TAKEN, score: null }],
      joho,
      total,
    };
  });

  // 志望校履歴（I列）：1〜3回ぶれて、最新（最下行）を採用
  const aspCount = 1 + Math.floor(rnd() * 3);
  const idx0 = Math.floor(rnd() * ASPIRATIONS.length);
  const aspHistory = [];
  for (let k = 0; k < aspCount && k < exams.length; k++) {
    const ei = Math.floor((k / aspCount) * exams.length);
    aspHistory.push({ date: exams[ei] ? exams[ei].date : sched[0].date, school: ASPIRATIONS[(idx0 + k * 4) % ASPIRATIONS.length] });
  }
  const aspiration = aspHistory[aspHistory.length - 1].school;

  return { exams, aspiration, aspHistory };
}

// ── 12 生徒（履修バラバラ・5科目すべて登場）────────────────
// staleMonths: 直近受験を何ヶ月前で止めるか（未受験フラグ検証）
// homeroom = 担任（生徒IDシート F列）。3名の担任を割り当て。
const ROSTER = [
  { name: '佐藤 陽斗',   grade: '高3', homeroom: '田中', subjects: ['chemistry', 'biology'],                    seed: 1101 },
  { name: '鈴木 美咲',   grade: '高2', homeroom: '佐々木', subjects: ['chemistry', 'chem_basics'],              seed: 1217 },
  { name: '髙橋 蓮',     grade: '高2', homeroom: '佐々木', subjects: ['biology', 'bio_basics'],                 seed: 1330 },
  { name: '田中 結菜',   grade: '高3', homeroom: '田中', subjects: ['chemistry', 'biology'],                    seed: 1454, dip: true },
  { name: '伊藤 大翔',   grade: '高2', homeroom: '渡辺', subjects: ['chem_basics', 'bio_basics'],               seed: 1573 },
  { name: '渡辺 葵',     grade: '高1', homeroom: '渡辺', subjects: ['chem_basics', 'earth_basics'],             seed: 1699, stale: 2 },
  { name: '山本 颯太',   grade: '高3', homeroom: '田中', subjects: ['chemistry'],                               seed: 1812, many: 30 },
  { name: '中村 さくら', grade: '高2', homeroom: '佐々木', subjects: ['biology', 'chem_basics'],                seed: 1934, dip: true },
  { name: '小林 悠真',   grade: '高1', homeroom: '渡辺', subjects: ['earth_basics', 'bio_basics'],              seed: 2055 },
  { name: '加藤 凛',     grade: '高3', homeroom: '田中', subjects: ['chemistry', 'biology', 'earth_basics'],    seed: 2176 },
  { name: '吉田 湊',     grade: '高2', homeroom: '佐々木', subjects: ['chemistry', 'chem_basics', 'earth_basics'],seed: 2291, stale: 3 },
  { name: '山田 莉子',   grade: '高1', homeroom: '渡辺', subjects: ['bio_basics'],                              seed: 2410 },
];

// "today" — 一覧の「最終受験からの経過」「要注目」判定の基準日。
const TODAY = new Date('2026-06-04');

// ── 合計点の推移を生成（テストごと・時系列）────────────────
function genTotalTrend(subject, seed, opts) {
  const rnd = mul32(seed);
  const n = opts.many || (4 + Math.floor(rnd() * 5));          // 4〜8 件（many 指定時はその件数）
  const pool = TEST_POOL[subject];
  // 直近テストの締め日（stale 指定があれば過去にずらす）
  const end = new Date(TODAY);
  end.setDate(end.getDate() - 6 - Math.floor(rnd() * 10));
  if (opts.stale) end.setMonth(end.getMonth() - opts.stale);
  let cur = new Date(end);
  cur.setDate(cur.getDate() - (n - 1) * (9 + Math.floor(rnd() * 9)));
  let base = 52 + rnd() * 26;                   // 実力ベース
  const out = [];
  for (let i = 0; i < n; i++) {
    let drift = (rnd() - 0.42) * 9;
    // 落ち込み生徒は直近で下げる
    if (opts.dip && i >= n - 2) drift -= 9 + rnd() * 6;
    base = clamp(base + drift, 30, 99);
    const total = Math.round(clamp(base + (rnd() - 0.5) * 8, 8, 100));
    const avg = r1(clamp(total - (10 + rnd() * 16), 8, 92));
    const hensachi = r1(clamp(50 + (total - avg) * 0.6 + (rnd() - 0.5) * 4, 30, 78));
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const dd = String(cur.getDate()).padStart(2, '0');
    let nm = pool[i % pool.length];
    if (/[第形式]$/.test(nm.trim()) || nm.endsWith('第') || nm.endsWith('式 ') || nm.endsWith('形式 '))
      nm = nm.replace(/\s+$/, '') + (/第$/.test(nm.trim()) ? '' : '') ;
    let name = pool[i % pool.length];
    if (name.endsWith('第')) name = `${name}${(i % 6) + 1}回`;
    else if (name.endsWith('形式 ') || name.endsWith('共通')) name = `${name}${(i % 4) + 1}`;
    out.push({ date: `${y}/${m}/${dd}`, test: name, total, avg, hensachi });
    cur.setDate(cur.getDate() + (9 + Math.floor(rnd() * 9)));
  }
  return out;
}

// ── 分野別 月次（rate / avgRate / hensachi）を生成（欠測 null 入り）──
function genMonthly(subject, seed, opts) {
  const fields = FIELDS[subject];
  const rnd = mul32(seed + 777);
  const rate = {}, avgRate = {}, hensachi = {};

  // この科目で「全生徒共通に欠測」とする先頭月数（演習が始まる前）。
  // stale 生徒は観測も短くなる。
  const startGap = opts.stale ? 2 + Math.floor(rnd() * 2) : Math.floor(rnd() * 2); // 先頭の欠測月数
  const endGap = opts.stale ? opts.stale : 0;                                      // 末尾の欠測月数

  fields.forEach((f, fi) => {
    const base = 44 + rnd() * 42;          // 44–86%
    const slope = (rnd() - (opts.dip ? 0.58 : 0.40)) * 7;
    const rArr = [], aArr = [], hArr = [];
    MONTHS.forEach((_, m) => {
      // 観測ウィンドウ外は欠測
      const beforeStart = m < startGap;
      const afterEnd = endGap && (m > MONTHS.length - 1 - endGap);
      // 分野ごとに散発的な欠測（その月その分野は未出題）。約18%。
      const sporadic = !beforeStart && !afterEnd && rnd() < 0.18;
      if (beforeStart || afterEnd || sporadic) {
        rArr.push(null); aArr.push(null); hArr.push(null);
        return;
      }
      const noise = (rnd() - 0.5) * 9;
      const r = clamp(base + slope * m + noise, 18, 99);
      const a = clamp(r - (13 + rnd() * 12), 12, 90);
      const h = clamp(50 + (r - a) * 0.62 + (rnd() - 0.5) * 3, 32, 78);
      rArr.push(r1(r)); aArr.push(r1(a)); hArr.push(r1(h));
    });
    // 最低1点は保証（全 null を避ける）
    if (rArr.every(v => v == null)) {
      const m = MONTHS.length - 1 - endGap;
      const r = clamp(base, 20, 95);
      rArr[m] = r1(r); aArr[m] = r1(clamp(r - 16, 12, 88)); hArr[m] = r1(clamp(50 + (r * 0.2), 35, 72));
    }
    rate[f] = rArr; avgRate[f] = aArr; hensachi[f] = hArr;
  });
  return { rate, avgRate, hensachi };
}

// ── per-subject detail block ──────────────────────────────
function genSubjectData(subject, seed, opts) {
  return {
    fields: FIELDS[subject],
    months: MONTHS,
    totalTrend: genTotalTrend(subject, seed, opts),
    ...genMonthly(subject, seed, opts),
  };
}

// ── build the full dataset ────────────────────────────────
function daysBetween(a, b) { return Math.round((b - a) / 86400000); }

const STUDENTS = [];      // 一覧サマリー
const DETAIL = {};        // name -> 個人詳細

ROSTER.forEach((r) => {
  const opts = { dip: r.dip, stale: r.stale, many: r.many };
  const data = {};
  r.subjects.forEach((s, si) => { data[s] = genSubjectData(s, r.seed + si * 137, opts); });

  const mock = genMockExams(r.seed, r.grade);

  // 授業の欠席率（科目別）
  const absence = {};
  r.subjects.forEach((s) => { absence[s] = sampleAbs(r.seed, s); });

  // 個人詳細
  DETAIL[r.name] = {
    name: r.name, grade: r.grade, homeroom: r.homeroom,
    subjects: r.subjects,
    meta: SUBJECT_META,
    months: MONTHS,
    data,
    mock,
    absence,
  };

  // 一覧サマリー（各科目の直近テスト → 偏差値・前回比・合計点・最終受験日）
  const perSubject = {};
  let lastExam = null;
  let worstDelta = 0;
  r.subjects.forEach((s) => {
    const tt = data[s].totalTrend;
    const last = tt[tt.length - 1];
    const prev = tt[tt.length - 2];
    const dHen = prev ? r1(last.hensachi - prev.hensachi) : 0;
    const dTot = prev ? last.total - prev.total : 0;
    perSubject[s] = {
      lastHensachi: last.hensachi,
      deltaHensachi: dHen,
      lastTotal: last.total,
      deltaTotal: dTot,
      lastDate: last.date,
      spark: tt.map(p => p.total),
      n: tt.length,
      absence: sampleAbs(r.seed, s),
    };
    const d = new Date(last.date.replace(/\//g, '-'));
    if (!lastExam || d > lastExam) lastExam = d;
    if (dHen < worstDelta) worstDelta = dHen;
  });
  const daysSince = lastExam ? daysBetween(lastExam, TODAY) : 999;

  STUDENTS.push({
    name: r.name, grade: r.grade, homeroom: r.homeroom,
    subjects: r.subjects,
    perSubject,
    aspiration: mock.aspiration,
    mockLatest: mock.exams.length ? mock.exams[mock.exams.length - 1] : null,
    lastExamDate: lastExam ? `${lastExam.getFullYear()}/${String(lastExam.getMonth() + 1).padStart(2, '0')}/${String(lastExam.getDate()).padStart(2, '0')}` : null,
    daysSince,
    flags: {
      declining: worstDelta <= -3,        // 偏差値が大きく下降
      stale: daysSince >= 30,             // 長期間未受験
    },
    worstDelta,
  });
});

// ── label helpers ─────────────────────────────────────────
function monthShort(ym) { return String(parseInt(ym.split('-')[1], 10)) + '月'; }
function dateShort(d) { const [, m, day] = d.split('/'); return `${parseInt(m, 10)}/${parseInt(day, 10)}`; }
function dateMD(d) { const [, m, day] = d.split('/'); return `${m}/${day}`; }
function daysAgoLabel(days) {
  if (days <= 0) return '今日';
  if (days === 1) return '昨日';
  if (days < 7) return `${days}日前`;
  if (days < 31) return `${Math.floor(days / 7)}週間前`;
  return `${Math.floor(days / 30)}ヶ月前`;
}

// 担任の一覧（生徒IDシート F列）— フィルタ/ソート用
const HOMEROOMS = Array.from(new Set(ROSTER.map(r => r.homeroom)));

// 本番フロントの「サンプルモード」用。GAS_ENDPOINT 未設定時のみ api.js が参照。
window.__SAMPLE__ = { students: STUDENTS, detail: DETAIL, homerooms: HOMEROOMS };

})();
