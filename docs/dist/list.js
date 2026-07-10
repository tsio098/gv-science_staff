function Delta({
  v,
  suffix = ''
}) {
  const cls = v > 0.05 ? 'up' : v < -0.05 ? 'down' : 'flat';
  const arrow = v > 0.05 ? '▲' : v < -0.05 ? '▼' : '－';
  const num = v === 0 ? '0' : `${Math.abs(v)}`;
  return React.createElement("span", {
    className: `tw-delta ${cls} gv-num`
  }, arrow, cls !== 'flat' ? num : '', suffix);
}
function SubjStat({
  subj,
  s
}) {
  const m = SUBJECT_META[subj];
  return React.createElement("div", {
    className: "tw-sstat"
  }, React.createElement("div", {
    className: "tw-sstat-top"
  }, React.createElement("span", {
    className: "tw-sstat-lbl"
  }, React.createElement("span", {
    className: "sdot",
    style: {
      background: m.color
    }
  }), m.label)), React.createElement("div", {
    className: "tw-sstat-mid"
  }, React.createElement("span", {
    className: "tw-sstat-hen gv-num"
  }, React.createElement("small", null, "偏"), s.lastHensachi), React.createElement(Delta, {
    v: s.deltaHensachi
  })), React.createElement("div", {
    className: "tw-sstat-bot"
  }, "直近 ", React.createElement("b", null, s.lastTotal), "点"), s.absence != null && React.createElement("div", {
    className: `tw-sstat-abs ${absLevel(s.absence)}`
  }, React.createElement("span", {
    className: "k"
  }, "欠席率"), React.createElement("b", {
    className: "gv-num"
  }, absFmt(s.absence), React.createElement("small", null, "%"))));
}
function FlagBadges({
  flags
}) {
  return React.createElement(React.Fragment, null, flags.declining && React.createElement("span", {
    className: "tw-flag declining"
  }, React.createElement("span", {
    className: "fdot"
  }), "要注目 · 下降"), flags.stale && React.createElement("span", {
    className: "tw-flag stale"
  }, React.createElement("span", {
    className: "fdot"
  }), "長期未受験"));
}
function Avatar({
  name
}) {
  return React.createElement("div", {
    className: "tw-name-av"
  }, name.replace(/\s/g, '').slice(0, 1));
}
function NameMain({
  st
}) {
  return React.createElement("div", {
    className: "tw-name-main"
  }, React.createElement("div", {
    className: "tw-name-t"
  }, st.name, React.createElement("span", {
    className: "tw-name-grade"
  }, st.grade)), React.createElement("div", {
    className: "tw-name-flags"
  }, React.createElement("span", {
    className: "tw-hr-chip"
  }, "担任 ", st.homeroom), React.createElement(FlagBadges, {
    flags: st.flags
  })));
}
const GRADE_ORDER = {
  '既卒': -1,
  '高3': 0,
  'H3': 0,
  '高2': 1,
  'H2': 1,
  '高1': 2,
  'H1': 2
};
const gradeRank = g => GRADE_ORDER[g] != null ? GRADE_ORDER[g] : 99;
const SORTS = [{
  key: 'name',
  label: '名前順'
}, {
  key: 'homeroom',
  label: '担任順'
}, {
  key: 'grade',
  label: '学年順（高3→高1）'
}, {
  key: 'subject',
  label: '科目順'
}, {
  key: 'hensachi',
  label: '直近偏差値が高い順'
}, {
  key: 'drop',
  label: '前回比 · 落ち込み順'
}, {
  key: 'recent',
  label: '最終受験が新しい順'
}];
function bestHensachi(st) {
  return Math.max(...st.subjects.map(s => st.perSubject[s].lastHensachi));
}
function firstSubjectIdx(st) {
  return Math.min(...st.subjects.map(s => SUBJECT_ORDER.indexOf(s)));
}
function sortStudents(list, key) {
  const arr = [...list];
  const byName = (a, b) => a.name.localeCompare(b.name, 'ja');
  if (key === 'name') return arr.sort(byName);
  if (key === 'homeroom') return arr.sort((a, b) => a.homeroom.localeCompare(b.homeroom, 'ja') || byName(a, b));
  if (key === 'grade') return arr.sort((a, b) => gradeRank(a.grade) - gradeRank(b.grade) || byName(a, b));
  if (key === 'subject') return arr.sort((a, b) => firstSubjectIdx(a) - firstSubjectIdx(b) || byName(a, b));
  if (key === 'hensachi') return arr.sort((a, b) => bestHensachi(b) - bestHensachi(a));
  if (key === 'drop') return arr.sort((a, b) => a.worstDelta - b.worstDelta);
  if (key === 'recent') return arr.sort((a, b) => b.daysSince - a.daysSince ? a.daysSince - b.daysSince : 0);
  return arr;
}
function ClassOverview({
  subject,
  students
}) {
  const m = SUBJECT_META[subject];
  const vals = students.filter(s => s.subjects.includes(subject)).map(s => s.perSubject[subject].lastHensachi);
  if (!vals.length) return null;
  const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10;
  const max = Math.max(...vals),
    min = Math.min(...vals);
  const rising = students.filter(s => s.subjects.includes(subject) && s.perSubject[subject].deltaHensachi > 0.05).length;
  return React.createElement("div", {
    className: "tw-overview"
  }, React.createElement("div", {
    className: "tw-overview-head"
  }, React.createElement("span", {
    className: "sdot",
    style: {
      background: m.color
    }
  }), React.createElement("span", {
    className: "t1"
  }, m.label, " · クラス俯瞰"), React.createElement("span", {
    className: "aux gv-num"
  }, vals.length, " 名 · 直近偏差値の分布")), React.createElement("div", {
    className: "tw-overview-grid"
  }, React.createElement(Measured, {
    h: 132
  }, w => React.createElement(ClassHistogram, {
    values: vals,
    width: w,
    highlight: avg
  })), React.createElement("div", null, React.createElement("div", {
    className: "tw-overview-stats"
  }, React.createElement("div", {
    className: "tw-ostat"
  }, React.createElement("div", {
    className: "k"
  }, "平均偏差値"), React.createElement("div", {
    className: "v acc gv-num"
  }, avg)), React.createElement("div", {
    className: "tw-ostat"
  }, React.createElement("div", {
    className: "k"
  }, "最高 / 最低"), React.createElement("div", {
    className: "v gv-num"
  }, max, React.createElement("span", {
    style: {
      fontSize: 14,
      color: 'var(--c-text-mute)'
    }
  }, " / ", min))), React.createElement("div", {
    className: "tw-ostat"
  }, React.createElement("div", {
    className: "k"
  }, "前回比 上昇"), React.createElement("div", {
    className: "v gv-num"
  }, rising, React.createElement("span", {
    style: {
      fontSize: 14,
      color: 'var(--c-text-mute)'
    }
  }, " 名")))), React.createElement("div", {
    className: "tw-overview-hint"
  }, "オレンジの帯＝クラス平均偏差値の位置。個別の推移は生徒をクリックして確認できます。"))));
}
function TableView({
  students,
  onOpen
}) {
  return React.createElement("div", {
    className: "tw-tablecard"
  }, React.createElement("div", {
    className: "tw-tablescroll"
  }, React.createElement("table", {
    className: "tw-table"
  }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", null, "生徒"), React.createElement("th", null, "履修科目"), React.createElement("th", null, "科目別 · 直近偏差値 / 前回比 / 合計点"), React.createElement("th", null, "最終受験"), React.createElement("th", null))), React.createElement("tbody", null, students.map(st => {
    const flagged = st.flags.declining || st.flags.stale;
    return React.createElement("tr", {
      key: st.name,
      className: flagged ? 'flagged' : '',
      onClick: () => onOpen(st.name)
    }, React.createElement("td", null, React.createElement("div", {
      className: "tw-name"
    }, React.createElement(Avatar, {
      name: st.name
    }), React.createElement(NameMain, {
      st: st
    }))), React.createElement("td", null, React.createElement("div", {
      className: "tw-subjchips"
    }, st.subjects.map(s => React.createElement("span", {
      key: s,
      className: "tw-subjchip"
    }, React.createElement("span", {
      className: "sdot",
      style: {
        background: SUBJECT_META[s].color
      }
    }), SUBJECT_META[s].label)))), React.createElement("td", null, React.createElement("div", {
      className: "tw-stats-cell"
    }, st.subjects.map(s => React.createElement(SubjStat, {
      key: s,
      subj: s,
      s: st.perSubject[s]
    })))), React.createElement("td", null, React.createElement("div", {
      className: "tw-lastdate gv-num"
    }, dateMD(st.lastExamDate), React.createElement("span", {
      className: "ago"
    }, daysAgoLabel(st.daysSince)))), React.createElement("td", {
      className: "tw-chevcell"
    }, Icon.chevR(14)));
  })))));
}
function CardView({
  students,
  onOpen
}) {
  return React.createElement("div", {
    className: "tw-cards"
  }, students.map(st => {
    const flagged = st.flags.declining || st.flags.stale;
    return React.createElement("div", {
      key: st.name,
      className: `tw-card ${flagged ? 'flagged' : ''}`,
      onClick: () => onOpen(st.name)
    }, React.createElement("div", {
      className: "tw-card-head"
    }, React.createElement(Avatar, {
      name: st.name
    }), React.createElement(NameMain, {
      st: st
    })), React.createElement("div", {
      className: "tw-card-subjects"
    }, st.subjects.map(s => {
      const ss = st.perSubject[s];
      const m = SUBJECT_META[s];
      return React.createElement("div", {
        key: s,
        className: "tw-card-srow"
      }, React.createElement("span", {
        className: "lbl"
      }, React.createElement("span", {
        className: "sdot",
        style: {
          background: m.color
        }
      }), m.label), React.createElement("span", {
        className: "mid"
      }, React.createElement("span", {
        className: "hen gv-num",
        style: {
          color: m.color
        }
      }, React.createElement("small", null, "偏"), ss.lastHensachi), React.createElement(Delta, {
        v: ss.deltaHensachi
      }), React.createElement("span", {
        className: "tot"
      }, "直近 ", React.createElement("b", null, ss.lastTotal), "点"), ss.absence != null && React.createElement("span", {
        className: `tw-card-abs ${absLevel(ss.absence)}`
      }, "欠席 ", React.createElement("b", {
        className: "gv-num"
      }, absFmt(ss.absence), React.createElement("small", null, "%")))), React.createElement("span", {
        className: "spark"
      }, React.createElement(MiniSparkline, {
        values: ss.spark,
        color: m.color
      })));
    })), React.createElement("div", {
      className: "tw-card-foot"
    }, React.createElement("span", {
      className: "gv-num"
    }, "最終受験 ", dateMD(st.lastExamDate), " · ", daysAgoLabel(st.daysSince)), React.createElement("span", {
      className: "open"
    }, "推移を見る ", Icon.chevR(12))));
  }));
}
function HybridView({
  students,
  onOpen
}) {
  return React.createElement("div", {
    className: "tw-hybrid"
  }, students.map(st => {
    const flagged = st.flags.declining || st.flags.stale;
    return React.createElement("div", {
      key: st.name,
      className: `tw-hrow ${flagged ? 'flagged' : ''}`,
      onClick: () => onOpen(st.name)
    }, React.createElement("div", {
      className: "tw-hrow-id"
    }, React.createElement(Avatar, {
      name: st.name
    }), React.createElement(NameMain, {
      st: st
    })), React.createElement("div", {
      className: "tw-hrow-stats"
    }, st.subjects.map(s => React.createElement(SubjStat, {
      key: s,
      subj: s,
      s: st.perSubject[s]
    }))), React.createElement("div", {
      className: "tw-hrow-meta"
    }, React.createElement("div", {
      className: "tw-lastdate gv-num"
    }, dateMD(st.lastExamDate), React.createElement("span", {
      className: "ago"
    }, daysAgoLabel(st.daysSince))), React.createElement("span", {
      className: "tw-chevcell"
    }, Icon.chevR(14))));
  }));
}
function ListSkeleton({
  layout
}) {
  if (layout === 'cards') {
    return React.createElement("div", {
      className: "tw-cards"
    }, Array.from({
      length: 6
    }).map((_, i) => React.createElement("div", {
      key: i,
      className: "tw-skel-card"
    }, React.createElement("div", {
      style: {
        display: 'flex',
        gap: 11,
        alignItems: 'center'
      }
    }, React.createElement("div", {
      className: "tw-skel-row",
      style: {
        width: 34,
        height: 34,
        borderRadius: 10
      }
    }), React.createElement("div", {
      className: "tw-skel-row",
      style: {
        width: '50%'
      }
    })), React.createElement("div", {
      className: "tw-skel-row",
      style: {
        height: 38
      }
    }), React.createElement("div", {
      className: "tw-skel-row",
      style: {
        height: 38
      }
    }))));
  }
  return React.createElement("div", {
    className: "tw-tablecard",
    style: {
      padding: 16
    }
  }, Array.from({
    length: 8
  }).map((_, i) => React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      gap: 16,
      alignItems: 'center',
      padding: '12px 4px'
    }
  }, React.createElement("div", {
    className: "tw-skel-row",
    style: {
      width: 34,
      height: 34,
      borderRadius: 10,
      flex: 'none'
    }
  }), React.createElement("div", {
    className: "tw-skel-row",
    style: {
      width: '20%'
    }
  }), React.createElement("div", {
    className: "tw-skel-row",
    style: {
      width: '24%'
    }
  }), React.createElement("div", {
    className: "tw-skel-row",
    style: {
      flex: 1
    }
  }), React.createElement("div", {
    className: "tw-skel-row",
    style: {
      width: 56,
      flex: 'none'
    }
  }))));
}
const LIST_PREF = {
  get(k, d) {
    try {
      const v = sessionStorage.getItem('gv-listpref:' + k);
      return v == null ? d : v;
    } catch (e) {
      return d;
    }
  },
  set(k, v) {
    try {
      sessionStorage.setItem('gv-listpref:' + k, v);
    } catch (e) {}
  }
};
function StudentListScreen({
  nav,
  query,
  layout = 'table',
  state = 'normal',
  density,
  showOverview = true
}) {
  const [subjectFilter, setSubjectFilter] = React.useState(() => LIST_PREF.get('subjectFilter', 'all'));
  const [homeroomFilter, setHomeroomFilter] = React.useState(() => LIST_PREF.get('homeroomFilter', 'all'));
  const [sort, setSort] = React.useState(() => LIST_PREF.get('sort', 'name'));
  React.useEffect(() => {
    LIST_PREF.set('subjectFilter', subjectFilter);
  }, [subjectFilter]);
  React.useEffect(() => {
    LIST_PREF.set('homeroomFilter', homeroomFilter);
  }, [homeroomFilter]);
  React.useEffect(() => {
    LIST_PREF.set('sort', sort);
  }, [sort]);
  const q = (query || '').trim();
  let list = STUDENTS.filter(st => {
    if (subjectFilter !== 'all' && !st.subjects.includes(subjectFilter)) return false;
    if (homeroomFilter !== 'all' && st.homeroom !== homeroomFilter) return false;
    if (q && !st.name.replace(/\s/g, '').includes(q.replace(/\s/g, ''))) return false;
    return true;
  });
  list = sortStudents(list, sort);
  const flaggedCount = list.filter(s => s.flags.declining || s.flags.stale).length;
  return React.createElement("div", {
    className: "tw-main"
  }, React.createElement("div", {
    className: "tw-pagehead"
  }, React.createElement("div", {
    className: "tw-eyebrow"
  }, "REPORT · 生徒一覧"), React.createElement("div", {
    className: "tw-pagehead-row"
  }, React.createElement("h1", {
    className: "tw-title"
  }, "成績", React.createElement("span", {
    className: "accent"
  }, "一覧")), React.createElement("div", {
    className: "tw-subtitle gv-num"
  }, STUDENTS.length, " 名を担当", flaggedCount > 0 && React.createElement("span", null, " · ", React.createElement("span", {
    style: {
      color: 'var(--c-accent)',
      fontWeight: 600
    }
  }, flaggedCount, " 名 要注目"))))), React.createElement("div", {
    className: "tw-toolbar"
  }, React.createElement("div", {
    className: "tw-filters"
  }, React.createElement("button", {
    className: `tw-fchip ${subjectFilter === 'all' ? 'on' : ''}`,
    onClick: () => setSubjectFilter('all')
  }, "全科目"), SUBJECT_ORDER.map(s => {
    const m = SUBJECT_META[s];
    const on = subjectFilter === s;
    return React.createElement("button", {
      key: s,
      className: `tw-fchip subj ${on ? 'on' : ''}`,
      style: on ? {
        ['--sc']: m.color
      } : undefined,
      onClick: () => setSubjectFilter(on ? 'all' : s)
    }, React.createElement("span", {
      className: "sdot",
      style: {
        background: m.color
      }
    }), m.label);
  })), React.createElement("div", {
    className: "tw-toolbar-right"
  }, React.createElement("span", {
    className: "tw-count gv-num"
  }, list.length, " 件表示"), React.createElement("div", {
    className: "tw-sort"
  }, React.createElement("span", null, "担任"), React.createElement("select", {
    value: homeroomFilter,
    onChange: e => setHomeroomFilter(e.target.value)
  }, React.createElement("option", {
    value: "all"
  }, "全担任"), HOMEROOMS.map(h => React.createElement("option", {
    key: h,
    value: h
  }, h)))), React.createElement("div", {
    className: "tw-sort"
  }, React.createElement("span", null, "並べ替え"), React.createElement("select", {
    value: sort,
    onChange: e => setSort(e.target.value)
  }, SORTS.map(o => React.createElement("option", {
    key: o.key,
    value: o.key
  }, o.label)))))), showOverview && subjectFilter !== 'all' && state === 'normal' && React.createElement(ClassOverview, {
    subject: subjectFilter,
    students: STUDENTS
  }), state === 'loading' && React.createElement(React.Fragment, null, React.createElement(ListSkeleton, {
    layout: layout
  }), React.createElement("div", {
    className: "tw-loadwrap"
  }, React.createElement("div", {
    className: "spinner"
  }), React.createElement("span", null, "生徒データを読み込み中…"))), state === 'empty' && React.createElement("div", {
    className: "tw-empty"
  }, React.createElement("div", {
    className: "tw-empty-ic"
  }, Icon.user(28)), React.createElement("div", {
    className: "tw-empty-t1"
  }, "担当生徒がまだいません"), React.createElement("div", {
    className: "tw-empty-t2"
  }, "生徒が点数報告を始めると、ここに一覧で表示されます。", React.createElement("br", null), "配布リンク・トークンの状況は管理者にご確認ください。")), state === 'error' && React.createElement("div", {
    className: "tw-empty"
  }, React.createElement("div", {
    className: "tw-empty-ic",
    style: {
      background: 'var(--c-accent-soft)',
      color: '#9A4309'
    }
  }, Icon.alert(26)), React.createElement("div", {
    className: "tw-empty-t1"
  }, "データを取得できませんでした"), React.createElement("div", {
    className: "tw-empty-t2"
  }, "通信環境を確認して、もう一度お試しください。"), React.createElement("button", {
    className: "btn btn-quiet btn-sm",
    onClick: () => {}
  }, Icon.refresh(16), React.createElement("span", {
    style: {
      marginLeft: 6
    }
  }, "もう一度試す"))), state === 'normal' && (list.length === 0 ? React.createElement("div", {
    className: "tw-empty"
  }, React.createElement("div", {
    className: "tw-empty-ic",
    style: {
      background: 'var(--c-bg-warm)',
      color: 'var(--c-text-mute)'
    }
  }, Icon.search(26)), React.createElement("div", {
    className: "tw-empty-t1"
  }, "該当する生徒がいません"), React.createElement("div", {
    className: "tw-empty-t2"
  }, "検索条件・科目フィルタを変えてお試しください。")) : React.createElement(React.Fragment, null, layout === 'table' && React.createElement(TableView, {
    students: list,
    onOpen: n => nav('student', n)
  }), layout === 'cards' && React.createElement(CardView, {
    students: list,
    onOpen: n => nav('student', n)
  }), layout === 'hybrid' && React.createElement(HybridView, {
    students: list,
    onOpen: n => nav('student', n)
  }))));
}
Object.assign(window, {
  StudentListScreen
});