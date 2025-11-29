# 部署指南

## 📋 前置準備

1. **GitHub 帳號**：確保您有 GitHub 帳號
2. **Vercel 帳號**：推薦使用 Vercel 進行部署（免費且簡單）

## 🚀 部署步驟

### 方法一：使用 Vercel（推薦）

#### 步驟 1：初始化 Git 倉庫

```bash
cd FishBroCapital_PTBot_online

# 初始化 Git（如果還沒有）
git init

# 添加所有檔案
git add .

# 提交
git commit -m "Initial commit: FishBro Capital Performance Dashboard"
```

#### 步驟 2：推送到 GitHub

```bash
# 在 GitHub 上創建新倉庫（例如：fishbro-capital-dashboard）

# 添加遠端倉庫
git remote add origin https://github.com/YOUR_USERNAME/fishbro-capital-dashboard.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

#### 步驟 3：在 Vercel 部署

1. 訪問 [Vercel](https://vercel.com)
2. 使用 GitHub 帳號登入
3. 點擊 "Add New Project"
4. 選擇您的 GitHub 倉庫
5. Vercel 會自動檢測 Next.js 專案
6. 點擊 "Deploy"

**完成！** 幾分鐘後您的網站就會上線。

### 方法二：使用 Netlify

1. 訪問 [Netlify](https://www.netlify.com)
2. 使用 GitHub 帳號登入
3. 點擊 "Add new site" → "Import an existing project"
4. 選擇您的 GitHub 倉庫
5. 構建設置：
   - Build command: `npm run build`
   - Publish directory: `.next`
6. 點擊 "Deploy site"

### 方法三：使用 Railway

1. 訪問 [Railway](https://railway.app)
2. 使用 GitHub 帳號登入
3. 點擊 "New Project" → "Deploy from GitHub repo"
4. 選擇您的倉庫
5. Railway 會自動檢測並部署

## ⚙️ 環境變數配置

如果需要配置環境變數（例如 Gemini API Key），在部署平台設置：

### Vercel
1. 進入專案設置
2. 點擊 "Environment Variables"
3. 添加變數：
   - `GEMINI_API_KEY` = 您的 API Key

### Netlify
1. 進入 Site settings
2. 點擊 "Environment variables"
3. 添加變數

## 📝 注意事項

1. **CSV 檔案**：確保 CSV 檔案已包含在 Git 倉庫中（已在 `.gitignore` 中排除，但 CSV 檔案會被包含）
2. **檔案上傳**：上傳的檔案會儲存在 `public/uploads/` 目錄
3. **自動部署**：當您推送到 GitHub 時，Vercel/Netlify 會自動重新部署

## 🔄 更新部署

每次更新代碼後：

```bash
git add .
git commit -m "Update: 描述您的更改"
git push
```

部署平台會自動檢測更改並重新部署。

## 🐛 問題排查

### 構建失敗

1. 檢查 `package.json` 中的依賴是否正確
2. 查看構建日誌中的錯誤訊息
3. 確保 Node.js 版本 >= 18

### 檔案上傳失敗

1. 檢查 `public/uploads/` 目錄權限
2. 確保部署平台支援檔案寫入
3. 考慮使用外部儲存服務（如 AWS S3）

## 📞 需要幫助？

- Vercel 文檔：https://vercel.com/docs
- Next.js 部署：https://nextjs.org/docs/deployment

