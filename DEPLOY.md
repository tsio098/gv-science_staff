# GV Science 先生用 成績ダッシュボード — セットアップ手順

バックエンド = Google Apps Script（GAS）、フロント = GitHub Pages の構成です。
`docs/` がそのまま公開サイト、`gas/Code.gs` がバックエンドです。

```
成績一覧表示/
├─ docs/            ← GitHub Pages で公開する静的サイト（フロント）
│   ├─ index.html       エントリ（読込順を定義）
│   ├─ config.js        ★ GAS の URL を設定する唯一の場所
│   ├─ constants.js     科目メタ・ラベル整形
│   ├─ api.js           トークン認証・GAS通信・SWRキャッシュ・リトライ
│   ├─ sample-data.js   GAS未設定時のデモデータ（接続後は不使用）
│   ├─ icons.jsx / charts.jsx / list.jsx / detail.jsx / app.jsx
│   ├─ styles.css / gradetrend.css / teacher.css
│   └─ .nojekyll
└─ gas/
    ├─ Code.gs          ★ スプレッドシートID・列・トークンを設定
    └─ appsscript.json  Webアプリ設定（V8 / 匿名アクセス / spreadsheets スコープ）
```

そのままでも **サンプルデータで起動**します（`config.js` の GAS_ENDPOINT 空＝デモモード）。
まずブラウザで `docs/index.html` を開けばデザインと動作を確認できます。

---

## 1. バックエンド（GAS）を作る

1. https://script.google.com で**新規プロジェクト**を作成（生徒用とは別の独立プロジェクト）。
2. `gas/Code.gs` の内容をコピーして貼り付け。プロジェクト設定で「`appsscript.json` を表示」を有効にし、`gas/appsscript.json` の内容も反映。
3. `Code.gs` 冒頭の **CONFIG / ROSTER / MOCK** を実シートに合わせて設定（下の「2. 確認が必要な設定」）。
4. エディタで関数 `selfTest` を一度実行し、権限を承認。ログに `roster: N 名`・`detail … totalTrend=…`・`mock exams=…` が出れば設定OK。
5. **デプロイ → 新しいデプロイ → 種類「ウェブアプリ」**。
   - 実行ユーザー：**自分**
   - アクセスできるユーザー：**全員**
6. 発行された **ウェブアプリ URL（`…/exec`）** を控える。

> GAS の実行ユーザー（あなた）が、演習点数報告・生徒IDシート・マーク模試フォームの
> 3つのスプレッドシートを閲覧できる共有設定になっている必要があります。

## 2. 設定（実シートに合わせて記入済み）

`gas/Code.gs` は実スプレッドシートに合わせて設定済みです。要点：

- **認証はオフ**（`CONFIG.AUTH_ENABLED: false`／フロント `config.js` も `AUTH_ENABLED: false`）。
  URL を知っていれば誰でも閲覧できます。あとでトークン制限を掛ける場合は、両方を `true` にし、
  `CONFIG.ACCESS_TOKEN` を設定、配布URLに `?token=...` を付けてください（手順4参照）。
- **スプレッドシートID**（記入済み）
  - 演習点数報告 2026（回答）：`1ILJjWsOjVog3rQDrtSQ4E1Hh6Vodd-wpfRdczxRlWYY`
  - 生徒IDシート（GV Science DB）：`1JuEYCeSnBhKCw1Q9jbhh9CCstStQOF6uOCQAkfZvyOU`
  - ☆試験成績報告（回答／マーク模試）：`1b9vzmfH76k6hrXJ0AWZnZVmvbQzYBE_LWCcfVa8q5ZY`
- **生徒IDシート**：タブ `生徒ID`、列 A:名前 / C:学年 / E:理科使用科目 / F:担任。
- **演習成績**：タブ `化学 成績`・`生物 成績`（A〜F=名前/テスト名/実施日/合計/平均/偏差値、以降 分野ごとに4列）。
  分野名は両シートのヘッダーに厳密一致させています。
- **マーク模試**：タブ `マーク模試(フォーム)`。名前=F(6)、合計=7、試験名=2、志望校は 9（旧）/10（新）の両対応、
  国英数理社情報の各列も設定済み。「GV模試／英数」を含む校内模試は英数のみ（`PARTIAL_KEYWORDS`）として扱います。

### 表示範囲についての注意（重要）

- 一覧に出るのは **演習成績（化学 / 生物）のデータがある生徒のみ**です。現データでは
  名簿138名のうち約48名が表示されます。**化学基礎 / 生物基礎 / 地学基礎 / 物理 のみ**の生徒は、
  対応する演習成績シートが無いため一覧に出ません（エラーにはなりません）。
- 基礎科目の成績シートを今後追加する場合は、`gas/Code.gs` の `SCORES_SHEETS` と
  `SCORES_FIELDS` のコメントアウト箇所に実シート名・分野名を記入すれば表示されます。

### 授業の欠席率（実装済み）

- 欠席率は `gas/Code.gs` の `ABSENCE` 設定で取得します（ID `10laMTB...`／`ENABLED:true`）。
- 仕組み：**学年×科目でタブを解決**（既定タブ名「`<学年> <科目>`」例：`既卒 化学`／`H3 化学基礎`）し、
  そのタブ1行目の **「生徒名」「欠席率」** 列をヘッダー名で特定して、生徒の欠席率（%）を読みます。
  タブ名が違っても、半角/全角スペース区切りで「学年トークン」と「科目ラベル」を両方含むタブを
  自動で探します。学年表記の対応は `ABSENCE.GRADE_ALIAS`（`既卒`/`H3`等）で調整可。
- 表示：**一覧**＝各科目スタットの下に「欠席率 N%」、**個人詳細**＝ヘッダー右に科目別ピル。
  しきい値は `docs/constants.js` の `ABS_WARN`(15) / `ABS_BAD`(30) で色分け（良好/やや多い/多い）。
- 確認：`selfTest` を実行すると、先頭生徒の各科目について `absence[...]: tab=… rate=…` を
  ログ出力します。`tab=(見つからず)` の場合はタブ名を確認してください。
- 一時的に止めたいときは `ABSENCE.ENABLED=false`（欠席率は表示されなくなります）。

## 3. フロント（GitHub Pages）を公開する

1. `docs/config.js` を開き、`GAS_ENDPOINT` に手順1の `…/exec` URL を設定。
2. リポジトリに push。**Settings → Pages → Build and deployment → Deploy from a branch**、ブランチを選び **フォルダを `/docs`** に設定して保存。
3. 数十秒後、`https://<ユーザー>.github.io/<リポジトリ>/` で公開されます。

## 4. 先生への配布

**現在は認証オフ**なので、配布は公開URLをそのまま渡すだけです：

```
https://<ユーザー>.github.io/<リポジトリ>/#/students
```

### あとでトークン制限を掛けたくなったら

1. `gas/Code.gs` … `CONFIG.AUTH_ENABLED` を `true`、`CONFIG.ACCESS_TOKEN` に任意の文字列（例 `gv-2026-9f3a...`）。GAS を再デプロイ。
2. `docs/config.js` … `AUTH_ENABLED` を `true` に。push。
3. 配布URLにトークンを付ける：`…/#/students?token=gv-2026-9f3a...`
   - 初回アクセスでトークンが `sessionStorage` に保存され、URL からは自動で消えます（履歴に残りません）。タブを閉じると破棄。
   - トークンが無い／無効なときはトークン入力画面が出ます。簡易認証なので配布は限定してください。

---

## 動作・設計メモ

- **通信は GET のみ**（ContentService の JSON）。クロスオリジンで取得でき、CORS のプリフライトを避けるためトークンはクエリで渡します。
- **キャッシュ**：GAS 側は一覧/詳細を 30 分キャッシュ。フロントは直前データを `sessionStorage` に持ち即描画→裏で再取得（SWR）。右上の**更新**ボタンで `fresh=1` を付けて取り直します。
- **リトライ**：429/5xx・ネットワーク失敗は指数バックオフで最大4回再試行。
- **状態**：一覧・詳細とも 読込／空／エラー を表示。検索・フィルタで0件は「該当する生徒がいません」。
- **分野別の折れ線**：欠測月（null）は軸から外して詰め、存在する月だけを連続線でつなぎます（補間なし・線は途切れない）。
- **エンドポイント**
  - `GET …/exec?action=students&token=…` → `{ students:[…], homerooms:[…] }`
  - `GET …/exec?action=scores&name=<生徒名>&token=…` → `{ detail:{…} }`
  - エラーは HTTP 200 のまま body に `{ error:'UNAUTHORIZED' | 'NO_DATA' | … }`。

## トラブルシュート

- **認証エラー画面が出る** → `config.js` のトークンと `Code.gs` の `ACCESS_TOKEN` が一致しているか。
- **一覧が空** → 生徒IDシートの列マップ（ROSTER.COL）と履修科目の表記、`selfTest` のログを確認。
- **分野の値が 1/100 で出る/おかしい** → 得点率列がパーセント書式なら自動で100倍補正します。ヘッダー名が「<分野名> 得点率」と一致しているか確認。
- **詳細でグラフが出ない** → そのテスト件数が1件だと折れ線は出ません（2件以上で描画）。
- **CORS で失敗** → デプロイのアクセスが「全員」か、URL が `…/exec` か確認。
