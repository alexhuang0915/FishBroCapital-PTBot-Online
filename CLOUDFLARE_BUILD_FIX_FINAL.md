# Cloudflare Pages 構建修復（最終版本）

## ❌ 當前問題

構建失敗：錯誤 "Failed: error occurred while running build command"

## 🔧 需要修復的設置

### 問題 1: Build output directory 路徑錯誤

**當前（錯誤）**：`/.vercel/output/static`  
**應該改為**：`.vercel/output/static` （去掉開頭的斜杠 `/`）

### 問題 2: 構建命令

**當前**：`npm run pages:build`  
**應該改為**：`npm run pages:build` （這個是對的，但讓我們確保它包含完整的構建流程）

## ✅ 正確的 Cloudflare Pages 設置

在 Cloudflare Dashboard → Builds & deployments：

### Build command
```
npm run pages:build
```

或者（如果上面不工作）：
```
npm run build && npx @cloudflare/next-on-pages@1
```

### Build output directory
```
.vercel/output/static
```
**重要：不要加前面的斜杠 `/`**

### 其他設置
- Framework preset: `Next.js`
- Root directory: 留空
- Production branch: `main`

## 🔄 已更新的代碼

1. ✅ `package.json` - `pages:build` 腳本已更新
2. ✅ `wrangler.toml` - 添加了 Cloudflare 配置文件

## 🚀 操作步驟

1. **在 Cloudflare Dashboard 修改設置**：
   - Build output directory 改為：`.vercel/output/static`（去掉前面的 `/`）
   - Build command 保持：`npm run pages:build`

2. **推送最新代碼**（如果還沒有）

3. **重新部署**

## 📝 說明

`npm run pages:build` 會：
1. 運行 `npm run build`（構建 Next.js）
2. 運行 `npx @cloudflare/next-on-pages@1`（生成 Cloudflare 輸出）

生成的輸出在 `.vercel/output/static` 目錄。

## ⚠️ 關鍵修復

**Build output directory 必須是**：`.vercel/output/static`  
**不能是**：`/.vercel/output/static`（有前導斜杠）

這是導致構建失敗的主要原因！

