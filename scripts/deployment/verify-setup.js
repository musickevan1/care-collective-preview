#!/usr/bin/env node
/**
 * Setup Verification Script for Care Collective
 * This script verifies that all environment variables and dependencies are correctly configured
 * Run with: node scripts/verify-setup.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env.local
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          process.env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
  }
}

// Load environment variables
loadEnv();

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

// Helper functions for colored output
const success = (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`);
const error = (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`);
const warning = (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`);
const info = (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`);
const header = (msg) => console.log(`\n${colors.bold}${colors.blue}${msg}${colors.reset}`);

// Track overall status
let hasErrors = false;
let hasWarnings = false;

async function verifyEnvironmentVariables() {
  header('🔧 Checking Environment Variables');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SITE_URL',
  ];
  
  const optionalVars = [
    'NEXT_PUBLIC_PREVIEW_ADMIN',
    'NEXT_PUBLIC_ADMIN_ALLOWLIST',
  ];
  
  // Check required variables
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      success(`${varName} is set`);
      
      // Validate format
      if (varName === 'NEXT_PUBLIC_SUPABASE_URL') {
        if (!process.env[varName].startsWith('https://')) {
          warning(`  ${varName} should start with https://`);
          hasWarnings = true;
        }
        if (!process.env[varName].includes('.supabase.co')) {
          warning(`  ${varName} doesn't look like a Supabase URL`);
          hasWarnings = true;
        }
      }
      
      if (varName.includes('KEY') || varName.includes('ROLE')) {
        if (process.env[varName].length < 100) {
          warning(`  ${varName} seems too short for a valid key`);
          hasWarnings = true;
        }
      }
    } else {
      error(`${varName} is missing`);
      hasErrors = true;
    }
  }
  
  // Check optional variables
  for (const varName of optionalVars) {
    if (process.env[varName]) {
      success(`${varName} is set (optional)`);
    } else {
      info(`${varName} is not set (optional)`);
    }
  }
}

async function verifySupabaseConnection() {
  header('🔌 Testing Supabase Connection');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRole) {
    error('Missing Supabase credentials, skipping connection test');
    hasErrors = true;
    return;
  }
  
  try {
    // Test with anon key (public access)
    const anonClient = createClient(supabaseUrl, supabaseAnonKey);
    const { error: healthError } = await anonClient.from('profiles').select('count').limit(1);
    
    if (healthError) {
      if (healthError.message.includes('relation "public.profiles" does not exist')) {
        warning('Database tables not yet created - run migrations first');
        hasWarnings = true;
      } else {
        error(`Anon client connection failed: ${healthError.message}`);
        hasErrors = true;
      }
    } else {
      success('Anon client connection successful');
    }
    
    // Test with service role (admin access)
    const serviceClient = createClient(supabaseUrl, supabaseServiceRole);
    
    // Test a simple query instead of admin API
    const { data: testData, error: testError } = await serviceClient
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (testError) {
      if (!testError.message.includes('relation "public.profiles" does not exist')) {
        error(`Service role connection failed: ${testError.message}`);
        hasErrors = true;
      }
    } else {
      success('Service role connection successful');
      if (testData) {
        info(`  Database connection verified`);
      }
    }
    
  } catch (err) {
    error(`Supabase connection test failed: ${err}`);
    hasErrors = true;
  }
}

async function verifyDatabaseSchema() {
  header('📊 Checking Database Schema');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceRole) {
    error('Missing Supabase credentials, skipping schema check');
    return;
  }
  
  const client = createClient(supabaseUrl, supabaseServiceRole);
  
  const requiredTables = [
    'profiles',
    'help_requests',
    'messages',
  ];
  
  for (const table of requiredTables) {
    try {
      const { error: tableError } = await client.from(table).select('*').limit(0);
      
      if (tableError) {
        if (tableError.message.includes('does not exist')) {
          error(`Table '${table}' does not exist`);
          hasErrors = true;
        } else {
          warning(`Table '${table}' exists but has issues: ${tableError.message}`);
          hasWarnings = true;
        }
      } else {
        success(`Table '${table}' exists and is accessible`);
      }
    } catch (err) {
      error(`Failed to check table '${table}': ${err}`);
      hasErrors = true;
    }
  }
}

async function verifyProjectStructure() {
  header('📁 Checking Project Structure');
  
  const requiredDirs = [
    'app',
    'components',
    'lib',
    'lib/supabase',
    'public',
    'app/api',
    'app/dashboard',
    'app/requests',
    'app/admin',
  ];
  
  const requiredFiles = [
    'package.json',
    'tsconfig.json',
    'next.config.ts',
    'tailwind.config.ts',
    '.env.local',
    'middleware.ts',
    'DEVELOPMENT_PLAN.md',
  ];
  
  // Check directories
  for (const dir of requiredDirs) {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      success(`Directory '${dir}' exists`);
    } else {
      error(`Directory '${dir}' is missing`);
      hasErrors = true;
    }
  }
  
  // Check files
  for (const file of requiredFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      success(`File '${file}' exists`);
    } else {
      if (file === '.env.local') {
        error(`File '${file}' is missing - copy from .env.example`);
      } else {
        error(`File '${file}' is missing`);
      }
      hasErrors = true;
    }
  }
}

async function checkDependencies() {
  header('📦 Checking Dependencies');
  
  try {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8')
    );
    
    const criticalDeps = [
      'next',
      'react',
      'react-dom',
      '@supabase/supabase-js',
      '@supabase/ssr',
      'tailwindcss',
      'typescript',
    ];
    
    for (const dep of criticalDeps) {
      if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
        const version = packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep];
        success(`${dep} (${version})`);
      } else {
        error(`${dep} is missing from package.json`);
        hasErrors = true;
      }
    }
    
    // Check if node_modules exists
    if (fs.existsSync(path.join(process.cwd(), 'node_modules'))) {
      success('node_modules directory exists');
    } else {
      error('node_modules directory missing - run "npm install"');
      hasErrors = true;
    }
    
  } catch (err) {
    error(`Failed to check dependencies: ${err}`);
    hasErrors = true;
  }
}

async function suggestNextSteps() {
  header('📋 Development Plan Status');
  
  info('According to DEVELOPMENT_PLAN.md, the next priorities are:');
  console.log('');
  console.log('  Phase 1 Options:');
  console.log('    • Option A: Real-time Features (WebSocket subscriptions)');
  console.log('    • Option B: Messaging System (user communication)');
  console.log('');
  console.log('  Quick Wins:');
  console.log('    • Enable admin write capabilities');
  console.log('    • Add request status tracking');
  console.log('    • Implement notifications');
  console.log('');
  
  if (hasErrors) {
    header('❌ Setup Issues Detected');
    error('Please fix the errors above before proceeding with development');
    console.log('');
    console.log('Common fixes:');
    console.log('  1. Copy .env.example to .env.local and add your Supabase credentials');
    console.log('  2. Run "npm install" to install dependencies');
    console.log('  3. Run database migrations if tables are missing');
    console.log('');
  } else if (hasWarnings) {
    header('⚠️  Setup Complete with Warnings');
    warning('Your setup is functional but has some warnings to address');
    console.log('');
    success('You can proceed with development!');
    console.log('');
    console.log('Recommended next steps:');
    console.log('  1. Review and address the warnings above');
    console.log('  2. Choose a Phase 1 implementation option from DEVELOPMENT_PLAN.md');
    console.log('  3. Create a feature branch: git checkout -b feature/phase-1-[option]');
    console.log('  4. Start the development server: npm run dev');
    console.log('');
  } else {
    header('✅ Setup Verification Complete');
    success('All checks passed! Your environment is ready for development.');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Choose a Phase 1 implementation option from DEVELOPMENT_PLAN.md');
    console.log('  2. Create a feature branch: git checkout -b feature/phase-1-[option]');
    console.log('  3. Start the development server: npm run dev');
    console.log('  4. Begin implementing your chosen feature');
    console.log('');
  }
  
  // Feature flag suggestions
  header('🚀 Feature Flags for Development');
  console.log('');
  console.log('Add these to your .env.local as you implement features:');
  console.log('');
  console.log('  # Phase 1 Features');
  console.log('  NEXT_PUBLIC_FEATURE_REALTIME=false');
  console.log('  NEXT_PUBLIC_FEATURE_MESSAGING=false');
  console.log('');
  console.log('  # Phase 2 Features');
  console.log('  NEXT_PUBLIC_FEATURE_ADVANCED_PROFILES=false');
  console.log('  NEXT_PUBLIC_FEATURE_SMART_MATCHING=false');
  console.log('');
  console.log('  # Phase 3 Features');
  console.log('  NEXT_PUBLIC_FEATURE_GROUPS=false');
  console.log('  NEXT_PUBLIC_FEATURE_EVENTS=false');
  console.log('');
  console.log('  # Phase 5 Features');
  console.log('  NEXT_PUBLIC_FEATURE_PWA=false');
  console.log('');
}

// Main execution
async function main() {
  console.log(`${colors.bold}${colors.cyan}`);
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   Care Collective Setup Verification       ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log(colors.reset);
  
  await verifyEnvironmentVariables();
  await verifyProjectStructure();
  await checkDependencies();
  await verifySupabaseConnection();
  await verifyDatabaseSchema();
  await suggestNextSteps();
  
  process.exit(hasErrors ? 1 : 0);
}

// Run the verification
main().catch((err) => {
  console.error('Verification script failed:', err);
  process.exit(1);
});