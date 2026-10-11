#!/bin/sh
# The app imports /environment.js at runtime (vite.config.js keeps the environment module out of
# the bundle), so the API and WebSocket addresses come from the container instead of the build.
set -eu

api_url="${API_URL:-http://localhost:7000}"
ws_url="${WS_URL:-$(echo "$api_url" | sed 's#^http#ws#')/ws}"

cat > /usr/share/nginx/html/environment.js <<JS
export const env = "${api_url}";
export const envWs = "${ws_url}";
JS

echo "environment.js: API_URL=${api_url} WS_URL=${ws_url}"
