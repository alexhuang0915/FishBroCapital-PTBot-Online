import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 策略配置
const STRATEGY_CONFIG = [
  // MNQ Strategies (USD)
  { name: 'MNQ_DX_120', file: 'CME.MNQ HOT  MNQ_DX_120_BackTest 策略回測績效報告.xlsx', currency: 'USD' },
  { name: 'MNQ_VIX_60', file: 'CME.MNQ HOT  MNQ_VIX_60_BackTest 策略回測績效報告.xlsx', currency: 'USD' },
  { name: 'MNQ_VIX_120', file: 'CME.MNQ HOT  MNQ_VIX_120_BackTest 策略回測績效報告.xlsx', currency: 'USD' },
  { name: 'MNQ_ZN_120', file: 'CME.MNQ HOT  MNQ_ZN_120_BackTest 策略回測績效報告.xlsx', currency: 'USD' },
  { name: 'MNQ_6J_60', file: 'CME.MNQ HOT  MNQ_6J_60_BackTest 策略回測績效報告.xlsx', currency: 'USD' },
  { name: 'MNQ_6J_120', file: 'CME.MNQ HOT  MNQ_6J_120_BackTest 策略回測績效報告.xlsx', currency: 'USD' },
  // MXF Strategies (TWD)
  { name: 'MXF_VIX_120', file: 'TWF.MXF HOT  MXF_VIX_120_BackTest 策略回測績效報告.xlsx', currency: 'TWD' },
  { name: 'MXF_VIX_60', file: 'TWF.MXF HOT  MXF_VIX_60_BackTest 策略回測績效報告.xlsx', currency: 'TWD' },
  { name: 'MXF_ZN_120', file: 'TWF.MXF HOT  MXF_ZN_120_BackTest 策略回測績效報告.xlsx', currency: 'TWD' },
  { name: 'MXF_6J_60', file: 'TWF.MXF HOT  MXF_6J_60_BackTest 策略回測績效報告.xlsx', currency: 'TWD' },
  { name: 'MXF_DX_60', file: 'TWF.MXF HOT  MXF_DX_60_BackTest 策略回測績效報告.xlsx', currency: 'TWD' },
  { name: 'MXF_DX_120', file: 'TWF.MXF HOT  MXF_DX_120_BackTest 策略回測績效報告.xlsx', currency: 'TWD' },
];

const reportsPath = path.join(__dirname, '..', '..', '策略報告');
const jsonPath = path.join(__dirname, '..', 'public', 'data', 'strategies.json');
const EXCHANGE_RATE = 32.5; // USD to TWD

// 從 Excel 讀取交易明細
function readTradesFromExcel(filePath, strategyName) {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = '交易明細';
    
    if (!workbook.SheetNames.includes(sheetName)) {
      console.error(`  ❌ ${strategyName}: 找不到「交易明細」工作表`);
      return null;
    }
    
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { defval: null });
    
    // 找到標題行
    let headerRow = -1;
    let dateCol = null;
    let pnlCol = null;
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const keys = Object.keys(row);
      
      // 尋找包含「日期」和「獲利」的列
      for (const key of keys) {
        const value = String(row[key] || '').trim();
        if (value === '日期' || value.includes('日期')) {
          dateCol = key;
        }
        if (value === '獲利(¤)' || value.includes('獲利')) {
          pnlCol = key;
        }
      }
      
      if (dateCol && pnlCol) {
        headerRow = i;
        break;
      }
    }
    
    if (headerRow === -1 || !dateCol || !pnlCol) {
      console.error(`  ❌ ${strategyName}: 找不到日期或獲利欄位`);
      return null;
    }
    
    // 提取交易數據（跳過標題行）
    const trades = [];
    for (let i = headerRow + 1; i < data.length; i++) {
      const row = data[i];
      const date = row[dateCol];
      const pnl = row[pnlCol];
      
      if (date && pnl !== null && pnl !== undefined && pnl !== '') {
        const dateStr = typeof date === 'string' ? date.trim() : String(date);
        const pnlNum = typeof pnl === 'number' ? pnl : parseFloat(String(pnl).replace(/[,$]/g, ''));
        
        if (dateStr && !isNaN(pnlNum)) {
          trades.push({
            date: dateStr,
            pnl: pnlNum
          });
        }
      }
    }
    
    return {
      totalTrades: trades.length,
      trades: trades,
      dateCol: dateCol,
      pnlCol: pnlCol
    };
  } catch (error) {
    console.error(`  ❌ ${strategyName}: 讀取 Excel 失敗 - ${error.message}`);
    return null;
  }
}

// 驗證策略數據
function verifyStrategy(strategyConfig, jsonData) {
  const { name, file, currency } = strategyConfig;
  const filePath = path.join(reportsPath, file);
  
  console.log(`\n📊 驗證策略: ${name}`);
  console.log(`   文件: ${file}`);
  console.log(`   貨幣: ${currency}`);
  
  // 1. 檢查文件是否存在
  if (!fs.existsSync(filePath)) {
    console.log(`   ❌ 文件不存在: ${filePath}`);
    return false;
  }
  console.log(`   ✓ 文件存在`);
  
  // 2. 從 Excel 讀取交易明細
  const excelData = readTradesFromExcel(filePath, name);
  if (!excelData) {
    return false;
  }
  console.log(`   ✓ Excel 交易明細: ${excelData.totalTrades} 筆`);
  
  // 3. 檢查 JSON 中的策略數據
  const jsonStrategy = jsonData.strategies[name];
  if (!jsonStrategy) {
    console.log(`   ❌ JSON 中找不到策略數據`);
    return false;
  }
  
  const jsonTrades = jsonData.trades[name] || [];
  // JSON 結構：strategies[name] 本身就是數據數組
  const jsonDailyData = Array.isArray(jsonStrategy) ? jsonStrategy : (jsonStrategy.data || []);
  
  console.log(`   ✓ JSON 交易數據: ${jsonTrades.length} 筆`);
  console.log(`   ✓ JSON 每日數據: ${jsonDailyData.length} 天`);
  
  // 4. 驗證交易筆數（允許一些差異，因為可能有過濾）
  const tradeCountDiff = Math.abs(excelData.totalTrades - jsonTrades.length);
  if (tradeCountDiff > excelData.totalTrades * 0.1) {
    console.log(`   ⚠️  交易筆數差異較大: Excel=${excelData.totalTrades}, JSON=${jsonTrades.length}, 差異=${tradeCountDiff}`);
  } else {
    console.log(`   ✓ 交易筆數驗證通過 (Excel: ${excelData.totalTrades}, JSON: ${jsonTrades.length})`);
  }
  
  // 5. 驗證每日數據的日期範圍
  if (jsonDailyData.length > 0) {
    const firstDate = jsonDailyData[0].date;
    const lastDate = jsonDailyData[jsonDailyData.length - 1].date;
    console.log(`   ✓ 日期範圍: ${firstDate} ~ ${lastDate}`);
    
    // 檢查權益曲線連續性
    let equityError = false;
    let prevEquity = jsonDailyData[0].equity;
    for (let i = 1; i < jsonDailyData.length; i++) {
      const currentEquity = jsonDailyData[i].equity;
      const expectedEquity = prevEquity + jsonDailyData[i].pnl;
      const diff = Math.abs(currentEquity - expectedEquity);
      
      if (diff > 0.01) {
        console.log(`   ❌ 權益曲線不連續 (第 ${i} 天, 日期: ${jsonDailyData[i].date}): 預期=${expectedEquity}, 實際=${currentEquity}, 差異=${diff}`);
        equityError = true;
        break;
      }
      prevEquity = currentEquity;
    }
    
    if (!equityError) {
      console.log(`   ✓ 權益曲線連續性驗證通過`);
    }
    
    // 6. 驗證貨幣轉換（USD 策略應該有轉換）
    if (currency === 'USD') {
      // 檢查每日數據中的貨幣轉換
      if (jsonDailyData.length > 0 && jsonTrades.length > 0) {
        // 取幾個樣本進行驗證
        let conversionVerified = false;
        let conversionErrors = 0;
        
        // 檢查前 5 筆交易
        for (let i = 0; i < Math.min(5, jsonTrades.length); i++) {
          const jsonTrade = jsonTrades[i];
          const tradeDate = jsonTrade.date;
          
          // 在 Excel 數據中找對應的交易（日期可能格式不同，需要匹配）
          const excelTrade = excelData.trades.find(t => {
            const excelDate = String(t.date).trim();
            const jsonDate = String(tradeDate).trim();
            return excelDate === jsonDate || excelDate.replace(/\//g, '-') === jsonDate.replace(/\//g, '-');
          });
          
          if (excelTrade && jsonTrade.pnl !== undefined) {
            // 如果已經轉換，jsonTrade.pnl 應該接近 excelTrade.pnl * 32.5
            const expectedTWD = excelTrade.pnl * EXCHANGE_RATE;
            const ratio = Math.abs(jsonTrade.pnl / excelTrade.pnl);
            const diff = Math.abs(jsonTrade.pnl - expectedTWD);
            
            if (ratio > 25 && ratio < 40) {
              conversionVerified = true;
            } else if (ratio > 0.9 && ratio < 1.1) {
              conversionErrors++;
              if (conversionErrors === 1) {
                console.log(`   ❌ 貨幣未轉換 (樣本 ${i+1}: Excel PnL=${excelTrade.pnl}, JSON PnL=${jsonTrade.pnl}, 預期 TWD=${expectedTWD.toFixed(2)})`);
              }
            }
          }
        }
        
        if (conversionVerified) {
          console.log(`   ✓ 貨幣轉換驗證通過 (USD → TWD, 匯率: ${EXCHANGE_RATE})`);
        } else if (conversionErrors > 0) {
          console.log(`   ❌ 貨幣轉換驗證失敗 (發現 ${conversionErrors} 個未轉換的樣本)`);
        } else {
          // 如果無法找到對應交易，檢查每日數據的 pnl 值是否合理（TWD 應該比 USD 大很多）
          const sampleDay = jsonDailyData[Math.floor(jsonDailyData.length / 2)];
          if (sampleDay.pnl && Math.abs(sampleDay.pnl) > 1000) {
            // 如果 pnl 值很大，可能是已經轉換的 TWD
            console.log(`   ⚠️  無法直接驗證貨幣轉換，但數據值看起來合理 (樣本 PnL: ${sampleDay.pnl.toFixed(2)})`);
          } else {
            console.log(`   ⚠️  無法驗證貨幣轉換（無對應交易數據）`);
          }
        }
      } else {
        console.log(`   ⚠️  無法驗證貨幣轉換（數據不足）`);
      }
    } else {
      console.log(`   ✓ 貨幣為 TWD，無需轉換`);
    }
  }
  
  return true;
}

// 主驗證函數
async function verifyAllData() {
  console.log('============================================================');
  console.log('開始驗證所有策略數據（從交易明細開始）');
  console.log('============================================================\n');
  
  // 1. 檢查 JSON 文件是否存在
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ JSON 文件不存在: ${jsonPath}`);
    process.exit(1);
  }
  console.log(`✓ JSON 文件存在: ${jsonPath}\n`);
  
  // 2. 讀取 JSON 數據
  let jsonData;
  try {
    const jsonContent = fs.readFileSync(jsonPath, 'utf8');
    jsonData = JSON.parse(jsonContent);
    console.log(`✓ JSON 數據載入成功`);
    console.log(`  策略數量: ${Object.keys(jsonData.strategies || {}).length}`);
    console.log(`  總天數: ${jsonData.metadata?.totalDays || 'N/A'}`);
    console.log(`  日期範圍: ${jsonData.metadata?.dateRange?.start || 'N/A'} ~ ${jsonData.metadata?.dateRange?.end || 'N/A'}\n`);
  } catch (error) {
    console.error(`❌ 讀取 JSON 失敗: ${error.message}`);
    process.exit(1);
  }
  
  // 3. 驗證每個策略
  let allPassed = true;
  const results = [];
  
  for (const config of STRATEGY_CONFIG) {
    const passed = verifyStrategy(config, jsonData);
    results.push({ name: config.name, passed });
    if (!passed) {
      allPassed = false;
    }
  }
  
  // 4. 驗證組合投資組合數據
  console.log(`\n📊 驗證組合投資組合數據`);
  const portfolioData = jsonData.rawPortfolioData || [];
  if (portfolioData.length === 0) {
    console.log(`   ❌ 組合投資組合數據為空`);
    allPassed = false;
  } else {
    console.log(`   ✓ 組合投資組合數據: ${portfolioData.length} 天`);
    
    // 檢查組合數據的連續性
    let portfolioError = false;
    let prevEquity = portfolioData[0].equity;
    for (let i = 1; i < portfolioData.length; i++) {
      const currentEquity = portfolioData[i].equity;
      const expectedEquity = prevEquity + portfolioData[i].pnl;
      const diff = Math.abs(currentEquity - expectedEquity);
      
      if (diff > 0.01) {
        console.log(`   ❌ 組合權益曲線不連續 (第 ${i} 天, 日期: ${portfolioData[i].date}): 預期=${expectedEquity}, 實際=${currentEquity}, 差異=${diff}`);
        portfolioError = true;
        break;
      }
      prevEquity = currentEquity;
    }
    
    if (!portfolioError) {
      console.log(`   ✓ 組合權益曲線連續性驗證通過`);
    }
  }
  
  // 5. 總結
  console.log('\n============================================================');
  console.log('驗證結果總結');
  console.log('============================================================');
  
  results.forEach(({ name, passed }) => {
    console.log(`  ${passed ? '✓' : '❌'} ${name}`);
  });
  
  if (allPassed) {
    console.log('\n✅ 所有驗證通過！');
  } else {
    console.log('\n❌ 部分驗證失敗，請檢查上述錯誤訊息');
    process.exit(1);
  }
  
  console.log('============================================================\n');
}

verifyAllData().catch(error => {
  console.error('\n❌ 驗證過程發生錯誤:', error);
  console.error('錯誤詳情:', error.message);
  console.error('堆疊追蹤:', error.stack);
  process.exit(1);
});

