/**
 * Verify all strategy data and Portfolio calculations
 * This script checks:
 * 1. All individual strategies data integrity
 * 2. Portfolio data calculation correctness
 * 3. Data consistency across strategies
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STRATEGY_CONFIG = [
  { name: 'MNQ_DX_120', originalCurrency: 'USD', displayName: 'MNQ DX 120' },
  { name: 'MNQ_VIX_60', originalCurrency: 'USD', displayName: 'MNQ VIX 60' },
  { name: 'MNQ_VIX_120', originalCurrency: 'USD', displayName: 'MNQ VIX 120' },
  { name: 'MNQ_ZN_120', originalCurrency: 'USD', displayName: 'MNQ ZN 120' },
  { name: 'MNQ_6J_60', originalCurrency: 'USD', displayName: 'MNQ 6J 60' },
  { name: 'MNQ_6J_120', originalCurrency: 'USD', displayName: 'MNQ 6J 120' },
  { name: 'MXF_VIX_120', originalCurrency: 'TWD', displayName: 'MXF VIX 120' },
  { name: 'MXF_VIX_60', originalCurrency: 'TWD', displayName: 'MXF VIX 60' },
  { name: 'MXF_ZN_120', originalCurrency: 'TWD', displayName: 'MXF ZN 120' },
  { name: 'MXF_6J_60', originalCurrency: 'TWD', displayName: 'MXF 6J 60' },
  { name: 'MXF_DX_60', originalCurrency: 'TWD', displayName: 'MXF DX 60' },
  { name: 'MXF_DX_120', originalCurrency: 'TWD', displayName: 'MXF DX 120' },
];

const RATES = {
  'USD': 32.5,
  'TWD': 1,
};

function verifyStrategyData(strategyName, data) {
  const errors = [];
  const warnings = [];
  
  if (!data || data.length === 0) {
    errors.push(`策略 ${strategyName}: 沒有數據`);
    return { errors, warnings, isValid: false };
  }
  
  // Check data structure
  const requiredFields = ['date', 'year', 'month', 'pnl', 'equity', 'strategy', 'currency'];
  const firstRow = data[0];
  const missingFields = requiredFields.filter(field => !(field in firstRow));
  if (missingFields.length > 0) {
    errors.push(`策略 ${strategyName}: 缺少必要欄位: ${missingFields.join(', ')}`);
  }
  
  // Check currency
  if (firstRow.currency !== 'TWD') {
    errors.push(`策略 ${strategyName}: 貨幣應該是 TWD，實際是 ${firstRow.currency}`);
  }
  
  // Check date consistency
  const dates = data.map(d => d.date).sort();
  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];
  
  // Check equity calculation
  let prevEquity = null;
  let equityErrors = 0;
  let totalPnl = 0;
  
  data.forEach((row, index) => {
    totalPnl += row.pnl || 0;
    
    if (prevEquity !== null) {
      const expectedEquity = prevEquity + row.pnl;
      const diff = Math.abs(expectedEquity - row.equity);
      if (diff > 0.01) { // Allow small floating point errors
        equityErrors++;
        if (equityErrors <= 3) { // Only report first 3 errors
          errors.push(`策略 ${strategyName}: 日期 ${row.date} 權益計算錯誤 (預期: ${expectedEquity.toFixed(2)}, 實際: ${row.equity.toFixed(2)})`);
        }
      }
    }
    prevEquity = row.equity;
  });
  
  if (equityErrors > 3) {
    errors.push(`策略 ${strategyName}: 共發現 ${equityErrors} 個權益計算錯誤`);
  }
  
  // Check for duplicate dates
  const dateSet = new Set();
  const duplicates = [];
  data.forEach(row => {
    if (dateSet.has(row.date)) {
      duplicates.push(row.date);
    }
    dateSet.add(row.date);
  });
  if (duplicates.length > 0) {
    warnings.push(`策略 ${strategyName}: 發現重複日期: ${duplicates.slice(0, 5).join(', ')}${duplicates.length > 5 ? '...' : ''}`);
  }
  
  // Calculate statistics
  const stats = {
    totalDays: data.length,
    dateRange: `${firstDate} ~ ${lastDate}`,
    totalPnl: totalPnl,
    finalEquity: data[data.length - 1].equity,
    initialEquity: data[0].equity - data[0].pnl,
    netProfit: data[data.length - 1].equity - (data[0].equity - data[0].pnl),
  };
  
  return {
    errors,
    warnings,
    isValid: errors.length === 0,
    stats
  };
}

function verifyPortfolioData(rawPortfolioData, strategiesData) {
  const errors = [];
  const warnings = [];
  
  if (!rawPortfolioData || rawPortfolioData.length === 0) {
    errors.push('Portfolio: 沒有數據');
    return { errors, warnings, isValid: false };
  }
  
  // Build strategy data maps
  const strategyDataMaps = {};
  STRATEGY_CONFIG.forEach(cfg => {
    const data = strategiesData[cfg.name] || [];
    const dataMap = new Map();
    data.forEach(d => {
      dataMap.set(d.date, d);
    });
    strategyDataMaps[cfg.name] = dataMap;
  });
  
  // Verify each portfolio day
  let portfolioErrors = 0;
  const allDates = new Set();
  
  rawPortfolioData.forEach((portfolioDay, index) => {
    const date = portfolioDay.date;
    allDates.add(date);
    
    // Check if all strategies' PnL match
    STRATEGY_CONFIG.forEach(cfg => {
      const strategyDay = strategyDataMaps[cfg.name]?.get(date);
      const portfolioPnLKey = `pnl_${cfg.name}`;
      const portfolioPnL = portfolioDay[portfolioPnLKey];
      
      if (strategyDay && portfolioPnL !== undefined) {
        const diff = Math.abs(strategyDay.pnl - portfolioPnL);
        if (diff > 0.01) {
          portfolioErrors++;
          if (portfolioErrors <= 5) {
            errors.push(`Portfolio: 日期 ${date} 策略 ${cfg.name} PnL 不匹配 (策略: ${strategyDay.pnl.toFixed(2)}, Portfolio: ${portfolioPnL.toFixed(2)})`);
          }
        }
      } else if (strategyDay && portfolioPnL === undefined) {
        warnings.push(`Portfolio: 日期 ${date} 策略 ${cfg.name} 有數據但 Portfolio 缺少`);
      } else if (!strategyDay && portfolioPnL !== undefined && portfolioPnL !== 0) {
        warnings.push(`Portfolio: 日期 ${date} 策略 ${cfg.name} 無數據但 Portfolio 有 PnL`);
      }
    });
  });
  
  if (portfolioErrors > 5) {
    errors.push(`Portfolio: 共發現 ${portfolioErrors} 個 PnL 不匹配錯誤`);
  }
  
  // Check date coverage
  const strategyDates = new Set();
  STRATEGY_CONFIG.forEach(cfg => {
    const data = strategiesData[cfg.name] || [];
    data.forEach(d => strategyDates.add(d.date));
  });
  
  const missingInPortfolio = Array.from(strategyDates).filter(d => !allDates.has(d));
  const extraInPortfolio = Array.from(allDates).filter(d => !strategyDates.has(d));
  
  if (missingInPortfolio.length > 0) {
    warnings.push(`Portfolio: 缺少 ${missingInPortfolio.length} 個策略日期 (範例: ${missingInPortfolio.slice(0, 3).join(', ')})`);
  }
  
  if (extraInPortfolio.length > 0) {
    warnings.push(`Portfolio: 有 ${extraInPortfolio.length} 個額外日期 (範例: ${extraInPortfolio.slice(0, 3).join(', ')})`);
  }
  
  return {
    errors,
    warnings,
    isValid: errors.length === 0,
    stats: {
      totalDays: rawPortfolioData.length,
      dateRange: `${rawPortfolioData[0].date} ~ ${rawPortfolioData[rawPortfolioData.length - 1].date}`,
    }
  };
}

async function main() {
  console.log('開始驗證所有策略數據...\n');
  console.log('='.repeat(80));
  
  const basePath = path.join(__dirname, '..');
  const dataPath = path.join(basePath, 'public', 'data', 'strategies.json');
  
  if (!fs.existsSync(dataPath)) {
    console.error(`✗ 找不到數據文件: ${dataPath}`);
    console.error('請先運行: npm run preprocess');
    process.exit(1);
  }
  
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const strategies = data.strategies || {};
  const rawPortfolioData = data.rawPortfolioData || [];
  
  console.log(`\n載入數據:`);
  console.log(`  - 策略數量: ${Object.keys(strategies).length}`);
  console.log(`  - Portfolio 天數: ${rawPortfolioData.length}`);
  console.log(`  - 生成時間: ${data.metadata?.generatedAt || '未知'}\n`);
  
  // Verify each strategy
  console.log('='.repeat(80));
  console.log('驗證單策略數據:');
  console.log('='.repeat(80));
  
  const strategyResults = {};
  let totalStrategyErrors = 0;
  let totalStrategyWarnings = 0;
  
  STRATEGY_CONFIG.forEach(cfg => {
    const strategyData = strategies[cfg.name] || [];
    const result = verifyStrategyData(cfg.name, strategyData);
    strategyResults[cfg.name] = result;
    
    if (result.isValid) {
      console.log(`✓ ${cfg.displayName.padEnd(20)}: ${result.stats.totalDays.toString().padStart(4)} 天, 淨損益: ${result.stats.netProfit.toFixed(2).padStart(12)} TWD, 日期範圍: ${result.stats.dateRange}`);
    } else {
      console.log(`✗ ${cfg.displayName.padEnd(20)}: ${result.errors.length} 個錯誤, ${result.warnings.length} 個警告`);
      totalStrategyErrors += result.errors.length;
      totalStrategyWarnings += result.warnings.length;
    }
    
    if (result.warnings.length > 0) {
      result.warnings.forEach(w => console.log(`  ⚠ ${w}`));
    }
    if (result.errors.length > 0) {
      result.errors.forEach(e => console.log(`  ✗ ${e}`));
    }
  });
  
  // Verify Portfolio
  console.log('\n' + '='.repeat(80));
  console.log('驗證 Portfolio 數據:');
  console.log('='.repeat(80));
  
  const portfolioResult = verifyPortfolioData(rawPortfolioData, strategies);
  
  if (portfolioResult.isValid) {
    console.log(`✓ Portfolio: ${portfolioResult.stats.totalDays} 天, 日期範圍: ${portfolioResult.stats.dateRange}`);
  } else {
    console.log(`✗ Portfolio: ${portfolioResult.errors.length} 個錯誤, ${portfolioResult.warnings.length} 個警告`);
    totalStrategyErrors += portfolioResult.errors.length;
    totalStrategyWarnings += portfolioResult.warnings.length;
  }
  
  if (portfolioResult.warnings.length > 0) {
    portfolioResult.warnings.forEach(w => console.log(`  ⚠ ${w}`));
  }
  if (portfolioResult.errors.length > 0) {
    portfolioResult.errors.forEach(e => console.log(`  ✗ ${e}`));
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('驗證總結:');
  console.log('='.repeat(80));
  console.log(`總錯誤數: ${totalStrategyErrors}`);
  console.log(`總警告數: ${totalStrategyWarnings}`);
  
  if (totalStrategyErrors === 0 && totalStrategyWarnings === 0) {
    console.log('\n✓ 所有數據驗證通過！');
    process.exit(0);
  } else if (totalStrategyErrors === 0) {
    console.log('\n⚠ 數據驗證通過，但有警告需要檢查');
    process.exit(0);
  } else {
    console.log('\n✗ 數據驗證失敗，請檢查上述錯誤');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('驗證過程發生錯誤:', error);
  process.exit(1);
});

