# Cloudflare Pages 404 錯誤修復方案

## ✅ 已完成的配置

1. ✅ 安裝了 `@cloudflare/next-on-pages` 適配器
2. ✅ 添加了 `public/_redirects` 文件處理路由
3. ✅ 配置了構建腳本

## 🔧 需要在 Cloudflare Pages 設置中修改

### 步驟 1: 更新構建命令

在 Cloudflare Pages Dashboard：

1. 進入項目設置
2. **Builds & deployments** → **Build configuration**
3. 修改 **Build command** 為：

```
npm run build && npm run pages:build
```

或者（更簡潔）：

```
npx @cloudflare/next-on-pages@1
```

### 步驟 2: 更新 Build output directory

**Build output directory** 設置為：

```
.vercel/output/static
```

這是 `@cloudflare/next-on-pages` 適配器生成的輸出目錄。

### 步驟 3: 其他設置保持不變

- Framework preset: `Next.js`
- Root directory: 留空
- Production branch: `main`

## 📋 完整設置總結

- **Build command**: `npm run build && npm run pages:build`
- **Build output directory**: `.vercel/output/static`
- **Root directory**: 留空
- **Framework preset**: `Next.js`

## 🚀 操作步驟

1. 提交並推送當前的更改
2. 在 Cloudflare Dashboard 更新構建設置（如上方）
3. 點擊 "Save and Deploy" 或等待自動重新部署
4. 等待構建完成（約 3-5 分鐘）
5. 測試訪問 URL

## ⚠️ 注意

- 構建時間可能會增加（因為需要運行適配器）
- 首次構建可能需要更長時間
- 如果構建失敗，檢查構建日誌中的錯誤信息

## 🔍 如果還有問題

1. 檢查構建日誌確認適配器是否成功運行
2. 確認 `.vercel/output/static` 目錄是否被正確生成
3. 檢查是否有構建錯誤

