#!/bin/bash

# Reset Production Database for Beta Testing
# This script loads production credentials and runs the reset

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   🚨 PRODUCTION DATABASE RESET 🚨                              ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "⚠️  This will reset the PRODUCTION database at:"
echo "   https://kecureoyekeqhrxkmjuh.supabase.co"
echo ""
echo "Loading production credentials from .env.prod..."
echo ""

# Load production environment variables
export $(cat .env.prod | grep -v '^#' | xargs)

# Run the reset script
node scripts/reset-database-for-beta.js
