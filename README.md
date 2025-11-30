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
- **構建命令**: `npm run pages:build`
- **輸出目錄**: `.vercel/output/static`

詳細部署說明請參考 `DEPLOYMENT.md`

## 📁 專案結構

```
FishBroCapital_PTBot_online/
├── app/
│   ├── api/
│   │   └── strategies/
│   │       └── route.js     # API 路由（讀取 CSV 數據）
│   ├── layout.jsx           # 根布局
│   ├── page.jsx             # 主頁面
│   └── globals.css           # 全局樣式
├── components/
│   ├── PerformanceReport.jsx # 主要儀表板組件
│   └── ui/
│       └── card.jsx          # UI 組件
├── lib/
│   ├── excelParser.js        # CSV/Excel 解析器
│   └── utils.js              # 工具函數
├── public/
│   └── data/
│       ├── *.csv              # 策略回測數據（CSV 格式）
│       └── strategies.json    # 預處理的 JSON 數據
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

# 建置生產版本
npm run build

# 預處理數據（生成 strategies.json）
npm run preprocess

# Cloudflare Pages 構建（包含適配器）
npm run pages:build

# 代碼檢查
npm run lint
```

## 📝 注意事項

- **數據來源**: 使用 CSV 檔案作為數據源（位於專案根目錄）
- **AI 功能**: 需要有效的 Gemini API Key（在 `components/PerformanceReport.jsx` 中配置）
- **環境要求**: Node.js 版本 >= 18
- **部署注意**: 
  - 確保 CSV 檔案已包含在部署中
  - 如需使用環境變數，請在部署平台設置 `.env` 檔案

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

