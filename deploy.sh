#!/usr/bin/env bash

set -Eeuo pipefail

APP_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REMOTE="${DEPLOY_REMOTE:-origin}"
BRANCH="${DEPLOY_BRANCH:-main}"
SERVICE_NAME="${SERVICE_NAME:-neo-studio}"
PM2_APP_NAME="${PM2_APP_NAME:-$SERVICE_NAME}"

log() {
  printf '\n\033[1;32m[deploy]\033[0m %s\n' "$1"
}

fail() {
  printf '\n\033[1;31m[deploy] 失败：%s\033[0m\n' "$1" >&2
  exit 1
}

cd "$APP_DIR"

[[ -d .git ]] || fail "当前目录不是 Git 仓库：$APP_DIR"
[[ -f package.json ]] || fail "找不到 package.json：$APP_DIR"
command -v git >/dev/null 2>&1 || fail "服务器未安装 Git"
command -v npm >/dev/null 2>&1 || fail "服务器未安装 npm"

log "检查服务器 Node.js 版本"
node --version
npm --version

log "拉取 $REMOTE/$BRANCH"
git fetch "$REMOTE" "$BRANCH"
git pull --ff-only "$REMOTE" "$BRANCH"

log "安装依赖"
npm ci

log "执行类型检查"
npm run check

log "执行测试"
npm test

log "构建生产版本"
npm run build

if command -v pm2 >/dev/null 2>&1 && pm2 describe "$PM2_APP_NAME" >/dev/null 2>&1; then
  log "使用 PM2 重启 $PM2_APP_NAME"
  pm2 restart "$PM2_APP_NAME" --update-env
  pm2 save
elif command -v systemctl >/dev/null 2>&1 && systemctl cat "$SERVICE_NAME" >/dev/null 2>&1; then
  log "使用 systemd 重启 $SERVICE_NAME"
  sudo systemctl restart "$SERVICE_NAME"
  sudo systemctl --no-pager --full status "$SERVICE_NAME"
else
  cat <<EOF

构建已完成，但没有检测到正在运行的 PM2 或 systemd 服务。
请确认服务名称，或手动重启：

  PM2_APP_NAME=$PM2_APP_NAME pm2 restart "$PM2_APP_NAME" --update-env
  sudo systemctl restart "$SERVICE_NAME"

项目目录：$APP_DIR
生产启动命令：npm start
EOF
  exit 0
fi

log "发布完成"
