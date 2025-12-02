/**
 * Update Strategy Reports from Excel Files
 * 從策略報告目錄更新策略數據
 * 
 * 使用方法：
 * npm run update-strategies
 * 
 * 或直接運行：
 * node _PythonScripts/update_strategy_reports.mjs
 */

import { loadAllStrategies } from '../lib/excelParser.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 匯率設定（USD 轉 TWD）
const USD_TO_TWD_RATE = 32.5;

// 策略配置
const STRATEGY_CONFIG = [
  { 
    name: 'MNQ_DX_60', 
    originalCurrency: 'USD', 
    color: '#06b6d4', 
    icon: 'NT$', 
    displayName: 'MNQ DX 60',
    filePattern: 'CME.MNQ HOT  MNQ_DX_60 策略回測績效報告.xlsx'
  },
  { 
    name: 'MNQ_VIX_120', 
    originalCurrency: 'USD', 
    color: '#3b82f6', 
    icon: 'NT$', 
    displayName: 'MNQ VIX 120',
    filePattern: 'CME.MNQ HOT  MNQ_VIX_120 策略回測績效報告.xlsx'
  },
  { 
    name: 'MNQ_VIX_60', 
    originalCurrency: 'USD', 
    color: '#10b981', 
    icon: 'NT$', 
    displayName: 'MNQ VIX 60',
    filePattern: 'CME.MNQ HOT  MNQ_VIX_60 策略回測績效報告.xlsx'
  },
  { 
    name: 'MXF_DX_60', 
    originalCurrency: 'TWD', 
    color: '#ec4899', 
    icon: 'NT$', 
    displayName: 'MXF DX 60',
    filePattern: 'TWF.MXF HOT  MXF_DX_60 策略回測績效報告.xlsx'
  },
  { 
    name: 'MXF_VIX_120', 
    originalCurrency: 'TWD', 
    color: '#f59e0b', 
    icon: 'NT$', 
    displayName: 'MXF VIX 120',
    filePattern: 'TWF.MXF HOT  MXF_VIX_120 策略回測績效報告.xlsx'
  },
  { 
    name: 'MXF_VIX_60', 
    originalCurrency: 'TWD', 
    color: '#8b5cf6', 
    icon: 'NT$', 
    displayName: 'MXF VIX 60',
    filePattern: 'TWF.MXF HOT  MXF_VIX_60 策略回測績效報告.xlsx'
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
  
  // 檢查文件是否存在
  console.log('檢查策略報告文件...');
  const missingFiles = [];
  STRATEGY_CONFIG.forEach(config => {
    const filePath = path.join(reportsPath, config.filePattern);
    if (fs.existsSync(filePath)) {
      console.log(`  ✓ ${config.filePattern}`);
    } else {
      console.log(`  ✗ ${config.filePattern} (未找到)`);
      missingFiles.push(config.filePattern);
    }
  });
  
  if (missingFiles.length > 0) {
    console.warn(`\n⚠️  警告：缺少以下文件：`);
    missingFiles.forEach(file => console.warn(`  - ${file}`));
    console.warn(`將繼續處理現有的 ${STRATEGY_CONFIG.length - missingFiles.length} 個策略文件...\n`);
  } else {
    console.log('\n所有文件檢查通過！\n');
  }
  
  // 使用 loadAllStrategies 但指定策略報告目錄
  console.log('開始解析策略數據...\n');
  const strategies = loadAllStrategies(reportsPath, []);
  
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
    const filePath = path.join(reportsPath, config.filePattern);
    return fs.existsSync(filePath);
  });
  
  existingStrategies.forEach(config => {
    const strategy = strategies[config.name];
    if (!strategy || !strategy.data || strategy.data.length === 0) {
      console.log(`  ⚠️  跳過 ${config.name}：無數據`);
      return;
    }
    
    const originalCurrency = config.originalCurrency;
    const rate = originalCurrency === 'USD' ? USD_TO_TWD_RATE : 1;
    
    console.log(`  ${config.name}: ${originalCurrency} → TWD (匯率: ${rate})`);
    
    // 轉換每日數據為 TWD 並正規化起始權益為 1,000,000 TWD
    const targetStartEquity = 1000000;
    const firstDataPoint = strategy.data[0];
    const firstStartEquityTWD = firstDataPoint 
      ? (firstDataPoint.equity - firstDataPoint.pnl) * rate 
      : targetStartEquity;
    const equityOffset = targetStartEquity - firstStartEquityTWD;
    
    const convertedData = strategy.data.map((d, i) => {
      const pnlTWD = d.pnl * rate;
      const originalEquityTWD = d.equity * rate;
      const equityTWD = originalEquityTWD + equityOffset;
      
      return {
        ...d,
        id: i + 1,
        pnl: Math.round(pnlTWD * 100) / 100,
        equity: Math.round(equityTWD * 100) / 100,
        currency: 'TWD'
      };
    });
    
    strategiesDataTWD[config.name] = convertedData;
    convertedData.forEach(d => allDates.add(d.date));
    
    // 轉換交易數據為 TWD
    const convertedTrades = (strategy.trades || []).map(trade => ({
      ...trade,
      pnl: Math.round(trade.pnl * rate * 100) / 100
    }));
    
    strategiesTradesTWD[config.name] = convertedTrades;
  });
  
  console.log('✓ 貨幣轉換完成\n');
  
  // 建立原始投資組合數據（不含口數縮放）
  const sortedDates = Array.from(allDates).sort();
  
  const strategyDataMaps = {};
  Object.keys(strategiesDataTWD).forEach(strategyName => {
    const dataMap = new Map();
    strategiesDataTWD[strategyName].forEach(d => {
      dataMap.set(d.date, d);
    });
    strategyDataMaps[strategyName] = dataMap;
  });
  
  const rawPortfolioData = sortedDates.map((date, i) => {
    const dayStats = { 
      date, 
      year: new Date(date).getFullYear(), 
      month: new Date(date).getMonth() + 1 
    };
    
    // 只處理存在的策略
    existingStrategies.forEach(cfg => {
      const sData = strategyDataMaps[cfg.name]?.get(date);
      if (sData) {
        dayStats[`pnl_${cfg.name}`] = sData.pnl;
        dayStats[`pnlTWD_${cfg.name}`] = sData.pnl;
      }
    });
    
    return dayStats;
  });
  
  // 建立輸出目錄
  const outputDir = path.join(basePath, 'public', 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // 儲存預處理數據
  const outputData = {
    strategies: strategiesDataTWD,
    trades: strategiesTradesTWD,
    rawPortfolioData: rawPortfolioData,
    metadata: {
      generatedAt: new Date().toISOString(),
      totalStrategies: Object.keys(strategiesDataTWD).length,
      totalDates: sortedDates.length,
      dateRange: {
        start: sortedDates[0],
        end: sortedDates[sortedDates.length - 1]
      },
      exchangeRate: {
        USD_TO_TWD: USD_TO_TWD_RATE
      }
    }
  };
  
  const outputPath = path.join(outputDir, 'strategies.json');
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf8');
  
  console.log('============================================================');
  console.log('✓ 數據更新完成！');
  console.log('============================================================');
  console.log(`輸出檔案: ${outputPath}`);
  console.log(`  - 策略數量: ${Object.keys(strategiesDataTWD).length}`);
  console.log(`  - 總天數: ${sortedDates.length}`);
  console.log(`  - 日期範圍: ${sortedDates[0]} ~ ${sortedDates[sortedDates.length - 1]}`);
  console.log(`  - 檔案大小: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);
  console.log('============================================================\n');
  
  return outputPath;
}

// 執行更新
try {
  const outputPath = await updateStrategyReports();
  console.log('✓ 策略報表更新成功！');
  console.log(`\n下一步：`);
  console.log(`1. 檢查 ${outputPath} 是否正確`);
  console.log(`2. 如需部署到線上，請執行部署指令`);
  process.exit(0);
} catch (error) {
  console.error('\n❌ 更新失敗:', error);
  console.error('錯誤詳情:', error.message);
  if (error.stack) {
    console.error('堆疊追蹤:', error.stack);
  }
  process.exit(1);
}

