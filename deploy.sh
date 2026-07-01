#!/bin/bash
set -e

# ===== 配置区（按需修改）=====
# 生产目录：构建产物会同步到这里，Nginx 站点根目录应指向它
PROD_DIR="/www/wwwroot/firefly-blog-prod"
# 远程分支名
BRANCH="main"
# ==============================

# 自动定位脚本所在目录（即仓库目录），无论从哪里调用都能正确进入
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 安全检查：生产目录不能为空或根目录，防止误删
if [ -z "$PROD_DIR" ] || [ "$PROD_DIR" = "/" ]; then
	echo "❌ 错误：PROD_DIR 配置非法 ('$PROD_DIR')" >&2
	exit 1
fi

echo "============================================"
echo "  Firefly Blog 一键部署"
echo "  仓库: $SCRIPT_DIR"
echo "  目标: $PROD_DIR"
echo "============================================"

cd "$SCRIPT_DIR"

# ---- 检查 Node ----
echo ""
echo "===> 检查 Node 版本 (要求 >= 22)"
if ! command -v node &>/dev/null; then
	echo "❌ 错误：未找到 node，请先安装 Node.js >= 22" >&2
	exit 1
fi
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
if [ "$NODE_MAJOR" -lt 22 ]; then
	echo "❌ 错误：当前 Node 版本为 $(node -v 2>/dev/null || echo unknown)，需要 Node >= 22" >&2
	exit 1
fi
echo "    ✅ Node: $(node -v)"

# ---- 检查 pnpm ----
echo ""
echo "===> 检查 pnpm"
if ! command -v pnpm &>/dev/null; then
	echo "    ⚠️  未找到 pnpm，尝试全局安装..."
	npm install -g pnpm
fi
echo "    ✅ pnpm: $(pnpm -v)"

# ---- 丢弃服务器本地改动 ----
echo ""
echo "===> 丢弃服务器本地改动"
git restore . 2>/dev/null || true

# ---- 拉取最新代码 (兼容 force-push 与新版 git) ----
echo ""
echo "===> 拉取最新代码 ($BRANCH)"
git config --local pull.rebase false 2>/dev/null || true
git fetch origin "$BRANCH" 2>/dev/null || true
git checkout -B "$BRANCH" "origin/$BRANCH"

# ---- 安装依赖 ----
echo ""
echo "===> 安装依赖"
pnpm install --frozen-lockfile

# ---- 构建项目 ----
echo ""
echo "===> 构建项目"
pnpm build

# ---- 检查构建产物 ----
if [ ! -d "dist" ]; then
	echo "❌ 错误：构建失败，未找到 dist 目录" >&2
	exit 1
fi

# ---- 同步到正式站目录 ----
echo ""
echo "===> 同步到正式站目录: $PROD_DIR"
mkdir -p "$PROD_DIR"
rm -rf "${PROD_DIR:?}"/*
cp -r dist/* "$PROD_DIR"/

echo ""
echo "============================================"
echo "  ✅ 部署完成！"
echo "  站点根目录: $PROD_DIR"
echo "============================================"