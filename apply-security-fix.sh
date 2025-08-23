#!/bin/bash

# Script to apply the security fix for demo_summary view
# This can be run once Supabase is running

echo "Applying security fix for demo_summary view..."

# Check if we can connect to the database
if psql "postgresql://postgres:postgres@localhost:54322/postgres" -c "SELECT 1" > /dev/null 2>&1; then
    echo "Database is accessible. Applying fix..."
    psql "postgresql://postgres:postgres@localhost:54322/postgres" -f scripts/apply-security-fix.sql
    echo "Security fix applied successfully!"
else
    echo "Database is not accessible. Please ensure Supabase is running."
    echo "You can start Supabase with: supabase start"
    echo ""
    echo "Alternatively, you can apply the fix manually by running:"
    echo "  1. Open Supabase SQL Editor"
    echo "  2. Copy and run the contents of scripts/apply-security-fix.sql"
    exit 1
fi