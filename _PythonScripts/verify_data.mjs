/**
 * Verify Strategy Data Update
 * 驗證策略數據更新
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(__dirname, '../public/data/strategies.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log('============================================================');
console.log('策略數據驗證報告');
console.log('============================================================\n');

// 1. 基本元數據驗證
console.log('【1. 基本元數據】');
console.log(`策略數量: ${Object.keys(data.strategies).length}`);
console.log(`策略名稱: ${Object.keys(data.strategies).join(', ')}`);
console.log(`總天數: ${data.metadata.totalDates}`);
console.log(`日期範圍: ${data.metadata.dateRange.start} ~ ${data.metadata.dateRange.end}`);
console.log(`生成時間: ${data.metadata.generatedAt}`);
console.log(`匯率設定: ${JSON.stringify(data.metadata.exchangeRate)}`);
console.log('');

// 2. 各策略詳細數據驗證
console.log('【2. 各策略詳細數據】');
Object.keys(data.strategies).forEach(name => {
  const s = data.strategies[name];
  console.log(`\n${name}:`);
  console.log(`  天數: ${s.length}`);
  console.log(`  日期範圍: ${s[0]?.date} ~ ${s[s.length-1]?.date}`);
  const startEquity = s[0]?.equity - s[0]?.pnl;
  const endEquity = s[s.length-1]?.equity;
  console.log(`  起始權益: ${startEquity.toFixed(2)}`);
  console.log(`  最終權益: ${endEquity.toFixed(2)}`);
  console.log(`  總損益: ${(endEquity - startEquity).toFixed(2)}`);
  console.log(`  貨幣: ${s[0]?.currency}`);
  
  // 驗證權益曲線連續性
  let equityErrors = 0;
  for (let i = 1; i < s.length; i++) {
    const expectedEquity = s[i-1].equity + s[i].pnl;
    if (Math.abs(expectedEquity - s[i].equity) > 0.01) {
      equityErrors++;
    }
  }
  if (equityErrors === 0) {
    console.log(`  ✓ 權益曲線連續性: 正確`);
  } else {
    console.log(`  ❌ 權益曲線連續性: 發現 ${equityErrors} 個錯誤`);
  }
});

// 3. 匯率轉換驗證（MNQ 策略應該是 TWD）
console.log('\n【3. 匯率轉換驗證】');
const mnqStrategies = ['MNQ_DX_120', 'MNQ_VIX_60', 'MNQ_ZN_120', 'MNQ_6J_60', 'MNQ_6J_120'];
mnqStrategies.forEach(name => {
  const s = data.strategies[name];
  if (s && s.length > 0) {
    const sample = s[Math.floor(s.length/2)];
    console.log(`\n${name}:`);
    console.log(`  樣本日期: ${sample.date}`);
    console.log(`  PnL: ${sample.pnl.toFixed(2)}`);
    console.log(`  權益: ${sample.equity.toFixed(2)}`);
    console.log(`  貨幣: ${sample.currency}`);
    
    // 檢查是否為 TWD（應該已經轉換）
    if (sample.currency === 'TWD') {
      console.log(`  ✓ 貨幣已正確轉換為 TWD`);
    } else {
      console.log(`  ❌ 貨幣未轉換，仍為 ${sample.currency}`);
    }
  }
});

// 4. MXF 策略驗證（應該保持 TWD）
console.log('\n【4. MXF 策略驗證（應為 TWD）】');
const mxfStrategies = ['MXF_VIX_120'];
mxfStrategies.forEach(name => {
  const s = data.strategies[name];
  if (s && s.length > 0) {
    const sample = s[Math.floor(s.length/2)];
    console.log(`\n${name}:`);
    console.log(`  樣本日期: ${sample.date}`);
    console.log(`  PnL: ${sample.pnl.toFixed(2)}`);
    console.log(`  貨幣: ${sample.currency}`);
    
    if (sample.currency === 'TWD') {
      console.log(`  ✓ 貨幣正確為 TWD`);
    } else {
      console.log(`  ❌ 貨幣錯誤，應為 TWD，實際為 ${sample.currency}`);
    }
  }
});

// 5. 投資組合數據驗證
console.log('\n【5. 投資組合數據驗證】');
console.log(`投資組合天數: ${data.rawPortfolioData.length}`);
if (data.rawPortfolioData.length > 0) {
  const sampleDay = data.rawPortfolioData[Math.floor(data.rawPortfolioData.length/2)];
  console.log(`樣本日期: ${sampleDay.date}`);
  console.log('該日各策略 PnL:');
  Object.keys(sampleDay).filter(k => k.startsWith('pnl_')).forEach(k => {
    console.log(`  ${k}: ${sampleDay[k]?.toFixed(2) || 'N/A'}`);
  });
}

// 6. 交易數據驗證
console.log('\n【6. 交易數據驗證】');
Object.keys(data.trades).forEach(name => {
  const trades = data.trades[name];
  console.log(`${name}: ${trades.length} 筆交易`);
  if (trades.length > 0) {
    const sample = trades[Math.floor(trades.length/2)];
    console.log(`  樣本交易: 日期=${sample.date}, PnL=${sample.pnl.toFixed(2)}`);
  }
});

// 7. 數據完整性檢查
console.log('\n【7. 數據完整性檢查】');
let allValid = true;
Object.keys(data.strategies).forEach(name => {
  const s = data.strategies[name];
  if (!s || s.length === 0) {
    console.log(`❌ ${name}: 無數據`);
    allValid = false;
  } else {
    const hasInvalid = s.some(d => !d.date || d.pnl === undefined || d.equity === undefined || d.currency === undefined);
    if (hasInvalid) {
      console.log(`❌ ${name}: 包含無效數據`);
      allValid = false;
    } else {
      console.log(`✓ ${name}: 數據完整`);
    }
  }
});

// 8. 起始權益驗證（應該都是 1,000,000）
console.log('\n【8. 起始權益驗證（應為 1,000,000 TWD）】');
Object.keys(data.strategies).forEach(name => {
  const s = data.strategies[name];
  if (s && s.length > 0) {
    const startEquity = s[0].equity - s[0].pnl;
    const targetEquity = 1000000;
    const diff = Math.abs(startEquity - targetEquity);
    if (diff < 1) {
      console.log(`✓ ${name}: 起始權益正確 (${startEquity.toFixed(2)})`);
    } else {
      console.log(`⚠️  ${name}: 起始權益偏差 ${diff.toFixed(2)} (${startEquity.toFixed(2)})`);
    }
  }
});

console.log('\n============================================================');
console.log(allValid ? '✓ 所有策略數據完整' : '❌ 發現數據問題');
console.log('============================================================\n');

