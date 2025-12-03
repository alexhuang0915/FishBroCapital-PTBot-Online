import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

/**
 * Parse CSV file
 * @param {string} filePath - Path to CSV file
 * @returns {Array} Parsed data
 */
export function parseCSVFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`CSV file does not exist: ${filePath}`);
      return [];
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const workbook = XLSX.read(fileContent, { type: 'string' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      defval: null,
      raw: false 
    });
    
    console.log(`  Parsed ${jsonData.length} rows from CSV`);
    if (jsonData.length > 0) {
      console.log(`  First row keys:`, Object.keys(jsonData[0]));
    }
    
    return jsonData;
  } catch (error) {
    console.error(`Error parsing CSV file ${filePath}:`, error);
    return [];
  }
}

/**
 * Find and parse the "交易明細" sheet from Excel file
 * @param {string} filePath - Path to Excel file
 * @returns {Array} Parsed trade details data
 */
export function parseExcelFile(filePath) {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`File does not exist: ${filePath}`);
      return [];
    }
    
    // Read file as buffer to avoid file locking issues
    let fileBuffer;
    try {
      fileBuffer = fs.readFileSync(filePath);
    } catch (readError) {
      console.error(`Cannot read file (may be locked or permission denied): ${filePath}`);
      console.error(`Error: ${readError.message}`);
      console.error('Make sure the file is not open in Excel or another program.');
      return [];
    }
    
    // Parse Excel from buffer
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    
    console.log(`Available sheets in ${path.basename(filePath)}:`, workbook.SheetNames);
    
    // Find the "交易明細" sheet
    const sheetName = workbook.SheetNames.find(name => 
      name.includes('交易明細') || 
      name.includes('交易明细') ||
      name.includes('Trade') ||
      name.includes('Trades') ||
      name.includes('明細') ||
      name.includes('明细')
    ) || workbook.SheetNames[0]; // Fallback to first sheet
    
    console.log(`Reading sheet: "${sheetName}" from ${path.basename(filePath)}`);
    
    const worksheet = workbook.Sheets[sheetName];
    
    if (!worksheet) {
      console.error(`Sheet "${sheetName}" not found in workbook`);
      return [];
    }
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      defval: null,
      raw: false 
    });
    
    console.log(`  Parsed ${jsonData.length} rows`);
    if (jsonData.length > 0) {
      console.log(`  First row keys:`, Object.keys(jsonData[0]));
      console.log(`  Sample row (first 300 chars):`, JSON.stringify(jsonData[0], null, 2).substring(0, 300));
    } else {
      console.warn(`  WARNING: No data rows found in sheet "${sheetName}"`);
    }
    
    return jsonData;
  } catch (error) {
    console.error(`Error parsing Excel file ${filePath}:`, error);
    console.error('Error message:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    return [];
  }
}

/**
 * Extract strategy name from filename
 * @param {string} filename - Excel filename
 * @returns {string} Strategy identifier
 */
export function extractStrategyName(filename) {
  // Match strategy name pattern (MNQ or TXF/MXF in filename)
  let match = filename.match(/(MNQ|TXF|MXF)_(VIX|DX)_\d+/);
  if (match) {
    let name = match[0];
    // Replace TXF with MXF for consistency
    if (name.startsWith('TXF_')) {
      name = name.replace('TXF_', 'MXF_');
    }
    return name;
  }
  
  let name = filename
    .replace('策略回測績效報告.xlsx', '')
    .replace('策略回測績效報告.csv', '')
    .replace('CME.', '')
    .replace('TWF.', '')
    .replace('HOT', '')
    .trim()
    .replace(/\s+/g, '_');
  
  // Replace TXF with MXF for consistency
  if (name.includes('TXF_')) {
    name = name.replace(/TXF_/g, 'MXF_');
  }
  
  return name;
}

/**
 * Convert trade details to daily PnL and Equity curve
 * @param {Array} tradeData - Raw trade details from Excel
 * @param {string} strategyName - Strategy identifier
 * @param {string} currency - Currency code (USD for MNQ, TWD for TXF)
 * @returns {Object} Daily data with PnL and Equity
 */
export function convertTradesToDailyData(tradeData, strategyName, currency = 'USD') {
  if (!tradeData || tradeData.length === 0) {
    return { data: [], startEquity: 100000, trades: [] };
  }

  // Check if first row is a header row
  const firstRow = tradeData[0];
  let dataStartIndex = 0;
  let dateCol = null;
  let pnlCol = null;
  
  if (firstRow) {
    const firstRowValues = Object.values(firstRow).map(v => String(v || ''));
    // Check if first row contains header text like "交易編號", "日期", "獲利"
    const isHeaderRow = firstRowValues.some(v => 
      v.includes('交易編號') || 
      v.includes('委託單編號') || 
      v.includes('類型') ||
      (v.includes('日期') && !v.match(/^\d{4}/)) || // Date header, not actual date
      (v.includes('獲利') && !v.match(/^-?\d/))    // Profit header, not actual number
    );
    
    if (isHeaderRow) {
      dataStartIndex = 1;
      console.log('Detected header row, skipping first row');
      
      // Find columns by checking header row values
      // CSV format: '交易明細', 'Unnamed: 1', 'Unnamed: 2', 'Unnamed: 3' (日期), 'Unnamed: 7' (獲利)
      // Excel format: '交易明細', '__EMPTY', '__EMPTY_1', '__EMPTY_3' (日期), '__EMPTY_7' (獲利)
      for (const [key, value] of Object.entries(firstRow)) {
        const strValue = String(value || '').trim();
        if (strValue.includes('日期') && !dateCol) {
          dateCol = key;
          console.log(`  Found date column: ${key} = "${strValue}"`);
        }
        if ((strValue.includes('獲利') || strValue.includes('損益') || strValue.includes('PnL') || strValue.includes('Profit')) && !pnlCol) {
          pnlCol = key;
          console.log(`  Found PnL column: ${key} = "${strValue}"`);
        }
      }
      
      // Fallback: Use known column patterns
      // CSV: Unnamed: 3 = 日期, Unnamed: 7 = 獲利(¤)
      // Excel: __EMPTY_3 = 日期, __EMPTY_7 = 獲利(¤)
      if (!dateCol) {
        dateCol = Object.keys(firstRow).find(k => k === 'Unnamed: 3' || k === '__EMPTY_3');
      }
      if (!pnlCol) {
        pnlCol = Object.keys(firstRow).find(k => k === 'Unnamed: 7' || k === '__EMPTY_7');
      }
    }
  }
  
  // Get actual data rows (skip header)
  const actualData = tradeData.slice(dataStartIndex);
  
  if (actualData.length === 0) {
    console.log('No data rows found after skipping header');
    return { data: [], startEquity: 100000 };
  }
  
  // If columns not found from header, try to detect from data
  if (!dateCol || !pnlCol) {
    const sampleRow = actualData[0];
    const columns = Object.keys(sampleRow);
    
    console.log('Trying to detect columns from data...');
    console.log('Sample row:', JSON.stringify(sampleRow, null, 2).substring(0, 500));
    
    // Try to find date column by checking for date-like values
    if (!dateCol) {
      for (const col of columns) {
        const value = sampleRow[col];
        const strValue = String(value || '');
        // Check for date patterns
        if (strValue.match(/^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}/) || 
            strValue.match(/^\d{1,2}[-\/]\d{1,2}[-\/]\d{4}/) ||
            value instanceof Date) {
          dateCol = col;
          console.log(`  Detected date column from data: ${col}`);
          break;
        }
      }
      // Fallback to known pattern from log
      if (!dateCol && columns.includes('__EMPTY_3')) {
        dateCol = '__EMPTY_3';
        console.log(`  Using fallback date column: __EMPTY_3`);
      }
    }
    
    // Try to find PnL column by checking for numeric values
    if (!pnlCol) {
      for (const col of columns) {
        const value = sampleRow[col];
        if (value !== null && value !== undefined) {
          const numValue = parseFloat(String(value).replace(/,/g, ''));
          // Check if it's a valid number (not NaN, and not 0 which might be header)
          if (!isNaN(numValue) && numValue !== 0) {
            pnlCol = col;
            console.log(`  Detected PnL column from data: ${col} = ${numValue}`);
            break;
          }
        }
      }
      // Fallback to known pattern from log
      if (!pnlCol && columns.includes('__EMPTY_7')) {
        pnlCol = '__EMPTY_7';
        console.log(`  Using fallback PnL column: __EMPTY_7`);
      }
    }
  }

  console.log(`Final columns - Date: ${dateCol || 'NOT FOUND'}, PnL: ${pnlCol || 'NOT FOUND'}`);
  
  if (!dateCol || !pnlCol) {
    console.error('ERROR: Missing required columns!');
    console.error('Available columns:', Object.keys(actualData[0] || {}));
    console.error('First data row sample:', JSON.stringify(actualData[0], null, 2).substring(0, 800));
    return { data: [], startEquity: 100000 };
  }

  // Group trades by date and collect individual trades for win rate calculation
  const dailyPnL = {};
  const individualTrades = []; // Store individual trades for win rate calculation
  let startEquity = 100000; // Default starting equity
  let validTrades = 0;
  let skippedTrades = 0;

  actualData.forEach((row, index) => {
    // Get date
    let dateValue = dateCol ? row[dateCol] : null;
    
    if (!dateValue) {
      skippedTrades++;
      return;
    }
    
    // Skip if date value is the header text itself
    if (String(dateValue).includes('日期')) {
      skippedTrades++;
      return;
    }

    // Parse date
    let date = null;
    if (dateValue instanceof Date) {
      date = dateValue;
    } else {
      // First, try to parse as number (Excel date serial number)
      const numericValue = typeof dateValue === 'string' ? parseFloat(dateValue) : dateValue;
      
      if (typeof numericValue === 'number' && !isNaN(numericValue) && numericValue > 0) {
        // Check if it looks like an Excel date serial number (typically 40000-50000 for recent dates)
        if (numericValue > 1000 && numericValue < 1000000) {
          // Excel date serial number (days since 1899-12-30)
          const excelEpoch = new Date(1899, 11, 30);
          date = new Date(excelEpoch.getTime() + numericValue * 24 * 60 * 60 * 1000);
        }
      }
      
      // If not parsed as Excel date, try string parsing
      if (!date || isNaN(date.getTime())) {
        const dateStr = String(dateValue);
        // Try various date formats
        date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          date = new Date(dateStr.replace(/\//g, '-'));
        }
        if (isNaN(date.getTime())) {
          // Try Excel date format YYYY-MM-DD
          const parts = dateStr.split(/[-/]/);
          if (parts.length === 3) {
            date = new Date(parts[0], parts[1] - 1, parts[2]);
          }
        }
      }
    }

    if (!date || isNaN(date.getTime())) {
      skippedTrades++;
      return;
    }

    // Get PnL
    let pnl = 0;
    if (pnlCol && row[pnlCol] !== null && row[pnlCol] !== undefined) {
      const pnlValue = String(row[pnlCol]).replace(/,/g, '').trim();
      pnl = parseFloat(pnlValue) || 0;
    }

    // Store individual trade for win rate calculation (only non-zero PnL trades)
    if (pnl !== 0) {
      individualTrades.push({
        date: date.toISOString().split('T')[0],
        pnl: pnl
      });
    }

    // Group by date (YYYY-MM-DD)
    const dateKey = date.toISOString().split('T')[0];
    
    if (!dailyPnL[dateKey]) {
      dailyPnL[dateKey] = 0;
    }
    dailyPnL[dateKey] += pnl;
    validTrades++;
  });
  
  console.log(`  Processed ${validTrades} valid trades, skipped ${skippedTrades} invalid trades`);

  // Convert to sorted array with equity calculation
  const sortedDates = Object.keys(dailyPnL).sort();
  const data = [];
  
  // Calculate starting equity from first day's data
  let firstDatePnL = 0;
  if (sortedDates.length > 0) {
    firstDatePnL = dailyPnL[sortedDates[0]];
  }
  
  // Start equity calculation - ensure it's consistent
  let equity = startEquity;
  let isFirstDay = true;

  sortedDates.forEach(dateKey => {
    const pnl = dailyPnL[dateKey];
    
    // For first day, ensure equity starts correctly
    if (isFirstDay) {
      equity = startEquity + pnl;
      isFirstDay = false;
    } else {
      equity += pnl;
    }
    
    const date = new Date(dateKey);
    
    data.push({
      date: dateKey,
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      pnl: Math.round(pnl * 100) / 100,
      equity: Math.round(equity * 100) / 100,
      strategy: strategyName,
      currency: currency
    });
  });

  // Update startEquity to actual starting equity (before first trade)
  if (data.length > 0) {
    startEquity = data[0].equity - data[0].pnl;
  }

  console.log(`Processed ${tradeData.length} trades into ${data.length} daily records for ${strategyName}`);
  console.log(`  Individual trades for win rate: ${individualTrades.length}`);
  
  return { data, startEquity, trades: individualTrades };
}

/**
 * Load all strategy Excel files and parse from "交易明細" sheet
 * @param {string} basePath - Base directory path
 * @param {Array<string>} searchPaths - Additional paths to search for files (optional)
 * @returns {Object} All strategies data
 */
export function loadAllStrategies(basePath, searchPaths = []) {
  const strategies = {};
  
  // Strategy configuration with multiple file patterns
  const strategyConfigs = [
    {
      name: 'MNQ_DX_60',
      currency: 'USD',
      excelFiles: [
        'CME.MNQ HOT  MNQ_DX_60_BackTest 策略回測績效報告.xlsx',
        'CME.MNQ HOT  MNQ_DX_60 策略回測績效報告.xlsx'
      ],
      csvFiles: [
        'CME.MNQ HOT  MNQ_DX_60 策略回測績效報告.csv'
      ]
    },
    {
      name: 'MNQ_DX_120',
      currency: 'USD',
      excelFiles: [
        'CME.MNQ HOT  MNQ_DX_120_BackTest 策略回測績效報告.xlsx',
        'CME.MNQ HOT  MNQ_DX_120 策略回測績效報告.xlsx'
      ],
      csvFiles: [
        'CME.MNQ HOT  MNQ_DX_120 策略回測績效報告.csv'
      ]
    },
    {
      name: 'MNQ_VIX_60',
      currency: 'USD',
      excelFiles: [
        'CME.MNQ HOT  MNQ_VIX_60_BackTest 策略回測績效報告.xlsx',
        'CME.MNQ HOT  MNQ_VIX_60 策略回測績效報告.xlsx'
      ],
      csvFiles: [
        'CME.MNQ HOT  MNQ_VIX_60 策略回測績效報告.csv'
      ]
    },
    {
      name: 'MNQ_ZN_60',
      currency: 'USD',
      excelFiles: [
        'CME.MNQ HOT  MNQ_ZN_60_BackTest 策略回測績效報告.xlsx',
        'CME.MNQ HOT  MNQ_ZN_60 策略回測績效報告.xlsx'
      ],
      csvFiles: [
        'CME.MNQ HOT  MNQ_ZN_60 策略回測績效報告.csv'
      ]
    },
    {
      name: 'MNQ_ZN_120',
      currency: 'USD',
      excelFiles: [
        'CME.MNQ HOT  MNQ_ZN_120_BackTest 策略回測績效報告.xlsx',
        'CME.MNQ HOT  MNQ_ZN_120 策略回測績效報告.xlsx'
      ],
      csvFiles: [
        'CME.MNQ HOT  MNQ_ZN_120 策略回測績效報告.csv'
      ]
    },
    {
      name: 'MXF_VIX_120',
      currency: 'TWD',
      excelFiles: [
        'CME.MNQ HOT  TXF_VIX_120_BackTest 策略回測績效報告.xlsx', // 可能是誤命名，但實際是 MXF
        'TWF.MXF HOT  MXF_VIX_120_BackTest 策略回測績效報告.xlsx',
        'TWF.MXF HOT  MXF_VIX_120 策略回測績效報告.xlsx'
      ],
      csvFiles: [
        'TWF.MXF HOT  TXF_VIX_120 策略回測績效報告.csv',
        'TWF.MXF HOT  MXF_VIX_120 策略回測績效報告.csv'
      ]
    }
  ];
  
  // Combine basePath with searchPaths
  const allPaths = [basePath, ...searchPaths];
  
  // Process each strategy
  strategyConfigs.forEach(({ name, currency, excelFiles, csvFiles }) => {
    let filePath = null;
    let useCSV = false;
    
    // First try Excel files (preferred)
    for (const excelFile of excelFiles) {
      for (const searchPath of allPaths) {
        const excelPath = path.join(searchPath, excelFile);
        if (fs.existsSync(excelPath)) {
          filePath = excelPath;
          useCSV = false;
          break;
        }
      }
      if (filePath) break;
    }
    
    // If no Excel file found, try CSV files
    if (!filePath) {
      for (const csvFile of csvFiles) {
        for (const searchPath of allPaths) {
          const csvPath = path.join(searchPath, csvFile);
          if (fs.existsSync(csvPath)) {
            filePath = csvPath;
            useCSV = true;
            break;
          }
        }
        if (filePath) break;
      }
    }
    
    if (filePath) {
      try {
        console.log(`Loading ${name} from: ${path.basename(filePath)} (${useCSV ? 'CSV' : 'Excel'})`);
        
        // Parse data
        const tradeData = useCSV ? parseCSVFile(filePath) : parseExcelFile(filePath);
        
        // Convert trades to daily data
        const { data, startEquity, trades } = convertTradesToDailyData(tradeData, name, currency);
        
        strategies[name] = { data, startEquity, trades };
        
        console.log(`✓ Loaded ${name}: ${data.length} days, ${tradeData.length} trades`);
      } catch (error) {
        console.error(`Error loading ${name} from ${filePath}:`, error);
        console.error('Error details:', error.message);
        strategies[name] = { data: [], startEquity: 100000 };
      }
    } else {
      console.warn(`File not found for ${name}. Searched in: ${allPaths.join(', ')}`);
      strategies[name] = { data: [], startEquity: 100000 };
    }
  });
  
  return strategies;
}
