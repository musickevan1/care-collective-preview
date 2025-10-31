#!/usr/bin/env node
/**
 * Apply RLS policy fix by executing SQL statements one by one
 * This script reads the migration file and applies each statement individually
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

console.log('🔧 Connecting to Supabase...');

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyRLSFix() {
  try {
    console.log('📖 Reading RLS fix migration...');
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250906_revert_rls_for_demo.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📊 Migration script size:', migrationSQL.length, 'characters');
    
    // For now, let's just print the SQL that needs to be executed
    console.log('\n🔍 SQL to be executed:');
    console.log('=====================================');
    console.log(migrationSQL);
    console.log('=====================================\n');
    
    console.log('📝 Please copy and paste the above SQL into your Supabase SQL Editor at:');
    console.log(`   https://supabase.com/dashboard/project/kecureoyekeqhrxkmjuh/sql`);
    console.log('');
    
    // Test if we can at least query the current policies
    console.log('🔍 Checking current RLS policies...');
    
    const { data: policies, error } = await supabase
      .from('pg_policies')
      .select('schemaname, tablename, policyname, permissive, roles, cmd, qual')
      .eq('tablename', 'help_requests')
      .limit(10);
      
    if (error) {
      console.log('   ❌ Could not query policies directly:', error.message);
    } else if (policies && policies.length > 0) {
      console.log('   ✅ Current help_requests policies:');
      policies.forEach(policy => {
        console.log(`     - ${policy.policyname} (${policy.cmd})`);
      });
    } else {
      console.log('   ℹ️  No policies found or access denied');
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

applyRLSFix().catch(console.error);