import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ComposedChart, 
  AreaChart,     
  Area,
  Line,          
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Brush,
  ReferenceLine
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { 
  ArrowUpRight, ArrowDownRight, Activity, DollarSign, Percent, 
  TrendingUp, Calendar, Loader2, 
  Layers, PieChart as PieIcon, BarChart3, Grid, Scale, Target, Trophy, TimerReset,
  Gauge, RefreshCw, Coins, Table2, LineChart as LineIcon, Atom
} from "lucide-react";

// --- 0. Configuration: Settings ---

// 🔥 魚哥，請把你在 Postimages 拿到的「Direct link」貼在這裡！
const LOGO_URL = "https://i.postimg.cc/YqN2hg4V/20251015-174207724-i-OS.jpg"; 

const RATES = {
  'USD': 32.5,   
  'TWD': 1,      
  'JPY': 0.21,   
  'EUR': 34.2    
};

const STRATEGY_CONFIG = [
  { name: 'MNQ_DX_60', originalCurrency: 'USD', color: '#06b6d4', icon: 'NT$', displayName: 'MNQ DX 60' },
  { name: 'MNQ_VIX_120', originalCurrency: 'USD', color: '#3b82f6', icon: 'NT$', displayName: 'MNQ VIX 120' },
  { name: 'MNQ_VIX_60', originalCurrency: 'USD', color: '#10b981', icon: 'NT$', displayName: 'MNQ VIX 60' },
  { name: 'MXF_DX_60', originalCurrency: 'TWD', color: '#ec4899', icon: 'NT$', displayName: 'MXF DX 60' },
  { name: 'MXF_VIX_120', originalCurrency: 'TWD', color: '#f59e0b', icon: 'NT$', displayName: 'MXF VIX 120' },
  { name: 'MXF_VIX_60', originalCurrency: 'TWD', color: '#8b5cf6', icon: 'NT$', displayName: 'MXF VIX 60' },
];

// --- 1. Data Engine ---
const generateStrategyData = (config) => {
  const data = [];
  let equity = 100000; 
  
  let nominalMultiplier = 1;
  if (config.currency === 'JPY') nominalMultiplier = 100; 
  else if (config.currency === 'TWD') nominalMultiplier = 30;

  let date = new Date('2024-01-01');
  const winRate = 0.45 + (Math.random() * 0.15); 
  const volatility = 0.5 + (Math.random() * 1.0); 

  for (let i = 0; i < 250; i++) {
    const marketFactor = Math.sin(i / 20) * 200; 
    const isWin = Math.random() > (1 - winRate);
    
    const basePnl = isWin 
      ? (Math.random() * 1500 + 500) 
      : (Math.random() * -1200 - 300);
      
    const pnl = Math.floor(((basePnl * volatility) + (marketFactor * 0.3)) * nominalMultiplier);
    equity += pnl;

    const currentDate = new Date(date);
    currentDate.setDate(date.getDate() + 1);
    date = currentDate;

    data.push({
      date: date.toISOString().split('T')[0],
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      pnl, 
      equity, 
      strategy: config.name,
      currency: config.currency
    });
  }
  return data;
};

// Generate Portfolio (All data in TWD)
const generatePortfolio = () => {
  const strategiesDataTWD = {};
  const strategiesTradesTWD = {};
  
  // Convert all strategies data to TWD
  STRATEGY_CONFIG.forEach((cfg) => {
    const originalData = generateStrategyData(cfg);
    const originalCurrency = cfg.originalCurrency || 'USD';
    const rate = RATES[originalCurrency];
    
    // Convert daily data to TWD
    const convertedData = originalData.map((d, i) => {
      const pnlTWD = d.pnl * rate;
      const startEquityTWD = (d.equity - d.pnl) * rate;
      const equityTWD = startEquityTWD + pnlTWD;
      
      return {
        ...d,
        id: i + 1,
        pnl: pnlTWD,
        equity: equityTWD,
        currency: 'TWD'
      };
    });
    
    strategiesDataTWD[cfg.name] = convertedData;
    
    // Generate mock trades in TWD
    const mockTrades = [];
    convertedData.forEach(d => {
      if (d.pnl !== 0) {
        mockTrades.push({
          date: d.date,
          pnl: d.pnl // Already in TWD
        });
      }
    });
    strategiesTradesTWD[cfg.name] = mockTrades;
  });

  const portfolioData = [];
  strategiesDataTWD[STRATEGY_CONFIG[0].name].forEach((d, i) => {
    let dailyTotalPnlTWD = 0;
    const date = d.date;
    const dayStats = { date, year: d.year, month: d.month };

    STRATEGY_CONFIG.forEach(cfg => {
      const sData = strategiesDataTWD[cfg.name][i];
      dailyTotalPnlTWD += sData.pnl; // Already in TWD
      
      dayStats[`pnl_${cfg.name}`] = sData.pnl; 
      dayStats[`pnlTWD_${cfg.name}`] = sData.pnl; // Same value, already TWD
    });

    const prevEquity = i === 0 ? 5000000 : portfolioData[i-1].equity;
    const currentEquity = prevEquity + dailyTotalPnlTWD;
    
    portfolioData.push({
      ...dayStats,
      pnl: dailyTotalPnlTWD, 
      equity: currentEquity,
      id: i + 1
    });
  });

  return { strategies: strategiesDataTWD, portfolio: portfolioData, trades: strategiesTradesTWD };
};

// Default fallback data
const defaultDataBundle = generatePortfolio();

export default function PerformanceDashboard() {
  const [selectedStrategy, setSelectedStrategy] = useState('Portfolio'); 
  const [chartView, setChartView] = useState('equity'); // 'equity', 'heatmap', 'analysis' 
  const [imgError, setImgError] = useState(false);
  
  // Position sizes for each strategy (default 1 contract)
  const [positionSizes, setPositionSizes] = useState(() => {
    const sizes = {};
    STRATEGY_CONFIG.forEach(cfg => {
      sizes[cfg.name] = 1;
    });
    return sizes;
  });
  
  // Initial equity for Portfolio (default 5,000,000 TWD)
  const [initialEquity, setInitialEquity] = useState(5000000);
  
  // Data loading states - use null initially to prevent hydration mismatch
  const [rawDataBundle, setRawDataBundle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  

  // Set mounted flag on client side only
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load Excel data on component mount (client side only)
  useEffect(() => {
    if (!isMounted) return;
    
    const loadExcelData = async () => {
      let timeoutId = null;
      try {
        setIsLoading(true);
        setDataError(null);
        
        // Add timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          setDataError('載入超時，請檢查網路連線或稍後再試');
          setIsLoading(false);
        }, 30000); // 30 second timeout
        
        const response = await fetch('/api/strategies');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        if (timeoutId) clearTimeout(timeoutId);
        
        if (result.success && result.strategies) {
          // Check if data is preprocessed (already in TWD and normalized)
          if (result.preprocessed && result.rawPortfolioData) {
            // Use preprocessed data directly (much faster!)
            const strategiesDataTWD = {};
            const strategiesTradesTWD = {};
            const allDates = new Set();
            
            Object.keys(result.strategies).forEach(strategyName => {
              const strategy = result.strategies[strategyName];
              strategiesDataTWD[strategyName] = strategy.data; // Already in TWD
              strategiesTradesTWD[strategyName] = strategy.trades || []; // Already in TWD
              strategy.data.forEach(d => allDates.add(d.date));
            });
            
            // Use preprocessed rawPortfolioData
            setRawDataBundle({ 
              strategies: strategiesDataTWD, // All in TWD (preprocessed)
              portfolio: [], // Will be calculated in useMemo with position sizes
              trades: strategiesTradesTWD, // All in TWD (preprocessed)
              rawPortfolioData: result.rawPortfolioData // Preprocessed portfolio data
            });
            setDataError(null);
            setIsLoading(false);
          } else {
            // Fallback: Convert raw CSV data to TWD (for development)
            const strategiesDataTWD = {};
            const strategiesTradesTWD = {};
            const allDates = new Set();
            
            // Step 1: Convert all strategies data and trades to TWD
            Object.keys(result.strategies).forEach(strategyName => {
              const strategy = result.strategies[strategyName];
              const config = STRATEGY_CONFIG.find(c => c.name === strategyName);
              const originalCurrency = config?.originalCurrency || 'USD';
              const rate = RATES[originalCurrency];
              
              // Convert daily data to TWD and normalize to 1,000,000 TWD starting equity
              const targetStartEquity = 1000000; // All strategies start with 1,000,000 TWD
              
              // Get the first data point's starting equity (before first PnL) in TWD
              const firstDataPoint = strategy.data[0];
              const firstStartEquityTWD = firstDataPoint ? (firstDataPoint.equity - firstDataPoint.pnl) * rate : targetStartEquity;
              
              // Calculate offset to normalize to target starting equity
              const equityOffset = targetStartEquity - firstStartEquityTWD;
              
              const convertedData = strategy.data.map((d, i) => {
                const pnlTWD = d.pnl * rate;
                // Calculate equity in TWD and add offset to normalize
                const originalEquityTWD = d.equity * rate;
                const equityTWD = originalEquityTWD + equityOffset;
                
                return {
                  ...d,
                  id: i + 1,
                  pnl: pnlTWD, // Convert to TWD
                  equity: equityTWD, // Normalized to start from 1,000,000 TWD
                  currency: 'TWD' // All data is now TWD
                };
              });
              
              strategiesDataTWD[strategyName] = convertedData;
              convertedData.forEach(d => allDates.add(d.date));
              
              // Convert trades to TWD
              const convertedTrades = (strategy.trades || []).map(trade => ({
                ...trade,
                pnl: trade.pnl * rate // Convert to TWD
              }));
              
              strategiesTradesTWD[strategyName] = convertedTrades;
            });
            
            const sortedDates = Array.from(allDates).sort();
            
            // Step 2: Build portfolio data from TWD data
            const strategyDataMaps = {};
            Object.keys(strategiesDataTWD).forEach(strategyName => {
              const dataMap = new Map();
              strategiesDataTWD[strategyName].forEach(d => {
                dataMap.set(d.date, d);
              });
              strategyDataMaps[strategyName] = dataMap;
            });
            
            // Store raw data without position size scaling
            setRawDataBundle({ 
              strategies: strategiesDataTWD, // All in TWD
              portfolio: [], // Will be calculated in useMemo with position sizes
              trades: strategiesTradesTWD, // All in TWD
              rawPortfolioData: sortedDates.map((date, i) => {
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
              })
            });
            setDataError(null);
            setIsLoading(false);
          }
        } else {
          throw new Error('Failed to load strategies data');
        }
      } catch (error) {
        console.error('Error loading Excel data:', error);
        if (timeoutId) clearTimeout(timeoutId);
        setDataError(error.message || '無法載入數據，請確認 CSV 文件是否存在');
        // Use default data as fallback
        setRawDataBundle(defaultDataBundle);
        setIsLoading(false);
      }
    };
    
    loadExcelData();
  }, [isMounted]);

  // --- 2. Analytics Logic ---
  const currentViewContext = useMemo(() => {
    // Only use data if it's loaded, otherwise return empty to prevent hydration mismatch
    if (!isMounted || !rawDataBundle) {
      return { 
        data: [], 
        currency: 'TWD', 
        symbol: 'NT$',
        isPortfolio: selectedStrategy === 'Portfolio'
      };
    }
    
    if (selectedStrategy === 'Portfolio') {
      // Calculate portfolio data with position sizes applied
      const rawPortfolioData = rawDataBundle.rawPortfolioData || [];
      const portfolioData = [];
      let currentPortfolioEquity = initialEquity; // Starting equity in TWD (user configurable)
      
      rawPortfolioData.forEach((dayStats, i) => {
        let dailyTotalPnlTWD = 0;
        const scaledDayStats = { 
          date: dayStats.date,
          year: dayStats.year,
          month: dayStats.month
        };
        
        STRATEGY_CONFIG.forEach(cfg => {
          const basePnl = dayStats[`pnl_${cfg.name}`] || 0;
          const positionSize = positionSizes[cfg.name] || 1;
          const scaledPnl = basePnl * positionSize; // Apply position size multiplier
          dailyTotalPnlTWD += scaledPnl;
          scaledDayStats[`pnl_${cfg.name}`] = scaledPnl;
          scaledDayStats[`pnlTWD_${cfg.name}`] = scaledPnl;
        });
        
        currentPortfolioEquity += dailyTotalPnlTWD;
        
        portfolioData.push({
          ...scaledDayStats,
          pnl: dailyTotalPnlTWD,
          equity: currentPortfolioEquity,
          id: i + 1
        });
      });
      
      return { 
        data: portfolioData, 
        currency: 'TWD', 
        symbol: 'NT$',
        isPortfolio: true
      };
    } else {
      // Data is already in TWD, no conversion needed
      const strategyData = rawDataBundle.strategies?.[selectedStrategy] || [];
      
      return { 
        data: strategyData.map((d, i) => ({
          ...d,
          id: d.id || i + 1,
          drawdown: 0
        })), 
        currency: 'TWD', // All data is in TWD
        symbol: 'NT$',
        isPortfolio: false
      };
    }
  }, [selectedStrategy, rawDataBundle, isMounted, positionSizes, initialEquity]);

  const stats = useMemo(() => {
    const { data, isPortfolio } = currentViewContext;
    
    // Guard against empty data
    if (!data || data.length === 0) {
      return {
        netProfit: 0,
        winRate: '0.0',
        profitFactor: '0.00',
        maxDrawdown: '0.00',
        maxDDAmount: 0,
        payoffRatio: '0.00',
        sharpeRatio: '0.00',
        avgWin: 0,
        avgLoss: 0,
        expectancy: 0,
        recoveryFactor: '0.00',
        sqn: '0.00',
        totalTrades: 0,
        dataWithDD: [],
        symbol: currentViewContext.symbol || 'NT$'
      };
    }
    
    let maxEquity = -Infinity;
    let maxDDAmount = 0; 
    
    // SMA Calculation Helper
    const calculateSMA = (arr, period, index) => {
      if (index < period - 1) return null;
      let sum = 0;
      for (let i = 0; i < period; i++) {
        sum += arr[index - i].equity;
      }
      return sum / period;
    };

    // Track max equity properly for drawdown calculation
    let runningMaxEquity = -Infinity;
    
    const processedData = data
      .filter(d => d && d.equity !== undefined && d.equity !== null)
      .map((d, i) => {
        // Update running max equity
        if (d.equity > runningMaxEquity) {
          runningMaxEquity = d.equity;
        }
        
        // Calculate drawdown from running max
        const ddAmount = runningMaxEquity - d.equity;
        if (ddAmount > maxDDAmount) maxDDAmount = ddAmount;
        
        // MDD% for display (positive): ((Max Equity - Current Equity) / Max Equity) * 100
        const ddPercent = runningMaxEquity === 0 ? 0 : ((runningMaxEquity - d.equity) / runningMaxEquity) * 100;
        
        // Drawdown amount for chart (negative value)
        const ddAmountNegative = -(ddAmount);
        
        // Drawdown percent for chart (negative value)
        const ddPercentNegative = -(ddPercent);
        
        // Calculate SMA 60
        const sma60 = calculateSMA(data, 60, i);

        return { ...d, drawdown: ddAmountNegative, drawdownPercent: ddPercentNegative, drawdownPercentPositive: ddPercent, sma60 };
      });

    if (processedData.length === 0) {
      return {
        netProfit: 0,
        winRate: '0.0',
        profitFactor: '0.00',
        maxDrawdown: '0.00',
        maxDDAmount: 0,
        payoffRatio: '0.00',
        sharpeRatio: '0.00',
        avgWin: 0,
        avgLoss: 0,
        expectancy: 0,
        recoveryFactor: '0.00',
        sqn: '0.00',
        totalTrades: 0,
        dataWithDD: [],
        symbol: currentViewContext.symbol || 'NT$'
      };
    }

    // Calculate win rate from individual trades, not daily PnL
    // Convert all trades pnl to TWD first
    let winRate = 0;
    let totalTrades = 0;
    let wins = [];
    let losses = [];
    let allTradesTWD = []; // Store all trades with TWD pnl for SQN calculation
    
    // Only use rawDataBundle, not defaultDataBundle, to prevent hydration mismatch
    const dataSource = rawDataBundle;
    
    if (isPortfolio) {
      // For portfolio, aggregate trades from all strategies with position size scaling applied
      if (dataSource?.trades) {
        STRATEGY_CONFIG.forEach(cfg => {
          const strategyTrades = dataSource.trades[cfg.name] || [];
          const positionSize = positionSizes[cfg.name] || 1;
          // Apply position size scaling to each trade's PnL
          strategyTrades.forEach(trade => {
            allTradesTWD.push({
              ...trade,
              pnl: (trade.pnl || 0) * positionSize // Scale PnL by position size
            });
          });
        });
        totalTrades = allTradesTWD.length;
        wins = allTradesTWD.filter(t => t.pnl > 0);
        losses = allTradesTWD.filter(t => t.pnl <= 0);
        winRate = totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0;
      } else {
        // Fallback to daily data if trades not available (already scaled)
        totalTrades = processedData.length;
        wins = processedData.filter(d => d.pnl > 0);
        losses = processedData.filter(d => d.pnl <= 0);
        winRate = (wins.length / totalTrades) * 100;
        // For SQN fallback, use daily PnL (already scaled)
        allTradesTWD = processedData.map(d => ({ pnl: d.pnl }));
      }
    } else {
      // For individual strategy, use trades from rawDataBundle (already in TWD)
      const strategyTrades = dataSource?.trades?.[selectedStrategy] || [];
      
      if (strategyTrades.length > 0) {
        // Trades are already in TWD, no conversion needed
        allTradesTWD.push(...strategyTrades);
        totalTrades = allTradesTWD.length;
        wins = allTradesTWD.filter(t => t.pnl > 0);
        losses = allTradesTWD.filter(t => t.pnl <= 0);
        winRate = (wins.length / totalTrades) * 100;
      } else {
        // Fallback to daily data if trades not available
        totalTrades = processedData.length;
        wins = processedData.filter(d => d.pnl > 0);
        losses = processedData.filter(d => d.pnl <= 0);
        winRate = (wins.length / totalTrades) * 100;
        // For SQN fallback, use daily PnL
        allTradesTWD = processedData.map(d => ({ pnl: d.pnl }));
      }
    }
    
    // Calculate startEquity in TWD (all data is already in TWD)
    // All strategies use 1,000,000 TWD as starting equity
    let startEquityTWD;
    if (isPortfolio) {
      startEquityTWD = initialEquity; // Portfolio starting equity in TWD (user configurable)
    } else {
      startEquityTWD = 1000000; // All individual strategies use 1,000,000 TWD (fixed)
    }
    
    const lastDataPoint = processedData[processedData.length - 1];
    const totalNetProfit = lastDataPoint && lastDataPoint.equity !== undefined 
      ? lastDataPoint.equity - startEquityTWD 
      : 0;
    const grossProfit = wins.reduce((acc, curr) => acc + curr.pnl, 0);
    const grossLoss = Math.abs(losses.reduce((acc, curr) => acc + curr.pnl, 0));
    const profitFactor = grossLoss === 0 ? grossProfit : grossProfit / grossLoss;

    const avgWin = grossProfit / (wins.length || 1);
    const avgLoss = grossLoss / (losses.length || 1);
    const payoffRatio = avgWin / avgLoss;
    
    const expectancy = (winRate/100 * avgWin) - ((1 - winRate/100) * avgLoss);
    // MDD% should use drawdownPercentPositive (positive percentage)
    const maxDrawdown = processedData.length > 0 ? Math.max(...processedData.map(d => d.drawdownPercentPositive || 0)) : 0;
    const recoveryFactor = maxDDAmount === 0 ? totalNetProfit : totalNetProfit / maxDDAmount;

    // SQN: Use individual trades pnl (in TWD), not daily PnL
    const pnlValues = allTradesTWD.map(t => t.pnl);
    const meanPnl = pnlValues.reduce((a, b) => a + b, 0) / totalTrades;
    const variancePnl = pnlValues.reduce((a, b) => a + Math.pow(b - meanPnl, 2), 0) / totalTrades;
    const stdDevPnl = Math.sqrt(variancePnl);
    const sqn = stdDevPnl === 0 ? 0 : Math.sqrt(totalTrades) * (meanPnl / stdDevPnl);

    // Sharpe
    const returns = processedData.map((d, i) => i === 0 ? 0 : (d.equity - processedData[i-1].equity) / processedData[i-1].equity);
    const avgDailyRet = returns.reduce((a, b) => a + b, 0) / returns.length;
    const varianceRet = returns.reduce((a, b) => a + Math.pow(b - avgDailyRet, 2), 0) / returns.length;
    const stdDevRet = Math.sqrt(varianceRet);
    const sharpeRatio = stdDevRet === 0 ? 0 : (Math.sqrt(252) * avgDailyRet / stdDevRet);

    return {
      netProfit: totalNetProfit,
      winRate: winRate.toFixed(1),
      profitFactor: profitFactor.toFixed(2),
      maxDrawdown: maxDrawdown.toFixed(2),
      maxDDAmount: maxDDAmount,
      payoffRatio: payoffRatio.toFixed(2),
      sharpeRatio: sharpeRatio.toFixed(2),
      avgWin: Math.floor(avgWin),
      avgLoss: Math.floor(avgLoss),
      expectancy: Math.floor(expectancy),
      recoveryFactor: recoveryFactor.toFixed(2),
      sqn: sqn.toFixed(2),
      totalTrades,
      dataWithDD: processedData,
      symbol: currentViewContext.symbol
    };
  }, [currentViewContext, rawDataBundle, selectedStrategy, initialEquity, positionSizes]);

  // --- 2.4 Year Boundary Lines ---
  const yearBoundaries = useMemo(() => {
    if (!stats.dataWithDD || stats.dataWithDD.length === 0) return [];
    
    const boundaries = [];
    let lastYear = null;
    
    stats.dataWithDD.forEach((d, i) => {
      if (!d || !d.date) return;
      
      const date = new Date(d.date);
      const currentYear = date.getFullYear();
      
      // If year changed, mark this point as a boundary
      if (lastYear !== null && currentYear !== lastYear) {
        boundaries.push(d.date);
      }
      
      lastYear = currentYear;
    });
    
    return boundaries;
  }, [stats.dataWithDD]);

  // --- 2.5 Monthly Returns Logic ---
  const monthlyReturns = useMemo(() => {
    const { data } = currentViewContext;
    if (!data || data.length === 0) {
      return { years: [], months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], map: {}, winRateMap: {} };
    }
    
    const map = {};
    const winRateMap = {}; // Store win rate for each month: { year: { month: winRate } }
    
    data.forEach(d => {
      if (d && d.year && d.month !== undefined) {
        const year = d.year;
        const month = d.month;
        if (!map[year]) map[year] = {};
        if (!map[year][month]) map[year][month] = 0;
        map[year][month] += (d.pnl || 0);
      }
    });

    // Calculate monthly win rate
    const monthlyStats = {}; // { year: { month: { wins: 0, total: 0 } } }
    data.forEach(d => {
      if (d && d.year && d.month !== undefined) {
        const year = d.year;
        const month = d.month;
        if (!monthlyStats[year]) monthlyStats[year] = {};
        if (!monthlyStats[year][month]) monthlyStats[year][month] = { wins: 0, total: 0 };
        monthlyStats[year][month].total++;
        if (d.pnl > 0) monthlyStats[year][month].wins++;
      }
    });

    // Calculate win rate percentage
    Object.keys(monthlyStats).forEach(year => {
      winRateMap[year] = {};
      Object.keys(monthlyStats[year]).forEach(month => {
        const stats = monthlyStats[year][month];
        winRateMap[year][month] = stats.total > 0 ? (stats.wins / stats.total) * 100 : 0;
      });
    });

    const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const years = Object.keys(map).sort().reverse();
    
    return { years, months, map, winRateMap };
  }, [currentViewContext]);


  // --- 3. Portfolio Correlation (TWD Basis) ---
  const correlationMatrix = useMemo(() => {
    if (selectedStrategy !== 'Portfolio') return null;
    const { data: portfolioData } = currentViewContext;
    if (!portfolioData || portfolioData.length === 0) return null;
    
    const matrix = [];
    const calculateCorrelation = (arr1, arr2) => {
      const n = arr1.length;
      if (n === 0) return 0;
      const mean1 = arr1.reduce((a, b) => a + b, 0) / n;
      const mean2 = arr2.reduce((a, b) => a + b, 0) / n;
      let num = 0, den1 = 0, den2 = 0;
      for (let i = 0; i < n; i++) {
        const dx = arr1[i] - mean1;
        const dy = arr2[i] - mean2;
        num += dx * dy;
        den1 += dx * dx;
        den2 += dy * dy;
      }
      const den = Math.sqrt(den1 * den2);
      return den === 0 ? 0 : num / den;
    };

    STRATEGY_CONFIG.forEach(rowStrat => {
      const row = { name: rowStrat.name };
      STRATEGY_CONFIG.forEach(colStrat => {
        const data1 = portfolioData.map(d => d[`pnlTWD_${rowStrat.name}`] || 0);
        const data2 = portfolioData.map(d => d[`pnlTWD_${colStrat.name}`] || 0);
        row[colStrat.name] = calculateCorrelation(data1, data2);
      });
      matrix.push(row);
    });
    return matrix;
  }, [selectedStrategy, currentViewContext]);

  // --- 4. Contribution (TWD Basis) ---
  const contributionData = useMemo(() => {
    if (selectedStrategy !== 'Portfolio') return null;
    const { data: portfolioData } = currentViewContext;
    if (!portfolioData || portfolioData.length === 0) return [];
    
    return STRATEGY_CONFIG.map((cfg, idx) => {
      const totalPnlTWD = portfolioData.reduce((acc, curr) => acc + (curr[`pnlTWD_${cfg.name}`] || 0), 0);
      return { name: cfg.displayName || cfg.name, value: totalPnlTWD, fill: cfg.color };
    }).filter(d => d.value > 0);
  }, [selectedStrategy, currentViewContext]);


  return (
    <div className="min-h-screen font-sans text-slate-200 selection:bg-indigo-500 selection:text-white relative overflow-hidden bg-[#020617]">
      
      {/* --- COSMIC BACKGROUND LAYER --- */}
      {/* Stars Background */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none" style={{
        backgroundImage: `radial-gradient(1px 1px at 20px 30px, #eee, rgba(0,0,0,0)),
                          radial-gradient(2px 2px at 40px 70px, #fff, rgba(0,0,0,0)),
                          radial-gradient(1px 1px at 50px 160px, #ddd, rgba(0,0,0,0)),
                          radial-gradient(2px 2px at 90px 40px, #fff, rgba(0,0,0,0)),
                          radial-gradient(1px 1px at 130px 80px, #fff, rgba(0,0,0,0)),
                          radial-gradient(2px 2px at 160px 120px, #ddd, rgba(0,0,0,0))`,
        backgroundSize: '200px 200px',
      }}></div>
      
      {/* Nebula Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/30 blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/30 blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute top-[20%] right-[30%] w-[30%] h-[30%] rounded-full bg-cyan-900/20 blur-[100px] pointer-events-none z-0"></div>


      <div className="max-w-[1600px] mx-auto p-4 space-y-4 relative z-10">
        
        {/* Loading State */}
        {isLoading && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-[#0f172a] border border-white/10 rounded-lg p-6 flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              <p className="text-slate-300 text-sm">正在載入數據...</p>
            </div>
          </div>
        )}
        
        {/* Error State */}
        {dataError && !isLoading && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4 mb-4">
            <p className="text-rose-400 text-sm">
              載入數據時發生錯誤: {dataError}。請確認 CSV 文件是否存在於專案根目錄。
            </p>
          </div>
        )}
        
        {/* Header & Controls */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center border-b border-white/10 pb-4 gap-4 relative">
          
          {/* Left: Branding */}
          <div>
            <div className="flex items-center gap-3">
              {/* Gold Icon */}
              <div className="p-1.5 bg-amber-500/10 rounded-lg border border-amber-500/20 backdrop-blur-sm">
                <Layers className="w-5 h-5 text-amber-400" />
              </div>
              {/* Gold Title */}
              <h1 className="text-2xl font-serif font-bold tracking-wide bg-gradient-to-r from-amber-100 via-yellow-200 to-amber-500 bg-clip-text text-transparent drop-shadow-sm">
                FishBro Capital
              </h1>
            </div>
            <div className="flex items-center space-x-3 mt-1.5 text-xs text-slate-400">
              <span className="flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1 opacity-70"/>
                {(() => {
                  const { data } = currentViewContext;
                  if (data && data.length > 0) {
                    const firstDate = data[0].date;
                    const lastDate = data[data.length - 1].date;
                    return `${firstDate} ~ ${lastDate}`;
                  }
                  return '載入中...';
                })()}
              </span>
              <span className="px-1.5 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center backdrop-blur-sm">
                <div className="w-1 h-1 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></div>
                Live
              </span>
            </div>
          </div>
          
          {/* Middle: Controls */}
          <div className="flex flex-col md:flex-row gap-3 items-end md:items-center pr-0 sm:pr-0 xl:pr-[240px]"> 
            
            {/* Strategy Selectors */}
            <div className="flex flex-wrap gap-1 bg-white/5 backdrop-blur-md p-1 rounded-lg border border-white/10">
               <button
                 onClick={() => setSelectedStrategy('Portfolio')}
                 className={`px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-medium rounded-md transition-all flex items-center ${selectedStrategy === 'Portfolio' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
               >
                 <PieIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5" />
                 <span className="hidden sm:inline">Portfolio (TWD)</span>
                 <span className="sm:hidden">Portfolio</span>
               </button>
               <div className="w-px h-5 bg-white/10 my-auto mx-1"></div>
               {STRATEGY_CONFIG.map((s, idx) => (
                 <button
                   key={s.name}
                   onClick={() => setSelectedStrategy(s.name)}
                   className={`px-1.5 sm:px-2.5 py-1.5 text-[10px] sm:text-xs font-medium rounded-md transition-all flex items-center ${selectedStrategy === s.name ? 'bg-white/10 text-white border border-white/20' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                 >
                   <span className="w-1.5 h-1.5 rounded-full inline-block mr-1 sm:mr-1.5" style={{backgroundColor: s.color}}></span>
                   <span className="hidden sm:inline">{s.displayName || s.name}</span>
                   <span className="sm:hidden">{s.displayName?.replace(' VIX ', ' ').replace(' VIX', '') || s.name}</span>
                   <span className="ml-1 opacity-50 text-[9px] sm:text-[10px] hidden sm:inline">(TWD)</span>
                 </button>
               ))}
            </div>

            {/* Position Size Selectors and Initial Equity - Only show when Portfolio is selected */}
            {selectedStrategy === 'Portfolio' && (
              <div className="flex flex-wrap gap-2 bg-white/5 backdrop-blur-md p-2 rounded-lg border border-white/10">
                <div className="flex items-center gap-1.5">
                  <label className="text-[9px] sm:text-[10px] text-slate-400 whitespace-nowrap">初始資金:</label>
                  <select
                    value={initialEquity}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 5000000;
                      setInitialEquity(value);
                    }}
                    className="bg-[#0f172a]/95 backdrop-blur-xl border border-indigo-500/30 rounded-lg px-2 py-0.5 text-[10px] sm:text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500/50 shadow-lg transition-all"
                  >
                    {[1000000, 2000000, 3000000, 4000000, 5000000, 6000000, 7000000, 8000000, 9000000, 10000000].map(val => (
                      <option key={val} value={val} className="bg-[#0f172a]">NT$ {val.toLocaleString()}</option>
                    ))}
                  </select>
                </div>
                <div className="w-px h-6 bg-white/10 mx-1"></div>
                <span className="text-[10px] sm:text-xs text-slate-400 font-medium self-center">口數設定:</span>
                {STRATEGY_CONFIG.map((s) => (
                  <div key={s.name} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full inline-block" style={{backgroundColor: s.color}}></span>
                    <label className="text-[9px] sm:text-[10px] text-slate-400 whitespace-nowrap">{s.displayName}:</label>
                    <select
                      value={positionSizes[s.name] || 1}
                      onChange={(e) => {
                        const newSizes = { ...positionSizes };
                        newSizes[s.name] = parseInt(e.target.value) || 1;
                        setPositionSizes(newSizes);
                      }}
                      className="bg-[#0f172a]/95 backdrop-blur-xl border border-indigo-500/30 rounded-lg px-1.5 py-0.5 text-[10px] sm:text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500/50 shadow-lg transition-all min-w-[50px]"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                        <option key={num} value={num} className="bg-[#0f172a]">{num}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
            
            {/* Show initial equity for individual strategies (read-only) */}
            {selectedStrategy !== 'Portfolio' && (
              <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-md px-2 py-1.5 rounded-lg border border-white/10">
                <span className="text-[9px] sm:text-[10px] text-slate-400 whitespace-nowrap">初始資金:</span>
                <span className="text-[10px] sm:text-xs text-slate-200 font-mono">NT$ 1,000,000</span>
              </div>
            )}

          </div>

          {/* Right: Fixed LOGO - Always in top right corner */}
          <div className="fixed top-2 sm:top-4 right-2 sm:right-4 z-20 flex items-center justify-end">
             {imgError ? (
               <div className="max-h-10 sm:max-h-14 xl:max-h-16 px-3 sm:px-4 xl:px-6 py-1 sm:py-2 flex items-center justify-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg shadow-sm">
                 <span className="text-xs sm:text-sm xl:text-xl font-serif italic font-bold bg-gradient-to-r from-amber-200 to-yellow-500 bg-clip-text text-transparent">
                   FishBro Capital
                 </span>
               </div>
             ) : (
               <img 
                 src={LOGO_URL} 
                 alt="FishBro Capital" 
                 className="max-h-10 sm:max-h-14 xl:max-h-16 w-auto rounded-lg border border-white/10 shadow-2xl object-contain bg-[#020617]/60 backdrop-blur-sm"
                 onError={() => setImgError(true)} 
               />
             )}
          </div>

        </div>

        {/* --- Metrics Grid --- */}
        {!isMounted || isLoading || !rawDataBundle ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-md border border-white/10 px-3 py-2.5 rounded-lg shadow-lg h-[60px] animate-pulse">
                <div className="h-3 bg-white/10 rounded mb-2"></div>
                <div className="h-5 bg-white/10 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
           <CompactCard 
             label="Net Profit" 
             value={stats.netProfit} 
             prefix={stats.symbol} 
             trend={stats.netProfit > 0}
             hint={{
               title: "淨損益 (Net Profit)",
               description: "總損益金額，等於最終權益值減去起始權益值。",
               formula: "Net Profit = Final Equity - Initial Equity",
               standard: "正值表示盈利，負值表示虧損"
             }}
           />
           <CompactCard 
             label="Sharpe" 
             value={stats.sharpeRatio} 
             trend={stats.sharpeRatio > 1.0} 
             sub="> 1.0"
             hint={{
               title: "夏普比率 (Sharpe Ratio)",
               description: "衡量風險調整後的報酬率，數值越高表示風險調整後的表現越好。",
               formula: "Sharpe = (平均日報酬率 × √252) / 日報酬率標準差",
               standard: "> 1.0 良好，> 2.0 優秀，> 3.0 卓越"
             }}
           />
           <CompactCard 
             label="Profit Factor" 
             value={stats.profitFactor} 
             trend={stats.profitFactor > 1.5} 
             sub="> 1.5"
             hint={{
               title: "獲利因子 (Profit Factor)",
               description: "總盈利除以總虧損，衡量策略的盈利能力。",
               formula: "Profit Factor = 總盈利 / 總虧損",
               standard: "> 1.0 盈利，> 1.5 良好，> 2.0 優秀"
             }}
           />
           <CompactCard 
             label="SQN Score" 
             value={stats.sqn} 
             color="text-yellow-400" 
             sub="> 2.0"
             hint={{
               title: "系統品質數 (System Quality Number)",
               description: "Van Tharp 提出的指標，評估策略的品質和一致性。",
               formula: "SQN = √交易次數 × (平均損益 / 損益標準差)",
               standard: "> 1.6 可接受，> 2.5 良好，> 3.0 優秀"
             }}
           />
           <CompactCard 
             label="Win Rate" 
             value={stats.winRate} 
             suffix="%" 
             color="text-blue-400" 
             sub="> 45%"
             hint={{
               title: "勝率 (Win Rate)",
               description: "盈利交易數佔總交易數的百分比。",
               formula: "Win Rate = (盈利交易數 / 總交易數) × 100%",
               standard: "> 45% 可接受，> 50% 良好，> 60% 優秀"
             }}
           />
           <CompactCard 
             label="Max Drawdown" 
             value={stats.maxDrawdown} 
             suffix="%" 
             inverseTrend 
             warning={parseFloat(stats.maxDrawdown) > 20} 
             sub="< 20%"
             hint={{
               title: "最大回撤 (Max Drawdown)",
               description: "從最高權益值到最低權益值的最大跌幅百分比。",
               formula: "MDD = ((最低權益 - 最高權益) / 最高權益) × 100%",
               standard: "< 20% 良好，< 15% 優秀，< 10% 卓越"
             }}
           />
           <CompactCard 
             label="Payoff Ratio" 
             value={stats.payoffRatio} 
             color="text-amber-400" 
             sub="> 1.5"
             hint={{
               title: "盈虧比 (Payoff Ratio)",
               description: "平均盈利除以平均虧損，衡量單筆交易的風險報酬比。",
               formula: "Payoff Ratio = 平均盈利 / 平均虧損",
               standard: "> 1.0 可接受，> 1.5 良好，> 2.0 優秀"
             }}
           />
           <CompactCard 
             label="Recovery Factor" 
             value={stats.recoveryFactor} 
             color="text-indigo-400" 
             sub="> 3.0"
             hint={{
               title: "恢復因子 (Recovery Factor)",
               description: "淨損益除以最大回撤金額，衡量策略從回撤中恢復的能力。",
               formula: "Recovery Factor = 淨損益 / 最大回撤金額",
               standard: "> 1.0 可接受，> 3.0 良好，> 5.0 優秀"
             }}
           />
           <CompactCard 
             label="Avg Win" 
             value={stats.avgWin} 
             prefix={stats.symbol} 
             color="text-emerald-400"
             hint={{
               title: "平均盈利 (Average Win)",
               description: "所有盈利交易的平均損益金額。",
               formula: "Avg Win = 總盈利 / 盈利交易數",
               standard: "數值越高越好，通常應大於平均虧損"
             }}
           />
           <CompactCard 
             label="Avg Loss" 
             value={stats.avgLoss} 
             prefix={stats.symbol} 
             color="text-rose-400"
             hint={{
               title: "平均虧損 (Average Loss)",
               description: "所有虧損交易的平均損益金額（取絕對值）。",
               formula: "Avg Loss = |總虧損| / 虧損交易數",
               standard: "數值越低越好，應小於平均盈利"
             }}
           />
           <CompactCard 
             label="Expectancy" 
             value={stats.expectancy} 
             prefix={stats.symbol} 
             color="text-purple-400"
             hint={{
               title: "期望值 (Expectancy)",
               description: "每筆交易的預期損益，結合勝率和盈虧比。",
               formula: "Expectancy = (勝率 × 平均盈利) - (敗率 × 平均虧損)",
               standard: "> 0 表示長期盈利，數值越高越好"
             }}
           />
           <CompactCard 
             label="Trades" 
             value={stats.totalTrades} 
             color="text-slate-300"
             hint={{
               title: "交易次數 (Total Trades)",
               description: "策略執行的總交易筆數。",
               formula: "Total Trades = 所有交易筆數",
               standard: "足夠的樣本數（> 30）才能有統計意義"
             }}
           />
        </div>
        )}

        {/* --- Charts --- */}
        {!isMounted || isLoading || !rawDataBundle ? (
          <div className="space-y-4">
            <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
              <CardHeader className="border-b border-white/10 py-3 px-4">
                <div className="h-6 bg-white/10 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-[400px] bg-white/5 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-4">
          
          <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
            <CardHeader className="border-b border-white/10 py-3 px-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm font-medium text-slate-200">Performance Analysis</span>
                  </div>
                  <div className="flex bg-white/5 rounded-lg p-0.5">
                    <button 
                      onClick={() => setChartView('equity')}
                      className={`flex items-center px-2.5 py-1 text-xs font-medium rounded-md transition-all ${chartView === 'equity' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                    >
                      <LineIcon className="w-3 h-3 mr-1.5" />
                      Equity
                    </button>
                    <button 
                      onClick={() => setChartView('heatmap')}
                      className={`flex items-center px-2.5 py-1 text-xs font-medium rounded-md transition-all ${chartView === 'heatmap' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                    >
                      <Table2 className="w-3 h-3 mr-1.5" />
                      Heatmap
                    </button>
                    {selectedStrategy === 'Portfolio' && (
                      <button 
                        onClick={() => setChartView('analysis')}
                        className={`flex items-center px-2.5 py-1 text-xs font-medium rounded-md transition-all ${chartView === 'analysis' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                      >
                        <PieIcon className="w-3 h-3 mr-1.5" />
                        Analysis
                      </button>
                    )}
                  </div>
                </div>
                <span className={`text-[10px] sm:text-xs md:text-sm font-mono font-bold break-all ${stats.netProfit > 0 ? 'text-emerald-400' : 'text-rose-400'}`} suppressHydrationWarning>
                  {stats.symbol}{stats.netProfit.toLocaleString()}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {chartView === 'equity' ? (
                <div className="h-[500px] sm:h-[600px] p-4">
                  {/* Combined Equity and Drawdown Chart - Full Height */}
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={stats.dataWithDD} syncId="strategyChart" margin={{ top: 10, right: 5, left: 40, bottom: 30 }}>
                      <defs>
                        <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="date" minTickGap={50} tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                      <YAxis 
                        yAxisId="equity" 
                        domain={['auto', 'auto']} 
                        tick={{fontSize: 10, fill: '#94a3b8'}} 
                        tickLine={false} 
                        axisLine={false} 
                        tickFormatter={val => `${(val/1000).toFixed(0)}k`} 
                        width={45}
                      />
                      <YAxis 
                        yAxisId="drawdown" 
                        orientation="right"
                        domain={['auto', 0]} 
                        tick={{fontSize: 10, fill: '#94a3b8'}} 
                        tickLine={false} 
                        axisLine={false} 
                        tickFormatter={val => `${(val/1000).toFixed(0)}k`} 
                        width={45}
                      />
                      <Tooltip content={<CompactTooltip symbol={stats.symbol} />} cursor={{stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1, strokeDasharray: '4 4'}} />
                      {yearBoundaries.map((date, idx) => (
                        <ReferenceLine 
                          key={`year-boundary-${idx}`} 
                          x={date} 
                          yAxisId="equity"
                          stroke="rgba(148, 163, 184, 0.3)" 
                          strokeWidth={1} 
                          strokeDasharray="2 2"
                        />
                      ))}
                      <Area yAxisId="equity" type="monotone" dataKey="equity" stroke="#818cf8" strokeWidth={2} fill="url(#colorEquity)" animationDuration={1000} />
                      <Line yAxisId="equity" type="monotone" dataKey="sma60" stroke="#fbbf24" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} strokeDasharray="4 4" name="60 SMA" />
                      <Area yAxisId="drawdown" type="step" dataKey="drawdown" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.2} strokeWidth={1} />
                      <Brush 
                        dataKey="date" 
                        height={25}
                        stroke="#6366f1"
                        fill="rgba(99, 102, 241, 0.15)"
                        strokeWidth={1.5}
                        tickFormatter={(value) => {
                          if (!value) return '';
                          try {
                            const date = new Date(value);
                            return `${date.getMonth() + 1}/${date.getDate()}`;
                          } catch {
                            return value;
                          }
                        }}
                        style={{ cursor: 'grab' }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : chartView === 'analysis' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                  <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-slate-200 flex items-center text-xs font-medium">
                        <BarChart3 className="w-3.5 h-3.5 mr-2 text-indigo-400" />
                        PnL Contribution ({currentViewContext.currency})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center -mt-2">
                      {contributionData && contributionData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={contributionData}
                              cx="50%"
                              cy="50%"
                              innerRadius={0}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="value"
                              stroke="none"
                            >
                              {contributionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip content={<CompactTooltip symbol="NT$" />} />
                            <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '11px', right: 20, color: '#94a3b8' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-slate-500 text-sm">No contribution data available</div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-slate-200 flex items-center text-xs font-medium">
                        <Grid className="w-3.5 h-3.5 mr-2 text-indigo-400" />
                        Correlation Matrix
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 flex items-center justify-center h-[300px]">
                      <div className="overflow-x-auto w-full custom-scrollbar">
                        <table className="w-full text-[11px] text-center">
                          <thead>
                            <tr>
                              <th className="p-2 text-left text-slate-400 font-medium min-w-[100px]">策略</th>
                              {STRATEGY_CONFIG.map(s => (
                                <th key={s.name} className="p-2 text-slate-400 font-medium whitespace-nowrap">
                                  {s.displayName || s.name}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {correlationMatrix && correlationMatrix.length > 0 ? (
                              correlationMatrix.map((row, i) => {
                                const rowConfig = STRATEGY_CONFIG.find(s => s.name === row.name);
                                return (
                                  <tr key={row.name}>
                                    <td className="p-2 text-slate-400 font-medium text-left whitespace-nowrap">
                                      {rowConfig?.displayName || row.name}
                                    </td>
                                    {STRATEGY_CONFIG.map(col => {
                                      const val = row[col.name];
                                      let bgClass = '';
                                      let textClass = 'text-slate-300';
                                      if (val === 1) { bgClass = 'bg-white/10'; textClass='text-slate-600'; }
                                      else if (val > 0.5) { bgClass = 'bg-rose-900/40'; textClass='text-rose-300'; } 
                                      else if (val < 0) { bgClass = 'bg-emerald-900/40'; textClass='text-emerald-300'; } 
                                      else { bgClass = 'bg-white/5'; }
                                      return (
                                        <td key={col.name} className={`p-2 border border-white/10 ${bgClass} ${textClass}`}>
                                          {val.toFixed(2)}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan={STRATEGY_CONFIG.length + 1} className="p-4 text-center text-slate-500 text-sm">
                                  No correlation data available
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="h-[400px] p-6 overflow-auto custom-scrollbar">
                   <div className="min-w-[600px]">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr>
                            <th className="p-2 text-left text-slate-400">Year</th>
                            {monthlyReturns.months.map(m => <th key={m} className="p-2 text-center text-slate-400">{m}月</th>)}
                            <th className="p-2 text-right text-slate-400">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                           {monthlyReturns.years.map(year => {
                             let yearTotal = 0;
                             return (
                               <tr key={year} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                 <td className="p-3 font-mono text-slate-300 font-medium">{year}</td>
                                 {monthlyReturns.months.map(month => {
                                   const val = monthlyReturns.map[year]?.[month] || 0;
                                   yearTotal += val;
                                   let colorClass = "text-slate-600";
                                   let bgClass = "";
                                   if (val > 0) {
                                      const intensity = Math.min(val / 10000, 1);
                                      colorClass = "text-emerald-100";
                                      bgClass = `rgba(16, 185, 129, ${0.1 + intensity * 0.5})`;
                                   } else if (val < 0) {
                                      const intensity = Math.min(Math.abs(val) / 5000, 1);
                                      colorClass = "text-rose-100";
                                      bgClass = `rgba(244, 63, 94, ${0.1 + intensity * 0.5})`;
                                   }
                                   return (
                                     <td key={month} className="p-1 text-center">
                                       <div className={`py-1.5 rounded ${colorClass} font-mono`} style={{backgroundColor: bgClass}}>
                                         {val !== 0 ? val.toLocaleString() : '-'}
                                       </div>
                                     </td>
                                   )
                                 })}
                                 <td className={`p-3 text-right font-mono font-bold ${yearTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                   {yearTotal.toLocaleString()}
                                 </td>
                               </tr>
                             )
                           })}
                           {/* Monthly Win Rate Row */}
                           <tr className="border-t-2 border-white/20 bg-white/5">
                             <td className="p-3 font-mono text-slate-300 font-medium">勝率</td>
                             {monthlyReturns.months.map(month => {
                               // Calculate average win rate across all years for this month
                               let totalWinRate = 0;
                               let count = 0;
                               monthlyReturns.years.forEach(year => {
                                 const winRate = monthlyReturns.winRateMap[year]?.[month];
                                 if (winRate !== undefined) {
                                   totalWinRate += winRate;
                                   count++;
                                 }
                               });
                               const avgWinRate = count > 0 ? totalWinRate / count : 0;
                               let colorClass = "text-slate-400";
                               if (avgWinRate >= 60) colorClass = "text-emerald-300";
                               else if (avgWinRate >= 50) colorClass = "text-blue-300";
                               else if (avgWinRate >= 45) colorClass = "text-yellow-300";
                               else colorClass = "text-rose-300";
                               return (
                                 <td key={month} className="p-1 text-center">
                                   <div className={`py-1.5 rounded font-mono text-xs ${colorClass}`}>
                                     {avgWinRate > 0 ? `${avgWinRate.toFixed(1)}%` : '-'}
                                   </div>
                                 </td>
                               );
                             })}
                             <td className="p-3 text-right font-mono text-slate-400">-</td>
                           </tr>
                        </tbody>
                      </table>
                   </div>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
        )}
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05); 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2); 
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3); 
        }
        /* Dark dropdown styling to match hint tooltip */
        select option {
          background: #0f172a;
          color: #e2e8f0;
        }
        select:focus {
          border-color: rgba(99, 102, 241, 0.5);
        }
      `}</style>
    </div>
  );
}

// --- Sub Components ---

function CompactCard({ label, value, prefix = "", suffix = "", sub, trend, inverseTrend, warning, color, hint }) {
  const [showHint, setShowHint] = useState(false);
  const [hintPosition, setHintPosition] = useState({ top: 0, left: 0 });
  const labelRef = useRef(null);
  
  let valueColor = color || "text-slate-200";
  if (!color) {
     const isPositive = trend === true;
     const isBad = warning || (isPositive && inverseTrend) || (!isPositive && !inverseTrend && trend !== undefined);
     if (isBad) valueColor = "text-rose-400";
     else if (trend !== undefined) valueColor = "text-emerald-400";
  }
  
  const handleMouseEnter = () => {
    if (hint && labelRef.current) {
      const updatePosition = () => {
        if (labelRef.current) {
          const rect = labelRef.current.getBoundingClientRect();
          setHintPosition({
            top: rect.bottom + 8,
            left: rect.left
          });
        }
      };
      updatePosition();
      setShowHint(true);
      // Update position on scroll
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      // Store cleanup function
      labelRef.current._hintCleanup = () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  };
  
  const handleMouseLeave = () => {
    setShowHint(false);
    if (labelRef.current && labelRef.current._hintCleanup) {
      labelRef.current._hintCleanup();
      labelRef.current._hintCleanup = null;
    }
  };
  
  
  // Format number consistently to avoid hydration mismatch
  const formatValue = (val) => {
    if (typeof val !== 'number') return val;
    // Use consistent locale to avoid hydration issues
    return val.toLocaleString('en-US', { maximumFractionDigits: 0 });
  };
  
  return (
    <>
      <div className="bg-white/5 backdrop-blur-md border border-white/10 px-3 py-2.5 rounded-lg shadow-lg hover:border-white/20 transition-all flex flex-col justify-between h-[60px] group relative overflow-visible">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-1.5 relative">
            <span 
              ref={labelRef}
              className="text-[10px] font-medium text-slate-400 uppercase tracking-wider group-hover:text-slate-300 transition-colors cursor-help"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {label}
            </span>
          </div>
          {sub && <span className="text-[9px] text-slate-500 font-mono bg-white/5 px-1 rounded">{sub}</span>}
        </div>
        <div className={`text-base font-bold font-mono tracking-tight ${valueColor} truncate drop-shadow-sm`} suppressHydrationWarning>
          {prefix}{formatValue(value)}{suffix}
        </div>
      </div>
      {hint && showHint && (
        <div 
          className="fixed z-[9999] w-[280px] p-3 bg-[#0f172a]/98 backdrop-blur-xl border border-indigo-500/30 rounded-lg shadow-2xl text-[10px] pointer-events-none"
          style={{
            top: `${hintPosition.top}px`,
            left: `${hintPosition.left}px`
          }}
        >
          <div className="space-y-1.5">
            <div className="font-semibold text-indigo-300 mb-1.5">{hint.title}</div>
            <div className="text-slate-300 leading-relaxed">{hint.description}</div>
            {hint.formula && (
              <div className="mt-2 pt-2 border-t border-white/10">
                <div className="text-slate-400 text-[9px] font-mono">{hint.formula}</div>
              </div>
            )}
            {hint.standard && (
              <div className="mt-1.5 text-emerald-400 text-[9px]">
                標準: {hint.standard}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function CompactTooltip({ active, payload, label, symbol = "", isPercent = false }) {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    const name = payload[0].name;
    const isDrawdown = name === "drawdown" || name === "Drawdown";
    const isSMA = name === "60 SMA";
    let displayColor = isDrawdown ? 'text-rose-400' : (val >= 0 ? 'text-emerald-400' : 'text-rose-400');
    if (isSMA) displayColor = "text-amber-400";
    return (
      <div className="bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 p-2 rounded shadow-2xl text-[10px] ring-1 ring-white/10">
        <p className="text-slate-400 mb-1 font-mono">{label}</p>
        <div className="flex flex-col gap-1">
          {payload.map((entry, index) => (
             <div key={index} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full shadow-sm" style={{backgroundColor: entry.stroke || entry.fill}}></span>
                <span className="text-slate-400">{entry.name}:</span>
                <span className={`font-bold font-mono ${entry.name === '60 SMA' ? 'text-amber-400' : displayColor}`}>
                  {isPercent ? '' : symbol}{entry.value?.toLocaleString()}{isPercent ? symbol : ''}
                </span>
             </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}


