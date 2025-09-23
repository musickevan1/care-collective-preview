#!/usr/bin/env node

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
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

console.log('🔧 Connecting to Supabase...');
console.log('📍 URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigrations() {
  try {
    console.log('📖 Reading migration script...');
    const migrationPath = path.join(__dirname, 'apply-all-migrations.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📊 Migration script size:', migrationSQL.length, 'characters');
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log('🔄 Executing', statements.length, 'SQL statements...');
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length < 10) continue; // Skip very short statements
      
      console.log(`📝 Executing statement ${i + 1}/${statements.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', { 
        sql: statement + ';' 
      });
      
      if (error) {
        console.error(`❌ Error in statement ${i + 1}:`, error);
        // Continue with other statements
      } else {
        console.log(`✅ Statement ${i + 1} completed`);
      }
    }
    
    console.log('🎉 Migration process completed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

async function seedDemoData() {
  try {
    console.log('🌱 Reading seed script...');
    const seedPath = path.join(__dirname, 'seed-demo.sql');
    const seedSQL = fs.readFileSync(seedPath, 'utf8');
    
    console.log('📊 Seed script size:', seedSQL.length, 'characters');
    
    // Split the seed script into individual statements
    const statements = seedSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log('🔄 Executing', statements.length, 'seed statements...');
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length < 10) continue; // Skip very short statements
      
      console.log(`🌱 Executing seed statement ${i + 1}/${statements.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', { 
        sql: statement + ';' 
      });
      
      if (error) {
        console.error(`❌ Error in seed statement ${i + 1}:`, error);
        // Continue with other statements
      } else {
        console.log(`✅ Seed statement ${i + 1} completed`);
      }
    }
    
    console.log('🎉 Demo data seeding completed!');
    
    // Check the demo summary
    console.log('📊 Checking demo data summary...');
    const { data, error } = await supabase
      .from('demo_summary')
      .select('*')
      .single();
    
    if (error) {
      console.error('❌ Could not fetch demo summary:', error);
    } else {
      console.log('✅ Demo data summary:', data);
    }
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

async function main() {
  const command = process.argv[2];
  
  if (command === 'migrate') {
    await runMigrations();
  } else if (command === 'seed') {
    await seedDemoData();
  } else if (command === 'all') {
    await runMigrations();
    await seedDemoData();
  } else {
    console.log('Usage: node run-migrations.js [migrate|seed|all]');
    console.log('  migrate - Run database migrations');
    console.log('  seed    - Seed demo data');
    console.log('  all     - Run migrations and seed data');
  }
}

main().catch(console.error);