import { NextResponse } from 'next/server';
import { loadAllStrategies } from '@/lib/excelParser';
import path from 'path';
import { readFileSync, existsSync } from 'fs';

export async function GET() {
  try {
    const basePath = process.cwd();
    const preprocessedPath = path.join(basePath, 'public', 'data', 'strategies.json');
    
    // Try to load preprocessed JSON first (faster)
    if (existsSync(preprocessedPath)) {
      try {
        console.log('Loading preprocessed data from:', preprocessedPath);
        const fileContent = readFileSync(preprocessedPath, 'utf8');
        const preprocessedData = JSON.parse(fileContent);
        
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
      } catch (jsonError) {
        console.warn('Failed to load preprocessed data, falling back to CSV:', jsonError.message);
      }
    }
    
    // Fallback: Load from CSV files (slower, for development)
    console.log('Loading from CSV files...');
    const publicDataPath = path.join(basePath, 'public', 'data');
    const searchPaths = [basePath, publicDataPath];
    
    const strategies = loadAllStrategies(basePath, searchPaths);
    
    const hasData = Object.keys(strategies).some(name => strategies[name].data.length > 0);
    
    if (!hasData) {
      console.warn('No strategy data found. Run preprocessing script first: npm run preprocess');
      return NextResponse.json(
        { success: false, error: 'No data found. Please run preprocessing script: npm run preprocess' },
        { status: 404 }
      );
    }
    
    console.log('Loaded strategies from CSV:', Object.keys(strategies));
    
    return NextResponse.json({ 
      success: true, 
      strategies,
      preprocessed: false
    });
  } catch (error) {
    console.error('Error loading strategies:', error);
    console.error('Stack:', error.stack);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

