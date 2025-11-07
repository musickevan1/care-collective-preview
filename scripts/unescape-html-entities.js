#!/usr/bin/env node

/**
 * Script to unescape HTML entities in existing database records
 * Fixes the &#x27; display issue by converting HTML entities back to regular characters
 */

const { createClient } = require('@supabase/supabase-js');

// HTML entity decoder
function decodeHTMLEntities(text) {
  if (!text) return text;

  const entities = {
    '&#x27;': "'",
    '&#39;': "'",
    '&apos;': "'",
    '&quot;': '"',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
  };

  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replaceAll(entity, char);
  }

  return decoded;
}

async function unescapeHelpRequests() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔍 Fetching all help requests...');

  // Fetch all help requests
  const { data: requests, error: fetchError } = await supabase
    .from('help_requests')
    .select('id, title, description, location_override');

  if (fetchError) {
    console.error('❌ Error fetching help requests:', fetchError.message);
    process.exit(1);
  }

  console.log(`📊 Found ${requests.length} help requests`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const request of requests) {
    const updates = {};
    let hasChanges = false;

    // Check and decode title
    if (request.title && request.title.includes('&#')) {
      const decoded = decodeHTMLEntities(request.title);
      if (decoded !== request.title) {
        updates.title = decoded;
        hasChanges = true;
        console.log(`  📝 Title: "${request.title}" → "${decoded}"`);
      }
    }

    // Check and decode description
    if (request.description && request.description.includes('&#')) {
      const decoded = decodeHTMLEntities(request.description);
      if (decoded !== request.description) {
        updates.description = decoded;
        hasChanges = true;
        console.log(`  📝 Description: "${request.description.substring(0, 50)}..." → "${decoded.substring(0, 50)}..."`);
      }
    }

    // Check and decode location_override
    if (request.location_override && request.location_override.includes('&#')) {
      const decoded = decodeHTMLEntities(request.location_override);
      if (decoded !== request.location_override) {
        updates.location_override = decoded;
        hasChanges = true;
        console.log(`  📝 Location: "${request.location_override}" → "${decoded}"`);
      }
    }

    if (hasChanges) {
      console.log(`🔧 Updating request ${request.id}...`);
      const { error: updateError } = await supabase
        .from('help_requests')
        .update(updates)
        .eq('id', request.id);

      if (updateError) {
        console.error(`❌ Error updating request ${request.id}:`, updateError.message);
      } else {
        updatedCount++;
        console.log(`✅ Updated request ${request.id}`);
      }
    } else {
      skippedCount++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`  ✅ Updated: ${updatedCount} requests`);
  console.log(`  ⏭️  Skipped: ${skippedCount} requests (no HTML entities found)`);
  console.log(`  📝 Total: ${requests.length} requests processed`);
}

async function unescapeProfiles() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('\n🔍 Fetching all profiles...');

  // Fetch all profiles
  const { data: profiles, error: fetchError } = await supabase
    .from('profiles')
    .select('id, name, location');

  if (fetchError) {
    console.error('❌ Error fetching profiles:', fetchError.message);
    return;
  }

  console.log(`📊 Found ${profiles.length} profiles`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const profile of profiles) {
    const updates = {};
    let hasChanges = false;

    // Check and decode name
    if (profile.name && profile.name.includes('&#')) {
      const decoded = decodeHTMLEntities(profile.name);
      if (decoded !== profile.name) {
        updates.name = decoded;
        hasChanges = true;
        console.log(`  📝 Name: "${profile.name}" → "${decoded}"`);
      }
    }

    // Check and decode location
    if (profile.location && profile.location.includes('&#')) {
      const decoded = decodeHTMLEntities(profile.location);
      if (decoded !== profile.location) {
        updates.location = decoded;
        hasChanges = true;
        console.log(`  📝 Location: "${profile.location}" → "${decoded}"`);
      }
    }

    if (hasChanges) {
      console.log(`🔧 Updating profile ${profile.id}...`);
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id);

      if (updateError) {
        console.error(`❌ Error updating profile ${profile.id}:`, updateError.message);
      } else {
        updatedCount++;
        console.log(`✅ Updated profile ${profile.id}`);
      }
    } else {
      skippedCount++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`  ✅ Updated: ${updatedCount} profiles`);
  console.log(`  ⏭️  Skipped: ${skippedCount} profiles (no HTML entities found)`);
  console.log(`  📝 Total: ${profiles.length} profiles processed`);
}

async function main() {
  console.log('🚀 Starting HTML entity unescape process...\n');

  try {
    await unescapeHelpRequests();
    await unescapeProfiles();

    console.log('\n✅ HTML entity unescape process completed successfully!');
  } catch (error) {
    console.error('\n❌ Error during unescape process:', error.message);
    process.exit(1);
  }
}

main();
