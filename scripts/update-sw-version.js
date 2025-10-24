#!/usr/bin/env node
/**
 * Updates the service worker cache version to ensure fresh content on deployments
 * Run this script before each deployment to bust the service worker cache
 */

const fs = require('fs');
const path = require('path');

const swPath = path.join(__dirname, '../public/sw.js');
const timestamp = new Date().toISOString().slice(0, 10);
const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
const newVersion = `${timestamp}-${randomSuffix}`;

console.log('📦 Updating service worker cache version...');
console.log(`   Old pattern: const CACHE_VERSION = 'YYYY-MM-DD-XXX'`);
console.log(`   New version: ${newVersion}`);

try {
  // Check if service worker file exists
  if (!fs.existsSync(swPath)) {
    throw new Error(`Service worker file not found at: ${swPath}`);
  }

  // Read the service worker file
  let swContent = fs.readFileSync(swPath, 'utf8');

  // Strict version format validation: YYYY-MM-DD-XXX
  const versionRegex = /const CACHE_VERSION = '\d{4}-\d{2}-\d{2}-\d{3}'/;
  const newVersionLine = `const CACHE_VERSION = '${newVersion}'`;

  if (versionRegex.test(swContent)) {
    swContent = swContent.replace(versionRegex, newVersionLine);
    fs.writeFileSync(swPath, swContent, 'utf8');
    console.log(`✅ Service worker cache version updated to: ${newVersion}`);
    console.log('');
  } else {
    console.error('');
    console.error('❌ Could not find CACHE_VERSION with expected format in sw.js');
    console.error('   Expected format: const CACHE_VERSION = \'YYYY-MM-DD-XXX\'');
    console.error('   File path:', swPath);
    console.error('');
    process.exit(1);
  }
} catch (error) {
  console.error('');
  console.error('❌ CRITICAL ERROR: Service worker version update failed!');
  console.error('   This will cause users to see stale cached content.');
  console.error('   Deployment should be aborted.');
  console.error('');
  console.error('   Error details:', error.message);
  console.error('   File path:', swPath);
  console.error('');
  process.exit(1);
}
