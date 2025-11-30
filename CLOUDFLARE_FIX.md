# 🔧 Cloudflare Pages 構建錯誤修復

## 問題
錯誤訊息顯示 Cloudflare Pages 誤將項目識別為 Workers 項目，需要 wrangler 配置。

## ✅ 解決方案

### 方法 1：正確設置構建配置（推薦）

在 Cloudflare Pages 的構建設置中，請確保：

#### ⚠️ 重要設置

1. **Framework preset:**
   ```
   Next.js
   ```
   必須明確選擇或確保自動檢測到

2. **Build command:**
   ```
   npm install && npm run build
   ```
   或者
   ```
   npm run build
   ```

3. **Build output directory:**
   ```
   留空
   ```
   ⚠️ **不要填寫 `.next`**，讓 Cloudflare 自動處理 Next.js 構建輸出

4. **Root directory:**
   ```
   留空
   ```
   表示根目錄

5. **Node.js version:**
   ```
   18
   ```
   或選擇最新版本

### 方法 2：如果還是失敗，檢查以下設置

#### 確認 package.json 中的構建腳本
確保 `package.json` 中有：
```json
{
  "scripts": {
    "build": "next build"
  }
}
```

#### 確認 next.config.js 存在
確保根目錄有 `next.config.js` 文件。

---

## 🔄 重新部署步驟

1. **進入 Cloudflare Pages 項目設置**
   - 點擊項目名稱
   - 進入 **"Settings"** → **"Builds & deployments"**

2. **檢查構建設置**
   - Framework preset: 必須是 `Next.js`
   - Build command: `npm run build`
   - Build output directory: **留空**
   - Root directory: **留空**

3. **如果 Framework preset 不是 Next.js**
   - 刪除當前項目
   - 重新創建項目
   - 這次確保選擇 `Next.js` 框架

4. **重新部署**
   - 點擊 **"Retry deployment"** 或觸發新的部署

---

## 📝 正確的構建配置截圖說明

### 構建設置應該如下：

```
Framework preset: [Next.js ▼]
Build command: npm run build
Build output directory: (留空)
Root directory: (留空)
Node.js version: 18
```

⚠️ **關鍵：Build output directory 必須留空！**

Cloudflare Pages 會自動處理 Next.js 的構建輸出，如果手動填寫 `.next` 會導致錯誤。

---

## 🆘 如果還是不行

### 選項 A：刪除並重新創建項目

1. 刪除當前 Cloudflare Pages 項目
2. 重新創建項目
3. 選擇倉庫：`alexhuang0915/FishBroCapital-PTBot-Online`
4. **重要：** 在 Framework preset 中明確選擇 `Next.js`
5. 其他設置保持默認或留空
6. 點擊部署

### 選項 B：使用 Cloudflare Pages Functions（如果 API 路由有問題）

如果 Next.js API 路由在 Cloudflare Pages 上無法正常工作，可能需要調整配置。

---

## 📞 需要進一步幫助？

如果問題仍然存在，請提供：
1. 完整的構建日誌
2. 當前構建設置的截圖
3. Framework preset 的選項列表

我會根據具體情況提供更精確的解決方案。

