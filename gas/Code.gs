/***********************************************************************
 * GV Science — 先生用 成績ダッシュボード  バックエンド（GAS Web App）
 *
 *  生徒向けアプリとは独立した「先生用」スタンドアロン GAS プロジェクトです。
 *  GitHub Pages のフロント（docs/）から GET で呼ばれ、JSON を返します。
 *
 *  エンドポイント（すべて GET / クエリ token 必須）:
 *    ?action=students&token=...            … 生徒一覧の軽量サマリー
 *    ?action=scores&name=<生徒名>&token=... … 生徒1人の詳細（演習＋マーク模試）
 *    （&fresh=1 でサーバキャッシュを無視して取り直す）
 *
 *  ── 設定（CONFIG）──────────────────────────────────────────────
 *  下の CONFIG / 列マップを、実際のスプレッドシートに合わせて埋めてください。
 *  ★印は必ず確認・修正が必要な箇所です。シート構成が CONFIG と一致していれば
 *  コード本体の変更は不要です。
 ***********************************************************************/

/* ============================ CONFIG ============================ */
var CONFIG = {
  // 認証：false なら「URL を知っていれば誰でも閲覧可」（トークン不要）。
  //   あとでトークン制限を掛けたくなったら true にし、ACCESS_TOKEN とフロント config.js の
  //   AUTH_ENABLED / token を合わせるだけで有効化できます。
  AUTH_ENABLED: false,
  // 先生用の限定配布トークン（AUTH_ENABLED:true のときのみ使用）。
  ACCESS_TOKEN: 'gv-2026-CHANGE-ME',

  // スプレッドシートID（URL の /d/ と /edit の間の文字列）
  SCORES_SPREADSHEET_ID: '1ILJjWsOjVog3rQDrtSQ4E1Hh6Vodd-wpfRdczxRlWYY', // 演習点数報告 2026（回答）
  ROSTER_SPREADSHEET_ID: '1JuEYCeSnBhKCw1Q9jbhh9CCstStQOF6uOCQAkfZvyOU', // GV Science DB（生徒IDシート）
  MOCK_SPREADSHEET_ID:   '1b9vzmfH76k6hrXJ0AWZnZVmvbQzYBE_LWCcfVa8q5ZY', // ☆試験成績報告（回答）

  // 【将来用・未実装】授業欠席率シート。学年×使用科目でシートを絞り欠席率を取得する想定。
  // ABSENCE_SPREADSHEET_ID: '10laMTBkDx6gafoMSbQr3ib1hSEt3G-NYTWTuX9iB7qw',

  // 科目キー → 演習成績シート名。
  //   化学 / 生物 は作成済み。基礎科目（化学基礎/生物基礎/地学基礎）は下記の名前で事前登録済みです。
  //   そのタブがまだ無い間は自動でスキップされます（エラーにはなりません）。
  //   タブを「A〜F=名前/テスト名/実施日/合計/平均/偏差値、以降 分野ごとに4列
  //   （分野名 / 分野名 得点率 / 分野名 平均得点率 / 分野名 偏差値）」の並びで作れば、
  //   分野名はヘッダーから自動検出されるため SCORES_FIELDS への追記は不要です。
  SCORES_SHEETS: {
    chemistry:    '化学 成績',
    biology:      '生物 成績',
    chem_basics:  '化学基礎 成績',
    bio_basics:   '生物基礎 成績',
    earth_basics: '地学基礎 成績',
  },

  // キャッシュ秒数
  //  ★ スナップショット方式：30分ごとの時間トリガー rebuildSnapshot が一覧＋全生徒詳細を
  //    まとめて再計算し、下の TTL でキャッシュします。TTL を長め(6時間)にしているのは
  //    「万一トリガーが1回失敗してもキャッシュが空にならない」ための保険で、表示の鮮度は
  //    トリガー間隔（=実質30分）で決まります。データ入力直後は「更新」ボタン（fresh=1）で即時反映。
  CACHE_STUDENTS_SEC: 6 * 60 * 60, // 一覧 6時間（トリガーが30分ごとに上書き）
  CACHE_DETAIL_SEC:   6 * 60 * 60, // 詳細 6時間（同上）
  CACHE_NODATA_SEC:   5 * 60,      // データ無しは短く（5分）

  // 一覧の「要注目」判定
  // 「下降」フラグ＝いずれかの科目で偏差値が2回連続で下降（直近3テストが単調減少）。
  // ※ FLAG_DECLINING_DELTA は現在フラグ判定には未使用（並べ替え「落ち込み順」は worstDelta を使用）。
  FLAG_DECLINING_DELTA: -3,
  FLAG_STALE_DAYS:      30,    // 最終受験からこの日数以上で「長期未受験」
};

/* ── ★ 生徒IDシートの列マップ（1始まり）────────────────────────
 *  README より「担任 = F列」。他列は実シートに合わせて調整してください。
 *  SUBJECTS は「化学,生物」等を1セルに入れる想定（区切りは , 、 空白 / のいずれも可）。
 *  科目を列ごとに分けている場合は readRoster_() の該当箇所を調整。      */
var ROSTER = {
  SHEET: '生徒ID',     // 実シート名（GV Science DB の先頭タブ）
  HEADER_ROWS: 1,      // 見出し行数
  // 実ヘッダー：A:名前 / B:USERID / C:学年 / D:ID / E:理科使用科目 / F:担任
  COL: {
    name:     1,       // 名前（A列）
    grade:    3,       // 学年（C列）"既卒"/"高校3年生" 等
    subjects: 5,       // 理科使用科目（E列）"化学,生物" 等。物理は成績シートが無いため自動で無視。
    homeroom: 6,       // 担任（F列）
  },
  // E列がこれらの値（または空白）の生徒は一覧対象から除外（読み込み段階でスキップ）。
  SKIP_SUBJECT_TOKENS: ['未回答', '未記入', 'なし', '使用しない', '-', '—'],
};

/* ── ★ マーク模試(フォーム)シートの列マップ（1始まり）─────────────
 *  README より「生徒名 = F列」「志望校 = I列（時系列・最新を採用）」。
 *  共通テスト各科目の素点列は実シートに合わせて必ず調整してください。
 *  null を入れた項目は「その列が無い」とみなして '–'（未入力）扱いにします。   */
var MOCK = {
  SHEET: 'マーク模試(フォーム)', // 実シート名（☆試験成績報告（回答）の先頭タブ）
  HEADER_ROWS: 1,
  // ★ 今年度（4/1）以降の回答だけ読む高速化。A列タイムスタンプは昇順（下が最新）。
  //   true: 今年度開始(4/1)以降の行だけをテール読み（過去年度の模試は詳細に出ません）。
  //   false: 従来どおり全行（約2.9万行）を読む。
  LIMIT_TO_FISCAL_YEAR: true,
  // 実ヘッダー（1始まり）：1 タイムスタンプ / 2 試験名 / 3 生徒ID / 4 姓 / 5 名 / 6 名前 /
  //   7 合計 / 8 学年 / 9 志望校(旧) / 10 志望校(新) / 11 国現 / 12 国古 / 13 国漢 / 14 国合計 /
  //   15 英R / 16 英L / 17 英合計 / 18 ⅠA / 19 ⅡBC /
  //   20 理1名 21 理1点 / 22 理2名 23 理2点 / 24 理3名 25 理3点 /
  //   26 社1名 27 社1点 / 28 社2名 29 社2点 / 30 情報
  COL: {
    timestamp: 1,   // タイムスタンプ（記入日に使用）
    date:      null, // 記入日を別列で持つ場合はその列（null ならタイムスタンプを使用）
    examName:  2,    // 試験名「今回受験した模試…」
    studentName: 6, // 名前（F列）
    aspiration:  9, // 志望校（旧フォーム列）
    aspiration2: 10, // 志望校（新フォーム列）。9 が空なら 10 を採用。

    // 国語
    kokugo_gendai: 11, kokugo_koten: 12, kokugo_kanbun: 13,
    // 英語（w=リーディング, l=リスニング）
    eigo_w: 15, eigo_l: 16,
    // 数学
    math_ia: 18, math_iib: 19,
    // 理科（科目名＋点。第一〜第三）
    rika1_name: 20, rika1_score: 21,
    rika2_name: 22, rika2_score: 23,
    rika3_name: 24, rika3_score: 25,
    // 社会（科目名＋点。第一・第二）
    shakai1_name: 26, shakai1_score: 27,
    shakai2_name: 28, shakai2_score: 29,
    // 情報I
    joho: 30,
    // 合計点（列があれば優先、無ければ各素点から自動合算）
    total: 7,
  },
  // 試験名列が無い場合の表示名
  EXAM_NAME_FALLBACK: 'マーク模試',
  // 「英数のみ」の校内模試を判定する試験名キーワード（含まれれば full=false）
  PARTIAL_KEYWORDS: ['GV模試', 'GV 模試', '英数'],
  NOT_TAKEN: '受験していない',
};

/* 科目ラベル → キー（履修科目セルの表記ゆれを吸収）*/
var SUBJECT_LABEL_TO_KEY = {
  '化学': 'chemistry', '生物': 'biology',
  '化学基礎': 'chem_basics', '生物基礎': 'bio_basics', '地学基礎': 'earth_basics',
  'chemistry': 'chemistry', 'biology': 'biology',
  'chem_basics': 'chem_basics', 'bio_basics': 'bio_basics', 'earth_basics': 'earth_basics',
};
var SUBJECT_ORDER = ['chemistry', 'biology', 'chem_basics', 'bio_basics', 'earth_basics'];

/* ── 授業欠席率（学年×科目でタブを絞り、事前計算済みの「欠席率」を取得）────────
 *  欠席率スプレッドシートは「<学年> <科目>」名のタブ（例：「既卒 化学」「H3 化学基礎」）に分かれ、
 *  各タブ 1行目に「生徒名」「欠席率」列を含む（欠席率は % の数値が既に入っている）。
 *  ※ ENABLED:false にすると一切読みに行きません（欠席率列は null になります）。       */
var ABSENCE = {
  ENABLED: true,
  SPREADSHEET_ID: '10laMTBkDx6gafoMSbQr3ib1hSEt3G-NYTWTuX9iB7qw',
  // タブ名は「<学年トークン> <科目ラベル>」。名簿の学年表記 → タブの学年トークンへ正規化。
  GRADE_ALIAS: {
    '既卒': '既卒',
    'H3': 'H3', '高3': 'H3', '高校3年生': 'H3',
    'H2': 'H2', '高2': 'H2', '高校2年生': 'H2',
    'H1': 'H1', '高1': 'H1', '高校1年生': 'H1',
  },
  // 科目キー → タブ名に使う科目ラベル
  SUBJECT_LABEL: { chemistry: '化学', biology: '生物', chem_basics: '化学基礎', bio_basics: '生物基礎', earth_basics: '地学基礎' },
  STUDENT_HEADER: '生徒名',
  RATE_HEADER: '欠席率',
  // ★全タブ共通の固定レイアウト（FIXED:true なら先頭12行×全列のヘッダー自動検出をスキップして高速化）。
  //   実シート：生徒名=B列(2) / 欠席率=E列(5) / データは4行目から（見出しは3行目）。
  //   レイアウトが変わったら下を直すか、FIXED:false で自動検出に戻せます。
  FIXED: true,
  NAME_COL: 2,        // B列
  RATE_COL: 5,        // E列
  DATA_START_ROW: 4,  // データ開始行
};

/* 各科目の分野（順序固定）。演習シートの分野列を特定するために使用。
 * ヘッダー（「分野名 得点率」等）で照合し、見つからなければこの順で固定オフセット。*/
var SCORES_FIELDS = {
  // 実シート「化学 成績」「生物 成績」のヘッダー（<分野名> 得点率 等）に厳密一致させています。
  chemistry: ['物質','原子の構造','化学結合と結晶','物質量と濃度','酸塩基と中和','酸化還元反応','電池と電気分解','物質の三態','気体の性質','溶液の性質','熱化学','反応速度','化学平衡','非金属','典型金属','遷移金属','脂肪族化合物','芳香族化合物','天然高分子','合成高分子'],
  biology: ['生物の進化','遺伝','系統と分類','細胞と分子','代謝','遺伝情報の発現','発生','遺伝子技術','動物の環境応答','植物の環境応答','生態系'],
  // 基礎科目は成績シート未作成。空にしておくと、シート作成後にヘッダー「<分野名> 得点率」から
  // 分野を自動検出します（明示したい場合はここに配列で列挙してください）。
  chem_basics: [],
  bio_basics: [],
  earth_basics: [],
};

var TZ = Session.getScriptTimeZone() || 'Asia/Tokyo';

/* ============================ ROUTER ============================ */
function doGet(e) {
  var p = (e && e.parameter) || {};
  try {
    if (CONFIG.AUTH_ENABLED && p.token !== CONFIG.ACCESS_TOKEN) return json_({ error: 'UNAUTHORIZED' });
    var action = p.action || 'students';
    var fresh = p.fresh === '1' || p.fresh === 'true';

    if (action === 'students') return json_(getStudents_(fresh));
    if (action === 'scores') {
      if (!p.name) return json_({ error: 'NO_DATA' });
      return json_(getDetail_(p.name, fresh));
    }
    return json_({ error: 'BAD_ACTION' });
  } catch (err) {
    return json_({ error: 'SERVER_ERROR', message: String(err && err.message || err) });
  }
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ===================== STUDENTS (一覧サマリー) =====================
 * スナップショット方式：通常はキャッシュ（30分トリガーが温め続ける）から即返す。
 * キャッシュが無い／fresh=1（更新ボタン）のときだけ rebuildAll_ で全再計算する。   */
function getStudents_(fresh) {
  var cache = CacheService.getScriptCache();
  if (fresh) {
    // 「更新」ボタン（明示操作）：一覧＋全詳細を作り直す。数秒かかってよい。
    var resF = rebuildAll_(true);
    return { students: resF.students, homerooms: resF.homerooms };
  }
  // 通常アクセス：温まったキャッシュ(L1=CacheService)を即返す。
  var hit = cacheGetBig_(cache, 'students');
  if (hit) { try { return JSON.parse(hit); } catch (e) {} }
  // ★L2=永続スナップショット(ScriptProperties)。CacheService は数分で揮発するため、
  //   ミス時はここから即返す（再計算ゼロ＝約0.1秒）。鮮度はトリガー間隔(30分)で決まる。
  var persisted = loadStudentsProp_(CONFIG.CACHE_STUDENTS_SEC);
  if (persisted) {
    var pp = safeParse_(persisted);
    if (pp && pp.students) {
      try { cachePutBig_(cache, 'students', persisted, CONFIG.CACHE_STUDENTS_SEC); } catch (e) {} // L1 を温め直す
      return { students: pp.students || [], homerooms: pp.homerooms || [] };
    }
  }
  // ★L1/L2 とも無ければ rebuildAll_（重い全再計算）には落とさず、一覧だけ軽量再計算する（数秒）。
  var res = rebuildStudentsList_();
  return { students: res.students, homerooms: res.homerooms };
}

/* roster と「科目→(normName→演習行)」「学年|科目→欠席率マップ」から一覧サマリーを構築。
 * シートI/Oは一切せず、事前ロード済みデータだけで計算する（rebuildAll_ から呼ぶ）。   */
function buildStudentsList_(roster, scoresLoaded, absMaps) {
  // 科目ごとに normName→[{date,total,avg,hensachi}]（A〜F相当）を事前ロードから索引化
  var totalsIndex = {};
  Object.keys(scoresLoaded).forEach(function (s) {
    var L = scoresLoaded[s];
    var m = {};
    if (L) Object.keys(L.byName).forEach(function (nn) { m[nn] = subjectTotalsFromPicked_(L.byName[nn]); });
    totalsIndex[s] = m;
  });

  var today = new Date();
  var students = roster.map(function (r) {
    var perSubject = {};
    var lastExam = null, worstDelta = 0, declining = false;
    r.subjects.forEach(function (s) {
      var rows = (totalsIndex[s] && totalsIndex[s][normName_(r.name)]) || [];
      rows = rows.slice().sort(byDateAsc_);
      if (!rows.length) return;
      var last = rows[rows.length - 1], prev = rows[rows.length - 2];
      var dHen = prev ? round1_(last.hensachi - prev.hensachi) : 0;
      var dTot = prev ? (last.total - prev.total) : 0;
      var am = absMaps[absGradeToken_(r.grade) + '|' + s];
      var abVal = am ? am[normName_(r.name)] : undefined;
      perSubject[s] = {
        lastHensachi: last.hensachi,
        deltaHensachi: dHen,
        lastTotal: last.total,
        deltaTotal: dTot,
        lastDate: last.date,
        spark: rows.map(function (x) { return x.total; }),
        n: rows.length,
        absence: (abVal == null ? null : abVal),
      };
      var d = parseDate_(last.date);
      if (d && (!lastExam || d > lastExam)) lastExam = d;
      if (dHen < worstDelta) worstDelta = dHen;
      // 「2回連続で偏差値が下がった」科目があれば下降フラグ（直近3テストの偏差値が単調減少）
      if (rows.length >= 3) {
        var h1 = rows[rows.length - 3].hensachi, h2 = rows[rows.length - 2].hensachi, h3 = rows[rows.length - 1].hensachi;
        if (h3 < h2 && h2 < h1) declining = true;
      }
    });

    // 集計対象の科目（成績が実在するものだけ）
    var subjects = r.subjects.filter(function (s) { return perSubject[s]; });
    var daysSince = lastExam ? Math.round((today - lastExam) / 86400000) : null;

    return {
      name: r.name, grade: r.grade, homeroom: r.homeroom,
      subjects: subjects,
      perSubject: perSubject,
      aspiration: null,           // 一覧では未使用（重いマーク模試読込を省く）
      mockLatest: null,
      lastExamDate: lastExam ? fmtDate_(lastExam) : null,
      daysSince: daysSince,
      flags: {
        declining: declining, // いずれかの科目で偏差値が2回連続で下降
        stale: daysSince != null && daysSince >= CONFIG.FLAG_STALE_DAYS,
      },
      worstDelta: worstDelta,
    };
  }).filter(function (st) { return st.subjects.length > 0; }); // 成績ゼロ件の生徒は一覧から除外

  var homerooms = uniq_(roster.map(function (r) { return r.homeroom; }).filter(Boolean));
  return { students: students, homerooms: homerooms };
}

/* roster 全体で必要な「学年トークン|科目」欠席率マップを構築。
 *  ★高速化：Google Sheets API（高度なサービス）の batchGet で、全タブの B列(生徒名)/E列(欠席率) を
 *    まとめて1回のHTTPで取得する（従来は1タブ3往復×10タブ＝約14秒 → 約2秒）。
 *    サービス未有効時は従来の per-tab 読み（readAbsenceMap_）にフォールバックする。*/
function buildAbsenceMapsForRoster_(roster) {
  var absMaps = {}; // "gradeToken|subjectKey" -> { normName -> rate }
  if (!ABSENCE.ENABLED) return absMaps;

  // 1) 必要な (gradeToken|subjectKey) → 実タブ名 を解決（重複排除）
  var jobs = []; // {key, sheetName}
  var seen = {};
  roster.forEach(function (r) {
    var g = absGradeToken_(r.grade);
    r.subjects.forEach(function (s) {
      var key = g + '|' + s;
      if (seen[key]) return; seen[key] = true;
      var label = ABSENCE.SUBJECT_LABEL[s];
      if (!label) { absMaps[key] = {}; return; }
      var sh = resolveAbsenceSheet_(g, label);
      if (!sh) { absMaps[key] = {}; return; }
      jobs.push({ key: key, sheetName: sh.getName() });
    });
  });
  if (!jobs.length) return absMaps;

  // 2) Sheets API batchGet（高度なサービス Sheets が有効なら一括取得）
  var t0 = Date.now();
  if (typeof Sheets !== 'undefined' && Sheets.Spreadsheets && Sheets.Spreadsheets.Values) {
    try {
      var nameA1 = colLetter_(ABSENCE.NAME_COL), rateA1 = colLetter_(ABSENCE.RATE_COL);
      var start = ABSENCE.DATA_START_ROW;
      var ranges = [];
      jobs.forEach(function (j) {
        var t = "'" + String(j.sheetName).replace(/'/g, "''") + "'";
        ranges.push(t + '!' + nameA1 + start + ':' + nameA1); // 生徒名列（4行目以降）
        ranges.push(t + '!' + rateA1 + start + ':' + rateA1); // 欠席率列（4行目以降）
      });
      var resp = Sheets.Spreadsheets.Values.batchGet(ABSENCE.SPREADSHEET_ID, { ranges: ranges });
      var vr = (resp && resp.valueRanges) || [];
      for (var i = 0; i < jobs.length; i++) {
        var names = (vr[i * 2] && vr[i * 2].values) || [];
        var rates = (vr[i * 2 + 1] && vr[i * 2 + 1].values) || [];
        var map = {};
        var n = Math.max(names.length, rates.length);
        for (var d = 0; d < n; d++) {
          var nm = String((names[d] && names[d][0]) || '').trim();
          if (!nm) continue;
          var v = rates[d] ? rates[d][0] : null;
          if (v === '' || v == null) continue;
          map[normName_(nm)] = round1_(num_(v));
        }
        absMaps[jobs[i].key] = map;
      }
      Logger.log('ABS batchGet: tabs=%s, %sms', jobs.length, (Date.now() - t0));
      return absMaps;
    } catch (e) {
      Logger.log('ABS batchGet 失敗→フォールバック: %s', (e && e.message) || e);
    }
  }

  // 3) フォールバック：従来の per-tab 読み（Sheets API 未有効化／失敗時）
  jobs.forEach(function (j) {
    var p = j.key.split('|');
    absMaps[j.key] = readAbsenceMap_(p[0], p[1]);
  });
  Logger.log('ABS per-tab(fallback): tabs=%s, %sms', jobs.length, (Date.now() - t0));
  return absMaps;
}

/* 列番号(1始まり)→A1の列記号（2→"B", 5→"E", 27→"AA"）。*/
function colLetter_(col) {
  var s = '';
  while (col > 0) { var m = (col - 1) % 26; s = String.fromCharCode(65 + m) + s; col = Math.floor((col - 1) / 26); }
  return s || 'A';
}

/* 事前ロード行（[{rowArr,fmtArr,date}]）→ 一覧用 [{date,total,avg,hensachi}] */
function subjectTotalsFromPicked_(picked) {
  return picked.map(function (p) {
    return { date: p.date, total: num_(p.rowArr[3]), avg: round1_(num_(p.rowArr[4])), hensachi: round1_(num_(p.rowArr[5])) };
  });
}

/* 演習成績シート1枚を「丸ごと1回」読み、header と normName→[{rowArr,fmtArr,date}] を返す。
 * 全列＋数値書式を1回で取得し、生徒ごとの TextFinder を不要にする（rebuildAll_ 用）。 */
function loadScoresSheet_(subjectKey) {
  var sh = getSheet_(CONFIG.SCORES_SPREADSHEET_ID, CONFIG.SCORES_SHEETS[subjectKey]);
  if (!sh) return null;
  var lastRow = sh.getLastRow(), lastCol = sh.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return { header: [], byName: {} };
  var rng = sh.getRange(1, 1, lastRow, lastCol);
  var vals = rng.getValues();
  var fmts = rng.getNumberFormats();
  var header = vals[0];
  var byName = {};
  for (var r = 1; r < vals.length; r++) {
    var row = vals[r];
    var nm = String(row[0] || '').trim();
    if (!nm) continue;
    var date = fmtAny_(row[2]);
    if (!date) continue;
    var key = normName_(nm);
    (byName[key] || (byName[key] = [])).push({ rowArr: row, fmtArr: fmts[r], date: date });
  }
  return { header: header, byName: byName };
}

/* ★高速化（案1a＋案3）：履修されている全演習成績シートを「Sheets API batchGet」で一括取得する。
 *  5科目シートは同一スプレッドシート内なので、従来の per-sheet 読み
 *    （openById×5 ＋ getLastRow/Col×10 ＋ getValues/getNumberFormats×10 ≈ 25往復）
 *  を HTTP2回に集約する：
 *    ① 値：UNFORMATTED_VALUE ＋ 日付は FORMATTED_STRING（数値は完全精度・日付は文字列）
 *    ② 表示：FORMATTED_VALUE（"85%" を含む列を percent と判定＝getNumberFormats の代替）
 *  下流（computeScoresPerSubject_/readNum_）が使う {header, byName:[{rowArr,fmtArr,date}]} 構造を
 *  そのまま再現するので無改変。Sheets 未有効化／例外時は従来の per-sheet 読みへ自動フォールバック。*/
function loadScoresForSubjects_(subjectKeys) {
  try {
    if (typeof Sheets !== 'undefined' && Sheets.Spreadsheets && Sheets.Spreadsheets.Values) {
      var fast = loadScoresViaSheetsApi_(subjectKeys);
      if (fast) return fast;
    }
  } catch (e) {
    Logger.log('SCORES batchGet 失敗→フォールバック: %s', (e && e.message) || e);
  }
  var out = {};
  subjectKeys.forEach(function (s) { out[s] = loadScoresSheet_(s); });
  Logger.log('SCORES per-sheet(fallback): sheets=%s', subjectKeys.length);
  return out;
}

function loadScoresViaSheetsApi_(subjectKeys) {
  var t0 = Date.now();
  var ssId = CONFIG.SCORES_SPREADSHEET_ID;
  var keys = [], ranges = [];
  (subjectKeys || []).forEach(function (s) {
    var nm = CONFIG.SCORES_SHEETS[s];
    if (!nm) return;
    keys.push(s);
    ranges.push("'" + String(nm).replace(/'/g, "''") + "'");
  });
  if (!keys.length) return {};

  // ① 値（数値=完全精度、日付=文字列）
  var respU = Sheets.Spreadsheets.Values.batchGet(ssId, {
    ranges: ranges,
    valueRenderOption: 'UNFORMATTED_VALUE',
    dateTimeRenderOption: 'FORMATTED_STRING'
  });
  // ② 表示文字列（%列検出・日付フォールバック用）
  var respF = Sheets.Spreadsheets.Values.batchGet(ssId, {
    ranges: ranges,
    valueRenderOption: 'FORMATTED_VALUE',
    dateTimeRenderOption: 'FORMATTED_STRING'
  });
  var vrU = respU.valueRanges || [];
  var vrF = respF.valueRanges || [];

  var out = {};
  for (var i = 0; i < keys.length; i++) {
    var valsU = (vrU[i] && vrU[i].values) || [];
    var valsF = (vrF[i] && vrF[i].values) || [];
    out[keys[i]] = buildScoresByName_(valsU, valsF);
  }
  Logger.log('SCORES batchGet: sheets=%s, %sms', keys.length, (Date.now() - t0));
  return out;
}

/* batchGet の値配列（U=数値, F=表示）から {header, byName} を作る。loadScoresSheet_ と同型を返す。
 *  %判定：表示文字列に '%' を含む列は percent（列単位で一様）。readNum_ 互換の fmt 行を全行で共有。*/
function buildScoresByName_(valsU, valsF) {
  if (!valsU.length) return { header: [], byName: {} };
  var header = (valsF[0] || valsU[0] || []);
  var maxCol = 0;
  [valsU, valsF].forEach(function (vs) {
    for (var r = 0; r < vs.length; r++) { if (vs[r] && vs[r].length > maxCol) maxCol = vs[r].length; }
  });
  // 表示文字列に '%' を含む列を percent とみなす（列一様）。
  var fmtRow = new Array(maxCol);
  for (var c = 0; c < maxCol; c++) fmtRow[c] = '';
  for (var rr = 1; rr < valsF.length; rr++) {
    var fr = valsF[rr]; if (!fr) continue;
    for (var cc = 0; cc < fr.length; cc++) {
      if (fmtRow[cc] !== '%' && typeof fr[cc] === 'string' && fr[cc].indexOf('%') >= 0) fmtRow[cc] = '%';
    }
  }
  var byName = {};
  for (var r2 = 1; r2 < valsU.length; r2++) {
    var row = valsU[r2] || [];
    var nm = String(row[0] || '').trim();
    if (!nm) continue;
    var fr2 = valsF[r2] || [];
    var date = fmtAny_(fr2[2] != null ? fr2[2] : row[2]); // 日付列(3列目)は表示文字列優先
    if (!date) continue;
    var key = normName_(nm);
    (byName[key] || (byName[key] = [])).push({ rowArr: row, fmtArr: fmtRow, date: date });
  }
  return { header: header, byName: byName };
}

/* 今年度（4/1）開始時刻の ms(絶対時刻) を返す。スクリプトTZの「今日」で年度を判定（1〜3月は前年4/1）。
 *  本プロジェクトのTZは Asia/Tokyo（JST=+09:00・DSTなし）。GASランタイムTZに依存しないよう
 *  UTC基準から固定オフセットで 4/1 00:00 JST を算出する。*/
function fiscalYearStartMs_() {
  var now = new Date();
  var y = Number(Utilities.formatDate(now, TZ, 'yyyy'));
  var m = Number(Utilities.formatDate(now, TZ, 'MM'));
  var fyStartYear = (m >= 4) ? y : (y - 1);
  // 4/1 00:00:00 JST = 3/31 15:00:00 UTC
  return Date.UTC(fyStartYear, 3, 1, 0, 0, 0) - 9 * 3600 * 1000;
}

/* セル値（Date / 文字列）→ ms。判定不能は null。getValues は日時セルを Date で返す。*/
function tsToMs_(v) {
  if (v == null || v === '') return null;
  if (v instanceof Date) return v.getTime();
  var d = parseDate_(String(v));
  return d ? d.getTime() : null;
}

/* マーク模試シートで「今年度(4/1)以降」の最初のデータ行(1始まり)を返す。
 *  A列タイムスタンプ列だけ（1列）を読んで cutoff 以上の先頭行を線形探索する。全列(30列)読みより遥かに軽い。
 *  末尾に空行/書式だけの行があっても取りこぼさないよう、末尾スライスではなく全行を堅牢に走査する。
 *  今年度の行が無ければ lastRow+1。LIMIT 無効時は先頭データ行。*/
function mockDataStartRow_(sh, lastRow) {
  var firstData = MOCK.HEADER_ROWS + 1;
  if (!MOCK.LIMIT_TO_FISCAL_YEAR) return firstData;
  var n = lastRow - MOCK.HEADER_ROWS;
  if (n <= 0) return firstData;
  var cutoff = fiscalYearStartMs_();
  if (!cutoff) return firstData;
  var tsVals = sh.getRange(firstData, MOCK.COL.timestamp, n, 1).getValues();
  for (var i = 0; i < n; i++) {
    var ms = tsToMs_(tsVals[i][0]);
    if (ms != null && ms >= cutoff) return firstData + i; // 昇順なので以降は全て今年度
  }
  return lastRow + 1; // 今年度の行が無い
}

/* マーク模試シート(約2.9万行)を読み、normName→[行配列] を返す（rebuildAll_ 用）。
 * ★ MOCK.LIMIT_TO_FISCAL_YEAR=true のときは「今年度(4/1)以降」の行だけをテール読みする。*/
function loadMockByName_() {
  var out = {};
  var sh = getSheet_(CONFIG.MOCK_SPREADSHEET_ID, MOCK.SHEET);
  if (!sh) return out;
  var lastRow = sh.getLastRow(), lastCol = sh.getLastColumn();
  if (lastRow <= MOCK.HEADER_ROWS || lastCol < 1) return out;
  // ★ 今年度(4/1)以降だけを読む：A列は昇順なので、cutoff以上になる先頭行から末尾までを1回読み。
  var startRow = mockDataStartRow_(sh, lastRow);
  if (startRow > lastRow) return out; // 今年度の回答が無い
  var vals = sh.getRange(startRow, 1, lastRow - startRow + 1, lastCol).getValues();
  var nameIdx = MOCK.COL.studentName - 1;
  for (var i = 0; i < vals.length; i++) {
    var row = vals[i];
    var nm = normName_(row[nameIdx]);
    if (!nm) continue;
    (out[nm] || (out[nm] = [])).push(row);
  }
  return out;
}

/* ===================== DETAIL (生徒1人) =====================
 * スナップショット方式：通常はキャッシュ（30分トリガーが温め続ける）から即返す。
 * キャッシュが無い／fresh=1 のときだけ rebuildAll_ で全再計算し、該当生徒を返す。     */
function getDetail_(name, fresh) {
  var cache = CacheService.getScriptCache();
  var ckey = 'detail:' + normName_(name);
  if (!fresh) {
    var hit = cacheGetBig_(cache, ckey);
    if (hit) { try { return JSON.parse(hit); } catch (e) {} }
  }

  if (fresh) {
    // 「更新」ボタン：全員分を作り直してから該当生徒をキャッシュから返す。
    rebuildAll_(true);
    var hit2 = cacheGetBig_(cache, ckey);
    if (hit2) { try { return JSON.parse(hit2); } catch (e) {} }
    try { cachePutBig_(cache, ckey, JSON.stringify({ error: 'NO_DATA' }), CONFIG.CACHE_NODATA_SEC); } catch (e) {}
    return { error: 'NO_DATA' };
  }

  // ★C: 非fresh のキャッシュ未ヒット → 全再計算せず、その1人だけライブ計算（約3〜6秒）。
  //     スナップショットが温まっていれば通常ここには来ない（保険＆コールド時の単発高速化）。
  var d = computeDetailLive_(name);
  if (!d) {
    try { cachePutBig_(cache, ckey, JSON.stringify({ error: 'NO_DATA' }), CONFIG.CACHE_NODATA_SEC); } catch (e) {}
    return { error: 'NO_DATA' };
  }
  try { cachePutBig_(cache, ckey, JSON.stringify({ detail: d }), CONFIG.CACHE_DETAIL_SEC); } catch (e) {}
  return { detail: d };
}

/* 1生徒分の詳細をライブ計算（シートを開いて TextFinder。その生徒だけ）。無ければ null。
 * 全再計算 rebuildAll_ の重さを避けるためのフォールバック（getDetail_ の非fresh未ヒット時）。*/
function computeDetailLive_(name) {
  var roster = readRoster_();
  var stu = null;
  for (var i = 0; i < roster.length; i++) { if (normName_(roster[i].name) === normName_(name)) { stu = roster[i]; break; } }
  if (!stu) return null;

  var data = {}, subjects = [], allMonths = {};
  stu.subjects.forEach(function (s) {
    var per = readScoresPerSubject_(stu.name, s);
    if (per && per.totalTrend.length) {
      data[s] = per; subjects.push(s);
      per.months.forEach(function (m) { allMonths[m] = true; });
    }
  });
  var mock = readMockForStudent_(stu.name);
  if (!subjects.length && (!mock || !mock.exams.length)) return null;

  var absence = {};
  if (ABSENCE.ENABLED) {
    var gTok = absGradeToken_(stu.grade);
    stu.subjects.forEach(function (s) { absence[s] = readAbsenceForStudent_(stu.name, gTok, s); });
  }
  var months = Object.keys(allMonths).sort();
  return {
    name: stu.name, grade: stu.grade, homeroom: stu.homeroom,
    subjects: subjects, months: months, data: data, mock: mock, absence: absence,
  };
}

/* 事前ロード済みデータだけで、roster 全生徒の詳細 detail を構築（シートI/Oなし）。
 * 戻り値: { normName -> detailObj }。成績もマーク模試も無い生徒は含めない。           */
function buildAllDetails_(roster, scoresLoaded, mockByName, absMaps) {
  var out = {};
  roster.forEach(function (stu) {
    var data = {};
    var subjects = [];
    var allMonths = {};
    stu.subjects.forEach(function (s) {
      var L = scoresLoaded[s];
      if (!L) return;
      var picked = L.byName[normName_(stu.name)];
      if (!picked || !picked.length) return;
      var per = computeScoresPerSubject_(s, L.header, picked);
      if (per && per.totalTrend.length) {
        data[s] = per;
        subjects.push(s);
        per.months.forEach(function (m) { allMonths[m] = true; });
      }
    });

    var mock = computeMockForRows_(mockByName[normName_(stu.name)] || []);

    if (!subjects.length && (!mock || !mock.exams.length)) return; // NO_DATA はマップに入れない

    // 欠席率：履修科目すべて（成績の有無に関わらず）について事前ロードのマップから取得
    var absence = {};
    if (ABSENCE.ENABLED) {
      var gTok = absGradeToken_(stu.grade);
      stu.subjects.forEach(function (s) {
        var am = absMaps[gTok + '|' + s];
        var v = am ? am[normName_(stu.name)] : undefined;
        absence[s] = (v == null ? null : v);
      });
    }

    var months = Object.keys(allMonths).sort();
    out[normName_(stu.name)] = {
      name: stu.name, grade: stu.grade, homeroom: stu.homeroom,
      subjects: subjects,
      months: months,
      data: data,
      mock: mock,
      absence: absence,
    };
  });
  return out;
}

/* 1科目分の演習データを整形（合計点推移 + 分野別月次, 欠測 null）— 単体ライブ取得（フォールバック用）。
 * 設計仕様（成績推移）に準拠：TextFinderで対象行を絞り込み、%書式は100倍補正、
 * 未出題（平均得点率<=0）は月次から除外、全期間null分野は除去。
 * ※ 通常のスナップショット再計算は loadScoresSheet_ + computeScoresPerSubject_ を使い、
 *    この関数は使いません（互換のため残置）。                                       */
function readScoresPerSubject_(name, subjectKey) {
  var sh = getSheet_(CONFIG.SCORES_SPREADSHEET_ID, CONFIG.SCORES_SHEETS[subjectKey]);
  if (!sh) return null;
  var lastRow = sh.getLastRow(), lastCol = sh.getLastColumn();
  if (lastRow < 2) return null;

  // A列で名前完全一致の行番号を TextFinder で特定
  var finder = sh.getRange(1, 1, lastRow, 1).createTextFinder(name).matchEntireCell(true);
  var matches = finder.findAll();
  var rowNums = [];
  matches.forEach(function (rng) { if (normName_(rng.getValue()) === normName_(name)) rowNums.push(rng.getRow()); });
  if (!rowNums.length) return { fields: [], months: [], totalTrend: [], rate: {}, avgRate: {}, hensachi: {} };

  var minR = Math.min.apply(null, rowNums), maxR = Math.max.apply(null, rowNums);
  var block = sh.getRange(minR, 1, maxR - minR + 1, lastCol);
  var vals = block.getValues();
  var fmts = block.getNumberFormats();      // %書式検出用
  var header = sh.getRange(1, 1, 1, lastCol).getValues()[0];

  // 対象行だけ抽出（minR..maxR の連続ブロックから rowNums のみ）
  var picked = [];
  rowNums.forEach(function (rn) {
    var row = vals[rn - minR];
    var date = fmtAny_(row[2]);
    if (!date) return;
    picked.push({ rowArr: row, fmtArr: fmts[rn - minR], date: date });
  });
  return computeScoresPerSubject_(subjectKey, header, picked);
}

/* 1科目分の演習データ整形の本体。事前ロード済み picked（[{rowArr,fmtArr,date}]）と header から計算。
 * ライブ取得（readScoresPerSubject_）とスナップショット再計算（buildAllDetails_）の共通ロジック。 */
function computeScoresPerSubject_(subjectKey, header, picked) {
  if (!picked || !picked.length) return { fields: [], months: [], totalTrend: [], rate: {}, avgRate: {}, hensachi: {} };
  picked = picked.slice().sort(function (a, b) { return parseDate_(a.date) - parseDate_(b.date); });

  // 使用する分野リスト：SCORES_FIELDS に定義があればそれ、無ければヘッダーから自動検出
  var fields = fieldsForSubject_(subjectKey, header);
  // 分野→列（得点率/平均得点率/偏差値）をヘッダーで特定（無ければ固定オフセット）
  var fieldDefs = resolveFieldColumns_(fields, header);

  // 合計点推移
  var totalTrend = picked.map(function (p) {
    return {
      date: p.date,
      test: String(p.rowArr[1] || '').trim(),
      total: num_(p.rowArr[3]),
      avg: round1_(num_(p.rowArr[4])),
      hensachi: round1_(num_(p.rowArr[5])),
    };
  });

  // 分野別 月次平均
  var monthsSet = {};
  picked.forEach(function (p) { monthsSet[p.date.slice(0, 7).replace('/', '-')] = true; });
  var months = Object.keys(monthsSet).sort();
  var monthIndex = {}; months.forEach(function (m, i) { monthIndex[m] = i; });

  var rate = {}, avgRate = {}, hensachi = {};
  // 月次の合算器
  var acc = {}; // field -> month -> {r:[],a:[],h:[]}
  fields.forEach(function (f) { acc[f] = months.map(function () { return { r: 0, a: 0, h: 0, n: 0 }; }); });

  picked.forEach(function (p) {
    var ym = p.date.slice(0, 7).replace('/', '-');
    var mi = monthIndex[ym];
    fields.forEach(function (f) {
      var def = fieldDefs[f];
      if (!def) return;
      var rVal = readNum_(p.rowArr, p.fmtArr, def.rate);
      var aVal = readNum_(p.rowArr, p.fmtArr, def.avgRate);
      var hVal = readNum_(p.rowArr, p.fmtArr, def.hensachi);
      // 出題判定：平均得点率>0。平均列が無ければ rate か hensachi が正なら出題扱い
      var tested = (def.avgRate ? aVal > 0 : (rVal > 0 || hVal > 0));
      if (!tested) return;
      var cell = acc[f][mi];
      cell.r += rVal; cell.a += aVal; cell.h += hVal; cell.n += 1;
    });
  });

  fields.forEach(function (f) {
    var rArr = [], aArr = [], hArr = [];
    acc[f].forEach(function (c) {
      if (c.n > 0) { rArr.push(round1_(c.r / c.n)); aArr.push(round1_(c.a / c.n)); hArr.push(round1_(c.h / c.n)); }
      else { rArr.push(null); aArr.push(null); hArr.push(null); }
    });
    rate[f] = rArr; avgRate[f] = aArr; hensachi[f] = hArr;
  });

  // 全期間 null（本人未受験）の分野は丸ごと除去
  var keptFields = fields.filter(function (f) { return rate[f].some(function (v) { return v != null; }); });
  var R = {}, A = {}, H = {};
  keptFields.forEach(function (f) { R[f] = rate[f]; A[f] = avgRate[f]; H[f] = hensachi[f]; });

  return { fields: keptFields, months: months, totalTrend: totalTrend, rate: R, avgRate: A, hensachi: H };
}

/* 設定の分野リストを返す。空ならヘッダーの「<分野名> 得点率」から自動検出（出現順）。*/
function fieldsForSubject_(subjectKey, header) {
  var cfg = SCORES_FIELDS[subjectKey];
  if (cfg && cfg.length) return cfg;
  return autoFields_(header);
}
function autoFields_(header) {
  var out = [], seen = {};
  for (var i = 0; i < header.length; i++) {
    var h = String(header[i] || '').trim();
    if (h.slice(-5) === '平均得点率') continue;       // 「<分野> 平均得点率」列は分野見出しではない
    var m = h.match(/^(.+?)\s*得点率$/);              // 「<分野> 得点率」だけを分野として採用
    if (m) { var f = m[1].trim(); if (f && !seen[f]) { seen[f] = 1; out.push(f); } }
  }
  return out;
}

/* 分野名→{rate,avgRate,hensachi} 列番号(1始まり)。ヘッダー照合→固定オフセットの順。*/
function resolveFieldColumns_(fields, header) {
  var defs = {};
  var norm = header.map(function (h) { return String(h || '').trim(); });

  function findCol(label) { var i = norm.indexOf(label); return i >= 0 ? i + 1 : 0; }

  fields.forEach(function (f, i) {
    var rc = findCol(f + ' 得点率');
    var ac = findCol(f + ' 平均得点率');
    var hc = findCol(f + ' 偏差値');
    if (!rc && !hc) {
      // 固定オフセット（A..F の後、4列ずつ：分野名/得点率/平均得点率/偏差値）
      var base = 7 + i * 4;     // 分野名列
      rc = base + 1; ac = base + 2; hc = base + 3;
    }
    defs[f] = { rate: rc || 0, avgRate: ac || 0, hensachi: hc || 0 };
  });
  return defs;
}

/* 1セルを数値で読む。%書式の列は100倍補正（表示「40%」→内部0.4 を 40 に戻す）。*/
function readNum_(rowArr, fmtArr, col1) {
  if (!col1) return 0;
  var idx = col1 - 1;
  var v = num_(rowArr[idx]);
  var fmt = String((fmtArr && fmtArr[idx]) || '');
  if (fmt.indexOf('%') >= 0) v = v * 100;
  return v;
}

/* ===================== ROSTER (生徒IDシート) ===================== */
function readRoster_() {
  var sh = getSheet_(CONFIG.ROSTER_SPREADSHEET_ID, ROSTER.SHEET);
  if (!sh) return [];
  var lastRow = sh.getLastRow(), lastCol = sh.getLastColumn();
  if (lastRow <= ROSTER.HEADER_ROWS) return [];
  var vals = sh.getRange(ROSTER.HEADER_ROWS + 1, 1, lastRow - ROSTER.HEADER_ROWS, lastCol).getValues();
  var C = ROSTER.COL;
  var out = [];
  vals.forEach(function (row) {
    var name = String(cell_(row, C.name) || '').trim();
    if (!name) return;
    // E列（理科使用科目）が空白／未回答 の生徒は対象外。読み込み時点で除外して処理を軽くする。
    var subjRaw = String(cell_(row, C.subjects) || '').trim();
    if (!subjRaw || ROSTER.SKIP_SUBJECT_TOKENS.indexOf(subjRaw) >= 0) return;
    var grade = String(cell_(row, C.grade) || '').trim();
    var homeroom = String(cell_(row, C.homeroom) || '').trim();
    var subjects = parseSubjects_(subjRaw);
    out.push({ name: name, grade: grade, homeroom: homeroom, subjects: subjects });
  });
  return out;
}

function parseSubjects_(cellVal) {
  var s = String(cellVal || '').trim();
  if (!s) return [];
  var parts = s.split(/[,、\s\/／・]+/).map(function (x) { return x.trim(); }).filter(Boolean);
  var keys = [];
  parts.forEach(function (p) {
    var k = SUBJECT_LABEL_TO_KEY[p];
    if (k && keys.indexOf(k) < 0) keys.push(k);
  });
  // 表示順に整列
  keys.sort(function (a, b) { return SUBJECT_ORDER.indexOf(a) - SUBJECT_ORDER.indexOf(b); });
  return keys;
}

/* ===================== MOCK (マーク模試フォーム) =====================
 * 単体ライブ取得（フォールバック用）。数万行あるため TextFinder で該当行だけ読む。
 * ※ 通常のスナップショット再計算は loadMockByName_ + computeMockForRows_ を使い、
 *    この関数は使いません（互換のため残置）。                                       */
function readMockForStudent_(name) {
  var sh = getSheet_(CONFIG.MOCK_SPREADSHEET_ID, MOCK.SHEET);
  if (!sh) return { exams: [], aspiration: null, aspHistory: [] };
  var lastRow = sh.getLastRow(), lastCol = sh.getLastColumn();
  if (lastRow <= MOCK.HEADER_ROWS) return { exams: [], aspiration: null, aspHistory: [] };
  var C = MOCK.COL;

  // ★ 今年度(4/1)以降だけを対象に。A列は昇順なので cutoff 以上の先頭行から下だけを検索範囲にする。
  var startRow = mockDataStartRow_(sh, lastRow);
  if (startRow > lastRow) return { exams: [], aspiration: null, aspHistory: [] };
  // この回答シートは数万行あるため、名前列を TextFinder で絞り込み、該当行だけ読む。
  var nameCol = sh.getRange(startRow, C.studentName, lastRow - startRow + 1, 1);
  var hits = nameCol.createTextFinder(name).matchEntireCell(true).findAll();
  var rowNums = [];
  hits.forEach(function (rng) {
    if (rng.getRow() >= startRow && normName_(rng.getValue()) === normName_(name)) rowNums.push(rng.getRow());
  });
  if (!rowNums.length) return { exams: [], aspiration: null, aspHistory: [] };

  var minR = Math.min.apply(null, rowNums), maxR = Math.max.apply(null, rowNums);
  var block = sh.getRange(minR, 1, maxR - minR + 1, lastCol).getValues();
  var rows = rowNums.map(function (rn) { return block[rn - minR]; });
  return computeMockForRows_(rows);
}

/* マーク模試の行配列（[行配列,...]）から exams / 志望校履歴を構築。
 * ライブ取得（readMockForStudent_）とスナップショット再計算（buildAllDetails_）の共通ロジック。 */
function computeMockForRows_(rows) {
  if (!rows || !rows.length) return { exams: [], aspiration: null, aspHistory: [] };
  var C = MOCK.COL;
  // フォーム回答はタイムスタンプ昇順が基本だが、念のため日付で並べる
  rows = rows.slice().sort(function (a, b) {
    return (mockDate_(a) || 0) - (mockDate_(b) || 0);
  });

  var exams = rows.map(function (row) { return parseMockRow_(row, C); }).filter(Boolean);

  // 志望校履歴（I列を時系列で、空でないものだけ）。最新＝末尾。
  var aspHistory = [];
  rows.forEach(function (row) {
    // 志望校は旧列(9)・新列(10)の2系統。値がある方を採用（新列を優先）。
    var sch = String(cell_(row, C.aspiration2) || cell_(row, C.aspiration) || '').trim();
    if (!sch) return;
    var date = mockDateStr_(row);
    if (!aspHistory.length || aspHistory[aspHistory.length - 1].school !== sch) {
      aspHistory.push({ date: date, school: sch });
    }
  });
  var aspiration = aspHistory.length ? aspHistory[aspHistory.length - 1].school : null;

  return { exams: exams, aspiration: aspiration, aspHistory: aspHistory };
}

function parseMockRow_(row, C) {
  var date = mockDateStr_(row);
  var examName = C.examName ? String(cell_(row, C.examName) || '').trim() : '';
  if (!examName) examName = MOCK.EXAM_NAME_FALLBACK;

  var isPartial = MOCK.PARTIAL_KEYWORDS.some(function (kw) { return examName.indexOf(kw) >= 0; });
  var full = !isPartial;

  var gendai = optNum_(row, C.kokugo_gendai), koten = optNum_(row, C.kokugo_koten), kanbun = optNum_(row, C.kokugo_kanbun);
  var hasKokugo = full && (gendai != null || koten != null || kanbun != null);
  var kokugo = hasKokugo ? { gendai: z_(gendai), koten: z_(koten), kanbun: z_(kanbun), total: z_(gendai) + z_(koten) + z_(kanbun) } : null;

  var w = optNum_(row, C.eigo_w), l = optNum_(row, C.eigo_l);
  var eigo = { w: z_(w), l: z_(l), total: z_(w) + z_(l) };

  var ia = optNum_(row, C.math_ia), iib = optNum_(row, C.math_iib);
  var math = { ia: z_(ia), iib: (iib == null ? null : iib) };

  var rika = [
    mkSubj_(row, C.rika1_name, C.rika1_score, full),
    mkSubj_(row, C.rika2_name, C.rika2_score, full),
    mkSubj_(row, C.rika3_name, C.rika3_score, full),
  ];
  var shakai = [
    mkSubj_(row, C.shakai1_name, C.shakai1_score, full),
    mkSubj_(row, C.shakai2_name, C.shakai2_score, full),
  ];
  var joho = full ? optNum_(row, C.joho) : null;
  if (joho === undefined) joho = null;

  // 合計点：列があればそれを優先、無ければ素点合算
  var total = optNum_(row, C.total);
  if (total == null) {
    total = (kokugo ? kokugo.total : 0) + eigo.total + z_(math.ia) + z_(math.iib)
      + rika.reduce(function (s, x) { return s + z_(x.score); }, 0)
      + shakai.reduce(function (s, x) { return s + z_(x.score); }, 0)
      + z_(joho);
  }

  return { date: date, name: examName, full: full, kokugo: kokugo, eigo: eigo, math: math, rika: rika, shakai: shakai, joho: (joho == null ? null : joho), total: total };
}

function mkSubj_(row, nameCol, scoreCol, full) {
  if (!full || !nameCol) return { name: MOCK.NOT_TAKEN, score: null };
  var nm = String(cell_(row, nameCol) || '').trim();
  var sc = optNum_(row, scoreCol);
  if (!nm || nm === MOCK.NOT_TAKEN || sc == null) return { name: MOCK.NOT_TAKEN, score: null };
  return { name: nm, score: sc };
}

function mockDate_(row) { return parseDate_(mockDateStr_(row)); }
function mockDateStr_(row) {
  var C = MOCK.COL;
  var raw = C.date ? cell_(row, C.date) : cell_(row, C.timestamp);
  return fmtAny_(raw);
}

/* ===================== ABSENCE (授業欠席率) ===================== */
/* 学年トークン正規化（名簿の学年表記 → 欠席率タブの学年トークン）。未知はそのまま。*/
function absGradeToken_(grade) {
  var g = String(grade || '').trim();
  return ABSENCE.GRADE_ALIAS[g] || g;
}

var _absSS_ = undefined;
function absSpreadsheet_() {
  if (_absSS_ !== undefined) return _absSS_;
  try { _absSS_ = SpreadsheetApp.openById(ABSENCE.SPREADSHEET_ID); }
  catch (e) { _absSS_ = null; }
  return _absSS_;
}

/* ★高速化：欠席率スプレッドシートの「シート名→Sheet」マップを1回だけ構築してメモ化。
 *  従来は (学年×科目) ごとに getSheetByName 失敗時 getSheets() を呼び直し、呼び出しが積み上がっていた。*/
var _absSheets_ = undefined;
function absSheetMap_() {
  if (_absSheets_ !== undefined) return _absSheets_;
  _absSheets_ = {};
  var ss = absSpreadsheet_();
  if (ss) { ss.getSheets().forEach(function (s) { _absSheets_[s.getName()] = s; }); }
  return _absSheets_;
}

/* 「<学年トークン> <科目ラベル>」タブを解決。完全名→空白区切りトークン一致 の順。
 * 科目ラベルの部分一致（化学 と 化学基礎）を避けるため、トークン完全一致で判定する。*/
function resolveAbsenceSheet_(gradeToken, label) {
  var map = absSheetMap_();
  if (map[gradeToken + ' ' + label]) return map[gradeToken + ' ' + label];
  if (map[gradeToken + '　' + label]) return map[gradeToken + '　' + label];
  // フォールバック：半角/全角スペース区切りのトークンに「学年」と「科目ラベル」が両方あるタブ。
  var names = Object.keys(map);
  for (var i = 0; i < names.length; i++) {
    var toks = names[i].split(/[\s　]+/);
    if (toks.indexOf(gradeToken) >= 0 && toks.indexOf(label) >= 0) return map[names[i]];
  }
  return null;
}

/* 欠席率タブの ヘッダー行 / 生徒名列 / 欠席率列（いずれも1始まり）を特定。
 * ヘッダーが1行目とは限らない（実シートは日付などが先頭にあり、3行目が見出し）。
 * そのため先頭から最大 ABS_HEADER_SCAN 行を走査し、「生徒名」「欠席率」の両方を
 * 含む最初の行をヘッダー行として採用する。見つからなければ headerRow:0 を返す。*/
var ABS_HEADER_SCAN = 12;
function absCols_(sh) {
  var lastCol = sh.getLastColumn();
  var scanRows = Math.min(sh.getLastRow(), ABS_HEADER_SCAN);
  if (scanRows < 1 || lastCol < 1) return { headerRow: 0, nameCol: 0, rateCol: 0, lastCol: lastCol };
  var grid = sh.getRange(1, 1, scanRows, lastCol).getValues();
  for (var r = 0; r < scanRows; r++) {
    var nameCol = 0, rateCol = 0;
    for (var i = 0; i < grid[r].length; i++) {
      var h = String(grid[r][i] || '').trim();
      if (h === ABSENCE.STUDENT_HEADER) nameCol = i + 1;
      if (h === ABSENCE.RATE_HEADER) rateCol = i + 1;
    }
    if (nameCol && rateCol) return { headerRow: r + 1, nameCol: nameCol, rateCol: rateCol, lastCol: lastCol };
  }
  return { headerRow: 0, nameCol: 0, rateCol: 0, lastCol: lastCol };
}

/* 1学年×1科目タブを読み、normName → 欠席率(%) のマップを返す（一覧用・まとめ読み）。
 * ★高速化：getLastRow/getLastColumn/getRange を個別に呼ばず、getDataRange().getValues() の1回読みで
 *   ヘッダー検出〜データ抽出まで行う（API呼び出し回数を削減）。*/
/* タブの「データ開始行 / 生徒名列 / 欠席率列」（いずれも1始まり）を返す。
 *  ABSENCE.FIXED=true なら固定設定を即返す（ヘッダースキャン無し＝高速）。
 *  そうでなければ absCols_ による自動検出にフォールバック。失敗時は null。*/
function absLayout_(sh) {
  if (ABSENCE.FIXED) {
    return { dataStart: ABSENCE.DATA_START_ROW, nameCol: ABSENCE.NAME_COL, rateCol: ABSENCE.RATE_COL };
  }
  var c = absCols_(sh);
  if (!c.headerRow || !c.nameCol || !c.rateCol) return null;
  return { dataStart: c.headerRow + 1, nameCol: c.nameCol, rateCol: c.rateCol };
}

function readAbsenceMap_(gradeToken, subjectKey) {
  if (!ABSENCE.ENABLED) return {};
  var label = ABSENCE.SUBJECT_LABEL[subjectKey];
  if (!label) return {};
  var sh = resolveAbsenceSheet_(gradeToken, label);
  if (!sh) return {};
  var L = absLayout_(sh);
  if (!L) return {};
  var lastRow = sh.getLastRow();
  if (lastRow < L.dataStart) return {};
  // ★高速化の肝：日次出席グリッド全列は読まず、生徒名列(B)と欠席率列(E)の“細い1列ずつ”だけ読む。
  var dataRows = lastRow - L.dataStart + 1;
  var names = sh.getRange(L.dataStart, L.nameCol, dataRows, 1).getValues();
  var rates = sh.getRange(L.dataStart, L.rateCol, dataRows, 1).getValues();
  var map = {};
  for (var d = 0; d < dataRows; d++) {
    var nm = String(names[d][0] || '').trim();
    if (!nm) continue;
    var v = rates[d][0];
    if (v === '' || v == null) continue;
    map[normName_(nm)] = round1_(num_(v));
  }
  return map;
}

/* 1生徒×1科目の欠席率（%）を取得（詳細用・TextFinderで該当行だけ）。無ければ null。*/
function readAbsenceForStudent_(name, gradeToken, subjectKey) {
  if (!ABSENCE.ENABLED) return null;
  var label = ABSENCE.SUBJECT_LABEL[subjectKey];
  if (!label) return null;
  var sh = resolveAbsenceSheet_(gradeToken, label);
  if (!sh) return null;
  var L = absLayout_(sh);
  if (!L) return null;
  var lastRow = sh.getLastRow();
  var firstData = L.dataStart;
  if (lastRow < firstData) return null;
  var hits = sh.getRange(firstData, L.nameCol, lastRow - firstData + 1, 1).createTextFinder(name).matchEntireCell(true).findAll();
  for (var j = 0; j < hits.length; j++) {
    var rn = hits[j].getRow();
    if (rn < firstData) continue;
    if (normName_(hits[j].getValue()) === normName_(name)) {
      var v = sh.getRange(rn, L.rateCol).getValue();
      if (v === '' || v == null) return null;
      return round1_(num_(v));
    }
  }
  return null;
}

/* ===================== SNAPSHOT 事前計算 =====================
 * 各ソースシートを「1回だけ」読み、一覧＋全生徒詳細をまとめて計算してキャッシュへ。
 * これにより、ユーザーのアクセス時は重い計算を一切走らせず（=温まったキャッシュを返すだけ）、
 * 体感速度が劇的に改善する。30分ごとの時間トリガー rebuildSnapshot から呼ばれるほか、
 * 「更新」ボタン（fresh=1）やキャッシュ未ヒット時にも呼ばれる。
 *
 * 重要な高速化ポイント：
 *  - マーク模試(約2.9万行)を loadMockByName_ で1回だけ読む（従来の生徒ごと TextFinder を撤廃）
 *  - 各演習成績シートも loadScoresSheet_ で1回だけ全列読み、メモリ上で生徒別に索引化
 *  - 欠席率タブも学年×科目ごとに1回だけ読む                                            */
/* 戻り値: { students, homerooms }。詳細は各 'detail:<normName>' キーへ書き込む（getDetail_ が個別取得）。
 * 引数 force=true（更新ボタン/トリガー）のときは直近再計算の再利用（プレチェック）を行わず必ず作りに行く。
 * ★A バッチ書き込み / ★B 二重再計算の防止（鮮度チェック＋ロック）を実装。                       */
function rebuildAll_(force) {
  var cache = CacheService.getScriptCache();

  // ★B-1: 非forceは「直近 PRE 秒以内に再計算済み」なら、ロックも取らず再利用（コールド時の集中を吸収）。
  if (!force) {
    var pre = recentSnapshot_(cache, REBUILD_DEDUP_PRE_SEC);
    if (pre) return pre;
  }

  var lock = LockService.getScriptLock();
  var have = false;
  try { have = lock.tryLock(1000); } catch (e) {}
  if (!have) {
    // 他の実行が再計算中。完了まで待つ（再計算は数十秒で済む想定）。
    try { lock.waitLock(300000); have = true; } catch (e) {}
  }

  try {
    // ★B-2: ロック保持下で再度鮮度チェック。待っている間に他が作った／「更新」2本同時発火の2本目は
    //       ここで既存スナップショットを再利用し、二重の全再計算を防ぐ。
    var snap = recentSnapshot_(cache, REBUILD_DEDUP_POST_SEC);
    if (snap) return snap;

    // ── 計測（PROFILE）：各処理の所要msを Logger に出す。ボトルネック特定用。挙動は変えない。
    var _p0 = Date.now(), _pm = _p0;
    function _lap(label) { var now = Date.now(); _PROFILE_LAPS.push(label + '=' + (now - _pm) + 'ms'); _pm = now; }
    var _PROFILE_LAPS = [];

    var roster = readRoster_(); // [{name,grade,subjects[],homeroom}]
    _lap('roster');
    if (!roster.length) {
      cachePutBig_(cache, 'students', JSON.stringify({ students: [], homerooms: [] }), CONFIG.CACHE_NODATA_SEC);
      setRebuildEpoch_(cache);
      return { students: [], homerooms: [] };
    }

    // 履修されている科目だけ、演習成績シートを「丸ごと1回」ロード
    var usedSubjects = {};
    roster.forEach(function (r) { r.subjects.forEach(function (s) { usedSubjects[s] = true; }); });
    var scoresLoaded = loadScoresForSubjects_(Object.keys(usedSubjects)); // subjectKey -> { header, byName }
    _lap('scores');

    // マーク模試を1回ロード（normName -> 行配列[]）
    var mockByName = loadMockByName_();
    var _mockRows = 0; try { Object.keys(mockByName).forEach(function (k) { _mockRows += mockByName[k].length; }); } catch (e) {}
    _lap('mock(rows=' + _mockRows + ')');

    // 欠席率マップ（学年|科目ごとに1回）
    var absMaps = buildAbsenceMapsForRoster_(roster);
    _lap('absence');

    // 一覧 & 全生徒詳細を構築
    var list = buildStudentsList_(roster, scoresLoaded, absMaps);
    var details = buildAllDetails_(roster, scoresLoaded, mockByName, absMaps);
    _lap('build(details=' + Object.keys(details).length + ')');

    // ★A: 全チャンクを1つの map にまとめ、数回の putAll でまとめ書き（従来は生徒ごとに putAll＝約105往復）。
    var entries = {};
    var studentsJson = JSON.stringify({ students: list.students, homerooms: list.homerooms });
    addBigEntries_(entries, 'students', studentsJson);
    Object.keys(details).forEach(function (nn) {
      addBigEntries_(entries, 'detail:' + nn, JSON.stringify({ detail: details[nn] }));
    });
    var _bytes = 0; Object.keys(entries).forEach(function (k) { _bytes += (entries[k] || '').length; });
    putAllBatched_(cache, entries, CONFIG.CACHE_DETAIL_SEC);
    _lap('cacheWrite(keys=' + Object.keys(entries).length + ',KB=' + Math.round(_bytes / 1024) + ')');
    Logger.log('rebuildAll_ PROFILE total=%sms | %s', (Date.now() - _p0), _PROFILE_LAPS.join(' / '));
    setRebuildEpoch_(cache);
    setStudentsEpoch_(cache); // 一覧パス（rebuildStudentsList_）の鮮度チェックも満たしておく
    saveStudentsProp_(studentsJson); // ★L2: 揮発しない永続スナップショット(ScriptProperties)も更新
    try {
      cache.put('snapshot_meta', JSON.stringify({
        at: Utilities.formatDate(new Date(), TZ, 'yyyy/MM/dd HH:mm:ss'),
        students: list.students.length, details: Object.keys(details).length,
      }), CONFIG.CACHE_DETAIL_SEC);
    } catch (e) {}

    return { students: list.students, homerooms: list.homerooms };
  } finally {
    if (have) { try { lock.releaseLock(); } catch (e) {} }
  }
}

/* 直近 withinSec 秒以内に再計算済みなら、キャッシュ上のスナップショット {students,homerooms} を返す。*/
function recentSnapshot_(cache, withinSec) {
  var ep = rebuildEpoch_(cache);
  if (!ep || (Date.now() - ep) > withinSec * 1000) return null;
  var sHit = cacheGetBig_(cache, 'students');
  if (!sHit) return null;
  var s = safeParse_(sHit);
  if (!s) return null;
  return { students: s.students || [], homerooms: s.homerooms || [] };
}
function rebuildEpoch_(cache) { var v = cache.get('rebuild_epoch'); return v ? (parseInt(v, 10) || 0) : 0; }
function setRebuildEpoch_(cache) { try { cache.put('rebuild_epoch', String(Date.now()), CONFIG.CACHE_DETAIL_SEC); } catch (e) {} }

/* ===================== STUDENTS-ONLY 軽量再計算 =====================
 * 一覧（buildStudentsList_）は roster＋演習成績シート（小）＋欠席率だけで作れ、
 * マーク模試(約2.9万行)も全生徒詳細も不要。よってユーザーの一覧アクセスがキャッシュ未ヒット
 * でも、重い rebuildAll_ ではなくこの関数で「一覧だけ」を数秒で作り直してキャッシュする。
 * 鮮度管理は students_epoch（rebuild_epoch とは別キー）で行い、全再計算の二重防止ロジックに干渉しない。*/
function studentsEpoch_(cache) { var v = cache.get('students_epoch'); return v ? (parseInt(v, 10) || 0) : 0; }
function setStudentsEpoch_(cache) { try { cache.put('students_epoch', String(Date.now()), CONFIG.CACHE_STUDENTS_SEC); } catch (e) {} }

/* 直近 withinSec 秒以内に一覧を作成済みなら、キャッシュ上の {students,homerooms} を返す。*/
function recentStudents_(cache, withinSec) {
  var ep = studentsEpoch_(cache);
  if (!ep || (Date.now() - ep) > withinSec * 1000) return null;
  var sHit = cacheGetBig_(cache, 'students');
  if (!sHit) return null;
  var s = safeParse_(sHit);
  if (!s) return null;
  return { students: s.students || [], homerooms: s.homerooms || [] };
}

/* 一覧だけを軽量再計算（マーク模試も全生徒詳細も読まない）。
 *  - ロックは短時間 tryLock のみで、長くは待たない（重い rebuildAll_ 進行中でもユーザーを待たせない）。
 *  - ロックを取れなければ、既存キャッシュがあれば即返す／無ければロック無しで自前計算（小シートのみ）。*/
function rebuildStudentsList_() {
  var cache = CacheService.getScriptCache();
  var pre = recentStudents_(cache, REBUILD_DEDUP_PRE_SEC);
  if (pre) return pre;

  var lock = LockService.getScriptLock();
  var have = false;
  try { have = lock.tryLock(1500); } catch (e) {}
  if (!have) {
    var hit = cacheGetBig_(cache, 'students');
    if (hit) { var p = safeParse_(hit); if (p) return { students: p.students || [], homerooms: p.homerooms || [] }; }
    // キャッシュも無い → ロック無しで一覧だけ自前計算（小さい演習シートのみ・数秒）。
  }
  try {
    if (have) {
      var snap = recentStudents_(cache, REBUILD_DEDUP_POST_SEC);
      if (snap) return snap;
    }
    var roster = readRoster_();
    if (!roster.length) {
      cachePutBig_(cache, 'students', JSON.stringify({ students: [], homerooms: [] }), CONFIG.CACHE_NODATA_SEC);
      setStudentsEpoch_(cache);
      return { students: [], homerooms: [] };
    }
    var usedSubjects = {};
    roster.forEach(function (r) { r.subjects.forEach(function (s) { usedSubjects[s] = true; }); });
    var scoresLoaded = loadScoresForSubjects_(Object.keys(usedSubjects)); // 演習成績シートのみ（マーク模試は読まない）
    var absMaps = buildAbsenceMapsForRoster_(roster);
    var list = buildStudentsList_(roster, scoresLoaded, absMaps);
    var studentsJson = JSON.stringify({ students: list.students, homerooms: list.homerooms });
    cachePutBig_(cache, 'students', studentsJson, CONFIG.CACHE_STUDENTS_SEC);
    setStudentsEpoch_(cache);
    saveStudentsProp_(studentsJson); // ★L2: 永続スナップショットも更新
    return { students: list.students, homerooms: list.homerooms };
  } finally {
    if (have) { try { lock.releaseLock(); } catch (e) {} }
  }
}

/* 公開トリガー関数：GAS エディタで時間主導トリガーに割り当てる（30分ごと推奨）。
 * セルフテスト用に手動実行も可。実行ログに所要時間と件数を出す。                      */
function rebuildSnapshot() {
  var t0 = Date.now();
  var res = rebuildAll_(true);
  var ms = Date.now() - t0;
  var meta = CacheService.getScriptCache().get('snapshot_meta');
  Logger.log('rebuildSnapshot: students=%s, %sms, meta=%s', (res.students || []).length, ms, meta);
  return res;
}

/* 一度だけ実行：rebuildSnapshot を30分ごとに走らせる時間主導トリガーを作成（重複作成は防止）。*/
function setupSnapshotTrigger() {
  var exists = ScriptApp.getProjectTriggers().some(function (t) {
    return t.getHandlerFunction() === 'rebuildSnapshot';
  });
  if (exists) { Logger.log('既に rebuildSnapshot トリガーがあります（作成しません）。'); return; }
  ScriptApp.newTrigger('rebuildSnapshot').timeBased().everyMinutes(30).create();
  Logger.log('rebuildSnapshot トリガーを30分ごとで作成しました。初回ウォームアップを実行します…');
  rebuildSnapshot();
}

/* rebuildSnapshot トリガーを全削除（間隔変更ややり直し用）。*/
function removeSnapshotTriggers() {
  var n = 0;
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'rebuildSnapshot') { ScriptApp.deleteTrigger(t); n++; }
  });
  Logger.log('削除した rebuildSnapshot トリガー: %s 個', n);
}

/* ── チャンク対応キャッシュ（CacheService は1値100KB上限のため分割保存）──────────
 *  cachePutBig_/cacheGetBig_ は <key>:meta（チャンク数）と <key>:0,<key>:1… に分けて保存・復元。*/
var CACHE_CHUNK_ = 95000; // 文字数/チャンク（100KB上限の安全側）
// ★B 二重再計算の防止に使う鮮度ウィンドウ（秒）
var REBUILD_DEDUP_PRE_SEC = 25;  // 非force：直近この秒数なら再計算せず再利用（コールド時の集中アクセス対策）
var REBUILD_DEDUP_POST_SEC = 12; // ロック取得後：この秒数なら再利用（「更新」2本同時発火/トリガー重複の2本目）

/* 1論理キーを meta＋チャンクに展開して into に積む（★A バッチ書き込み用）。*/
function addBigEntries_(into, key, str) {
  var n = Math.max(1, Math.ceil(str.length / CACHE_CHUNK_));
  into[key + ':meta'] = JSON.stringify({ n: n, len: str.length });
  for (var i = 0; i < n; i++) into[key + ':' + i] = str.substr(i * CACHE_CHUNK_, CACHE_CHUNK_);
}
/* 多数のキーを putAll で「まとめ書き」。1回あたり 最大40キー / 約400KB に分割（putAll上限の安全側）。*/
function putAllBatched_(cache, entries, ttl) {
  var keys = Object.keys(entries);
  var batch = {}, cnt = 0, bytes = 0;
  function flush() { if (cnt > 0) { try { cache.putAll(batch, ttl); } catch (e) {} batch = {}; cnt = 0; bytes = 0; } }
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i], v = entries[k], vb = v ? v.length : 0;
    if (cnt >= 40 || (bytes + vb) > 400000) flush();
    batch[k] = v; cnt++; bytes += vb;
  }
  flush();
}
function cachePutBig_(cache, key, str, ttl) {
  try {
    var n = Math.max(1, Math.ceil(str.length / CACHE_CHUNK_));
    var puts = {};
    puts[key + ':meta'] = JSON.stringify({ n: n, len: str.length });
    for (var i = 0; i < n; i++) puts[key + ':' + i] = str.substr(i * CACHE_CHUNK_, CACHE_CHUNK_);
    cache.putAll(puts, ttl);
  } catch (e) { /* 上限超過などは黙ってスキップ（次回 rebuild で再試行）*/ }
}
function cacheGetBig_(cache, key) {
  var meta = cache.get(key + ':meta');
  if (!meta) return null;
  var n;
  try { n = JSON.parse(meta).n; } catch (e) { return null; }
  var keys = [];
  for (var i = 0; i < n; i++) keys.push(key + ':' + i);
  var got = cache.getAll(keys);
  var s = '';
  for (var j = 0; j < n; j++) {
    var c = got[key + ':' + j];
    if (c == null) return null; // 一部チャンク失効 → 取り直し扱い
    s += c;
  }
  return s;
}
function safeParse_(s) { try { return JSON.parse(s); } catch (e) { return null; } }

/* ===================== 一覧スナップショットの永続化（ScriptProperties + gzip） =====================
 * CacheService は TTL 内でも数分で揮発するため、一覧JSONを gzip 圧縮して ScriptProperties にも保存する（L2）。
 * これにより doGet の非fresh ミス時も再計算ゼロ（約0.1秒）で返せ、cold/evicted/初回でも常に速い。
 *  - 1プロパティ9KB上限に対し、base64文字列を CHUNK 文字ずつ分割保存（将来 students 増でも安全）。
 *  - meta に {n=チャンク数, at=保存時刻ms, len=base64長} を持ち、整合性・鮮度を検証。
 *  - 空ロスター等の縮退結果では保存しない（直前の良いスナップショットを潰さないため、呼び出し側で制御）。*/
var STUDENTS_PROP = { META: 'students_blob_meta', PREFIX: 'students_blob_', CHUNK: 8000 };

function saveStudentsProp_(jsonString) {
  try {
    if (!jsonString) return;
    var gz = Utilities.gzip(Utilities.newBlob(jsonString, 'application/json', 'students.json'));
    var b64 = Utilities.base64Encode(gz.getBytes());
    var n = Math.ceil(b64.length / STUDENTS_PROP.CHUNK);
    var props = PropertiesService.getScriptProperties();
    var prevN = 0;
    try { var pm = props.getProperty(STUDENTS_PROP.META); if (pm) prevN = (JSON.parse(pm).n || 0); } catch (e) {}
    var toSet = {};
    for (var i = 0; i < n; i++) toSet[STUDENTS_PROP.PREFIX + i] = b64.substr(i * STUDENTS_PROP.CHUNK, STUDENTS_PROP.CHUNK);
    toSet[STUDENTS_PROP.META] = JSON.stringify({ n: n, at: Date.now(), len: b64.length });
    props.setProperties(toSet); // 既存の他キーは保持
    for (var j = n; j < prevN; j++) { try { props.deleteProperty(STUDENTS_PROP.PREFIX + j); } catch (e) {} } // 余ったチャンクを掃除
    Logger.log('STUDENTS prop saved: chunks=%s, b64KB=%s', n, Math.round(b64.length / 1024));
  } catch (e) {
    Logger.log('STUDENTS prop save 失敗: %s', (e && e.message) || e);
  }
}

/* 永続スナップショットを読む。maxAgeSec を超えて古ければ null（=呼び出し側で再計算へ）。*/
function loadStudentsProp_(maxAgeSec) {
  try {
    var props = PropertiesService.getScriptProperties();
    var all = props.getProperties();
    var pm = all[STUDENTS_PROP.META];
    if (!pm) return null;
    var meta = JSON.parse(pm);
    if (!meta || !meta.n) return null;
    if (maxAgeSec && meta.at && (Date.now() - meta.at) > maxAgeSec * 1000) return null;
    var b64 = '';
    for (var i = 0; i < meta.n; i++) {
      var part = all[STUDENTS_PROP.PREFIX + i];
      if (part == null) return null; // チャンク欠損→無効
      b64 += part;
    }
    if (meta.len && b64.length !== meta.len) return null; // 整合性チェック
    var bytes = Utilities.base64Decode(b64);
    return Utilities.ungzip(Utilities.newBlob(bytes, 'application/x-gzip')).getDataAsString();
  } catch (e) {
    Logger.log('STUDENTS prop load 失敗: %s', (e && e.message) || e);
    return null;
  }
}

/* ===================== helpers ===================== */
/* ★案3：openById のメモ化。同一実行中は1スプレッドシートを1回だけ開く（GASは実行ごとにグローバル初期化）。
 *  scores(同一ブックを5回開いていた)・roster・mock・フォールバックに波及。*/
var _SS_MEMO_ = {};
function getSheet_(ssId, sheetName) {
  try {
    var ss = _SS_MEMO_[ssId] || (_SS_MEMO_[ssId] = SpreadsheetApp.openById(ssId));
    return ss.getSheetByName(sheetName);
  } catch (e) { return null; }
}
function cell_(row, col1) { return col1 ? row[col1 - 1] : ''; }
function num_(v) { var n = (typeof v === 'number') ? v : parseFloat(String(v).replace(/[^0-9.\-]/g, '')); return isNaN(n) ? 0 : n; }
function optNum_(row, col1) {
  if (!col1) return null;
  var v = row[col1 - 1];
  if (v === '' || v === null || v === undefined) return null;
  var n = (typeof v === 'number') ? v : parseFloat(String(v).replace(/[^0-9.\-]/g, ''));
  return isNaN(n) ? null : n;
}
function z_(v) { return v == null ? 0 : v; }
function round1_(v) { return Math.round(v * 10) / 10; }
function normName_(s) { return String(s || '').replace(/\s/g, ''); }
function uniq_(arr) { var seen = {}, out = []; arr.forEach(function (x) { if (!seen[x]) { seen[x] = 1; out.push(x); } }); return out; }
function byDateAsc_(a, b) { return parseDate_(a.date) - parseDate_(b.date); }
function parseDate_(s) { if (!s) return null; var d = new Date(String(s).replace(/\//g, '-')); return isNaN(d) ? null : d; }
function fmtDate_(d) { return Utilities.formatDate(d, TZ, 'yyyy/MM/dd'); }
function fmtAny_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, TZ, 'yyyy/MM/dd');
  var s = String(v || '').trim();
  if (!s) return '';
  // "2026-04-03 12:00:00" / "2026/4/3" 等を yyyy/MM/dd に正規化
  var d = new Date(s.replace(/\//g, '-'));
  if (!isNaN(d)) return Utilities.formatDate(d, TZ, 'yyyy/MM/dd');
  return s;
}
function cacheNoData_(cache, ckey, obj) {
  try { cache.put(ckey, JSON.stringify(obj), CONFIG.CACHE_NODATA_SEC); } catch (e) {}
  return obj;
}

/* ===================== セルフテスト（任意）=====================
 * エディタで実行すると、設定が正しいか簡易チェックしてログに出します。 */
function selfTest() {
  // ── 生徒IDシートの診断（roster が 0 のとき原因を切り分ける）──
  var ss = null;
  try { ss = SpreadsheetApp.openById(CONFIG.ROSTER_SPREADSHEET_ID); }
  catch (e) { Logger.log('★ ROSTER スプレッドシートを開けません: %s', e.message); }
  if (ss) {
    Logger.log('ROSTER ファイル名: 「%s」', ss.getName());
    Logger.log('ROSTER タブ一覧: %s', ss.getSheets().map(function (s) { return '「' + s.getName() + '」'; }).join(' / '));
    var rsh = ss.getSheetByName(ROSTER.SHEET);
    if (!rsh) {
      Logger.log('★ タブ「%s」が見つかりません。上のタブ一覧から正しい名前を ROSTER.SHEET に設定してください。', ROSTER.SHEET);
    } else {
      Logger.log('タブ「%s」 lastRow=%s lastCol=%s', ROSTER.SHEET, rsh.getLastRow(), rsh.getLastColumn());
      var n = Math.max(1, Math.min(4, rsh.getLastRow()));
      var sample = rsh.getRange(1, 1, n, Math.min(6, rsh.getLastColumn() || 1)).getValues();
      Logger.log('先頭セル A1..F%s: %s', n, JSON.stringify(sample));
    }
  }

  var roster = readRoster_();
  Logger.log('roster: %s 名', roster.length);
  if (roster.length) {
    // 成績シートのある科目（化学/生物）を履修している生徒を優先してテスト対象にする
    var st = roster[0];
    for (var i = 0; i < roster.length; i++) {
      if (roster[i].subjects.indexOf('chemistry') >= 0 || roster[i].subjects.indexOf('biology') >= 0) { st = roster[i]; break; }
    }
    Logger.log('テスト対象: %s', JSON.stringify(st));

    // 成績シートが存在する科目だけで詳細を確認（基礎科目はシート未作成のためスキップ）
    var scoreSubj = null;
    st.subjects.forEach(function (s) { if (!scoreSubj && CONFIG.SCORES_SHEETS[s]) scoreSubj = s; });
    if (scoreSubj) {
      var per = readScoresPerSubject_(st.name, scoreSubj);
      if (per) {
        Logger.log('detail[%s/%s] totalTrend=%s, fields=%s, months=%s',
          st.name, scoreSubj, per.totalTrend.length, per.fields.length, JSON.stringify(per.months));
      } else {
        Logger.log('detail[%s/%s]: 成績シートが見つからずスキップ', st.name, scoreSubj);
      }
    } else {
      Logger.log('detail: この生徒は成績シート対象科目（化学/生物）を履修していません');
    }

    var mock = readMockForStudent_(st.name);
    Logger.log('mock exams=%s, aspiration=%s', mock.exams.length, mock.aspiration);

    // 欠席率：先頭生徒の各履修科目について、タブ解決と取得値を確認
    if (ABSENCE.ENABLED) {
      var gTok = absGradeToken_(st.grade);
      st.subjects.forEach(function (s) {
        var label = ABSENCE.SUBJECT_LABEL[s];
        var sh = resolveAbsenceSheet_(gTok, label);
        var rate = readAbsenceForStudent_(st.name, gTok, s);
        Logger.log('absence[%s/%s]: tab=%s rate=%s', s, label, sh ? sh.getName() : '(見つからず)', rate);
      });
    }
  }
}
