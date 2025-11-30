# 部署替代方案

## 當前狀況

- **當前平台**: Netlify（免費額度快用光）
- **項目類型**: Next.js 應用（有 API 路由）
- **數據來源**: 預處理的 JSON 文件（`public/data/strategies.json`）

## 方案比較

### 方案 1: GitHub Pages（完全免費，推薦）⭐

**優點：**
- ✅ 完全免費，無限制
- ✅ 無限帶寬（GitHub 倉庫大小限制 100GB，但對這個項目足夠）
- ✅ 自動部署（GitHub Actions）
- ✅ 全球 CDN
- ✅ 無流量限制

**限制：**
- ❌ 只支持靜態網站（不支持 Next.js API 路由）
- ⚠️ **需要改為靜態導出**

**解決方案：**
由於我們已經有預處理的 JSON 文件，可以：
1. 將 Next.js 改為靜態導出（`output: 'export'`）
2. 前端直接從 `public/data/strategies.json` 讀取（不需要 API）
3. 部署到 GitHub Pages

**實施難度：** ⭐⭐（中等，需要修改代碼）

---

### 方案 2: Vercel（推薦）⭐

**優點：**
- ✅ 專為 Next.js 設計，完美支持
- ✅ 免費額度：100GB 帶寬/月，100 次部署/天
- ✅ 自動部署（連接 GitHub）
- ✅ 全球 CDN
- ✅ 無需修改代碼

**限制：**
- ⚠️ 免費方案有額度限制（但比 Netlify 寬鬆）

**實施難度：** ⭐（簡單，只需連接 GitHub）

---

### 方案 3: Cloudflare Pages（推薦）⭐

**優點：**
- ✅ 完全免費，無限制
- ✅ 支持 Next.js（包括 API 路由）
- ✅ 無限帶寬
- ✅ 全球 CDN（Cloudflare 網絡）
- ✅ 自動部署（連接 GitHub）

**限制：**
- ⚠️ API 路由在免費方案有限制（但對這個項目足夠）

**實施難度：** ⭐（簡單，只需連接 GitHub）

---

### 方案 4: Render

**優點：**
- ✅ 免費方案可用
- ✅ 支持 Next.js
- ✅ 自動部署

**限制：**
- ⚠️ 免費方案：服務器會在 15 分鐘無活動後休眠
- ⚠️ 首次訪問需要等待啟動（約 30 秒）

**實施難度：** ⭐⭐（中等）

---

## 推薦方案排序

1. **Cloudflare Pages** - 完全免費，支持 Next.js API，無限制
2. **Vercel** - 專為 Next.js 設計，免費額度充足
3. **GitHub Pages** - 完全免費，但需要改為靜態導出
4. **Render** - 可用，但有休眠限制

---

## 快速遷移指南

### 遷移到 Cloudflare Pages（推薦）

1. **註冊 Cloudflare 帳號**
   - 訪問 https://pages.cloudflare.com
   - 使用 GitHub 登錄

2. **連接 GitHub 倉庫**
   - 點擊 "Create a project"
   - 選擇你的 GitHub 倉庫
   - 構建設置：
     - Framework preset: `Next.js`
     - Build command: `npm run build`
     - Build output directory: `.next`

3. **環境變量（如果需要）**
   - 在項目設置中添加環境變量

4. **部署**
   - Cloudflare 會自動構建和部署
   - 完成後會提供 `*.pages.dev` 域名

**優點：** 完全免費，無限制，支持 Next.js API 路由

---

### 遷移到 Vercel

1. **註冊 Vercel 帳號**
   - 訪問 https://vercel.com
   - 使用 GitHub 登錄

2. **導入項目**
   - 點擊 "Add New Project"
   - 選擇你的 GitHub 倉庫
   - Vercel 會自動檢測 Next.js 配置

3. **部署**
   - 點擊 "Deploy"
   - 完成後會提供 `*.vercel.app` 域名

**優點：** 專為 Next.js 設計，免費額度充足

---

### 改為靜態導出 + GitHub Pages

如果需要完全免費且無限制的方案，可以改為靜態導出：

1. **修改 `next.config.js`**
   ```javascript
   const nextConfig = {
     output: 'export',
     images: {
       unoptimized: true
     }
   }
   ```

2. **修改前端代碼**
   - 將 `fetch('/api/strategies')` 改為直接讀取 `public/data/strategies.json`
   - 使用 `fetch('/data/strategies.json')` 或直接 import

3. **部署到 GitHub Pages**
   - 使用 GitHub Actions 自動部署
   - 或手動上傳 `out` 目錄

**優點：** 完全免費，無限制
**缺點：** 需要修改代碼，失去 API 路由功能

---

## 建議

**立即行動：**
1. 先嘗試 **Cloudflare Pages**（最簡單，完全免費）
2. 如果 Cloudflare 有問題，改用 **Vercel**（專為 Next.js 設計）
3. 如果兩個都不行，再考慮改為靜態導出 + GitHub Pages

**長期方案：**
- Cloudflare Pages 或 Vercel 都是很好的選擇
- 如果流量很大，可以考慮自建 VPS（但需要付費）

