#!/usr/bin/env bash
# =============================================================================
#  build.sh — JSX を dist/*.js へ事前コンパイル（ブラウザ実行時の Babel を廃止）
# -----------------------------------------------------------------------------
#  なぜ必要か：
#    以前は <script type="text/babel"> でブラウザ起動のたびに JSX を変換しており、
#    初回ロードに ~2.9 秒かかっていた。事前コンパイルでこれを ~0.5 秒未満に短縮。
#
#  使い方（Node.js が必要）：
#    1) docs/ で:  bash build.sh
#       → docs/*.jsx を docs/dist/*.js に変換します（初回は babel を取得）。
#    2) index.html 内の  v=YYYYMMDDx  の番号を1つ上げる（キャッシュ無効化）。
#    3) リポジトリ直下で:  git add . && git commit -m "..." && git push
#
#  Node.js が無い場合は、JSX を編集したら「dist を作り直して」と依頼してください。
# =============================================================================
set -e
cd "$(dirname "$0")"
mkdir -p dist
npm install --no-save @babel/core @babel/preset-react >/dev/null 2>&1 || true
for f in icons charts list detail app; do
  node -e "const b=require('@babel/core'),fs=require('fs');fs.writeFileSync('dist/$f.js',b.transformFileSync('$f.jsx',{presets:[['@babel/preset-react',{runtime:'classic'}]],compact:false,comments:false}).code);"
  echo "built dist/$f.js"
done
echo "完了。index.html の v=… を上げてから push してください。"
