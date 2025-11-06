#!/usr/bin/env node

/**
 * Diagnostic script to identify messaging system issues for beta users
 * Run with: node scripts/diagnose-beta-messaging.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load production environment
const prodEnvPath = path.join(__dirname, '..', '.env.prod');
const prodEnvContent = fs.readFileSync(prodEnvPath, 'utf8');

const prodEnv = {};
prodEnvContent.split('\n').forEach(line => {
  line = line.trim();
  if (line && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      prodEnv[key] = valueParts.join('=').replace(/^["']|["']$/g, '');
    }
  }
});

const supabase = createClient(prodEnv.NEXT_PUBLIC_SUPABASE_URL, prodEnv.SUPABASE_SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function diagnoseBetaMessaging() {
  console.log('🔍 CARE Collective Beta Messaging Diagnostics\n');
  console.log('=' .repeat(60));

  // 1. Check beta user verification status
  console.log('\n📋 1. BETA USER VERIFICATION STATUS');
  console.log('-'.repeat(60));

  const { data: betaUsers, error: userError } = await supabase
    .from('profiles')
    .select('id, name, email, verification_status, role, created_at')
    .or('role.eq.beta_tester,email.ilike.%test%')
    .order('created_at', { ascending: false });

  if (userError) {
    console.error('❌ Error fetching beta users:', userError.message);
  } else {
    console.log(`Found ${betaUsers.length} beta/test users:\n`);
    betaUsers.forEach(user => {
      const status = user.verification_status === 'approved' ? '✅' : '❌';
      console.log(`${status} ${user.name || 'No name'}`);
      console.log(`   Email: ${user.email || 'No email'}`);
      console.log(`   Status: ${user.verification_status || 'NOT SET'}`);
      console.log(`   Role: ${user.role || 'user'}`);
      console.log(`   ID: ${user.id}`);
      console.log('');
    });
  }

  // 2. Check user restrictions
  console.log('\n🚫 2. USER RESTRICTIONS');
  console.log('-'.repeat(60));

  const { data: restrictions, error: restrictionError } = await supabase
    .from('user_restrictions')
    .select('*')
    .neq('restriction_level', 'none');

  if (restrictionError) {
    console.error('❌ Error fetching restrictions:', restrictionError.message);
  } else if (restrictions.length === 0) {
    console.log('✅ No users have restrictions (good!)');
  } else {
    console.log(`⚠️ Found ${restrictions.length} users with restrictions:\n`);
    restrictions.forEach(r => {
      console.log(`User ID: ${r.user_id}`);
      console.log(`  Level: ${r.restriction_level}`);
      console.log(`  Can send messages: ${r.can_send_messages}`);
      console.log(`  Daily limit: ${r.message_limit_per_day}`);
      console.log(`  Reason: ${r.restriction_reason || 'Not specified'}`);
      console.log('');
    });
  }

  // 3. Check conversations status
  console.log('\n💬 3. CONVERSATION STATUS (V2)');
  console.log('-'.repeat(60));

  const { data: conversations, error: convError } = await supabase
    .from('conversations_v2')
    .select(`
      id,
      status,
      created_at,
      help_request_id,
      requester:profiles!conversations_v2_requester_id_fkey(name, email),
      helper:profiles!conversations_v2_helper_id_fkey(name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(20);

  if (convError) {
    console.error('❌ Error fetching conversations:', convError.message);
  } else {
    console.log(`Found ${conversations.length} recent conversations:\n`);
    conversations.forEach(conv => {
      const statusIcon = conv.status === 'active' ? '✅' :
                         conv.status === 'pending' ? '⏳' :
                         conv.status === 'archived' ? '📦' : '❓';
      console.log(`${statusIcon} Conversation ${conv.id.substring(0, 8)}...`);
      console.log(`   Status: ${conv.status}`);
      console.log(`   Requester: ${conv.requester?.name || 'Unknown'} (${conv.requester?.email || 'no email'})`);
      console.log(`   Helper: ${conv.helper?.name || 'Unknown'} (${conv.helper?.email || 'no email'})`);
      console.log(`   Created: ${new Date(conv.created_at).toLocaleString()}`);
      console.log('');
    });
  }

  // 4. Check messages_v2 table structure
  console.log('\n📨 4. MESSAGES TABLE CHECK (V2)');
  console.log('-'.repeat(60));

  const { count: messageCount, error: msgCountError } = await supabase
    .from('messages_v2')
    .select('*', { count: 'exact', head: true });

  if (msgCountError) {
    console.error('❌ Error checking messages table:', msgCountError.message);
  } else {
    console.log(`✅ messages_v2 table exists with ${messageCount} messages`);
  }

  // 5. Check for RPC functions existence
  console.log('\n⚙️ 5. RPC FUNCTION VERIFICATION');
  console.log('-'.repeat(60));

  const rpcFunctions = [
    'send_message_v2',
    'get_user_restrictions',
    'mark_messages_read',
    'get_unread_message_count'
  ];

  for (const funcName of rpcFunctions) {
    try {
      // Try calling with dummy data to see if function exists
      const { error } = await supabase.rpc(funcName, {});

      if (error) {
        if (error.message.includes('function') && error.message.includes('does not exist')) {
          console.log(`❌ ${funcName}: MISSING`);
        } else {
          // Function exists but parameters wrong (expected)
          console.log(`✅ ${funcName}: EXISTS`);
        }
      } else {
        console.log(`✅ ${funcName}: EXISTS`);
      }
    } catch (err) {
      console.log(`❓ ${funcName}: Could not verify (${err.message})`);
    }
  }

  // 6. Check rate limiter storage
  console.log('\n⏱️ 6. RATE LIMITING DATA');
  console.log('-'.repeat(60));

  // Rate limiting is in-memory, so we can only check if table exists
  console.log('ℹ️ Rate limiting uses in-memory storage (cannot query directly)');
  console.log('   Check Vercel logs for rate limit hits: [RATE_LIMIT_BLOCKED]');

  // 7. Sample a recent message send attempt
  console.log('\n🔬 7. RECENT MESSAGE ACTIVITY');
  console.log('-'.repeat(60));

  const { data: recentMessages, error: recentError } = await supabase
    .from('messages_v2')
    .select(`
      id,
      content,
      created_at,
      sender:profiles!messages_v2_sender_id_fkey(name, email),
      conversation_id
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  if (recentError) {
    console.error('❌ Error fetching recent messages:', recentError.message);
  } else {
    console.log(`Found ${recentMessages.length} recent messages:\n`);
    recentMessages.forEach(msg => {
      console.log(`✉️ Message ${msg.id.substring(0, 8)}...`);
      console.log(`   From: ${msg.sender?.name || 'Unknown'}`);
      console.log(`   Sent: ${new Date(msg.created_at).toLocaleString()}`);
      console.log(`   Preview: ${msg.content.substring(0, 50)}...`);
      console.log('');
    });
  }

  // 8. Provide recommendations
  console.log('\n💡 RECOMMENDATIONS');
  console.log('='.repeat(60));

  const issues = [];

  if (betaUsers?.some(u => u.verification_status !== 'approved')) {
    issues.push('⚠️ Some beta users are not approved - they cannot start conversations');
  }

  if (restrictions && restrictions.length > 0) {
    issues.push('⚠️ Some users have messaging restrictions - check if these are beta testers');
  }

  if (conversations?.some(c => c.status === 'pending')) {
    issues.push('ℹ️ Some conversations are still pending - users cannot message until accepted');
  }

  if (issues.length === 0) {
    console.log('✅ No obvious configuration issues found!');
    console.log('\nIf messaging still fails, check:');
    console.log('1. Vercel logs for [MESSAGE_SEND_DEBUG] entries');
    console.log('2. Network tab in browser for API request details');
    console.log('3. RPC function implementations in Supabase SQL editor');
  } else {
    console.log('Found the following issues:\n');
    issues.forEach(issue => console.log(issue));
    console.log('\nRun fix scripts to resolve these issues.');
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Diagnostic complete\n');
}

diagnoseBetaMessaging().catch(error => {
  console.error('Fatal error running diagnostics:', error);
  process.exit(1);
});
