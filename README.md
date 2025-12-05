# FishBro Capital - Performance Dashboard (Online Version)

這是一個基於 Next.js 的績效報告儀表板，用於展示交易策略的回測結果。這是準備部署到線上的版本。

## 🚀 快速開始

### 前置需求

- Node.js 18+ 
- npm 或 yarn

### 本地開發

1. **安裝依賴**
   ```bash
   cd FishBroCapital_PTBot_online
   npm install
   ```

2. **啟動開發伺服器**
   ```bash
   npm run dev
   ```

3. **在瀏覽器中打開**
   ```
   http://localhost:3000
   ```

### 部署到線上

#### Cloudflare Pages（當前使用）

項目已配置並部署到 Cloudflare Pages：

- **線上網址**: `https://fishbrocapital-ptbot-online.pages.dev/`
- **自動部署**: 每次 `git push` 到 `main` 分支會自動構建和部署
- **構建命令**: `npm run pages:build`（會自動運行 `preprocess` 生成 `strategies.json`）
- **輸出目錄**: `.vercel/output/static`
- **數據安全**: `strategies.json` 不會推送到 Git，而是在 Cloudflare Pages 構建時自動生成

## 📁 專案結構

```
FishBroCapital_PTBot_online/
├── app/
│   ├── api/
│   │   └── strategies/
│   │       └── route.js     # API 路由（讀取預處理的 JSON 數據）
│   ├── layout.jsx           # 根布局
│   ├── page.jsx             # 主頁面
│   └── globals.css           # 全局樣式
├── components/
│   ├── PerformanceReport.jsx # 主要儀表板組件
│   └── ui/
│       └── card.jsx          # UI 組件
├── lib/
│   ├── excelParser.js        # CSV/Excel 解析器（用於本地預處理）
│   └── utils.js              # 工具函數
├── public/
│   └── data/
│       ├── *.csv              # CSV 策略數據（用於構建時生成 JSON）
│       └── strategies.json    # 預處理的 JSON 數據（構建時自動生成，不推送到 Git）
├── _PythonScripts/
│   ├── preprocess_strategies.mjs  # 數據預處理腳本
│   └── update_strategy_reports.mjs  # 更新策略報告腳本
└── package.json
```

## ⚙️ 配置

### Gemini API (可選)

如果需要使用 AI 分析功能，請在 `components/PerformanceReport.jsx` 第 29 行填入你的 Gemini API Key：

```javascript
const genAI = new GoogleGenerativeAI("YOUR_API_KEY_HERE");
```

### Logo 圖片

Logo URL 已在 `components/PerformanceReport.jsx` 第 34 行配置，如需更換請修改：

```javascript
const LOGO_URL = "https://your-image-url.com/logo.jpg";
```

## 📊 功能特色

- ✅ 多策略績效展示
- ✅ 投資組合總覽
- ✅ Equity 曲線圖
- ✅ Drawdown 分析
- ✅ 月度收益熱圖
- ✅ 相關性矩陣
- ✅ 貢獻度分析
- ✅ AI 策略診斷（需 API Key）

## 🔧 開發指令

```bash
# 開發模式
npm run dev

# 建置生產版本（會自動運行 preprocess 生成 strategies.json）
npm run build

# 單獨預處理數據（生成 strategies.json）
npm run preprocess

# Cloudflare Pages 構建（包含適配器，會自動生成 strategies.json）
npm run pages:build

# 代碼檢查
npm run lint
```

## 📝 注意事項

- **數據來源**: 使用預處理的 JSON 檔案（`public/data/strategies.json`）
- **數據更新**: 
  - 本地開發：運行 `npm run preprocess` 從 CSV 檔案生成 JSON
  - Cloudflare Pages：構建時會自動運行 `preprocess` 生成 JSON
- **數據安全**: 
  - `strategies.json` 已加入 `.gitignore`，不會推送到 Git 倉庫
  - CSV 檔案在 `public/data/` 目錄中，會被推送到 Git（用於構建）
  - 構建時會自動從 CSV 生成 `strategies.json`
- **AI 功能**: 需要有效的 Gemini API Key（在 `components/PerformanceReport.jsx` 中配置）
- **環境要求**: Node.js 版本 >= 18
- **部署注意**: 
  - Cloudflare Pages 構建命令已包含 `preprocess`，會自動生成 `strategies.json`
  - 確保 `public/data/*.csv` 檔案已包含在 Git 提交中

## 🐛 問題排查

如果遇到問題：

1. **依賴安裝失敗**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **端口被占用**
   - 修改 `package.json` 中的 dev 指令，添加 `-p 3001` 使用其他端口

3. **樣式不顯示**
   - 確認 `tailwind.config.js` 中的 content 路徑正確
   - 確認 `app/globals.css` 已正確導入

