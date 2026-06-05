/* teacher-list.jsx — 生徒一覧（ホーム）。一覧を俯瞰 → 個人詳細へ。
   レイアウトは Tweak で table / cards / hybrid を切替。
   検索・科目フィルタ・ソート・要注目フラグ・クラス俯瞰・状態を備える。

   global: React, Icon, STUDENTS, SUBJECT_META, SUBJECT_ORDER,
           Measured, MiniSparkline, ClassHistogram, dateMD, daysAgoLabel */

// 偏差値の前回比デルタ表示
function Delta({ v, suffix = '' }) {
  const cls = v > 0.05 ? 'up' : v < -0.05 ? 'down' : 'flat';
  const arrow = v > 0.05 ? '▲' : v < -0.05 ? '▼' : '－';
  const num = v === 0 ? '0' : `${Math.abs(v)}`;
  return <span className={`tw-delta ${cls} gv-num`}>{arrow}{cls !== 'flat' ? num : ''}{suffix}</span>;
}

function SubjStat({ subj, s }) {
  const m = SUBJECT_META[subj];
  return (
    <div className="tw-sstat">
      <div className="tw-sstat-top">
        <span className="tw-sstat-lbl"><span className="sdot" style={{ background: m.color }} />{m.label}</span>
      </div>
      <div className="tw-sstat-mid">
        <span className="tw-sstat-hen gv-num"><small>偏</small>{s.lastHensachi}</span>
        <Delta v={s.deltaHensachi} />
      </div>
      <div className="tw-sstat-bot">直近 <b>{s.lastTotal}</b>点</div>
      {s.absence != null && (
        <div className={`tw-sstat-abs ${absLevel(s.absence)}`}>
          <span className="k">欠席率</span>
          <b className="gv-num">{absFmt(s.absence)}<small>%</small></b>
        </div>
      )}
    </div>
  );
}

function FlagBadges({ flags }) {
  return (
    <>
      {flags.declining && <span className="tw-flag declining"><span className="fdot" />要注目 · 下降</span>}
      {flags.stale && <span className="tw-flag stale"><span className="fdot" />長期未受験</span>}
    </>
  );
}

function Avatar({ name }) {
  return <div className="tw-name-av">{name.replace(/\s/g, '').slice(0, 1)}</div>;
}

// 氏名 + 学年 + 担任 + フラグ（table / card / hybrid 共通）
function NameMain({ st }) {
  return (
    <div className="tw-name-main">
      <div className="tw-name-t">{st.name}<span className="tw-name-grade">{st.grade}</span></div>
      <div className="tw-name-flags">
        <span className="tw-hr-chip">担任 {st.homeroom}</span>
        <FlagBadges flags={st.flags} />
      </div>
    </div>
  );
}

// ── sorting ───────────────────────────────────────────────
// 実データの学年表記（"既卒" / "H3"）にも対応。未知の値は末尾へ。
const GRADE_ORDER = { '既卒': -1, '高3': 0, 'H3': 0, '高2': 1, 'H2': 1, '高1': 2, 'H1': 2 };
const gradeRank = (g) => (GRADE_ORDER[g] != null ? GRADE_ORDER[g] : 99);
const SORTS = [
  { key: 'name', label: '名前順' },
  { key: 'homeroom', label: '担任順' },
  { key: 'grade', label: '学年順（高3→高1）' },
  { key: 'subject', label: '科目順' },
  { key: 'hensachi', label: '直近偏差値が高い順' },
  { key: 'drop', label: '前回比 · 落ち込み順' },
  { key: 'recent', label: '最終受験が新しい順' },
];
function bestHensachi(st) { return Math.max(...st.subjects.map(s => st.perSubject[s].lastHensachi)); }
function firstSubjectIdx(st) { return Math.min(...st.subjects.map(s => SUBJECT_ORDER.indexOf(s))); }
function sortStudents(list, key) {
  const arr = [...list];
  const byName = (a, b) => a.name.localeCompare(b.name, 'ja');
  if (key === 'name') return arr.sort(byName);
  if (key === 'homeroom') return arr.sort((a, b) => a.homeroom.localeCompare(b.homeroom, 'ja') || byName(a, b));
  if (key === 'grade') return arr.sort((a, b) => (gradeRank(a.grade) - gradeRank(b.grade)) || byName(a, b));
  if (key === 'subject') return arr.sort((a, b) => (firstSubjectIdx(a) - firstSubjectIdx(b)) || byName(a, b));
  if (key === 'hensachi') return arr.sort((a, b) => bestHensachi(b) - bestHensachi(a));
  if (key === 'drop') return arr.sort((a, b) => a.worstDelta - b.worstDelta);
  if (key === 'recent') return arr.sort((a, b) => b.daysSince - a.daysSince ? a.daysSince - b.daysSince : 0);
  return arr;
}

// ── class overview (補助) ─────────────────────────────────
function ClassOverview({ subject, students }) {
  const m = SUBJECT_META[subject];
  const vals = students.filter(s => s.subjects.includes(subject)).map(s => s.perSubject[subject].lastHensachi);
  if (!vals.length) return null;
  const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10;
  const max = Math.max(...vals), min = Math.min(...vals);
  const rising = students.filter(s => s.subjects.includes(subject) && s.perSubject[subject].deltaHensachi > 0.05).length;
  return (
    <div className="tw-overview">
      <div className="tw-overview-head">
        <span className="sdot" style={{ background: m.color }} />
        <span className="t1">{m.label} · クラス俯瞰</span>
        <span className="aux gv-num">{vals.length} 名 · 直近偏差値の分布</span>
      </div>
      <div className="tw-overview-grid">
        <Measured h={132}>{(w) => <ClassHistogram values={vals} width={w} highlight={avg} />}</Measured>
        <div>
          <div className="tw-overview-stats">
            <div className="tw-ostat"><div className="k">平均偏差値</div><div className="v acc gv-num">{avg}</div></div>
            <div className="tw-ostat"><div className="k">最高 / 最低</div><div className="v gv-num">{max}<span style={{ fontSize: 14, color: 'var(--c-text-mute)' }}> / {min}</span></div></div>
            <div className="tw-ostat"><div className="k">前回比 上昇</div><div className="v gv-num">{rising}<span style={{ fontSize: 14, color: 'var(--c-text-mute)' }}> 名</span></div></div>
          </div>
          <div className="tw-overview-hint">オレンジの帯＝クラス平均偏差値の位置。個別の推移は生徒をクリックして確認できます。</div>
        </div>
      </div>
    </div>
  );
}

// ── table layout ──────────────────────────────────────────
function TableView({ students, onOpen }) {
  return (
    <div className="tw-tablecard">
      <div className="tw-tablescroll">
        <table className="tw-table">
          <thead>
            <tr>
              <th>生徒</th>
              <th>履修科目</th>
              <th>科目別 · 直近偏差値 / 前回比 / 合計点</th>
              <th>最終受験</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {students.map((st) => {
              const flagged = st.flags.declining || st.flags.stale;
              return (
                <tr key={st.name} className={flagged ? 'flagged' : ''} onClick={() => onOpen(st.name)}>
                  <td>
                    <div className="tw-name">
                      <Avatar name={st.name} />
                      <NameMain st={st} />
                    </div>
                  </td>
                  <td>
                    <div className="tw-subjchips">
                      {st.subjects.map(s => (
                        <span key={s} className="tw-subjchip">
                          <span className="sdot" style={{ background: SUBJECT_META[s].color }} />{SUBJECT_META[s].label}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="tw-stats-cell">
                      {st.subjects.map(s => <SubjStat key={s} subj={s} s={st.perSubject[s]} />)}
                    </div>
                  </td>
                  <td>
                    <div className="tw-lastdate gv-num">
                      {dateMD(st.lastExamDate)}
                      <span className="ago">{daysAgoLabel(st.daysSince)}</span>
                    </div>
                  </td>
                  <td className="tw-chevcell">{Icon.chevR(14)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── card layout ───────────────────────────────────────────
function CardView({ students, onOpen }) {
  return (
    <div className="tw-cards">
      {students.map((st) => {
        const flagged = st.flags.declining || st.flags.stale;
        return (
          <div key={st.name} className={`tw-card ${flagged ? 'flagged' : ''}`} onClick={() => onOpen(st.name)}>
            <div className="tw-card-head">
              <Avatar name={st.name} />
              <NameMain st={st} />
            </div>
            <div className="tw-card-subjects">
              {st.subjects.map(s => {
                const ss = st.perSubject[s]; const m = SUBJECT_META[s];
                return (
                  <div key={s} className="tw-card-srow">
                    <span className="lbl"><span className="sdot" style={{ background: m.color }} />{m.label}</span>
                    <span className="mid">
                      <span className="hen gv-num" style={{ color: m.color }}><small>偏</small>{ss.lastHensachi}</span>
                      <Delta v={ss.deltaHensachi} />
                      <span className="tot">直近 <b>{ss.lastTotal}</b>点</span>
                      {ss.absence != null && (
                        <span className={`tw-card-abs ${absLevel(ss.absence)}`}>欠席 <b className="gv-num">{absFmt(ss.absence)}<small>%</small></b></span>
                      )}
                    </span>
                    <span className="spark"><MiniSparkline values={ss.spark} color={m.color} /></span>
                  </div>
                );
              })}
            </div>
            <div className="tw-card-foot">
              <span className="gv-num">最終受験 {dateMD(st.lastExamDate)} · {daysAgoLabel(st.daysSince)}</span>
              <span className="open">推移を見る {Icon.chevR(12)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── hybrid layout ─────────────────────────────────────────
function HybridView({ students, onOpen }) {
  return (
    <div className="tw-hybrid">
      {students.map((st) => {
        const flagged = st.flags.declining || st.flags.stale;
        return (
          <div key={st.name} className={`tw-hrow ${flagged ? 'flagged' : ''}`} onClick={() => onOpen(st.name)}>
            <div className="tw-hrow-id">
              <Avatar name={st.name} />
              <NameMain st={st} />
            </div>
            <div className="tw-hrow-stats">
              {st.subjects.map(s => <SubjStat key={s} subj={s} s={st.perSubject[s]} />)}
            </div>
            <div className="tw-hrow-meta">
              <div className="tw-lastdate gv-num">{dateMD(st.lastExamDate)}<span className="ago">{daysAgoLabel(st.daysSince)}</span></div>
              <span className="tw-chevcell">{Icon.chevR(14)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── skeletons ─────────────────────────────────────────────
function ListSkeleton({ layout }) {
  if (layout === 'cards') {
    return (
      <div className="tw-cards">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="tw-skel-card">
            <div style={{ display: 'flex', gap: 11, alignItems: 'center' }}>
              <div className="tw-skel-row" style={{ width: 34, height: 34, borderRadius: 10 }} />
              <div className="tw-skel-row" style={{ width: '50%' }} />
            </div>
            <div className="tw-skel-row" style={{ height: 38 }} />
            <div className="tw-skel-row" style={{ height: 38 }} />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="tw-tablecard" style={{ padding: 16 }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '12px 4px' }}>
          <div className="tw-skel-row" style={{ width: 34, height: 34, borderRadius: 10, flex: 'none' }} />
          <div className="tw-skel-row" style={{ width: '20%' }} />
          <div className="tw-skel-row" style={{ width: '24%' }} />
          <div className="tw-skel-row" style={{ flex: 1 }} />
          <div className="tw-skel-row" style={{ width: 56, flex: 'none' }} />
        </div>
      ))}
    </div>
  );
}

// ── 一覧の絞り込み/並べ替えを保持（ブラウザ戻りで一覧に戻っても解除されないように）──
//   sessionStorage に保存し、画面の再マウント時に復元する（タブを閉じると破棄）。
const LIST_PREF = {
  get(k, d) { try { const v = sessionStorage.getItem('gv-listpref:' + k); return v == null ? d : v; } catch (e) { return d; } },
  set(k, v) { try { sessionStorage.setItem('gv-listpref:' + k, v); } catch (e) {} },
};

// ── the screen ────────────────────────────────────────────
function StudentListScreen({ nav, query, layout = 'table', state = 'normal', density, showOverview = true }) {
  const [subjectFilter, setSubjectFilter] = React.useState(() => LIST_PREF.get('subjectFilter', 'all'));
  const [homeroomFilter, setHomeroomFilter] = React.useState(() => LIST_PREF.get('homeroomFilter', 'all'));
  const [sort, setSort] = React.useState(() => LIST_PREF.get('sort', 'name'));

  // 変更を保存（次回マウント＝戻り時に復元される）
  React.useEffect(() => { LIST_PREF.set('subjectFilter', subjectFilter); }, [subjectFilter]);
  React.useEffect(() => { LIST_PREF.set('homeroomFilter', homeroomFilter); }, [homeroomFilter]);
  React.useEffect(() => { LIST_PREF.set('sort', sort); }, [sort]);

  // filter by search query (header) + subject + homeroom
  const q = (query || '').trim();
  let list = STUDENTS.filter(st => {
    if (subjectFilter !== 'all' && !st.subjects.includes(subjectFilter)) return false;
    if (homeroomFilter !== 'all' && st.homeroom !== homeroomFilter) return false;
    if (q && !st.name.replace(/\s/g, '').includes(q.replace(/\s/g, ''))) return false;
    return true;
  });
  list = sortStudents(list, sort);

  const flaggedCount = list.filter(s => s.flags.declining || s.flags.stale).length;

  return (
    <div className="tw-main">
      <div className="tw-pagehead">
        <div className="tw-eyebrow">REPORT · 生徒一覧</div>
        <div className="tw-pagehead-row">
          <h1 className="tw-title">成績<span className="accent">一覧</span></h1>
          <div className="tw-subtitle gv-num">
            {STUDENTS.length} 名を担当{flaggedCount > 0 && <span> · <span style={{ color: 'var(--c-accent)', fontWeight: 600 }}>{flaggedCount} 名 要注目</span></span>}
          </div>
        </div>
      </div>

      {/* toolbar */}
      <div className="tw-toolbar">
        <div className="tw-filters">
          <button className={`tw-fchip ${subjectFilter === 'all' ? 'on' : ''}`} onClick={() => setSubjectFilter('all')}>全科目</button>
          {SUBJECT_ORDER.map(s => {
            const m = SUBJECT_META[s];
            const on = subjectFilter === s;
            return (
              <button key={s} className={`tw-fchip subj ${on ? 'on' : ''}`} style={on ? { ['--sc']: m.color } : undefined} onClick={() => setSubjectFilter(on ? 'all' : s)}>
                <span className="sdot" style={{ background: m.color }} />{m.label}
              </button>
            );
          })}
        </div>
        <div className="tw-toolbar-right">
          <span className="tw-count gv-num">{list.length} 件表示</span>
          <div className="tw-sort">
            <span>担任</span>
            <select value={homeroomFilter} onChange={(e) => setHomeroomFilter(e.target.value)}>
              <option value="all">全担任</option>
              {HOMEROOMS.map(h => <option key={h} value={h}>{h} 先生</option>)}
            </select>
          </div>
          <div className="tw-sort">
            <span>並べ替え</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              {SORTS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* class overview (補助・科目選択時) */}
      {showOverview && subjectFilter !== 'all' && state === 'normal' && (
        <ClassOverview subject={subjectFilter} students={STUDENTS} />
      )}

      {/* states */}
      {state === 'loading' && (
        <>
          <ListSkeleton layout={layout} />
          <div className="tw-loadwrap"><div className="spinner" /><span>生徒データを読み込み中…</span></div>
        </>
      )}

      {state === 'empty' && (
        <div className="tw-empty">
          <div className="tw-empty-ic">{Icon.user(28)}</div>
          <div className="tw-empty-t1">担当生徒がまだいません</div>
          <div className="tw-empty-t2">生徒が点数報告を始めると、ここに一覧で表示されます。<br />配布リンク・トークンの状況は管理者にご確認ください。</div>
        </div>
      )}

      {state === 'error' && (
        <div className="tw-empty">
          <div className="tw-empty-ic" style={{ background: 'var(--c-accent-soft)', color: '#9A4309' }}>{Icon.alert(26)}</div>
          <div className="tw-empty-t1">データを取得できませんでした</div>
          <div className="tw-empty-t2">通信環境を確認して、もう一度お試しください。</div>
          <button className="btn btn-quiet btn-sm" onClick={() => {}}>{Icon.refresh(16)}<span style={{ marginLeft: 6 }}>もう一度試す</span></button>
        </div>
      )}

      {state === 'normal' && (
        list.length === 0 ? (
          <div className="tw-empty">
            <div className="tw-empty-ic" style={{ background: 'var(--c-bg-warm)', color: 'var(--c-text-mute)' }}>{Icon.search(26)}</div>
            <div className="tw-empty-t1">該当する生徒がいません</div>
            <div className="tw-empty-t2">検索条件・科目フィルタを変えてお試しください。</div>
          </div>
        ) : (
          <>
            {layout === 'table' && <TableView students={list} onOpen={(n) => nav('student', n)} />}
            {layout === 'cards' && <CardView students={list} onOpen={(n) => nav('student', n)} />}
            {layout === 'hybrid' && <HybridView students={list} onOpen={(n) => nav('student', n)} />}
          </>
        )
      )}
    </div>
  );
}

Object.assign(window, { StudentListScreen });
