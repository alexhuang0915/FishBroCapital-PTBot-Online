# GitHub 連接指南

## 📋 前置準備

### 1. 安裝 Git

如果您的系統還沒有安裝 Git：

1. **下載 Git**
   - 訪問：https://git-scm.com/download/win
   - 下載 Windows 版本並安裝

2. **安裝時注意**
   - ✅ 選擇 "Add Git to PATH"
   - ✅ 選擇 "Use Visual Studio Code as Git's default editor"（如果使用 VS Code）
   - ✅ 其他選項使用預設值即可

3. **驗證安裝**
   - 打開 PowerShell 或 CMD
   - 輸入：`git --version`
   - 應該會顯示 Git 版本號

### 2. 創建 GitHub 帳號（如果還沒有）

1. 訪問：https://github.com
2. 註冊新帳號或登入

## 🚀 在 Cursor 中連接 GitHub

### 方法一：使用 Cursor 內建 Git UI（最簡單）

#### 步驟 1：初始化 Git 倉庫

1. 在 Cursor 中打開 `FishBroCapital_PTBot_online` 資料夾
2. 點擊左側的 **Source Control** 圖標（或按 `Ctrl+Shift+G`）
3. 如果看到 "Initialize Repository" 按鈕，點擊它
4. 或者使用命令面板：
   - 按 `Ctrl+Shift+P`
   - 輸入 `Git: Initialize Repository`
   - 選擇當前資料夾

#### 步驟 2：第一次提交

1. 在 Source Control 面板中，您會看到所有未追蹤的檔案
2. 點擊檔案旁邊的 **+** 號來暫存檔案（或點擊 "Stage All Changes"）
3. 在上方的輸入框輸入提交訊息，例如：`Initial commit: FishBro Capital Dashboard`
4. 點擊 **✓ Commit** 按鈕（或按 `Ctrl+Enter`）

#### 步驟 3：在 GitHub 創建新倉庫

1. 訪問 https://github.com/new
2. 填寫倉庫資訊：
   - **Repository name**: `fishbro-capital-dashboard`（或您喜歡的名稱）
   - **Description**: FishBro Capital Performance Dashboard
   - **Visibility**: 選擇 Public 或 Private
   - **不要**勾選 "Initialize with README"（因為我們已經有檔案了）
3. 點擊 "Create repository"

#### 步驟 4：連接遠端倉庫

1. 在 Cursor 的 Source Control 面板，點擊右上角的 **...** 選單
2. 選擇 **Remote** → **Add Remote**
3. 輸入遠端名稱：`origin`
4. 輸入遠端 URL：
   ```
   https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   ```
   例如：`https://github.com/yourusername/fishbro-capital-dashboard.git`

#### 步驟 5：推送到 GitHub

1. 在 Source Control 面板，點擊右上角的 **...** 選單
2. 選擇 **Push** → **Push to...**
3. 選擇 `origin` 和 `main`（或 `master`）
4. 如果提示認證，輸入您的 GitHub 使用者名稱和 Personal Access Token

### 方法二：使用終端機（如果 Git 已安裝）

打開 Cursor 的終端機（`Ctrl+`` 或 Terminal → New Terminal），然後執行：

```bash
# 1. 初始化 Git
git init

# 2. 添加所有檔案
git add .

# 3. 第一次提交
git commit -m "Initial commit: FishBro Capital Dashboard"

# 4. 添加遠端倉庫（替換成您的 GitHub 倉庫 URL）
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# 5. 設定分支名稱
git branch -M main

# 6. 推送到 GitHub
git push -u origin main
```

## 🔐 GitHub 認證

### 使用 Personal Access Token（推薦）

由於 GitHub 不再支援密碼認證，您需要使用 Personal Access Token：

1. **創建 Token**
   - 訪問：https://github.com/settings/tokens
   - 點擊 "Generate new token" → "Generate new token (classic)"
   - 填寫資訊：
     - **Note**: Cursor Git Access
     - **Expiration**: 選擇期限（建議 90 天或更長）
     - **Scopes**: 勾選 `repo`（完整倉庫權限）
   - 點擊 "Generate token"
   - **重要**：複製並保存 Token（只會顯示一次）

2. **使用 Token**
   - 當 Git 要求輸入密碼時，使用 Personal Access Token 代替密碼
   - 使用者名稱：您的 GitHub 使用者名稱
   - 密碼：貼上 Personal Access Token

### 使用 GitHub CLI（可選）

```bash
# 安裝 GitHub CLI
# 然後登入
gh auth login
```

## 📝 後續更新

每次修改代碼後：

1. **在 Cursor 中**：
   - Source Control 面板會顯示更改
   - 暫存檔案（點擊 +）
   - 輸入提交訊息
   - 點擊 Commit
   - 點擊 Sync Changes（或 Push）

2. **或使用終端機**：
   ```bash
   git add .
   git commit -m "描述您的更改"
   git push
   ```

## 🐛 常見問題

### 問題 1：Git 命令找不到

**解決方案**：
- 確保已安裝 Git 並添加到 PATH
- 重啟 Cursor
- 檢查終端機中的 PATH：`$env:PATH`

### 問題 2：認證失敗

**解決方案**：
- 使用 Personal Access Token 而不是密碼
- 確保 Token 有 `repo` 權限
- 檢查 Token 是否過期

### 問題 3：推送被拒絕

**解決方案**：
```bash
# 先拉取遠端更改
git pull origin main --allow-unrelated-histories

# 然後再推送
git push -u origin main
```

## 📚 參考資源

- Git 官方文檔：https://git-scm.com/doc
- GitHub 文檔：https://docs.github.com
- Cursor Git 文檔：在 Cursor 中按 `F1` 搜尋 "Git"

