# Session Handover
生成日時: 2026-06-05 13:45

## タスクの目的
塾・予備校「GV Science」の**先生用 成績ダッシュボード**（読み取り専用Webアプリ）を本番稼働させる。
構成は **バックエンド=Google Apps Script(GAS) Web App / フロント=GitHub Pages(静的サイト)**。
先生が生徒一覧→個人詳細で、演習成績の推移・共通テスト型マーク模試・志望校・授業欠席率を閲覧する。
プロトタイプ（デザイン）を本番コードに落とし込み、実スプレッドシートに接続して公開するのがゴール。

## 完了した作業
- **本番構成の最終化**：`docs/`（フロント）＋ `gas/Code.gs`（バックエンド）＋ `DEPLOY.md`。
- **認証オフ**：`CONFIG.AUTH_ENABLED=false`（GAS）/ `config.js` の `AUTH_ENABLED=false`。URLを知っていれば誰でも閲覧可。あとで両方を `true` + `ACCESS_TOKEN` + `?token=` でトークン制限に切替可能。
- **3スプレッドシートIDを設定し、実シートに合わせて列マップ確定**（下記「決定事項」）。
- **演習成績の分野名をヘッダーから自動検出**（`autoFields_`）。化学20分野・生物11分野で手書きと一致を確認。
- **基礎科目シートを事前登録**（`化学基礎 成績`/`生物基礎 成績`/`地学基礎 成績`）。未作成の間は自動スキップ。
- **マーク模試(約2.9万行)を TextFinder で高速化**、志望校は9/10列の二系統対応。
- **学年順ソート対応**：実データの学年表記 `既卒`/`H3` に合わせ `GRADE_ORDER`/`gradeRank` を修正。
- **E列(理科使用科目)が空白/未回答の生徒を除外**して軽量化（名簿138名→105名処理）。
- **授業欠席率を実装**（GAS取得＋フロント表示。指示書「学年×科目でシートを絞り欠席率を取得」に準拠）。
  - 一覧：各科目スタット下に「欠席率 N%」/カードに欠席チップ。詳細：ヘッダー右に科目別ピル（`AttMini`）。
  - 送付された `teacher_欠席率版.html` のCSS・クラス（`tw-sstat-abs`/`tw-card-abs`/`tw-att-mini`/`tw-att-pill`、level: good/warn/bad）を `teacher.css` に取り込み。
  - しきい値 `ABS_WARN=15` / `ABS_BAD=30`（`docs/constants.js`）。
- **GitHubに公開**：リポジトリ `https://github.com/tsio098/gv-science_staff`（main / `/docs`）へ push 済み、GitHub Pages 有効化済み。
- 検証：`selfTest` で `roster: 105 名`・氏名取得を確認。Code.gs構文OK、JSX5ファイルBabelトランスパイルOK。

## 残タスク・TODO
- [x] **公開サイトの最終目視確認**（2026-06-05 セッション2で完了）：原因は GitHub Pages の公開元が `main /(root)` になっており、`index.html` がある `/docs` を見ていなかったため 404。**Pages設定を `/docs` に変更**して解決。一覧（48名・36名要注目）・詳細（稲福恭佳で模試6回／化学10テスト／分野別20分野）すべて実データ表示を確認済み。
- [x] **欠席率がnullになる不具合を特定・修正**（セッション2）：`?action=students` のJSONで全生徒 `absence:null`。原因は **欠席率タブ（例「既卒 化学」）の見出し行が3行目**（1・2行目は日付）で、`absCols_` が1行目しか見ていなかったこと（タブ名・科目ラベルの解決自体は正常）。`生徒名`=B列・`欠席率`=E3 を確認。**`absCols_` を先頭最大12行からヘッダー行を動的検出する実装に変更**し、`readAbsenceMap_`/`readAbsenceForStudent_` のデータ開始行を `headerRow+1` に修正（Code.gs）。`node --check` 構文OK。
  - ⚠️ **未反映**：この修正は GAS Web App を**再デプロイするまで本番に反映されない**（下記「次のセッションへの注意事項」参照）。
- [ ] **GAS再デプロイ＋欠席率の実機確認**：修正済み Code.gs を GAS エディタに反映→再デプロイ→`?action=students` で `absence` が数値になるか／サイトで欠席率チップ・ピルが出るか確認。30分キャッシュに注意。`selfTest` の `absence[...]: tab=… rate=…` も確認推奨。
- [ ] **基礎科目の成績シート（化学基礎/生物基礎/地学基礎 成績）が未作成**。作成すれば自動で表示（同じ列構成にすること）。

## 設計・技術的な決定事項
- **スプレッドシートID / タブ / 列**
  - 演習点数報告 `1ILJjWsOjVog3rQDrtSQ4E1Hh6Vodd-wpfRdczxRlWYY`：タブ `化学 成績`・`生物 成績`。A〜F=名前/テスト名/実施日/合計点/平均点/偏差値、以降 分野ごと4列（分野名/得点率/平均得点率/偏差値）。得点率は%書式→GASで×100補正。
  - 生徒IDシート `1JuEYCeSnBhKCw1Q9jbhh9CCstStQOF6uOCQAkfZvyOU`（ファイル名 GV Science DB）：タブ `生徒ID`。A:名前(1)/C:学年(3)/E:理科使用科目(5)/F:担任(6)。学年は `既卒`/`H3`。中身はIMPORTRANGE/QUERYで他ファイルから取得。
  - マーク模試 `1b9vzmfH76k6hrXJ0AWZnZVmvbQzYBE_LWCcfVa8q5ZY`（☆試験成績報告（回答））：タブ `マーク模試(フォーム)`、30列・約2.9万行。名前=6,合計=7,試験名=2,志望校=9or10,国11/12/13,英R=15/L=16,数18/19,理20-25,社26-29,情報=30。
  - 欠席率 `10laMTBkDx6gafoMSbQr3ib1hSEt3G-NYTWTuX9iB7qw`：タブ「`<学年> <科目>`」（例 `既卒 化学`）。各タブ1行目に `生徒名`・`欠席率`(%既計算)。`resolveAbsenceSheet_` が完全名→トークン一致で解決、`absCols_` がヘッダー名で列特定。
- **GASウェブアプリURL**：`https://script.google.com/macros/s/AKfycbyMq1ej9Tun-Olt4u88Jip2ZLWDAZFbRsO3vp9GskmPTzOnLXH-rmvDfGulIxw-eq9O/exec`（`docs/config.js` の `GAS_ENDPOINT` に設定済み）。
- **APIは GET のみ**：`?action=students` / `?action=scores&name=`。エラーはHTTP200のbodyに `error`。SWR＋指数バックオフ＋GAS側30分キャッシュ。
- **分野名は SCORES_FIELDS が空なら自動検出**（基礎科目はこれで動く）。

## 試したがうまくいかなかったこと / ハマりどころ（重要）
- **OAuthスコープ**：`appsscript.json` を `spreadsheets.readonly` にすると `SpreadsheetApp.openById` が
  「Specified permissions are not sufficient」で失敗（roster:0）。→ **`https://www.googleapis.com/auth/spreadsheets`（フル）に変更**して解決。読み取り専用でもフルスコープが必須。スコープ変更後は再承認が必要。
- **末尾 `_` の関数はGASの実行ドロップダウンに出ない**（非公開扱い）。テスト関数を `selfTest_`→`selfTest` に改名。
- **selfTestのnull参照**：先頭生徒が基礎科目のみ（成績シート無し）だと `readScoresPerSubject_` が null→`totalTrend` 参照でTypeError。selfTestを「化学/生物を持つ生徒で、シートのある科目だけ」テストするよう修正（本番 `getDetail_` は元から null 除外で影響なし）。
- **Drive読み込みが巨大**：`read_file_content`/xlsx は25k/10MB上限超過。→ ツール結果の保存先 `…/.claude/projects/…/tool-results/*.txt` を **workspace bash + python/openpyxl** で解析。欠席率xlsxは10MB超でエクスポート不可→タブ名を列挙できず、GAS側の実行時リゾルバ＋`selfTest`ログで確認する方針にした。
- **bashサンドボックスはプロジェクトフォルダに書き込み不可**（Permission denied）。プロジェクト内ファイルの編集は必ず **Write/Edit ツール**で行う（bashは読み取り・/outputs書き込みのみ）。

## 次のセッションへの注意事項
- まず公開サイト `https://tsio098.github.io/gv-science_staff/` を確認。空/エラー時はブラウザF12のConsole/Networkを確認。
- 欠席率が出ない場合は GAS の `selfTest` を実行しログの `absence[...]: tab=…` を見る。`(見つからず)` なら実タブ名を確認。
- ファイル更新時は Write/Edit で直し、ユーザーがターミナルで `git add . && git commit -m "..." && git push`（push認証はPersonal Access Token）。GitHub Pagesはpushで自動再公開。
- GAS再デプロイで `/exec` URLが変わったら `config.js` の `GAS_ENDPOINT` を更新して再push。

## 関連ファイル・リソース
- `成績一覧表示/gas/Code.gs`（バックエンド本体）, `成績一覧表示/gas/appsscript.json`（スコープ=spreadsheets）
- `成績一覧表示/docs/`：`config.js`(GAS URL/認証) `constants.js`(科目メタ/欠席しきい値) `api.js`(通信) `sample-data.js`(デモ) `list.jsx` `detail.jsx` `app.jsx` `charts.jsx` `icons.jsx` `styles.css` `gradetrend.css` `teacher.css` `index.html` `.nojekyll`
- `成績一覧表示/DEPLOY.md`（セットアップ手順・トラブルシュート）
- リポジトリ：https://github.com/tsio098/gv-science_staff （main / Pages=/docs）
- 公開URL：https://tsio098.github.io/gv-science_staff/

## セッション情報
- セッションID: local_282e4967-cc3a-4ffd-bc1a-aee921f39ad1（環境cwdより。list_sessions未掲載のため参考値）
- 引き継ぎ生成日時: 2026-06-05 13:45
