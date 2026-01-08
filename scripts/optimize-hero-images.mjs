#!/usr/bin/env node
/**
 * Hero Image Optimization Script
 * Converts PNG hero images to WebP format with multiple responsive sizes
 * 
 * Usage: node scripts/optimize-hero-images.mjs
 */

import sharp from 'sharp';
import { readdir, mkdir, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const INPUT_DIR = join(PROJECT_ROOT, 'public/hero-images');
const OUTPUT_DIR = join(PROJECT_ROOT, 'public/hero-images/optimized');

// Responsive sizes for the circular hero image
// Max display size is 400px (2xl breakpoint), so we need:
// - 400px for 1x displays
// - 800px for 2x (retina) displays
// - 1200px for 3x displays (future-proof)
const SIZES = [400, 800, 1200];

// WebP quality setting (80 is a good balance of quality/size)
const WEBP_QUALITY = 80;

async function optimizeImages() {
  console.log('🖼️  Hero Image Optimization Script\n');
  
  // Create output directory
  try {
    await mkdir(OUTPUT_DIR, { recursive: true });
    console.log(`📁 Created output directory: ${OUTPUT_DIR}\n`);
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }

  // Get all hero PNG files
  const files = await readdir(INPUT_DIR);
  const heroImages = files.filter(f => f.match(/^hero-\d+\.png$/));
  
  console.log(`Found ${heroImages.length} hero images to optimize:\n`);

  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;

  for (const filename of heroImages) {
    const inputPath = join(INPUT_DIR, filename);
    const baseName = filename.replace('.png', '');
    
    const originalStats = await stat(inputPath);
    totalOriginalSize += originalStats.size;
    
    console.log(`Processing: ${filename} (${(originalStats.size / 1024 / 1024).toFixed(2)} MB)`);
    
    // Generate each size
    for (const size of SIZES) {
      const outputFilename = `${baseName}-${size}w.webp`;
      const outputPath = join(OUTPUT_DIR, outputFilename);
      
      await sharp(inputPath)
        .resize(size, size, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: WEBP_QUALITY })
        .toFile(outputPath);
      
      const outputStats = await stat(outputPath);
      totalOptimizedSize += outputStats.size;
      
      console.log(`  ✓ ${outputFilename} (${(outputStats.size / 1024).toFixed(0)} KB)`);
    }
    console.log('');
  }

  // Summary
  const savedMB = ((totalOriginalSize - totalOptimizedSize) / 1024 / 1024).toFixed(2);
  const savedPercent = ((1 - totalOptimizedSize / totalOriginalSize) * 100).toFixed(1);
  
  console.log('═══════════════════════════════════════════');
  console.log('📊 Optimization Summary:');
  console.log(`   Original total:  ${(totalOriginalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Optimized total: ${(totalOptimizedSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Saved: ${savedMB} MB (${savedPercent}% reduction)`);
  console.log('═══════════════════════════════════════════\n');
  
  console.log('✅ Optimization complete!');
  console.log(`   Output directory: ${OUTPUT_DIR}`);
}

optimizeImages().catch(err => {
  console.error('❌ Error optimizing images:', err);
  process.exit(1);
});
