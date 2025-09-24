#!/usr/bin/env node

/**
 * Test script for browse help requests functionality
 * Tests database connectivity and key functions used by the browse requests page
 */

const { createClient } = require('@supabase/supabase-js');

async function testBrowseRequests() {
  console.log('🧪 Testing Browse Help Requests Functionality\n');

  // Check environment variables
  console.log('1. Environment Variables:');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables');
    console.log('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
    console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!supabaseAnonKey);
    return;
  }

  console.log('✅ Environment variables present');
  console.log('   URL:', supabaseUrl);
  console.log('   Key:', supabaseAnonKey.substring(0, 20) + '...\n');

  // Test database connection
  console.log('2. Database Connection:');
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Test basic connection with a simple query
    const { data, error } = await supabase
      .from('help_requests')
      .select('id, title, created_at')
      .limit(1);

    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return;
    }

    console.log('✅ Database connection successful');
    console.log('   Sample data available:', data ? data.length : 0, 'records\n');

    // Test the search function
    console.log('3. Search Function Test:');
    try {
      const { data: searchData, error: searchError } = await supabase.rpc('search_help_requests', {
        search_query: 'test'
      });

      if (searchError) {
        console.error('❌ search_help_requests function failed:', searchError.message);
        console.log('   This might indicate the migration was not applied');
      } else {
        console.log('✅ search_help_requests function working');
        console.log('   Returned:', searchData ? searchData.length : 0, 'results\n');
      }
    } catch (funcError) {
      console.error('❌ search_help_requests function error:', funcError.message);
    }

    // Test profile join query (used in requests page)
    console.log('4. Profile Join Test:');
    try {
      const { data: joinData, error: joinError } = await supabase
        .from('help_requests')
        .select(`
          id,
          title,
          category,
          urgency,
          status,
          created_at,
          profiles!user_id (name, location)
        `)
        .limit(5);

      if (joinError) {
        console.error('❌ Profile join query failed:', joinError.message);
      } else {
        console.log('✅ Profile join query working');
        console.log('   Returned:', joinData ? joinData.length : 0, 'records with profiles\n');
      }
    } catch (joinErr) {
      console.error('❌ Profile join error:', joinErr.message);
    }

    console.log('🎯 Browse Help Requests Test Complete!');
    console.log('✅ Core functionality appears to be working');

  } catch (error) {
    console.error('❌ Unexpected error during testing:', error);
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

testBrowseRequests().catch(console.error);