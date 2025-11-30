# Cloudflare Pages 部署修復方案

## ❌ 問題

構建成功，但部署失敗：
```
Error: Pages only supports files up to 25 MiB in size
.next/cache/webpack/server-production/0.pack is 44.9 MiB in size
```

## ✅ 解決方案

已經創建了構建後清理腳本，現在需要在 Cloudflare Pages 設置中更新構建命令。

### 在 Cloudflare Pages 構建設置中修改：

**Build command** 改為：
```bash
npm run build && node scripts/clean-build.js
```

或者（更簡單，使用 postbuild hook）：
```bash
npm run build
```

（`postbuild` 會自動執行清理）

### 完整的設置應該是：

1. **Framework preset**: `Next.js` ✅
2. **Build command**: `npm run build` 或 `npm run build && node scripts/clean-build.js`
3. **Build output directory**: **留空**
4. **Root directory**: **留空**
5. **Production branch**: `main` ✅

## 📝 已添加的文件

1. `scripts/clean-build.js` - 自動清理構建緩存
2. `package.json` - 添加了 `postbuild` 腳本
3. `.cloudflareignore` - 嘗試排除緩存文件（Cloudflare 可能不支持，但嘗試）

## 🚀 下一步

1. 在 Cloudflare Pages 設置中更新構建命令
2. 保存並重新部署
3. 如果還有問題，我們需要使用 `@cloudflare/next-on-pages` 適配器
