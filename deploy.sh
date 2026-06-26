#!/bin/bash
set -e

echo "===> 进入项目目录"
cd /www/wwwroot/firefly-blog-test

echo "===> 丢弃服务器本地改动"
git restore .

echo "===> 拉取最新代码"
git pull origin master

echo "===> 安装依赖"
pnpm install

echo "===> 构建项目"
pnpm build

echo "===> 同步到正式站目录"
mkdir -p /www/wwwroot/firefly-blog-prod
rm -rf /www/wwwroot/firefly-blog-prod/*
cp -r dist/* /www/wwwroot/firefly-blog-prod/

echo "===> 部署完成"
