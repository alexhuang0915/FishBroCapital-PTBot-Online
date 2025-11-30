#!/bin/bash
# Cloudflare Pages 構建腳本（可選）
# 如果 Cloudflare 自動檢測有問題，可以使用這個腳本

echo "🚀 開始構建..."

# 安裝依賴
echo "📦 安裝依賴..."
npm ci

# 運行預處理腳本（確保 JSON 文件是最新的）
echo "🔄 運行預處理腳本..."
npm run preprocess || echo "⚠️ 預處理腳本失敗，繼續構建..."

# 構建 Next.js 應用
echo "🏗️ 構建 Next.js 應用..."
npm run build

echo "✅ 構建完成！"

