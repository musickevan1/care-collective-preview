#!/usr/bin/env node
/**
 * Updates the service worker cache version to ensure fresh content on deployments
 * Run this script before each deployment to bust the service worker cache
 */

const fs = require('fs');
const path = require('path');

const swPath = path.join(__dirname, '../public/sw.js');
const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '-');
const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
const newVersion = `${timestamp}-${randomSuffix}`;

try {
  // Read the service worker file
  let swContent = fs.readFileSync(swPath, 'utf8');

  // Replace the CACHE_VERSION
  const versionRegex = /const CACHE_VERSION = '[^']+'/;
  const newVersionLine = `const CACHE_VERSION = '${newVersion}'`;

  if (versionRegex.test(swContent)) {
    swContent = swContent.replace(versionRegex, newVersionLine);
    fs.writeFileSync(swPath, swContent, 'utf8');
    console.log(`✅ Service worker cache version updated to: ${newVersion}`);
  } else {
    console.error('❌ Could not find CACHE_VERSION in sw.js');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error updating service worker version:', error.message);
  process.exit(1);
}
