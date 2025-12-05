/**
 * Check online page and verify data loading (using fetch only)
 */

const URL = 'https://fishbrocapital-ptbot-online-01.pages.dev/';
const API_URL = 'https://fishbrocapital-ptbot-online-01.pages.dev/api/strategies';

async function checkOnlinePage() {
  console.log('正在檢查線上網頁...\n');
  console.log('URL:', URL);
  console.log('='.repeat(80));
  
  try {
    // Check API endpoint
    console.log('\n1. 檢查 API 端點...');
    const apiResponse = await fetch(API_URL);
    
    if (!apiResponse.ok) {
      console.log(`✗ API 請求失敗: ${apiResponse.status} ${apiResponse.statusText}`);
      return;
    }
    
    const apiData = await apiResponse.json();
    
    console.log('✓ API 端點正常');
    console.log(`  狀態: ${apiData.success ? '成功' : '失敗'}`);
    console.log(`  預處理: ${apiData.preprocessed ? '是' : '否'}`);
    
    const strategies = apiData.strategies || {};
    const strategyNames = Object.keys(strategies);
    console.log(`  策略數量: ${strategyNames.length}`);
    console.log(`  策略列表: ${strategyNames.join(', ')}`);
    
    // Check each strategy
    console.log('\n2. 檢查各策略數據:');
    strategyNames.forEach(name => {
      const strategy = strategies[name];
      const data = strategy?.data || [];
      const trades = strategy?.trades || [];
      const startEquity = strategy?.startEquity || 0;
      
      if (data.length > 0) {
        const firstDate = data[0].date;
        const lastDate = data[data.length - 1].date;
        const totalPnl = data.reduce((sum, d) => sum + (d.pnl || 0), 0);
        const finalEquity = data[data.length - 1].equity;
        
        console.log(`  ✓ ${name.padEnd(20)}: ${data.length.toString().padStart(4)} 天, ${trades.length.toString().padStart(4)} 筆交易, 淨損益: ${totalPnl.toFixed(2).padStart(12)} TWD`);
        console.log(`    日期範圍: ${firstDate} ~ ${lastDate}`);
        console.log(`    初始權益: ${startEquity.toFixed(2)}, 最終權益: ${finalEquity.toFixed(2)}`);
      } else {
        console.log(`  ✗ ${name.padEnd(20)}: 無數據`);
      }
    });
    
    // Check Portfolio data
    console.log('\n3. 檢查 Portfolio 數據:');
    const rawPortfolioData = apiData.rawPortfolioData || [];
    console.log(`  Portfolio 天數: ${rawPortfolioData.length}`);
    
    if (rawPortfolioData.length > 0) {
      const firstDate = rawPortfolioData[0].date;
      const lastDate = rawPortfolioData[rawPortfolioData.length - 1].date;
      console.log(`  日期範圍: ${firstDate} ~ ${lastDate}`);
      
      // Check if all strategies have PnL data in portfolio
      const sampleDay = rawPortfolioData[0];
      const pnlKeys = Object.keys(sampleDay).filter(k => k.startsWith('pnl_'));
      console.log(`  包含策略 PnL: ${pnlKeys.length} 個`);
      console.log(`  PnL 欄位: ${pnlKeys.map(k => k.replace('pnl_', '')).join(', ')}`);
      
      // Verify data consistency
      let missingDataCount = 0;
      strategyNames.forEach(name => {
        const pnlKey = `pnl_${name}`;
        const hasData = rawPortfolioData.some(day => day[pnlKey] !== undefined && day[pnlKey] !== null);
        if (!hasData) {
          missingDataCount++;
          console.log(`  ⚠ 警告: Portfolio 缺少 ${name} 的 PnL 數據`);
        }
      });
      
      if (missingDataCount === 0) {
        console.log('  ✓ 所有策略的 PnL 數據都存在於 Portfolio');
      }
    } else {
      console.log('  ✗ Portfolio 數據為空！');
      console.log('  ⚠ 這可能導致 Portfolio 視圖無法正常顯示');
    }
    
    // Check metadata
    if (apiData.metadata) {
      console.log('\n4. 檢查元數據:');
      console.log(`  生成時間: ${apiData.metadata.generatedAt || '未知'}`);
      console.log(`  總策略數: ${apiData.metadata.totalStrategies || '未知'}`);
      console.log(`  總天數: ${apiData.metadata.totalDates || '未知'}`);
      if (apiData.metadata.dateRange) {
        console.log(`  日期範圍: ${apiData.metadata.dateRange.start} ~ ${apiData.metadata.dateRange.end}`);
      }
    }
    
    // Check HTML page
    console.log('\n5. 檢查 HTML 頁面...');
    const htmlResponse = await fetch(URL);
    
    if (!htmlResponse.ok) {
      console.log(`✗ HTML 頁面請求失敗: ${htmlResponse.status} ${htmlResponse.statusText}`);
      return;
    }
    
    const html = await htmlResponse.text();
    console.log(`✓ HTML 頁面載入成功 (${html.length} 字元)`);
    
    // Check for key content
    const hasReact = html.includes('__NEXT_DATA__') || html.includes('react');
    const hasTitle = html.includes('FishBro Capital') || html.includes('FishBro');
    const hasScripts = html.includes('<script');
    
    console.log(`  包含 React: ${hasReact ? '是' : '否'}`);
    console.log(`  包含標題: ${hasTitle ? '是' : '否'}`);
    console.log(`  包含腳本: ${hasScripts ? '是' : '否'}`);
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('檢查總結:');
    console.log('='.repeat(80));
    
    const allStrategiesHaveData = strategyNames.every(name => {
      const strategy = strategies[name];
      return strategy?.data && strategy.data.length > 0;
    });
    
    const portfolioHasData = rawPortfolioData.length > 0;
    
    if (apiData.success && allStrategiesHaveData && portfolioHasData) {
      console.log('✓ 所有檢查通過！網頁應該可以正常顯示');
    } else {
      if (!apiData.success) {
        console.log('✗ API 返回失敗');
      }
      if (!allStrategiesHaveData) {
        console.log('✗ 部分策略缺少數據');
      }
      if (!portfolioHasData) {
        console.log('✗ Portfolio 數據為空 - 這會導致 Portfolio 視圖無法顯示');
      }
    }
    
  } catch (error) {
    console.error('檢查過程發生錯誤:', error);
    console.error('錯誤詳情:', error.message);
    if (error.stack) {
      console.error('堆疊:', error.stack);
    }
    process.exit(1);
  }
}

checkOnlinePage();
