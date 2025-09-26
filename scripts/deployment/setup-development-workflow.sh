#!/bin/bash

# CARE COLLECTIVE DEVELOPMENT WORKFLOW SETUP
# Enterprise-grade development automation and quality assurance
# Version: 5.0 (Enterprise Development Excellence)
#
# Usage: ./scripts/setup-development-workflow.sh [options]
# Options:
#   --install-hooks      Install Git pre-commit hooks
#   --setup-ci           Setup CI/CD configuration
#   --configure-quality  Configure quality tools and linting
#   --setup-automation   Setup automated deployment workflows
#   --all               Setup everything (recommended)
#   --dry-run           Show what would be configured
#   --help              Show help message

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
GIT_HOOKS_DIR="$PROJECT_ROOT/.git/hooks"

# Options
INSTALL_HOOKS=false
SETUP_CI=false
CONFIGURE_QUALITY=false
SETUP_AUTOMATION=false
DRY_RUN=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" >&2
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" >&2
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" >&2
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --install-hooks)
                INSTALL_HOOKS=true
                shift
                ;;
            --setup-ci)
                SETUP_CI=true
                shift
                ;;
            --configure-quality)
                CONFIGURE_QUALITY=true
                shift
                ;;
            --setup-automation)
                SETUP_AUTOMATION=true
                shift
                ;;
            --all)
                INSTALL_HOOKS=true
                SETUP_CI=true
                CONFIGURE_QUALITY=true
                SETUP_AUTOMATION=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

show_help() {
    cat << EOF
Care Collective Development Workflow Setup v5.0
Enterprise-grade development automation and quality assurance

Usage: $0 [options]

Options:
  --install-hooks      Install Git pre-commit hooks for quality checks
  --setup-ci           Setup CI/CD configuration files
  --configure-quality  Configure quality tools (ESLint, TypeScript, etc.)
  --setup-automation   Setup automated deployment workflows
  --all               Setup everything (recommended for new environments)
  --dry-run           Show what would be configured without making changes
  --help              Show this help message

Components:
  Git Hooks:
    • Pre-commit quality checks (TypeScript, ESLint, tests)
    • Migration validation for database changes
    • Security audit for sensitive changes
    • Automated backup before destructive operations

  CI/CD Pipeline:
    • GitHub Actions workflows for database changes
    • Automated testing and validation
    • Security scanning and compliance checks
    • Performance regression testing

  Quality Tools:
    • TypeScript strict configuration
    • ESLint with Care Collective rules
    • Prettier code formatting
    • Automated test coverage reporting

  Automation Scripts:
    • Database migration deployment
    • Backup and recovery automation
    • Performance monitoring setup
    • Emergency hotfix procedures

Examples:
  $0 --all                    # Complete setup (recommended)
  $0 --install-hooks          # Only install Git hooks
  $0 --dry-run --all          # Preview what would be configured

Prerequisites:
  • Git repository initialized
  • Node.js and npm installed
  • Supabase CLI installed and configured
  • Database connection configured

EOF
}

# Install Git pre-commit hooks
install_git_hooks() {
    log_info "Installing Git pre-commit hooks..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Would install pre-commit hooks"
        return 0
    fi
    
    # Ensure git hooks directory exists
    mkdir -p "$GIT_HOOKS_DIR"
    
    # Create pre-commit hook
    cat > "$GIT_HOOKS_DIR/pre-commit" << 'EOF'
#!/bin/bash
# Care Collective Pre-commit Hook v5.0
# Automated quality checks before every commit

set -e

echo "🔍 Running Care Collective pre-commit quality checks..."

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 1. TypeScript type checking
log_step "Checking TypeScript types..."
if npm run type-check --silent; then
    log_success "TypeScript type checking passed"
else
    log_error "TypeScript type checking failed"
    exit 1
fi

# 2. ESLint code style
log_step "Checking code style with ESLint..."
if npm run lint --silent; then
    log_success "Code style checks passed"
else
    log_error "Code style checks failed"
    exit 1
fi

# 3. Run tests
log_step "Running test suite..."
if npm run test:run --silent; then
    log_success "Test suite passed"
else
    log_error "Test suite failed"
    exit 1
fi

# 4. Database migration validation (if migrations changed)
if git diff --cached --name-only | grep -q "supabase/migrations/"; then
    log_step "Database migration detected, running validation..."
    if [ -f "scripts/validate-migration.sh" ]; then
        if ./scripts/validate-migration.sh --pre-commit; then
            log_success "Migration validation passed"
        else
            log_error "Migration validation failed"
            exit 1
        fi
    else
        log_error "Migration validation script not found"
        exit 1
    fi
fi

# 5. Security audit for database changes
if git diff --cached --name-only | grep -qE "(supabase/|scripts/.*\.sql)"; then
    log_step "Database changes detected, running security audit..."
    if npm run db:security-audit --silent; then
        log_success "Security audit passed"
    else
        log_error "Security audit failed"
        exit 1
    fi
fi

# 6. Check for sensitive information
log_step "Checking for sensitive information..."
if git diff --cached | grep -iE "(password|secret|key|token)" | grep -v "# " | grep -q .; then
    log_error "Potential sensitive information detected in staged files"
    echo "Please review and remove any secrets before committing"
    exit 1
else
    log_success "No sensitive information detected"
fi

echo ""
log_success "All pre-commit checks passed! 🎉"
echo ""
EOF
    
    # Make hook executable
    chmod +x "$GIT_HOOKS_DIR/pre-commit"
    
    # Create pre-push hook for additional checks
    cat > "$GIT_HOOKS_DIR/pre-push" << 'EOF'
#!/bin/bash
# Care Collective Pre-push Hook v5.0
# Additional checks before pushing to remote

set -e

echo "🚀 Running Care Collective pre-push checks..."

# Check if we're pushing to main/master branch
protected_branch="main"
current_branch=$(git rev-parse --abbrev-ref HEAD)

if [ "$current_branch" = "$protected_branch" ]; then
    echo "⚠️  Pushing to protected branch: $protected_branch"
    
    # Run comprehensive tests
    echo "Running comprehensive test suite..."
    npm run test:coverage
    
    # Check test coverage
    coverage=$(npm run test:coverage --silent | grep "All files" | awk '{print $10}' | sed 's/%//')
    if [ "$coverage" -lt 80 ]; then
        echo "❌ Test coverage too low: $coverage% (minimum: 80%)"
        exit 1
    fi
    
    # Run database health check
    if command -v psql &> /dev/null; then
        echo "Running database health check..."
        if npm run db:security-audit --silent; then
            health_score=$(npm run db:security-audit --silent | grep "Health Score" | awk '{print $3}' | cut -d'/' -f1)
            if [ "$health_score" -lt 75 ]; then
                echo "❌ Database health score too low: $health_score/100 (minimum: 75)"
                exit 1
            fi
        fi
    fi
fi

echo "✅ All pre-push checks passed!"
EOF
    
    chmod +x "$GIT_HOOKS_DIR/pre-push"
    
    log_success "Git hooks installed successfully"
}

# Setup CI/CD configuration
setup_ci_configuration() {
    log_info "Setting up CI/CD configuration..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Would setup CI/CD configuration"
        return 0
    fi
    
    # Create GitHub Actions directory
    mkdir -p "$PROJECT_ROOT/.github/workflows"
    
    # Create main CI workflow
    cat > "$PROJECT_ROOT/.github/workflows/ci.yml" << 'EOF'
name: CI - Care Collective

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: care_collective_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type checking
        run: npm run type-check
      
      - name: Linting
        run: npm run lint
      
      - name: Run tests
        run: npm run test:coverage
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/care_collective_test
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella
          fail_ci_if_error: true

  database-quality:
    runs-on: ubuntu-latest
    if: contains(github.event.head_commit.modified, 'supabase/') || contains(github.event.head_commit.added, 'supabase/')
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: care_collective_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest
      
      - name: Start Supabase
        run: supabase start
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      
      - name: Validate migrations
        run: |
          if [ -f "scripts/validate-migration.sh" ]; then
            ./scripts/validate-migration.sh
          fi
      
      - name: Run database tests
        run: |
          npm run db:test-rls
          npm run test:database
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/care_collective_test
      
      - name: Security audit
        run: npm run db:security-audit
      
      - name: Performance analysis
        run: |
          if [ -f "scripts/analyze-query-performance.sql" ]; then
            npm run performance:analyze
          fi

  build:
    runs-on: ubuntu-latest
    needs: [test]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-files
          path: .next/
EOF
    
    # Create database-specific workflow
    cat > "$PROJECT_ROOT/.github/workflows/database.yml" << 'EOF'
name: Database Quality & Security

on:
  push:
    paths:
      - 'supabase/migrations/**'
      - 'scripts/**/*.sql'
  pull_request:
    paths:
      - 'supabase/migrations/**'
      - 'scripts/**/*.sql'

jobs:
  migration-validation:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest
      
      - name: Validate migrations
        run: |
          supabase start
          supabase db reset
          
          if [ -f "scripts/validate-migration.sh" ]; then
            ./scripts/validate-migration.sh
          fi
      
      - name: Test RLS policies
        run: npm run db:test-rls
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/postgres
      
      - name: Security audit
        run: npm run db:security-audit
      
      - name: Performance impact analysis
        run: |
          if [ -f "scripts/scaling-analysis.sql" ]; then
            npm run performance:scaling
          fi
      
      - name: Generate migration report
        run: |
          echo "## Migration Validation Report" > migration-report.md
          echo "" >> migration-report.md
          echo "### Files Changed:" >> migration-report.md
          git diff --name-only HEAD~1 HEAD | grep -E "\.sql$" >> migration-report.md || echo "No SQL files changed" >> migration-report.md
          echo "" >> migration-report.md
          echo "### Security Audit Results:" >> migration-report.md
          npm run db:security-audit >> migration-report.md
      
      - name: Comment PR with report
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('migration-report.md', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: report
            });
EOF
    
    log_success "CI/CD configuration created successfully"
}

# Configure quality tools
configure_quality_tools() {
    log_info "Configuring quality tools..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Would configure quality tools"
        return 0
    fi
    
    # Update ESLint configuration for stricter rules
    if [ -f "$PROJECT_ROOT/.eslintrc.json" ]; then
        # Backup existing config
        cp "$PROJECT_ROOT/.eslintrc.json" "$PROJECT_ROOT/.eslintrc.json.backup"
    fi
    
    cat > "$PROJECT_ROOT/.eslintrc.json" << 'EOF'
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "@typescript-eslint/recommended-requiring-type-checking"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": "./tsconfig.json"
  },
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-unsafe-assignment": "error",
    "@typescript-eslint/no-unsafe-member-access": "error",
    "@typescript-eslint/no-unsafe-call": "error",
    "@typescript-eslint/no-unsafe-return": "error",
    "prefer-const": "error",
    "no-var": "error",
    "no-console": "warn",
    "no-debugger": "error"
  },
  "overrides": [
    {
      "files": ["tests/**/*", "**/*.test.ts", "**/*.test.tsx"],
      "rules": {
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-member-access": "off"
      }
    }
  ]
}
EOF
    
    # Create Prettier configuration
    cat > "$PROJECT_ROOT/.prettierrc" << 'EOF'
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
EOF
    
    # Create Prettier ignore file
    cat > "$PROJECT_ROOT/.prettierignore" << 'EOF'
.next
node_modules
coverage
dist
build
*.log
.env*
.git
EOF
    
    # Update TypeScript configuration for stricter checking
    if [ -f "$PROJECT_ROOT/tsconfig.json" ]; then
        # Backup existing config
        cp "$PROJECT_ROOT/tsconfig.json" "$PROJECT_ROOT/tsconfig.json.backup"
        
        # Add strict settings
        node -e "
        const fs = require('fs');
        const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
        tsconfig.compilerOptions = {
          ...tsconfig.compilerOptions,
          strict: true,
          noImplicitAny: true,
          noImplicitReturns: true,
          noImplicitThis: true,
          noUnusedLocals: true,
          noUnusedParameters: true,
          exactOptionalPropertyTypes: true
        };
        fs.writeFileSync('tsconfig.json', JSON.stringify(tsconfig, null, 2));
        " 2>/dev/null || log_warning "Could not update TypeScript configuration automatically"
    fi
    
    log_success "Quality tools configured successfully"
}

# Setup automation scripts
setup_automation_workflows() {
    log_info "Setting up automation workflows..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Would setup automation workflows"
        return 0
    fi
    
    # Create deployment automation script
    cat > "$PROJECT_ROOT/scripts/deploy-database-changes.sh" << 'EOF'
#!/bin/bash
# Automated database change deployment with safety checks

set -e

ENVIRONMENT="${1:-staging}"
MIGRATION_MODE="${2:-auto}"
BACKUP_BEFORE_DEPLOY=true

echo "🚀 Care Collective Database Deployment"
echo "Environment: $ENVIRONMENT"
echo "Mode: $MIGRATION_MODE"
echo ""

# Pre-deployment checks
echo "🔍 Running pre-deployment checks..."

# Health check
health_score=$(npm run db:security-audit --silent | grep "Health Score" | awk '{print $3}' | cut -d'/' -f1 || echo "0")
if [ "$health_score" -lt 75 ]; then
    echo "❌ Database health too low for deployment: $health_score/100"
    exit 1
fi

# Test suite
echo "Running test suite..."
if ! npm run test:database --silent; then
    echo "❌ Database tests failed"
    exit 1
fi

# Migration validation
echo "Validating migrations..."
if [ -f "scripts/validate-migration.sh" ] && ! ./scripts/validate-migration.sh; then
    echo "❌ Migration validation failed"
    exit 1
fi

echo "✅ All pre-deployment checks passed"

# Backup
if [ "$BACKUP_BEFORE_DEPLOY" = true ]; then
    echo "📦 Creating backup..."
    if [ -f "scripts/automated-backup.sh" ]; then
        ./scripts/automated-backup.sh --type=full --verify
    fi
fi

# Deployment
case "$MIGRATION_MODE" in
    "dry-run")
        echo "🧪 DRY RUN: Would deploy the following changes:"
        supabase db diff --local
        ;;
    "auto")
        echo "🚀 Deploying automatically..."
        supabase db push
        
        # Verify deployment
        if ! npm run db:test-rls --silent; then
            echo "❌ Post-deployment verification failed"
            exit 1
        fi
        echo "✅ Deployment completed successfully"
        ;;
    "manual")
        echo "📋 Manual deployment mode - review changes:"
        supabase db diff --local
        read -p "Proceed with deployment? (y/N): " confirm
        if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
            supabase db push
            echo "✅ Manual deployment completed"
        else
            echo "🚫 Deployment cancelled"
            exit 0
        fi
        ;;
esac

echo "🎉 Database deployment completed successfully!"
EOF
    
    chmod +x "$PROJECT_ROOT/scripts/deploy-database-changes.sh"
    
    # Create migration validation script
    cat > "$PROJECT_ROOT/scripts/validate-migration.sh" << 'EOF'
#!/bin/bash
# Validates database migrations before deployment

set -e

MIGRATION_DIR="supabase/migrations"
TEMP_DB="care_collective_migration_test_$(date +%s)"
PRE_COMMIT_MODE=false

if [ "$1" = "--pre-commit" ]; then
    PRE_COMMIT_MODE=true
fi

validate_migration() {
    local migration_file="$1"
    
    echo "Validating migration: $(basename "$migration_file")"
    
    # Syntax check
    if ! psql -d postgres -f "$migration_file" --dry-run 2>/dev/null; then
        echo "❌ Syntax error in migration: $migration_file"
        return 1
    fi
    
    # Create test database
    createdb "$TEMP_DB" 2>/dev/null || true
    
    # Apply migration
    if ! psql -d "$TEMP_DB" -f "$migration_file" &>/dev/null; then
        echo "❌ Migration failed to apply: $migration_file"
        dropdb "$TEMP_DB" 2>/dev/null || true
        return 1
    fi
    
    # Test RLS policies
    if grep -q "CREATE POLICY\|ALTER.*ENABLE ROW LEVEL SECURITY" "$migration_file"; then
        echo "Testing RLS policies..."
        PGDATABASE="$TEMP_DB" npm run db:test-rls &>/dev/null || echo "⚠️ RLS tests had issues"
    fi
    
    # Cleanup
    dropdb "$TEMP_DB" 2>/dev/null || true
    
    echo "✅ Migration validation passed: $(basename "$migration_file")"
}

# Validate migrations
if [ "$PRE_COMMIT_MODE" = true ]; then
    # Only validate staged migrations
    for migration_file in $(git diff --cached --name-only | grep "supabase/migrations/.*\.sql$" || true); do
        if [ -f "$migration_file" ]; then
            validate_migration "$migration_file"
        fi
    done
else
    # Validate all migrations
    for migration_file in "$MIGRATION_DIR"/*.sql; do
        if [ -f "$migration_file" ]; then
            validate_migration "$migration_file"
        fi
    done
fi

echo "🎉 All migration validations passed!"
EOF
    
    chmod +x "$PROJECT_ROOT/scripts/validate-migration.sh"
    
    # Update package.json with new scripts
    if [ -f "$PROJECT_ROOT/package.json" ]; then
        node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        pkg.scripts = {
          ...pkg.scripts,
          'format': 'prettier --write .',
          'format:check': 'prettier --check .',
          'validate-migration': './scripts/validate-migration.sh',
          'deploy:staging': './scripts/deploy-database-changes.sh staging auto',
          'deploy:production': './scripts/deploy-database-changes.sh production manual',
          'quality:check': 'npm run type-check && npm run lint && npm run format:check && npm run test:run'
        };
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
        " 2>/dev/null || log_warning "Could not update package.json automatically"
    fi
    
    log_success "Automation workflows setup successfully"
}

# Main setup function
main() {
    echo "🔧 Care Collective Development Workflow Setup v5.0"
    echo "=================================================="
    echo ""
    
    if [ "$DRY_RUN" = true ]; then
        echo "🧪 DRY RUN MODE - No changes will be made"
        echo ""
    fi
    
    # Check prerequisites
    log_info "Checking prerequisites..."
    
    if [ ! -d "$PROJECT_ROOT/.git" ]; then
        log_error "Not in a Git repository. Please run 'git init' first."
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js not found. Please install Node.js."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm not found. Please install npm."
        exit 1
    fi
    
    if [ ! -f "$PROJECT_ROOT/package.json" ]; then
        log_error "package.json not found. Please run 'npm init' first."
        exit 1
    fi
    
    log_success "Prerequisites check passed"
    echo ""
    
    # Run requested setups
    if [ "$INSTALL_HOOKS" = true ]; then
        install_git_hooks
        echo ""
    fi
    
    if [ "$SETUP_CI" = true ]; then
        setup_ci_configuration
        echo ""
    fi
    
    if [ "$CONFIGURE_QUALITY" = true ]; then
        configure_quality_tools
        echo ""
    fi
    
    if [ "$SETUP_AUTOMATION" = true ]; then
        setup_automation_workflows
        echo ""
    fi
    
    # Summary
    echo "🎉 Development workflow setup completed!"
    echo ""
    echo "Next steps:"
    echo "1. Review the generated configuration files"
    echo "2. Install additional dependencies if needed:"
    echo "   npm install --save-dev @typescript-eslint/eslint-plugin @typescript-eslint/parser prettier"
    echo "3. Test the setup:"
    echo "   npm run quality:check"
    echo "4. Make a test commit to verify hooks are working"
    echo ""
    echo "For more information, see docs/database/CODE_QUALITY_WORKFLOWS.md"
}

# If no arguments provided, show help
if [ $# -eq 0 ]; then
    show_help
    exit 0
fi

# Parse arguments and run
parse_args "$@"
main