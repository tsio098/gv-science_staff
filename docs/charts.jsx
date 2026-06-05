/* teacher-charts.jsx — hand-drawn SVG charts for the teacher dashboard.
   No external chart libraries.  All charts measure their container width and
   draw in true pixels (1 user-unit = 1 CSS px) so they stay crisp & legible
   from a 320px phone to a 760px desktop card.

   Exports:
     Measured        — width-measuring wrapper: <Measured h={...}>{(w)=>…}</Measured>
     MiniSparkline   — tiny preview line (list rows)
     TotalTrendChart — score (left axis) + 偏差値 (right axis)
     FieldLineChart  — months on X, one line per field.  ★ 欠測月(null)を詰めて連続線★
     ClassHistogram  — 偏差値 distribution bars (クラス俯瞰)

   global: React, monthShort, dateShort */

// ── nice rounded axis bounds ──────────────────────────────
// clamp = { lo, hi } を渡すと、目盛りの最小/最大をその範囲内に収める（例: 0〜100）。
function bounds(values, padFrac = 0.12, step = 5, clamp = null) {
  const vs = values.filter(v => v != null);
  if (!vs.length) return clamp ? { min: clamp.lo, max: clamp.hi } : { min: 0, max: step };
  const lo = Math.min(...vs), hi = Math.max(...vs);
  const span = Math.max(hi - lo, step);
  let min = Math.floor((lo - span * padFrac) / step) * step;
  let max = Math.ceil((hi + span * padFrac) / step) * step;
  if (clamp) {
    min = Math.max(clamp.lo, min);
    max = Math.min(clamp.hi, max);
    if (max <= min) { min = Math.max(clamp.lo, Math.min(min, clamp.hi - step)); max = Math.min(clamp.hi, min + step); }
  }
  if (min === max) max = min + step;
  return { min, max };
}
function ticks(min, max, n = 4) {
  const out = [];
  for (let i = 0; i <= n; i++) out.push(Math.round(min + (max - min) * i / n));
  return out;
}

// ── Measured — re-renders children(width) whenever the box resizes ──
function Measured({ h, minW = 120, children }) {
  const ref = React.useRef(null);
  const [w, setW] = React.useState(0);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setW(el.clientWidth);
    update();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ width: '100%', minHeight: h }}>
      {w >= minW ? children(w) : null}
    </div>
  );
}

// ── MiniSparkline — tiny total-score preview for list rows ──
function MiniSparkline({ values, w = 64, h = 22, color = 'var(--c-primary-deep)' }) {
  const vs = (values || []).filter(v => v != null);
  if (vs.length < 2) return <svg width={w} height={h} aria-hidden="true" />;
  const { min, max } = bounds(vs, 0.18, 1);
  const n = vs.length;
  const x = (i) => 1.5 + (w - 3) * i / (n - 1);
  const y = (v) => 1.5 + (h - 3) * (1 - (v - min) / (max - min));
  const d = vs.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const last = n - 1;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" aria-hidden="true">
      <path d={`${d} L ${x(last).toFixed(1)} ${h} L ${x(0).toFixed(1)} ${h} Z`} fill={color} opacity="0.09" />
      <path d={d} stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(last)} cy={y(vs[last])} r="2.1" fill={color} />
    </svg>
  );
}

// ── TotalTrendChart — total (left) + average (dashed) + 偏差値 (right axis) ──
function TotalTrendChart({ points, width }) {
  const W = width;
  const H = Math.round(clampN(W * 0.46, 180, 300));
  const padL = 34, padR = 40, padT = 16, padB = 30;
  const iW = W - padL - padR, iH = H - padT - padB;
  const n = points.length;

  const scoreVals = points.flatMap(p => [p.total, p.avg]);
  const sB = bounds(scoreVals, 0.14, 5, { lo: 0, hi: 100 }); // 左軸（点）は 0〜100 に収める
  const hB = bounds(points.map(p => p.hensachi), 0.16, 5);

  const X = (i) => padL + (n === 1 ? iW / 2 : iW * i / (n - 1));
  const Ys = (v) => padT + iH * (1 - (v - sB.min) / (sB.max - sB.min));
  const Yh = (v) => padT + iH * (1 - (v - hB.min) / (hB.max - hB.min));

  const line = (vals, Y) => vals.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ');
  const totalD = line(points.map(p => p.total), Ys);
  const avgD = line(points.map(p => p.avg), Ys);
  const hensD = line(points.map(p => p.hensachi), Yh);
  const areaD = `${totalD} L ${X(n - 1).toFixed(1)} ${(padT + iH).toFixed(1)} L ${X(0).toFixed(1)} ${(padT + iH).toFixed(1)} Z`;

  const sT = ticks(sB.min, sB.max, 4);
  const hT = ticks(hB.min, hB.max, 4);
  // 点の間隔から「全点表示できるか」を判定。PC/タブレットの広い幅では 24件超でも
  // 間隔が確保できるため全点を表示する。狭い幅(スマホ)で潰れる時だけ間引く。
  const spacing = n > 1 ? iW / (n - 1) : iW;
  const showAllDots = spacing >= 6;
  const showHenDots = spacing >= 11;
  const dotR = spacing < 13 ? 2.1 : 3.2;
  const lineW = spacing < 10 ? 2.2 : 3;
  const maxLabels = Math.max(4, Math.min(10, Math.floor(iW / 56)));
  let xIdx;
  if (n <= maxLabels) xIdx = points.map((_, i) => i);
  else {
    const step = (n - 1) / (maxLabels - 1);
    xIdx = [...new Set(Array.from({ length: maxLabels }, (_, k) => Math.round(k * step)))];
  }

  return (
    <svg className="gt-chart" width="100%" height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="合計点の推移グラフ">
      {sT.map((t, i) => (
        <g key={`g${i}`}>
          <line x1={padL} y1={Ys(t)} x2={padL + iW} y2={Ys(t)} stroke="var(--c-divider)" strokeWidth="1" opacity="0.7" />
          <text x={padL - 7} y={Ys(t) + 3.5} textAnchor="end" className="gt-axis">{t}</text>
        </g>
      ))}
      {hT.map((t, i) => (
        <text key={`h${i}`} x={padL + iW + 7} y={Yh(t) + 3.5} textAnchor="start" className="gt-axis gt-axis-acc">{t}</text>
      ))}
      {xIdx.map((i) => (
        <text key={`x${i}`} x={X(i)} y={H - 9} textAnchor="middle" className="gt-axis">{dateShort(points[i].date)}</text>
      ))}

      <path d={areaD} fill="var(--c-primary)" opacity="0.08" />
      <path d={avgD} fill="none" stroke="var(--c-text-mute)" strokeWidth="1.6" strokeDasharray="3 3" strokeLinecap="round" opacity="0.85" />
      <path d={hensD} fill="none" stroke="var(--c-accent)" strokeWidth={spacing < 10 ? 1.4 : 1.8} strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
      <path d={totalD} fill="none" stroke="var(--c-primary-deep)" strokeWidth={lineW} strokeLinecap="round" strokeLinejoin="round" />

      {showHenDots && points.map((p, i) => (
        <circle key={`dh${i}`} cx={X(i)} cy={Yh(p.hensachi)} r="2.4" fill="#fff" stroke="var(--c-accent)" strokeWidth="1.4" opacity="0.7" />
      ))}
      {showAllDots && points.map((p, i) => (
        <circle key={`dt${i}`} cx={X(i)} cy={Ys(p.total)} r={dotR} fill="#fff" stroke="var(--c-primary-deep)" strokeWidth={dotR > 2.5 ? 2 : 1.6} />
      ))}
      {!showAllDots && (
        <circle cx={X(n - 1)} cy={Ys(points[n - 1].total)} r="3.4" fill="#fff" stroke="var(--c-primary-deep)" strokeWidth="2.2" />
      )}
    </svg>
  );
}

// ════════════════════════════════════════════════════════════
//  FieldLineChart — ★ 欠測月(null)を詰めて連続線にする ★ (§7-2)
//
//  series[i].values は months と同じ長さで、欠測月は null。
//  - X軸 = 「表示中のいずれかの分野に値がある月」の和集合だけを等間隔に並べる
//    （どの分野にも値が無い月は軸から取り除く）。
//  - 各分野の線は、自分に値がある月の点だけを順に直結（自分の欠測月は飛ばす）→
//    線は途切れない・補間しない。
//  例) 4,5,6,7月で 5月が欠測 → 軸は 4,6,7月 になり 4→6→7 を直結。
// ════════════════════════════════════════════════════════════
function FieldLineChart({ months, series, unit = '%', width, yFixed }) {
  const W = width;
  const H = Math.round(clampN(W * 0.42, 170, 280));
  const padL = 34, padR = 14, padT = 14, padB = 28;
  const iW = W - padL - padR, iH = H - padT - padB;

  // 表示中の分野に値がある月インデックスの和集合（昇順）
  const activeIdx = months
    .map((_, i) => i)
    .filter(i => series.some(s => s.values[i] != null));

  const K = activeIdx.length;
  const xLabels = activeIdx.map(i => months[i]);
  // month-index → 軸ポジション(0..K-1) の対応
  const posOf = {};
  activeIdx.forEach((i, p) => { posOf[i] = p; });

  const all = series.flatMap(s => s.values).filter(v => v != null);
  const B = yFixed || bounds(all.length ? all : [0, 100], 0.12, 5);
  const X = (p) => padL + (K <= 1 ? iW / 2 : iW * p / (K - 1));
  const Y = (v) => padT + iH * (1 - (v - B.min) / (B.max - B.min));
  const yT = ticks(B.min, B.max, 4);

  // 欠測（軸から除いた月 or 分野内の飛ばし）が存在するか → 注記表示用
  const hasGaps =
    K < months.length ||
    series.some(s => {
      const present = activeIdx.map(i => s.values[i]);
      // 値→null→値 のように内部で飛んでいるか
      let started = false, gapAfter = false;
      for (const v of present) {
        if (v != null) { if (gapAfter) return true; started = true; }
        else if (started) gapAfter = true;
      }
      return false;
    });

  return (
    <div>
      <svg className="gt-chart" width="100%" height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="分野別の推移グラフ">
        {yT.map((t, i) => (
          <g key={`g${i}`}>
            <line x1={padL} y1={Y(t)} x2={padL + iW} y2={Y(t)} stroke="var(--c-divider)" strokeWidth="1" opacity="0.7" />
            <text x={padL - 7} y={Y(t) + 3.5} textAnchor="end" className="gt-axis">{t}</text>
          </g>
        ))}
        {xLabels.map((m, p) => (
          <text key={`x${p}`} x={X(p)} y={H - 8} textAnchor="middle" className="gt-axis">{monthShort(m)}</text>
        ))}

        {series.length === 0 && (
          <text x={W / 2} y={H / 2} textAnchor="middle" className="gt-axis" style={{ fontSize: 12 }}>
            分野を選択してください
          </text>
        )}
        {series.length > 0 && K === 0 && (
          <text x={W / 2} y={H / 2} textAnchor="middle" className="gt-axis" style={{ fontSize: 12 }}>
            この指標のデータがありません
          </text>
        )}

        {series.map((s) => {
          // 自分に値がある軸ポジションの点だけを順に結ぶ（欠測は飛ばす）
          const pts = activeIdx
            .map((i, p) => (s.values[i] != null ? { p, v: s.values[i] } : null))
            .filter(Boolean);
          if (!pts.length) return null;
          const d = pts.map((pt, k) => `${k ? 'L' : 'M'}${X(pt.p).toFixed(1)} ${Y(pt.v).toFixed(1)}`).join(' ');
          return (
            <g key={s.name}>
              <path d={d} fill="none" stroke={s.color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              {pts.map((pt, k) => (
                <circle key={k} cx={X(pt.p)} cy={Y(pt.v)} r="2.8" fill="#fff" stroke={s.color} strokeWidth="1.7" />
              ))}
            </g>
          );
        })}
      </svg>
      {series.length > 0 && hasGaps && (
        <div className="gt-gapnote">
          {Icon && Icon.info ? Icon.info(13) : null}
          <span>欠測月は軸から外して詰め、存在する月だけを連続線で表示しています（補間なし）。</span>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  FieldMultiChart — 分野別の推移を「合計点グラフと同じ形」で表示。
//  選択した各分野について、得点率(実線)・平均得点率(破線)を左軸(%, 0〜100)、
//  偏差値(細線)を右軸に重ねる。線の色＝分野。欠測月(null)は詰めて連続線(§7-2)。
//  fields: [{ name, color, rate:[], avgRate:[], hensachi:[] }]（各配列は months と同長）
// ════════════════════════════════════════════════════════════
function FieldMultiChart({ months, fields, width }) {
  const W = width;
  const H = Math.round(clampN(W * 0.46, 190, 300));
  const padL = 34, padR = 40, padT = 16, padB = 28;
  const iW = W - padL - padR, iH = H - padT - padB;

  // どれかの分野で値がある月だけを軸に残す（和集合・昇順）
  const activeIdx = months
    .map((_, i) => i)
    .filter(i => fields.some(f => f.rate[i] != null || f.avgRate[i] != null || f.hensachi[i] != null));
  const K = activeIdx.length;
  const xLabels = activeIdx.map(i => months[i]);

  const pctVals = fields.flatMap(f => [...f.rate, ...f.avgRate]);
  const pB = bounds(pctVals, 0.10, 5, { lo: 0, hi: 100 });           // 左軸：得点率/平均得点率（0〜100）
  const hVals = fields.flatMap(f => f.hensachi);
  const hB = bounds(hVals.length ? hVals : [40, 60], 0.16, 5);       // 右軸：偏差値

  const X = (p) => padL + (K <= 1 ? iW / 2 : iW * p / (K - 1));
  const Yp = (v) => padT + iH * (1 - (v - pB.min) / (pB.max - pB.min));
  const Yh = (v) => padT + iH * (1 - (v - hB.min) / (hB.max - hB.min));
  const pT = ticks(pB.min, pB.max, 4);
  const hT = ticks(hB.min, hB.max, 4);

  // 値がある軸ポジションだけを直結（欠測は飛ばす）
  const lineFor = (vals, Y) => {
    const pts = activeIdx.map((i, p) => (vals[i] != null ? { p, v: vals[i] } : null)).filter(Boolean);
    return { d: pts.map((pt, k) => `${k ? 'L' : 'M'}${X(pt.p).toFixed(1)} ${Y(pt.v).toFixed(1)}`).join(' '), pts };
  };

  return (
    <svg className="gt-chart" width="100%" height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="分野別の推移グラフ（得点率・平均得点率・偏差値）">
      {pT.map((t, i) => (
        <g key={`g${i}`}>
          <line x1={padL} y1={Yp(t)} x2={padL + iW} y2={Yp(t)} stroke="var(--c-divider)" strokeWidth="1" opacity="0.7" />
          <text x={padL - 7} y={Yp(t) + 3.5} textAnchor="end" className="gt-axis">{t}</text>
        </g>
      ))}
      {hT.map((t, i) => (
        <text key={`h${i}`} x={padL + iW + 7} y={Yh(t) + 3.5} textAnchor="start" className="gt-axis gt-axis-acc">{t}</text>
      ))}
      {xLabels.map((m, p) => (
        <text key={`x${p}`} x={X(p)} y={H - 8} textAnchor="middle" className="gt-axis">{monthShort(m)}</text>
      ))}

      {fields.length === 0 && (
        <text x={W / 2} y={H / 2} textAnchor="middle" className="gt-axis" style={{ fontSize: 12 }}>分野を選択してください</text>
      )}
      {fields.length > 0 && K === 0 && (
        <text x={W / 2} y={H / 2} textAnchor="middle" className="gt-axis" style={{ fontSize: 12 }}>データがありません</text>
      )}

      {fields.map((f) => {
        const rate = lineFor(f.rate, Yp);
        const avg = lineFor(f.avgRate, Yp);
        const hen = lineFor(f.hensachi, Yh);
        return (
          <g key={f.name}>
            {hen.d && <path d={hen.d} fill="none" stroke={f.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.38" />}
            {avg.d && <path d={avg.d} fill="none" stroke={f.color} strokeWidth="1.6" strokeDasharray="3 3" strokeLinecap="round" opacity="0.7" />}
            {rate.d && <path d={rate.d} fill="none" stroke={f.color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />}
            {rate.pts.map((pt, k) => (
              <circle key={k} cx={X(pt.p)} cy={Yp(pt.v)} r="2.8" fill="#fff" stroke={f.color} strokeWidth="1.7" />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

// ── ClassHistogram — 偏差値 distribution across the cohort (クラス俯瞰) ──
function ClassHistogram({ values, width, highlight }) {
  const W = width;
  const H = 132;
  const padL = 8, padR = 8, padT = 14, padB = 22;
  const iW = W - padL - padR, iH = H - padT - padB;
  // bins: <40, 40-45, 45-50, 50-55, 55-60, 60-65, 65-70, 70+
  const edges = [40, 45, 50, 55, 60, 65, 70];
  const labels = ['~40', '40', '45', '50', '55', '60', '65', '70~'];
  const bins = new Array(edges.length + 1).fill(0);
  values.forEach(v => {
    let b = 0;
    while (b < edges.length && v >= edges[b]) b++;
    bins[b]++;
  });
  const maxC = Math.max(1, ...bins);
  const nb = bins.length;
  const bw = iW / nb;
  const hiBin = highlight != null ? (() => { let b = 0; while (b < edges.length && highlight >= edges[b]) b++; return b; })() : -1;

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="偏差値の分布">
      {bins.map((c, i) => {
        const bh = iH * c / maxC;
        const x = padL + bw * i + 2.5;
        const w = bw - 5;
        const y = padT + (iH - bh);
        const on = i === hiBin;
        return (
          <g key={i}>
            {c > 0 && (
              <rect x={x} y={y} width={w} height={bh} rx="3"
                fill={on ? 'var(--c-accent)' : 'var(--c-primary)'} opacity={on ? 0.9 : 0.32} />
            )}
            {c > 0 && (
              <text x={x + w / 2} y={y - 4} textAnchor="middle" className="gt-axis" style={{ fontSize: 10, fill: on ? 'var(--c-accent)' : 'var(--c-text-sub)' }}>{c}</text>
            )}
            <line x1={padL + bw * i} y1={padT + iH} x2={padL + bw * i} y2={padT + iH + 3} stroke="var(--c-divider)" strokeWidth="1" />
            <text x={padL + bw * i} y={H - 6} textAnchor="middle" className="gt-axis" style={{ fontSize: 9.5 }}>{labels[i]}</text>
          </g>
        );
      })}
      <line x1={padL} y1={padT + iH} x2={W - padR} y2={padT + iH} stroke="var(--c-divider)" strokeWidth="1" />
    </svg>
  );
}

function clampN(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

Object.assign(window, { Measured, MiniSparkline, TotalTrendChart, FieldLineChart, FieldMultiChart, ClassHistogram });
