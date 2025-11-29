# 快速開始 - 連接 GitHub

## 🎯 當前步驟

您現在看到的是 Cursor 的 Source Control 面板。請按照以下步驟操作：

### 步驟 1：初始化倉庫 ✅

1. **點擊 "Initialize Repository" 按鈕**
   - 這會在當前資料夾中創建 Git 倉庫

### 步驟 2：第一次提交

初始化後，您會看到所有檔案出現在 "Changes" 區域：

1. **暫存所有檔案**
   - 點擊 "Stage All Changes" 按鈕（或點擊每個檔案旁邊的 + 號）

2. **輸入提交訊息**
   - 在上方的輸入框中輸入：`Initial commit: FishBro Capital Dashboard`

3. **提交**
   - 點擊 ✓ 按鈕（或按 `Ctrl+Enter`）

### 步驟 3：在 GitHub 創建倉庫

1. 訪問：https://github.com/new
2. 填寫：
   - **Repository name**: `fishbro-capital-dashboard`
   - **Description**: FishBro Capital Performance Dashboard
   - **Visibility**: Public 或 Private（您選擇）
   - **不要**勾選任何初始化選項
3. 點擊 "Create repository"

### 步驟 4：連接遠端倉庫

1. 在 Cursor 的 Source Control 面板，點擊右上角的 **...**（三個點）
2. 選擇 **Remote** → **Add Remote...**
3. 輸入：
   - **Remote name**: `origin`
   - **Remote URL**: `https://github.com/YOUR_USERNAME/fishbro-capital-dashboard.git`
     （替換 YOUR_USERNAME 為您的 GitHub 使用者名稱）

### 步驟 5：推送到 GitHub

1. 點擊右上角的 **...** 選單
2. 選擇 **Push** → **Push to...**
3. 選擇：
   - **Remote**: `origin`
   - **Branch**: `main`（或 `master`）

### 步驟 6：認證（如果需要）

如果提示輸入認證資訊：

1. **使用者名稱**：您的 GitHub 使用者名稱
2. **密碼**：使用 Personal Access Token（不是 GitHub 密碼）

**如何獲取 Token**：
- 訪問：https://github.com/settings/tokens
- 點擊 "Generate new token (classic)"
- 勾選 `repo` 權限
- 生成並複製 Token
- 在密碼欄位貼上這個 Token

## ✅ 完成！

推送成功後，您的代碼就會在 GitHub 上了！

## 🔄 後續更新

每次修改代碼後：
1. 在 Source Control 面板會看到更改
2. 點擊 "Stage All Changes"
3. 輸入提交訊息
4. 點擊 Commit
5. 點擊 "Sync Changes" 或 "Push"

---

**需要幫助？** 查看 `GITHUB_SETUP.md` 獲取更詳細的說明。


