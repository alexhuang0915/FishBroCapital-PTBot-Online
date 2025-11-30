# Cloudflare Pages 立即部署指南 🚀

## ✅ 你已經完成的步驟
- [x] 登入 Cloudflare Pages
- [x] 連結 GitHub 倉庫

## 📝 現在請按照以下設置

### 在 Cloudflare Pages 配置頁面，請設置：

#### 1. 項目名稱 (Project name)
```
fishbro-ptbot-online
```
或任何你喜歡的名稱

---

#### 2. 生產分支 (Production branch)
```
main
```

---

#### 3. 構建設置 (Build settings)

⚠️ **重要：** Cloudflare Pages 可能會自動檢測到 Next.js，但請手動確認以下設置：

**Framework preset:**
```
Next.js
```
如果沒有自動檢測，手動選擇或留空

**Build command:**
```
npm run build
```

**Build output directory:**
```
.next
```
或者留空，讓 Cloudflare 自動處理

**Root directory:**
```
/
```
留空即可（表示根目錄）

**Node.js version:**
```
18
```
或選擇最新版本

---

#### 4. 環境變量 (Environment variables)

**目前不需要設置**，直接跳過或留空

---

#### 5. 點擊 "Save and Deploy" 按鈕 🚀

---

## ⏱️ 構建時間

- 首次構建：約 **3-5 分鐘**
- 後續構建：約 **2-3 分鐘**

構建過程會顯示在頁面上，你可以實時查看進度。

---

## ✅ 構建完成後

你會看到：
1. ✅ **構建成功** 的綠色提示
2. 🌐 **網站 URL**：`your-project-name.pages.dev`
3. 📊 **部署詳情** 可以查看

---

## 🧪 測試網站

構建完成後，請測試：
1. ✅ 網站可以訪問
2. ✅ 數據正常載入
3. ✅ API 路由正常：`/api/strategies`
4. ✅ 手機版顯示正常

---

## ❗ 如果構建失敗

### 常見問題：

**1. 構建命令錯誤**
- 檢查 Build command 是否為：`npm run build`

**2. 依賴安裝失敗**
- 檢查 Node.js 版本（建議 18 或以上）
- 查看構建日誌中的錯誤信息

**3. 找不到文件**
- 確認 `public/data/strategies.json` 已提交到 Git
- 檢查 Root directory 設置

### 查看構建日誌：

1. 在 Cloudflare Pages 項目中
2. 點擊 **"Deployments"** 標籤
3. 選擇失敗的部署
4. 查看 **"Build logs"**

---

## 🎉 完成！

部署成功後，你的網站就運行在 Cloudflare Pages 上了！

**優勢：**
- ✅ 完全免費
- ✅ 無限帶寬
- ✅ 全球 CDN
- ✅ 自動部署（每次 push 自動更新）

---

## 📞 需要幫助？

如果遇到問題，請告訴我：
1. 構建失敗的錯誤信息
2. 構建日誌的具體內容
3. 在哪一步遇到問題

我會立即幫你解決！

