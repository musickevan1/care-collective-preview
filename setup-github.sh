#!/bin/bash

# GitHub Repository Setup Script for Care Collective Preview
# This script helps set up the GitHub remote and push the code

echo "🚀 Care Collective Preview - GitHub Setup"
echo "========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in the care-collective-preview directory"
    exit 1
fi

# Check current git status
echo "📊 Current Git Status:"
git status --short
echo ""

# Check if remote already exists
if git remote get-url origin &>/dev/null; then
    echo "⚠️  Remote 'origin' already exists:"
    git remote get-url origin
    echo ""
    read -p "Do you want to remove it and add a new one? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git remote remove origin
        echo "✅ Removed existing origin"
    else
        echo "Keeping existing remote. Exiting."
        exit 0
    fi
fi

echo "📝 Please provide your GitHub username:"
read -p "GitHub username: " github_username

if [ -z "$github_username" ]; then
    echo "❌ GitHub username is required"
    exit 1
fi

# Set up the remote
echo ""
echo "🔗 Setting up GitHub remote..."
git remote add origin "https://github.com/${github_username}/care-collective-preview.git"
echo "✅ Remote added: https://github.com/${github_username}/care-collective-preview.git"

# Change branch name to main (GitHub default)
echo ""
echo "🔄 Renaming branch to 'main'..."
git branch -M main

echo ""
echo "📋 Next Steps:"
echo "============="
echo ""
echo "1. Create the repository on GitHub:"
echo "   • Go to: https://github.com/new"
echo "   • Repository name: care-collective-preview"
echo "   • Description: Community mutual aid platform - Enhanced preview with status tracking"
echo "   • Set as: Public or Private (your choice)"
echo "   • DO NOT initialize with README, .gitignore, or license"
echo "   • Click 'Create repository'"
echo ""
echo "2. Push your code:"
echo "   git push -u origin main"
echo ""
echo "3. Apply database migration in Supabase:"
echo "   • Go to: https://supabase.com/dashboard/project/fagwisxdmfyyagzihnvh/sql/new"
echo "   • Run: supabase/migrations/20250811082915_add_request_status_tracking.sql"
echo ""
echo "4. Deploy to Vercel:"
echo "   • Go to: https://vercel.com/new"
echo "   • Import the GitHub repository"
echo "   • Add environment variables (see DEPLOYMENT_CHECKLIST.md)"
echo ""
echo "Ready to push? Run: git push -u origin main"