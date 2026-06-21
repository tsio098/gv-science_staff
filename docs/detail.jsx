/* teacher-detail.jsx — 生徒個人詳細（成績推移）。
   既存の生徒向け成績推移画面を踏襲しつつ、Web（デスクトップ2カラム）に再構成。
   gt-* クラス（gradetrend.css）と手書きSVGチャート（teacher-charts.jsx）を流用。

   ★ 分野別折れ線は欠測月(null)を詰めて連続線にする（§7-2）。
     得点傾向・月次一覧も「値のある月だけ」を扱う。

   global: React, Icon, DETAIL, SUBJECT_META, MONTHS, monthShort,
           Measured, TotalTrendChart, FieldLineChart */

// 授業の欠席率（ヘッダー右・科目別ピル）。det.absence = { [科目キー]: % | null }
function AttMini({ det }) {
  const abs = det.absence || {};
  const keys = SUBJECT_ORDER.filter((k) => abs[k] != null);
  if (!keys.length) return null;
  return (
    <div className="tw-att-mini">
      <div className="tw-att-mini-h"><span className="t">授業の欠席率</span><span className="aux">ATTENDANCE</span></div>
      <div className="tw-att-mini-row">
        {keys.map((k) => {
          const m = SUBJECT_META[k];
          return (
            <span key={k} className={`tw-att-pill ${absLevel(abs[k])}`}>
              <span className="sdot" style={{ background: m.color }} />
              <span className="lbl">{m.label}</span>
              <b className="gv-num">{absFmt(abs[k])}<small>%</small></b>
            </span>
          );
        })}
      </div>
    </div>
  );
}

// 落ち着いた categorical パレット（同じ分野には常に同じ色）
const FIELD_COLORS = [
'#5F8159', '#C77A3D', '#6E8FA6', '#B0593F', '#8A9B5A',
'#9C6F94', '#3F7E72', '#C29A3A', '#7A6BA6', '#B85C6E',
'#5E8C6A', '#A9743B', '#4F7E96', '#A85C4A', '#7C8C4E',
'#8C6486', '#3E7468', '#B08A33', '#6E5F96', '#A85262'];


const METRICS = [
{ key: 'rate', label: '得点率', unit: '%' },
{ key: 'avgRate', label: '平均得点率', unit: '%' },
{ key: 'hensachi', label: '偏差値', unit: '' }];


function colorForField(det, subject, field) {
  const idx = det.data[subject].fields.indexOf(field);
  return FIELD_COLORS[(idx % FIELD_COLORS.length + FIELD_COLORS.length) % FIELD_COLORS.length];
}

// 配列の「最後の非nullの値とその前の非null」を返す
function latestPair(arr) {
  let last = null,prev = null,lastIdx = -1;
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i] != null) {
      if (last == null) {last = arr[i];lastIdx = i;} else
      {prev = arr[i];break;}
    }
  }
  return { last, prev, lastIdx };
}

// 直近(値のある最後の月)の rate 上位3 + 下位3
function defaultFields(det, subject) {
  const d = det.data[subject];
  const ranked = d.fields.
  map((f) => ({ f, v: latestPair(d.rate[f]).last })).
  filter((x) => x.v != null).
  sort((a, b) => b.v - a.v);
  const top = ranked.slice(0, 3).map((x) => x.f);
  const bot = ranked.slice(-3).map((x) => x.f);
  return [...top, ...bot].filter((v, i, a) => a.indexOf(v) === i);
}

// 基礎科目は分野が少ないので上位/下位3件ずつ、化学・生物は5件ずつ
function swCount(subject) {
  return subject === 'chemistry' || subject === 'biology' ? 5 : 3;
}

function Delta2({ v, unit }) {
  if (v == null) return <span className="gt-sw-d flat gv-num">–</span>;
  const dv = Math.round(v * 10) / 10;
  const cls = dv > 0.05 ? 'up' : dv < -0.05 ? 'down' : 'flat';
  return <span className={`gt-sw-d ${cls} gv-num`}>{dv > 0 ? '+' : ''}{dv}</span>;
}

// ── 全国一斉模試（共通テスト型マーク模試）──────────────────
const MOCK_FULL_MARKS = 1000;

// 数値セル（未受験/空欄は '–'）
function Num({ v, sub, strong }) {
  if (v == null) return <span className="mk-na">–</span>;
  return <span className={`gv-num ${strong ? 'mk-strong' : ''}`}>{v}{sub ? <small>{sub}</small> : null}</span>;
}
// 科目名セル（受験していない を淡色に）
function SubjCell({ name }) {
  const na = !name || name === '受験していない';
  return <span className={`mk-subj ${na ? 'mk-na' : ''}`}>{name || '–'}</span>;
}

function MockExamCard({ det }) {
  const mock = det.mock;
  if (!mock || !mock.exams.length) {
    return (
      <div className="gt-card mk-card" style={{ margin: '0 0 30px' }}>
        <div className="gt-card-head">
          <div className="gt-card-title">模試の成績推移<span className="gt-card-title-sub">共通テスト型マーク模試</span></div>
        </div>
        <div className="gt-note gt-note-soft">マーク模試の記録がまだありません。</div>
      </div>);

  }
  const rows = [...mock.exams].reverse(); // 新しい順
  const latest = mock.exams[mock.exams.length - 1];
  const prevFull = [...mock.exams].reverse().slice(1).find((e) => e.full);
  const latestForDelta = latest.full ? latest : [...mock.exams].reverse().find((e) => e.full);
  const delta = latestForDelta && prevFull && latestForDelta !== prevFull ? latestForDelta.total - prevFull.total : null;
  const best = mock.exams.reduce((m, e) => Math.max(m, e.total), 0);

  return (
    <div className="gt-card mk-card" style={{ lineHeight: "1.4", margin: "0px 0px 30px" }}>
      <div className="gt-card-head">
        <div className="gt-card-title">模試の成績推移<span className="gt-card-title-sub">共通テスト型マーク模試</span></div>
        <div className="gt-card-aux gv-en">{mock.exams.length} 回受験</div>
      </div>

      {/* 志望校 + サマリー */}
      <div className="mk-top">
        <div className="mk-asp">
          <div className="mk-asp-k">志望校 <span className="mk-asp-note">最新</span></div>
          <div className="mk-asp-v">{mock.aspiration}</div>
          {mock.aspHistory.length > 1 &&
          <div className="mk-asp-hist">
              履歴：{mock.aspHistory.map((h, i) =>
            <span key={i}>{i > 0 ? ' → ' : ''}<span className={i === mock.aspHistory.length - 1 ? 'cur' : ''}>{h.school}</span></span>
            )}
            </div>
          }
        </div>
        <div className="mk-sumrow">
          <div className="mk-sum">
            <div className="mk-sum-k">直近 合計点</div>
            <div className="mk-sum-v"><span className="gv-num">{latestForDelta ? latestForDelta.total : latest.total}</span><span className="mk-sum-u">/ {MOCK_FULL_MARKS}</span></div>
            {delta != null && <div className={`mk-sum-d ${delta >= 0 ? 'up' : 'down'} gv-num`}>{delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}<small>前回比</small></div>}
          </div>
          <div className="mk-sum">
            <div className="mk-sum-k">自己ベスト</div>
            <div className="mk-sum-v"><span className="gv-num">{best}</span><span className="mk-sum-u">/ {MOCK_FULL_MARKS}</span></div>
          </div>
        </div>
      </div>

      {/* 成績表（共通テスト準拠・横スクロール）*/}
      <div className="mk-tablewrap">
        <table className="mk-table">
          <thead>
            <tr className="mk-grp">
              <th rowSpan="2" className="mk-sticky mk-date">記入日</th>
              <th rowSpan="2" className="mk-sticky mk-name">試験名</th>
              <th colSpan="4" className="mk-g-ko">国語</th>
              <th colSpan="3" className="mk-g-en">英語</th>
              <th colSpan="2" className="mk-g-ma">数学</th>
              <th colSpan="6" className="mk-g-ri">理科</th>
              <th colSpan="4" className="mk-g-sh">社会</th>
              <th rowSpan="2" className="mk-g-jo">情報</th>
              <th rowSpan="2" className="mk-tot">合計点</th>
            </tr>
            <tr className="mk-sub">
              <th>現代文</th><th>古文</th><th>漢文</th><th className="mk-subtot">合計</th>
              <th>筆記</th><th>L</th><th className="mk-subtot">合計</th>
              <th>ⅠA</th><th>ⅡB</th>
              <th className="mk-subjcol">第一解答</th><th>点</th>
              <th className="mk-subjcol">第二解答</th><th>点</th>
              <th className="mk-subjcol">第三解答</th><th>点</th>
              <th className="mk-subjcol">第一解答</th><th>点</th>
              <th className="mk-subjcol">第二解答</th><th>点</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e, i) =>
            <tr key={i} className={e.full ? '' : 'mk-partial'}>
                <td className="mk-sticky mk-date gv-num">{e.date.slice(5)}</td>
                <td className="mk-sticky mk-name">{e.name}{!e.full && <span className="mk-pill">英数</span>}</td>
                <td><Num v={e.kokugo && e.kokugo.gendai} /></td>
                <td><Num v={e.kokugo && e.kokugo.koten} /></td>
                <td><Num v={e.kokugo && e.kokugo.kanbun} /></td>
                <td className="mk-subtot"><Num v={e.kokugo && e.kokugo.total} strong /></td>
                <td><Num v={e.eigo && e.eigo.w} /></td>
                <td><Num v={e.eigo && e.eigo.l} /></td>
                <td className="mk-subtot"><Num v={e.eigo && e.eigo.total} strong /></td>
                <td><Num v={e.math && e.math.ia} /></td>
                <td><Num v={e.math && e.math.iib} /></td>
                <td className="mk-subjcol"><SubjCell name={e.rika[0].name} /></td>
                <td><Num v={e.rika[0].score} /></td>
                <td className="mk-subjcol"><SubjCell name={e.rika[1].name} /></td>
                <td><Num v={e.rika[1].score} /></td>
                <td className="mk-subjcol"><SubjCell name={e.rika[2].name} /></td>
                <td><Num v={e.rika[2].score} /></td>
                <td className="mk-subjcol"><SubjCell name={e.shakai[0].name} /></td>
                <td><Num v={e.shakai[0].score} /></td>
                <td className="mk-subjcol"><SubjCell name={e.shakai[1].name} /></td>
                <td><Num v={e.shakai[1].score} /></td>
                <td><Num v={e.joho} /></td>
                <td className="mk-tot gv-num">{e.total}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── スマホ縦表示：横長テーブルの代わりに「試験ごとのカード」を縦積み ──
          デスクトップは上の表、≤640px ではこちらをCSSで表示。 */}
      <div className="mk-cards">
        {rows.map((e, i) => {
          const items = [];
          if (e.full) items.push({ k: '国語', v: e.kokugo && e.kokugo.total });
          items.push({ k: '英語', v: e.eigo && e.eigo.total });
          items.push({ k: '数学ⅠA', v: e.math && e.math.ia });
          items.push({ k: '数学ⅡB', v: e.math && e.math.iib });
          if (e.full) {
            e.rika.forEach((r) => { if (r.name && r.name !== '受験していない') items.push({ k: r.name, v: r.score, tag: '理' }); });
            e.shakai.forEach((r) => { if (r.name && r.name !== '受験していない') items.push({ k: r.name, v: r.score, tag: '社' }); });
            items.push({ k: '情報', v: e.joho });
          }
          return (
            <div key={i} className={`mk-xcard ${e.full ? '' : 'mk-xcard-partial'}`}>
              <div className="mk-xcard-head">
                <span className="mk-xcard-date gv-num">{e.date.slice(5)}</span>
                <span className="mk-xcard-name">{e.name}{!e.full && <span className="mk-pill">英数</span>}</span>
                <span className="mk-xcard-tot gv-num">{e.total}<small>/ {MOCK_FULL_MARKS}</small></span>
              </div>
              <div className="mk-xcard-grid">
                {items.map((it, j) =>
                  <div key={j} className="mk-xcell">
                    <span className="mk-xcell-k">{it.tag && <i className="mk-xtag">{it.tag}</i>}{it.k}</span>
                    <span className="mk-xcell-v"><Num v={it.v} /></span>
                  </div>
                )}
              </div>
            </div>);
        })}
      </div>

      <div className="gt-note gt-note-soft">マーク模試(フォーム) シートの記録を新しい順に表示。「英数」は国語・理科・社会を含まない校内マーク模試です。志望校はフォーム I列の最新回答を採用しています。</div>
    </div>);

}

function StudentDetailScreen({ nav, name, state = 'normal' }) {
  const det = DETAIL[name];
  const subjects = det ? det.subjects : [];
  const [subject, setSubject] = React.useState(subjects[0]);
  const [metric, setMetric] = React.useState('rate');
  const [sel, setSel] = React.useState(() => new Set());
  const [fv, setFv] = React.useState('lines');
  const [range, setRange] = React.useState('all');

  React.useEffect(() => {setSel(new Set());}, [subject, name]);
  React.useEffect(() => {setRange('all');}, [subject]);

  if (!det) return null;

  const meta = SUBJECT_META[subject];
  const d = det.data[subject];
  const months = det.months;

  // ── 合計点 ──
  const tt = d.totalTrend;
  const view = range === 'all' ? tt : tt.slice(-range);
  const latest = tt[tt.length - 1];
  const prev = tt[tt.length - 2];
  const delta = prev ? latest.total - prev.total : 0;

  // ── 分野別 ──
  const curMetric = METRICS.find((m) => m.key === metric);
  const order = d.fields.filter((f) => sel.has(f));
  const fieldSeries = order.map((f) => ({ name: f, color: colorForField(det, subject, f), rate: d.rate[f], avgRate: d.avgRate[f], hensachi: d.hensachi[f] }));
  const toggleField = (f) => setSel((s) => {const n = new Set(s);n.has(f) ? n.delete(f) : n.add(f);return n;});

  // PDF出力（B4 横）。分野別は「得点傾向（得点率）」表示に切り替えてから印刷する。
  const onPrintPDF = () => {
    setFv('strengths');
    setMetric('rate');
    let st = document.getElementById('gv-print-page');
    if (!st) { st = document.createElement('style'); st.id = 'gv-print-page'; document.head.appendChild(st); }
    st.textContent = '@page { size: B4 landscape; margin: 7mm; }';
    setTimeout(() => window.print(), 220);
  };

  // ── 得点傾向（得意/苦手）— 平均得点率は除外 ──
  const swMetricKey = metric === 'avgRate' ? 'rate' : metric;
  const swMetric = METRICS.find((m) => m.key === swMetricKey);
  const ranked = d.fields.
  map((f) => {const { last, prev } = latestPair(d[swMetricKey][f]);return { f, v: last, prev };}).
  filter((x) => x.v != null).
  sort((a, b) => b.v - a.v);
  const cnt = swCount(subject);
  const strong = ranked.slice(0, cnt);
  const weak = ranked.slice(-cnt).reverse().filter((w) => !strong.some((s) => s.f === w.f));

  const subjectUI = subjects.length <= 2 ? 'segmented' : 'chips';

  // ── states ──
  if (state !== 'normal') {
    return (
      <div className="tw-main tw-detail">
        <button className="tw-back" onClick={() => nav('back')}>{Icon.chevL(14)} 一覧へ戻る</button>
        <h1 className="tw-detail-title" style={{ marginBottom: 18 }}>{name}<span className="grade">{det.grade}</span></h1>
        {state === 'loading' &&
        <div className="tw-detail-grid">
            {[0, 1].map((i) =>
          <div key={i} className="gt-card gt-skel"><div className="gt-skel-bar" style={{ width: '44%', height: 14 }} /><div className="gt-skel-plot" /></div>
          )}
          </div>
        }
        {state === 'loading' && <div className="tw-loadwrap"><div className="spinner" /><span>成績データを読み込み中…</span></div>}
        {state === 'empty' &&
        <div className="tw-empty">
            <div className="tw-empty-ic">{Icon.chart(26)}</div>
            <div className="tw-empty-t1">まだ成績データがありません</div>
            <div className="tw-empty-t2">この生徒の点数報告が登録されると、ここに推移が表示されます。</div>
            <button className="btn btn-primary btn-sm" onClick={() => nav('back')}>一覧へ戻る</button>
          </div>
        }
        {state === 'error' &&
        <div className="tw-empty">
            <div className="tw-empty-ic" style={{ background: 'var(--c-accent-soft)', color: '#9A4309' }}>{Icon.alert(26)}</div>
            <div className="tw-empty-t1">データを取得できませんでした</div>
            <div className="tw-empty-t2">通信環境を確認して、もう一度お試しください。</div>
            <button className="btn btn-quiet btn-sm" onClick={() => {}}>{Icon.refresh(16)}<span style={{ marginLeft: 6 }}>もう一度試す</span></button>
          </div>
        }
      </div>);

  }

  return (
    <div className="tw-main tw-detail">
      <div className="tw-detail-topbar">
        <button className="tw-back" onClick={() => nav('back')}>{Icon.chevL(14)} 一覧へ戻る</button>
        <div className="gv-print-bar">
          <button className="gv-print-btn" onClick={onPrintPDF}>PDF出力（B4・横）</button>
        </div>
      </div>
      <div className="tw-detail-head">
        <div>
          <div className="tw-eyebrow">REPORT · 成績推移</div>
          <h1 className="tw-detail-title">{name}<span className="grade">{det.grade}</span></h1>
          <div className="tw-detail-meta">
            <span className="tw-hr-chip">担任 {det.homeroom} 先生</span>
            {det.mock && det.mock.aspiration &&
            <span className="tw-asp-inline">{Icon.flag ? Icon.flag(13) : null}志望校 <b>{det.mock.aspiration}</b></span>
            }
          </div>
        </div>
        <div className="tw-detail-right">
          <div className="tw-detail-en">{meta.en}</div>
          <AttMini det={det} />
        </div>
      </div>

      <MockExamCard det={det} />

      {/* 科目別の成績推移セクション（科目タブ＋合計点/分野別カードを1グループとして見せる）*/}
      <div className="tw-subject-section">
        <div className="tw-eyebrow tw-subject-eyebrow">科目別の成績推移</div>
      {/* 科目タブ */}
      <div className={subjectUI === 'segmented' ? 'gt-seg' : 'tw-subjtabs'} style={subjectUI === 'segmented' ? { maxWidth: 360, marginBottom: 12 } : { marginBottom: 12 }} role="tablist">
        {subjects.map((s) =>
        subjectUI === 'segmented' ?
        <button key={s} role="tab" aria-selected={s === subject} className={`gt-seg-btn ${s === subject ? 'on' : ''}`} onClick={() => setSubject(s)}>{SUBJECT_META[s].label}</button> :

        <button key={s} role="tab" aria-selected={s === subject} className={`gt-chip-sub ${s === subject ? 'on' : ''}`} onClick={() => setSubject(s)}>
              {s === subject && <span className="gt-chip-dot" style={{ background: SUBJECT_META[s].color }} />}{SUBJECT_META[s].label}
            </button>

        )}
      </div>

      <div key={subject} className="gt-fade tw-detail-grid">
        {/* ── 合計点の推移 ── */}
        <div className="gt-card" style={{ margin: "-5px 0px 0px" }}>
          <div className="gt-card-head">
            <div className="gt-card-title">合計点の推移</div>
            <div className="gt-card-aux gv-en">{tt.length} TESTS</div>
          </div>
          <div className="gt-summary">
            <div className="gt-sum-main">
              <div className="gt-sum-k">直近</div>
              <div className="gt-sum-v"><span className="gv-num">{latest.total}</span><span className="gt-sum-u">点</span></div>
              {prev &&
              <div className={`gt-sum-delta ${delta >= 0 ? 'up' : 'down'}`}>{delta >= 0 ? '▲' : '▼'} <span className="gv-num">{Math.abs(delta)}</span></div>
              }
            </div>
            <div className="gt-sum-sub">
              <div className="gt-sum-cell"><span className="k">平均</span><span className="v gv-num">{latest.avg}</span></div>
              <div className="gt-sum-cell acc"><span className="k">偏差値</span><span className="v gv-num">{latest.hensachi}</span></div>
            </div>
          </div>

          {tt.length > 14 &&
          <div className="gt-range">
              {[['直近12', 12], ['直近30', 30], ['全期間', 'all']].map(([lb, v]) =>
            <button key={lb} className={`gt-range-btn ${range === v ? 'on' : ''}`} onClick={() => setRange(v)}>{lb}</button>
            )}
              <span className="gt-range-count gv-num">{view.length} / {tt.length} 件</span>
            </div>
          }

          {view.length >= 2 ?
          <>
              <Measured h={220}>{(w) => <TotalTrendChart points={view} width={w} />}</Measured>
              <div className="gt-legend">
                <span className="gt-leg"><span className="gt-leg-line main" />合計点</span>
                <span className="gt-leg"><span className="gt-leg-line dash" />平均点</span>
                <span className="gt-leg"><span className="gt-leg-line acc" />偏差値 <span className="gv-en" style={{ opacity: .6 }}>(右軸)</span></span>
              </div>
            </> :

          <div className="gt-note">データが {view.length} 件のため、推移グラフは2件以上で表示されます。</div>
          }

          <div className="gt-tests">
            <div className="gt-tests-h"><span>テストごとの記録</span><span className="gt-tests-count gv-num">全 {tt.length} 件</span></div>
            <div className="gt-scroll">
              {[...tt].reverse().map((p, i) =>
              <div key={i} className="gt-test-row">
                  <span className="gt-test-date gv-num">{p.date.slice(5)}</span>
                  <span className="gt-test-name">{p.test}</span>
                  <span className="gt-test-score gv-num">{p.total}<small>点</small></span>
                  <span className="gt-test-hen gv-num">偏 {p.hensachi}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── 分野別の推移 ── */}
        <div className="gt-card">
          <div className="gt-card-head">
            <div className="gt-card-title">分野別の推移<span className="gt-card-title-sub">月次平均</span></div>
            <div className="gt-card-aux gv-en">{d.fields.length} 分野</div>
          </div>

          <div className="gt-vchips">
            {[['lines', '折れ線'], ['strengths', '得点傾向']].map(([v, lb]) =>
            <button key={v} className={`gt-chip-sub ${fv === v ? 'on' : ''}`} onClick={() => setFv(v)}>
                {fv === v && <span className="gt-chip-dot" />}{lb}
              </button>
            )}
          </div>

          {fv === 'lines' &&
          <>
              <div className="gt-presets">
                <button className="gt-preset" onClick={() => setSel(new Set(defaultFields(det, subject)))}>強弱6</button>
                <button className="gt-preset" onClick={() => setSel(new Set(d.fields))}>全て</button>
                <button className="gt-preset" onClick={() => setSel(new Set())}>クリア</button>
                <span className="gt-presets-count gv-num">{sel.size}/{d.fields.length}</span>
              </div>
              <Measured h={220}>{(w) => <FieldMultiChart months={months} fields={fieldSeries} width={w} />}</Measured>
              <div className="gt-legend">
                <span className="gt-leg"><span className="gt-leg-line solid-n" />得点率</span>
                <span className="gt-leg"><span className="gt-leg-line dash-n" />平均得点率</span>
                <span className="gt-leg"><span className="gt-leg-line thin-n" />偏差値 <span className="gv-en" style={{ opacity: .6 }}>(右軸)</span></span>
                <span className="gt-leg gt-leg-note">線の色＝分野</span>
              </div>
              <div className="gt-fieldchips">
                {d.fields.map((f) => {
                const on = sel.has(f);const c = colorForField(det, subject, f);
                const hasData = d.rate[f].some((v) => v != null);
                return (
                  <button key={f} className={`gt-fchip ${on ? 'on' : ''}`} onClick={() => toggleField(f)}
                  style={on ? { borderColor: c, color: c, background: c + '14' } : hasData ? undefined : { opacity: 0.5 }}>
                      <span className="gt-fchip-dot" style={{ background: on ? c : 'var(--c-text-mute)' }} />{f}
                    </button>);

              })}
              </div>

              <div className="gt-fd">
                <div className="gt-tests-h"><span>分野ごとの月次</span><span className="gt-tests-count gv-num">得点率 · 偏差値 / {order.length} 分野</span></div>
                {order.length ?
              <div className="gt-scroll">
                    {order.map((f) => {
                  const c = colorForField(det, subject, f);
                  const present = months.map((m, i) => ({ m, i })).filter(({ i }) => d.rate[f][i] != null);
                  return (
                    <div key={f} className="gt-fd-group">
                          <div className="gt-fd-name"><span className="gt-fchip-dot" style={{ background: c }} />{f}</div>
                          {present.map(({ m, i }) =>
                      <div key={i} className="gt-fd-row">
                              <span className="gt-fd-month gv-num">{monthShort(m)}</span>
                              <span className="gt-fd-rate gv-num">{d.rate[f][i]}<small>%</small></span>
                              <span className="gt-fd-hen gv-num">偏 {d.hensachi[f][i]}</span>
                            </div>
                      )}
                        </div>);

                })}
                  </div> :

              <div className="gt-note gt-note-soft">分野を選択すると、月毎の得点率・偏差値が一覧表示されます。</div>
              }
              </div>
              <div className="gt-note gt-note-soft">チップをクリックで分野の線を表示／非表示。初期は直近月の上位3・下位3分野。</div>
            </>
          }

          {fv === 'strengths' &&
          <>
            <div className="gt-seg gt-seg-sm">
              {METRICS.filter((m) => m.key !== 'avgRate').map((m) =>
              <button key={m.key} className={`gt-seg-btn ${m.key === swMetricKey ? 'on' : ''}`} onClick={() => setMetric(m.key)}>{m.label}</button>
              )}
            </div>
            <div className="gt-sw">
              <div className="gt-sw-col">
                <div className="gt-sw-h"><span className="gt-sw-badge strong">得意</span>直近の上位{cnt}</div>
                {strong.map(({ f, v, prev }) =>
              <div key={f} className="gt-sw-row">
                    <span className="gt-sw-bar" style={{ background: 'var(--c-primary)', width: `${Math.max(8, swMetric.unit === '%' ? v : v)}%` }} />
                    <span className="gt-sw-name">{f}</span>
                    <span className="gt-sw-v gv-num">{v}{swMetric.unit}</span>
                    <Delta2 v={prev != null ? v - prev : null} />
                  </div>
              )}
              </div>
              <div className="gt-sw-col">
                <div className="gt-sw-h"><span className="gt-sw-badge weak">苦手</span>直近の下位{cnt}</div>
                {weak.map(({ f, v, prev }) =>
              <div key={f} className="gt-sw-row">
                    <span className="gt-sw-bar" style={{ background: 'var(--c-accent)', width: `${Math.max(8, v)}%` }} />
                    <span className="gt-sw-name">{f}</span>
                    <span className="gt-sw-v gv-num">{v}{swMetric.unit}</span>
                    <Delta2 v={prev != null ? v - prev : null} />
                  </div>
              )}
              </div>
            </div>
            </>
          }
          {fv === 'strengths' &&
          <div className="gt-note gt-note-soft" style={{ marginTop: 14 }}>得点傾向は「直近の値がある月」で判定。平均得点率はクラス難易度の指標のため、この表示では除外しています。</div>
          }
        </div>
      </div>
      </div>
    </div>);

}

Object.assign(window, { StudentDetailScreen });