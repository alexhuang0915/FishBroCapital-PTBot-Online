import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadAllStrategies } from '../lib/excelParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STRATEGY_CONFIG = [
  { 
    name: 'MNQ_DX_120', 
    originalCurrency: 'USD', 
    color: '#0891b2', 
    icon: 'NT$', 
    displayName: 'MNQ DX 120',
    filePatterns: [
      'CME.MNQ HOT  MNQ_DX_120_BackTest 策略回測績效報告.xlsx',
      'CME.MNQ HOT  MNQ_DX_120 策略回測績效報告.xlsx'
    ]
  },
  { 
    name: 'MNQ_VIX_60', 
    originalCurrency: 'USD', 
    color: '#10b981', 
    icon: 'NT$', 
    displayName: 'MNQ VIX 60',
    filePatterns: [
      'CME.MNQ HOT  MNQ_VIX_60_BackTest 策略回測績效報告.xlsx',
      'CME.MNQ HOT  MNQ_VIX_60 策略回測績效報告.xlsx'
    ]
  },
  { 
    name: 'MNQ_ZN_120', 
    originalCurrency: 'USD', 
    color: '#06b6d4', 
    icon: 'NT$', 
    displayName: 'MNQ ZN 120',
    filePatterns: [
      'CME.MNQ HOT  MNQ_ZN_120_BackTest 策略回測績效報告.xlsx',
      'CME.MNQ HOT  MNQ_ZN_120 策略回測績效報告.xlsx'
    ]
  },
  { 
    name: 'MNQ_6J_60', 
    originalCurrency: 'USD', 
    color: '#14b8a6', 
    icon: 'NT$', 
    displayName: 'MNQ 6J 60',
    filePatterns: [
      'CME.MNQ HOT  MNQ_6J_60_BackTest 策略回測績效報告.xlsx',
      'CME.MNQ HOT  MNQ_6J_60 策略回測績效報告.xlsx'
    ]
  },
  { 
    name: 'MNQ_6J_120', 
    originalCurrency: 'USD', 
    color: '#22d3ee', 
    icon: 'NT$', 
    displayName: 'MNQ 6J 120',
    filePatterns: [
      'CME.MNQ HOT  MNQ_6J_120_BackTest 策略回測績效報告.xlsx',
      'CME.MNQ HOT  MNQ_6J_120 策略回測績效報告.xlsx'
    ]
  },
  { 
    name: 'MXF_VIX_120', 
    originalCurrency: 'TWD', 
    color: '#f59e0b', 
    icon: 'NT$', 
    displayName: 'MXF VIX 120',
    filePatterns: [
      'CME.MNQ HOT  TXF_VIX_120_BackTest 策略回測績效報告.xlsx',
      'TWF.MXF HOT  MXF_VIX_120_BackTest 策略回測績效報告.xlsx',
      'TWF.MXF HOT  MXF_VIX_120 策略回測績效報告.xlsx'
    ]
  },
];

async function updateStrategyReports() {
  console.log('============================================================');
  console.log('開始更新策略報表數據...');
  console.log('============================================================\n');
  
  const basePath = process.cwd();
  const reportsPath = path.join(basePath, '..', '策略報告');
  
  console.log('專案路徑:', basePath);
  console.log('策略報告目錄:', reportsPath);
  console.log('');
  
  // 檢查策略報告目錄是否存在
  if (!fs.existsSync(reportsPath)) {
    console.error(`❌ 錯誤：找不到策略報告目錄: ${reportsPath}`);
    console.error('請確認策略報告目錄存在且包含 Excel 文件。');
    process.exit(1);
  }
  
  // 檢查文件是否存在（支援多個文件名模式）
  console.log('檢查策略報告文件...');
  const missingFiles = [];
  const foundFiles = new Map(); // 儲存找到的文件路徑
  
  STRATEGY_CONFIG.forEach(config => {
    let found = false;
    for (const filePattern of config.filePatterns) {
      const filePath = path.join(reportsPath, filePattern);
      if (fs.existsSync(filePath)) {
        console.log(`  ✓ ${config.name}: ${filePattern}`);
        foundFiles.set(config.name, filePath);
        found = true;
        break;
      }
    }
    if (!found) {
      console.log(`  ✗ ${config.name}: 未找到任何匹配的文件`);
      missingFiles.push(config.name);
    }
  });
  
  if (missingFiles.length > 0) {
    console.warn(`\n⚠️  警告：缺少以下策略的文件：`);
    missingFiles.forEach(name => console.warn(`  - ${name}`));
    console.warn(`將繼續處理現有的 ${STRATEGY_CONFIG.length - missingFiles.length} 個策略文件...\n`);
  } else {
    console.log('\n所有文件檢查通過！\n');
  }
  
  // 使用 loadAllStrategies 但指定策略報告目錄
  console.log('開始解析策略數據...\n');
  const strategies = loadAllStrategies(reportsPath, []);
  
  // 如果 loadAllStrategies 找不到文件，嘗試直接使用找到的文件路徑
  if (Object.keys(strategies).length === 0 && foundFiles.size > 0) {
    console.log('嘗試使用找到的文件路徑直接解析...\n');
    // 這裡需要手動解析，因為 loadAllStrategies 可能不匹配新文件名
    // 我們需要更新 excelParser.js 來支持新文件名格式
  }
  
  // 檢查是否成功載入所有策略
  const loadedStrategies = Object.keys(strategies).filter(name => 
    strategies[name].data && strategies[name].data.length > 0
  );
  
  console.log(`\n成功載入 ${loadedStrategies.length} 個策略：`);
  loadedStrategies.forEach(name => {
    const strategy = strategies[name];
    console.log(`  ✓ ${name}: ${strategy.data.length} 天數據, ${strategy.trades?.length || 0} 筆交易`);
  });
  
  if (loadedStrategies.length !== STRATEGY_CONFIG.length) {
    console.error(`\n⚠️  警告：預期 ${STRATEGY_CONFIG.length} 個策略，但只載入了 ${loadedStrategies.length} 個`);
  }
  
  // 轉換所有策略數據為 TWD
  console.log('\n開始轉換貨幣...');
  const strategiesDataTWD = {};
  const strategiesTradesTWD = {};
  const allDates = new Set();
  
  // 只處理存在的策略文件
  const existingStrategies = STRATEGY_CONFIG.filter(config => {
    // 檢查所有可能的文件名模式
    for (const filePattern of config.filePatterns) {
      const filePath = path.join(reportsPath, filePattern);
      if (fs.existsSync(filePath)) {
        return true;
      }
    }
    return false;
  });
  
  existingStrategies.forEach(config => {
    const strategy = strategies[config.name];
    if (!strategy || !strategy.data || strategy.data.length === 0) {
      console.log(`  ⚠️  跳過 ${config.name}：無數據`);
      return;
    }
    
    const originalCurrency = config.originalCurrency;
    const rate = originalCurrency === 'USD' ? 32.5 : 1;
    
    console.log(`  ${config.name}: ${originalCurrency} → TWD (匯率: ${rate})`);
    
    // 轉換每日數據
    const dataTWD = strategy.data.map(d => {
      allDates.add(d.date);
      return {
        ...d,
        pnl: d.pnl * rate,
        equity: d.equity * rate,
        pnlTWD: d.pnl * rate
      };
    });
    
    // 轉換交易數據
    const tradesTWD = (strategy.trades || []).map(t => ({
      ...t,
      pnl: t.pnl * rate,
      pnlTWD: t.pnl * rate
    }));
    
    strategiesDataTWD[config.name] = dataTWD;
    strategiesTradesTWD[config.name] = tradesTWD;
  });
  
  console.log('✓ 貨幣轉換完成');
  
  // 生成組合投資組合數據
  const portfolioData = [];
  const sortedDates = Array.from(allDates).sort();
  
  sortedDates.forEach(date => {
    let dailyTotalPnlTWD = 0;
    const dayStats = { date };
    
    existingStrategies.forEach(config => {
      const strategyData = strategiesDataTWD[config.name];
      if (!strategyData) return;
      
      const dayData = strategyData.find(d => d.date === date);
      if (dayData) {
        dailyTotalPnlTWD += dayData.pnl;
        dayStats[`pnl_${config.name}`] = dayData.pnl;
        dayStats[`pnlTWD_${config.name}`] = dayData.pnl;
      }
    });
    
    const prevEquity = portfolioData.length > 0 
      ? portfolioData[portfolioData.length - 1].equity 
      : 2000000; // 初始權益 200 萬
    
    portfolioData.push({
      ...dayStats,
      pnl: dailyTotalPnlTWD,
      equity: prevEquity + dailyTotalPnlTWD
    });
  });
  
  // 生成最終輸出
  const output = {
    metadata: {
      generatedAt: new Date().toISOString(),
      strategyCount: Object.keys(strategiesDataTWD).length,
      totalDays: sortedDates.length,
      dateRange: sortedDates.length > 0 ? {
        start: sortedDates[0],
        end: sortedDates[sortedDates.length - 1]
      } : null
    },
    strategies: strategiesDataTWD,
    trades: strategiesTradesTWD,
    rawPortfolioData: portfolioData
  };
  
  // 寫入文件
  const outputPath = path.join(basePath, 'public', 'data', 'strategies.json');
  const outputDir = path.dirname(outputPath);
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');
  
  const fileSize = fs.statSync(outputPath).size;
  const fileSizeKB = (fileSize / 1024).toFixed(2);
  
  console.log('\n============================================================');
  console.log('✓ 數據更新完成！');
  console.log('============================================================');
  console.log(`輸出檔案: ${outputPath}`);
  console.log(`  - 策略數量: ${Object.keys(strategiesDataTWD).length}`);
  console.log(`  - 總天數: ${sortedDates.length}`);
  if (sortedDates.length > 0) {
    console.log(`  - 日期範圍: ${sortedDates[0]} ~ ${sortedDates[sortedDates.length - 1]}`);
  }
  console.log(`  - 檔案大小: ${fileSizeKB} KB`);
  console.log('============================================================\n');
  
  console.log('✓ 策略報表更新成功！\n');
  console.log('下一步：');
  console.log('1. 檢查 ' + outputPath + ' 是否正確');
  console.log('2. 如需部署到線上，請執行部署指令');
}

updateStrategyReports().catch(error => {
  console.error('\n❌ 更新失敗:', error);
  console.error('錯誤詳情:', error.message);
  console.error('堆疊追蹤:', error.stack);
  process.exit(1);
});
