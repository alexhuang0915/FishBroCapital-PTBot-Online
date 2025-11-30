/**
 * Clean build script for Cloudflare Pages
 * Removes cache files that exceed Cloudflare's 25MB limit
 */
const fs = require('fs');
const path = require('path');

const NEXT_DIR = path.join(process.cwd(), '.next');
const CACHE_DIR = path.join(NEXT_DIR, 'cache');

console.log('🧹 Cleaning Next.js build cache for Cloudflare Pages...');

// Remove cache directory if it exists
if (fs.existsSync(CACHE_DIR)) {
  console.log(`Removing cache directory: ${CACHE_DIR}`);
  fs.rmSync(CACHE_DIR, { recursive: true, force: true });
  console.log('✓ Cache directory removed');
} else {
  console.log('No cache directory found');
}

// Also remove webpack cache files that might be outside cache directory
const WEBPACK_CACHE_DIRS = [
  path.join(NEXT_DIR, 'cache', 'webpack'),
  path.join(NEXT_DIR, 'server'),
  path.join(NEXT_DIR, 'static', 'chunks')
];

WEBPACK_CACHE_DIRS.forEach(dir => {
  if (fs.existsSync(dir)) {
    // Check for large files in these directories
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      entries.forEach(entry => {
        if (entry.isFile()) {
          const fullPath = path.join(dir, entry.name);
          const stats = fs.statSync(fullPath);
          // Remove files larger than 20MB
          if (stats.size > 20 * 1024 * 1024) {
            console.log(`Removing large file: ${fullPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
            fs.unlinkSync(fullPath);
          }
        }
      });
    } catch (err) {
      // Ignore errors
    }
  }
});

// Check for large files in .next directory
function checkLargeFiles(dir, maxSize = 25 * 1024 * 1024) {
  let found = false;
  
  if (!fs.existsSync(dir)) {
    return found;
  }
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Skip cache directories
      if (entry.name === 'cache') {
        continue;
      }
      checkLargeFiles(fullPath, maxSize);
    } else if (entry.isFile()) {
      const stats = fs.statSync(fullPath);
      if (stats.size > maxSize) {
        console.warn(`⚠ Warning: Large file found: ${fullPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
        found = true;
      }
    }
  }
  
  return found;
}

const hasLargeFiles = checkLargeFiles(NEXT_DIR);

if (hasLargeFiles) {
  console.warn('⚠ Some large files were found. You may need to use @cloudflare/next-on-pages adapter.');
}

console.log('✓ Build cleanup completed');

