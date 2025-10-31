#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Create admin client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createMaureenAdmin() {
  console.log('Creating Maureen\'s admin account...');

  const email = process.env.ADMIN_EMAIL || 'maureen.templeman@demo.carecollective.org';
  const password = process.env.ADMIN_PASSWORD || process.argv[2];

  if (!password) {
    console.error('❌ Password required. Provide via:');
    console.error('   Environment variable: ADMIN_PASSWORD');
    console.error('   Command line: node scripts/development/create-maureen-admin.js <password>');
    process.exit(1);
  }
  
  try {
    // 1. Create auth user
    console.log('Creating auth user...');
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        name: 'Maureen Templeman'
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      return;
    }

    console.log('Auth user created:', authUser.user.id);

    // 2. Create profile with admin privileges
    console.log('Creating admin profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authUser.user.id,
        name: 'Maureen Templeman',
        location: 'Springfield, MO',
        is_admin: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      return;
    }

    console.log('Profile created:', profile);

    console.log('\n✅ SUCCESS! Maureen\'s admin account created:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`User ID: ${authUser.user.id}`);
    console.log(`Admin: ${profile.is_admin}`);

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the script
createMaureenAdmin();