# 部署說明

## 預處理數據流程

為了避免線上版本處理大量 CSV 數據時卡住，我們使用本地預處理的方式：

### 1. 本地預處理數據

在部署前，請先運行預處理腳本：

```bash
npm run preprocess
```

這個腳本會：
- 讀取所有 CSV 文件
- 將數據轉換為 TWD 並標準化為 1,000,000 TWD 起始資金
- 生成 `public/data/strategies.json` 文件（約 800KB）

### 2. 提交預處理結果

預處理生成的 JSON 文件會自動包含在 Git 提交中：

```bash
git add public/data/strategies.json
git commit -m "Update preprocessed data"
git push
```

### 3. 自動部署

Netlify 會自動：
- 檢測到 Git 推送
- 構建應用
- 部署包含預處理 JSON 的版本

### 4. 線上版本載入流程

線上版本會：
1. **優先讀取預處理的 JSON**（快速，約 1-2 秒）
2. 如果 JSON 不存在，才回退到讀取 CSV（較慢，用於開發）

## 更新數據流程

當 CSV 文件更新時：

1. 更新 CSV 文件
2. 運行 `npm run preprocess` 重新生成 JSON
3. 提交並推送更改
4. Netlify 自動部署

## 開發模式

在本地開發時，如果沒有預處理的 JSON，API 會自動從 CSV 文件讀取數據（較慢但可用於測試）。

## 注意事項

- 預處理的 JSON 文件大小約 800KB，已包含在 Git 倉庫中
- 如果 CSV 文件更新，必須重新運行預處理腳本
- 預處理腳本會自動處理貨幣轉換和數據標準化
