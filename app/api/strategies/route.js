import { NextResponse } from 'next/server';
import { loadAllStrategies } from '@/lib/excelParser';
import path from 'path';
import { readdir } from 'fs/promises';
import { existsSync } from 'fs';

export async function GET() {
  try {
    // Get the base path (current working directory)
    const basePath = process.cwd();
    console.log('Base path:', basePath);
    
    // Only search in root directory for CSV files
    const searchPaths = [basePath];
    
    // Load all strategies from CSV/Excel files
    const strategies = loadAllStrategies(basePath, searchPaths);
    
    // Check if we have any data
    const hasData = Object.keys(strategies).some(name => strategies[name].data.length > 0);
    
    if (!hasData) {
      console.warn('No strategy data found. Make sure CSV files are in the root directory.');
    }
    
    // Log summary
    console.log('Loaded strategies:', Object.keys(strategies));
    Object.keys(strategies).forEach(name => {
      console.log(`  ${name}: ${strategies[name].data.length} days, ${strategies[name].trades?.length || 0} trades`);
    });
    
    return NextResponse.json({ 
      success: true, 
      strategies 
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

