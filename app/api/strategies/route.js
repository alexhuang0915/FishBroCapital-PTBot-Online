import { NextResponse } from 'next/server';

// Edge Runtime 配置
export const runtime = 'edge';

export async function GET(request) {
  try {
    // 在 Edge Runtime 中，使用 fetch 讀取 public 目錄的靜態文件
    // 構建時，public/data/strategies.json 會被複製到輸出目錄
    // 在 Cloudflare Pages 上，我們需要從請求中獲取 base URL
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const jsonUrl = `${baseUrl}/data/strategies.json`;
    
    try {
      console.log('Loading preprocessed data from:', jsonUrl);
      const response = await fetch(jsonUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      
      const preprocessedData = await response.json();
      
      // Convert to the expected format
      const strategies = {};
      Object.keys(preprocessedData.strategies).forEach(name => {
        strategies[name] = {
          data: preprocessedData.strategies[name],
          trades: preprocessedData.trades[name] || [],
          startEquity: 1000000
        };
      });
      
      console.log('✓ Loaded preprocessed data:', Object.keys(strategies));
      return NextResponse.json({ 
        success: true, 
        strategies,
        rawPortfolioData: preprocessedData.rawPortfolioData || [],
        preprocessed: true,
        metadata: preprocessedData.metadata
      });
    } catch (fetchError) {
      console.warn('Failed to load preprocessed data:', fetchError.message);
      return NextResponse.json(
        { success: false, error: 'No data found. Please ensure strategies.json exists in public/data/' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error loading strategies:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

