/**
 * Preprocess CSV files and generate JSON results
 * Run this script locally before deployment: npm run preprocess
 * 
 * This script processes CSV files and generates a preprocessed JSON file
 * that can be quickly loaded by the API, avoiding heavy processing on the server.
 */

import { loadAllStrategies } from '../lib/excelParser.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RATES = {
  'USD': 32.5,   
  'TWD': 1,      
  'JPY': 0.21,   
  'EUR': 34.2    
};

const STRATEGY_CONFIG = [
  { name: 'MNQ_DX_60', originalCurrency: 'USD', color: '#06b6d4', icon: 'NT$', displayName: 'MNQ DX 60' },
  { name: 'MNQ_VIX_120', originalCurrency: 'USD', color: '#3b82f6', icon: 'NT$', displayName: 'MNQ VIX 120' },
  { name: 'MXF_VIX_120', originalCurrency: 'TWD', color: '#f59e0b', icon: 'NT$', displayName: 'MXF VIX 120' },
  { name: 'MXF_VIX_60', originalCurrency: 'TWD', color: '#8b5cf6', icon: 'NT$', displayName: 'MXF VIX 60' },
];

async function preprocessStrategies() {
  console.log('Starting strategy data preprocessing...');
  
  const basePath = process.cwd();
  console.log('Base path:', basePath);
  
  // Search in both root and public/data
  const publicDataPath = path.join(basePath, 'public', 'data');
  const searchPaths = [basePath, publicDataPath];
  
  // Load all strategies using the same function as the API
  console.log('Loading strategies from CSV files...');
  const strategies = loadAllStrategies(basePath, searchPaths);
  
  // Convert all strategies data to TWD
  const strategiesDataTWD = {};
  const strategiesTradesTWD = {};
  const allDates = new Set();
  
  Object.keys(strategies).forEach(strategyName => {
    const strategy = strategies[strategyName];
    const config = STRATEGY_CONFIG.find(c => c.name === strategyName);
    const originalCurrency = config?.originalCurrency || 'USD';
    const rate = RATES[originalCurrency];
    
    // Convert daily data to TWD and normalize to 1,000,000 TWD starting equity
    const targetStartEquity = 1000000;
    const firstDataPoint = strategy.data[0];
    const firstStartEquityTWD = firstDataPoint ? (firstDataPoint.equity - firstDataPoint.pnl) * rate : targetStartEquity;
    const equityOffset = targetStartEquity - firstStartEquityTWD;
    
    const convertedData = strategy.data.map((d, i) => {
      const pnlTWD = d.pnl * rate;
      const originalEquityTWD = d.equity * rate;
      const equityTWD = originalEquityTWD + equityOffset;
      
      return {
        ...d,
        id: i + 1,
        pnl: pnlTWD,
        equity: equityTWD,
        currency: 'TWD'
      };
    });
    
    strategiesDataTWD[strategyName] = convertedData;
    convertedData.forEach(d => allDates.add(d.date));
    
    // Convert trades to TWD
    const convertedTrades = (strategy.trades || []).map(trade => ({
      ...trade,
      pnl: trade.pnl * rate
    }));
    
    strategiesTradesTWD[strategyName] = convertedTrades;
  });
  
  const sortedDates = Array.from(allDates).sort();
  
  // Build raw portfolio data (without position size scaling)
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
    
    STRATEGY_CONFIG.forEach(cfg => {
      const sData = strategyDataMaps[cfg.name]?.get(date);
      if (sData) {
        dayStats[`pnl_${cfg.name}`] = sData.pnl;
        dayStats[`pnlTWD_${cfg.name}`] = sData.pnl;
      }
    });
    
    return dayStats;
  });
  
  // Create output directory
  const outputDir = path.join(basePath, 'public', 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Save preprocessed data
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
      }
    }
  };
  
  const outputPath = path.join(outputDir, 'strategies.json');
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf8');
  
  console.log(`\n✓ Preprocessed data saved to: ${outputPath}`);
  console.log(`  - Strategies: ${Object.keys(strategiesDataTWD).length}`);
  console.log(`  - Total dates: ${sortedDates.length}`);
  console.log(`  - Date range: ${sortedDates[0]} ~ ${sortedDates[sortedDates.length - 1]}`);
  console.log(`  - File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB\n`);
}

// Run preprocessing
try {
  await preprocessStrategies();
  console.log('✓ Preprocessing completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('✗ Preprocessing failed:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
}

