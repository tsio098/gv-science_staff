/* config.js — 本番設定（GitHub Pages 用フロントの唯一の設定箇所）
 *
 * ★ デプロイ前にここを書き換えてください。
 *
 *  GAS_ENDPOINT … GAS を「ウェブアプリ」としてデプロイしたときに発行される
 *                 実行用 URL（.../exec で終わるもの）。
 *                 例: https://script.google.com/macros/s/AKfycbxxxxxxxx/exec
 *
 *  公開リポジトリ（public）で運用する場合、この URL とトークンはコードから
 *  読み取れます。トークンは限定配布リンク用の簡易認証であり、機密ではありません。
 *  本当に秘匿が必要な情報は GAS 側（スプレッドシート）に置き、ここには出しません。
 */
window.GV_CONFIG = {
  // GAS ウェブアプリの /exec URL（未設定だと「サンプルデータ」で起動します）
  GAS_ENDPOINT: 'https://script.google.com/macros/s/AKfycbyMq1ej9Tun-Olt4u88Jip2ZLWDAZFbRsO3vp9GskmPTzOnLXH-rmvDfGulIxw-eq9O/exec',

  // 認証：false なら「URL を知っていれば誰でも閲覧可」（トークン入力画面を出さない）。
  //   あとでトークン制限を掛けるときは true にし、GAS 側 CONFIG.AUTH_ENABLED も true に、
  //   配布URLに ?token=... を付ける運用に切り替えてください。GAS の ACCESS_TOKEN と一致が必要。
  AUTH_ENABLED: false,

  // sessionStorage / クエリで使うトークンのキー名（通常は変更不要）
  TOKEN_PARAM: 'token',

  // SWR キャッシュのスキーマ版。GAS の返却構造を変えたら上げる（古いキャッシュ失効）。
  CACHE_VERSION: 'v1',

  // GAS 側 30 分キャッシュの保持秒数の目安（表示用。実際の制御は GAS 側）。
  // フロントの sessionStorage キャッシュはタブを閉じるまで保持。
  STALE_MS: 30 * 60 * 1000,

  // GAS_ENDPOINT 未設定時にサンプルデータで動かすか（デモ・デザイン確認用）。
  // 本番では false でも可（その場合は未設定だと設定エラー画面）。
  ALLOW_SAMPLE_WHEN_UNSET: true,
};
