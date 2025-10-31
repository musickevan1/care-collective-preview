#!/usr/bin/env node
/**
 * Test Supabase Connection and Tables
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
const fs = require('fs');
const path = require('path');

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

loadEnv();

async function testConnection() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceRole) {
    console.error('Missing Supabase credentials');
    return;
  }
  
  console.log('🔌 Testing Supabase Connection...');
  console.log('URL:', supabaseUrl);
  console.log('');
  
  const supabase = createClient(supabaseUrl, supabaseServiceRole, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  // Test 1: Check if we can connect
  console.log('1. Testing basic connection...');
  const { data: healthCheck, error: healthError } = await supabase
    .from('profiles')
    .select('count')
    .limit(1)
    .single();
  
  if (healthError) {
    console.log('❌ Connection test failed:', healthError.message);
    console.log('   Error code:', healthError.code);
    console.log('   Error details:', healthError.details);
    console.log('');
  } else {
    console.log('✅ Connection successful');
    console.log('');
  }
  
  // Test 2: List all tables (using SQL)
  console.log('2. Checking available tables...');
  const { data: tables, error: tablesError } = await supabase
    .rpc('get_tables', {}, { get: true })
    .select('*');
  
  if (tablesError) {
    // Try alternative approach
    console.log('   Using alternative method...');
    
    // Try to query each table directly
    const tablesToCheck = ['profiles', 'help_requests', 'messages'];
    
    for (const table of tablesToCheck) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`   ❌ Table '${table}': ${error.message}`);
      } else {
        console.log(`   ✅ Table '${table}': Found (${count || 0} rows)`);
      }
    }
  } else {
    console.log('   Tables found:', tables);
  }
  
  console.log('');
  
  // Test 3: Check RLS policies
  console.log('3. Testing with anon key (RLS check)...');
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const anonClient = createClient(supabaseUrl, anonKey);
  
  const { data: profilesData, error: profilesError } = await anonClient
    .from('profiles')
    .select('*')
    .limit(1);
  
  if (profilesError) {
    console.log('   ❌ Anon access failed:', profilesError.message);
  } else {
    console.log('   ✅ Anon access working (RLS policies active)');
  }
  
  console.log('');
  console.log('📊 Summary:');
  console.log('   If tables show as not found, you may need to:');
  console.log('   1. Run the init-database.sql script in Supabase SQL Editor');
  console.log('   2. Wait a moment for schema cache to update');
  console.log('   3. Check if tables are in the correct schema (public)');
}

testConnection().catch(console.error);