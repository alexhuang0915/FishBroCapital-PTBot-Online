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
    
    // Check for uploaded files in public/uploads first
    const uploadsPath = path.join(basePath, 'public', 'uploads');
    let searchPaths = [basePath]; // Default: search in root directory
    
    if (existsSync(uploadsPath)) {
      try {
        const uploadFiles = await readdir(uploadsPath);
        if (uploadFiles.length > 0) {
          // If there are uploaded files, also search in uploads directory
          searchPaths.push(uploadsPath);
          console.log('Found uploaded files in:', uploadsPath);
        }
      } catch (err) {
        console.log('No uploads directory or error reading:', err.message);
      }
    }
    
    // Load all strategies from CSV/Excel files (from both root and uploads)
    const strategies = loadAllStrategies(basePath, searchPaths);
    
    // Log summary
    console.log('Loaded strategies:', Object.keys(strategies));
    Object.keys(strategies).forEach(name => {
      console.log(`  ${name}: ${strategies[name].data.length} days`);
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

