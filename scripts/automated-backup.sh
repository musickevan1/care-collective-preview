#!/bin/bash

# CARE COLLECTIVE AUTOMATED BACKUP SYSTEM
# Enterprise-grade backup automation for disaster recovery
# Version: 5.0 (Enterprise Data Protection)
#
# Usage: ./scripts/automated-backup.sh [options]
# Options:
#   --type=TYPE       Backup type (full|schema|data|config|all) [default: all]
#   --compression     Enable compression [default: enabled]
#   --encryption      Enable encryption [default: enabled]
#   --remote-sync     Sync to remote storage [default: enabled]
#   --verify          Verify backup integrity [default: enabled]
#   --retention=DAYS  Retention period in days [default: 30]
#   --dry-run         Show what would be done without executing
#   --verbose         Enable verbose output
#   --help            Show help message

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_BASE_DIR="${BACKUP_BASE_DIR:-/backup/care-collective}"
PROJECT_ID="${SUPABASE_PROJECT_ID:-kecureoyekeqhrxkmjuh}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE_DIR=$(date +%Y%m%d)

# Default options
BACKUP_TYPE="all"
ENABLE_COMPRESSION=true
ENABLE_ENCRYPTION=true
ENABLE_REMOTE_SYNC=true
ENABLE_VERIFICATION=true
RETENTION_DAYS=30
DRY_RUN=false
VERBOSE=false

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

log_verbose() {
    if [ "$VERBOSE" = true ]; then
        echo -e "${BLUE}[VERBOSE]${NC} $1" >&2
    fi
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --type=*)
                BACKUP_TYPE="${1#*=}"
                shift
                ;;
            --compression)
                ENABLE_COMPRESSION=true
                shift
                ;;
            --no-compression)
                ENABLE_COMPRESSION=false
                shift
                ;;
            --encryption)
                ENABLE_ENCRYPTION=true
                shift
                ;;
            --no-encryption)
                ENABLE_ENCRYPTION=false
                shift
                ;;
            --remote-sync)
                ENABLE_REMOTE_SYNC=true
                shift
                ;;
            --no-remote-sync)
                ENABLE_REMOTE_SYNC=false
                shift
                ;;
            --verify)
                ENABLE_VERIFICATION=true
                shift
                ;;
            --no-verify)
                ENABLE_VERIFICATION=false
                shift
                ;;
            --retention=*)
                RETENTION_DAYS="${1#*=}"
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --verbose)
                VERBOSE=true
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
Care Collective Automated Backup System v5.0
Enterprise-grade backup automation for disaster recovery

Usage: $0 [options]

Options:
  --type=TYPE       Backup type (full|schema|data|config|all) [default: all]
  --compression     Enable compression [default: enabled]
  --encryption      Enable encryption [default: enabled]  
  --remote-sync     Sync to remote storage [default: enabled]
  --verify          Verify backup integrity [default: enabled]
  --retention=DAYS  Retention period in days [default: 30]
  --dry-run         Show what would be done without executing
  --verbose         Enable verbose output
  --help            Show this help message

Backup Types:
  full              Complete database backup (schema + data)
  schema            Database schema only (structure, functions, policies)
  data              Application data only (excluding auth tables)
  config            Configuration files and environment templates
  all               All backup types (recommended for production)

Examples:
  $0                              # Full backup with default settings
  $0 --type=schema --no-encryption # Schema backup without encryption
  $0 --dry-run --verbose          # Preview what would be backed up
  $0 --type=data --retention=7    # Data backup with 7-day retention

Environment Variables:
  BACKUP_BASE_DIR         Base directory for backups [default: /backup/care-collective]
  SUPABASE_PROJECT_ID     Supabase project ID
  BACKUP_ENCRYPTION_KEY   GPG key for encryption
  REMOTE_BACKUP_URL       Remote storage URL (S3, rsync, etc.)

EOF
}

# Pre-flight checks
check_dependencies() {
    log_info "Checking dependencies..."
    
    local missing_deps=()
    
    # Check required commands
    for cmd in supabase pg_dump gzip; do
        if ! command -v "$cmd" &> /dev/null; then
            missing_deps+=("$cmd")
        fi
    done
    
    if [ "$ENABLE_ENCRYPTION" = true ] && ! command -v gpg &> /dev/null; then
        missing_deps+=("gpg")
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_error "Missing required dependencies: ${missing_deps[*]}"
        log_error "Please install missing dependencies and try again"
        exit 1
    fi
    
    # Check Supabase authentication
    if ! supabase projects list &> /dev/null; then
        log_error "Supabase CLI not authenticated. Run 'supabase login' first."
        exit 1
    fi
    
    # Check project ID
    if [ -z "$PROJECT_ID" ]; then
        log_error "SUPABASE_PROJECT_ID not set. Please set environment variable or configure in .env"
        exit 1
    fi
    
    log_success "All dependencies satisfied"
}

# Create backup directory structure
setup_backup_directories() {
    local backup_dir="$BACKUP_BASE_DIR/$DATE_DIR"
    
    if [ "$DRY_RUN" = true ]; then
        log_info "Would create backup directory: $backup_dir"
        return 0
    fi
    
    log_info "Setting up backup directories..."
    
    mkdir -p "$backup_dir/database"
    mkdir -p "$backup_dir/config"
    mkdir -p "$backup_dir/logs"
    mkdir -p "$backup_dir/verification"
    
    # Set secure permissions
    chmod 750 "$backup_dir"
    chmod 700 "$backup_dir/database"
    
    log_success "Backup directories created: $backup_dir"
    echo "$backup_dir"
}

# Backup database schema
backup_schema() {
    local backup_dir="$1"
    local schema_file="$backup_dir/database/schema_${TIMESTAMP}.sql"
    
    log_info "Backing up database schema..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "Would backup schema to: $schema_file"
        return 0
    fi
    
    log_verbose "Exporting schema from Supabase project: $PROJECT_ID"
    
    # Export schema using Supabase CLI
    if supabase db dump \
        --project-ref "$PROJECT_ID" \
        --schema-only \
        --file "$schema_file" 2>>"$backup_dir/logs/backup_${TIMESTAMP}.log"; then
        
        local file_size=$(stat -f%z "$schema_file" 2>/dev/null || stat -c%s "$schema_file")
        log_success "Schema backup completed: $(basename "$schema_file") ($(($file_size / 1024))KB)"
        
        # Compress if enabled
        if [ "$ENABLE_COMPRESSION" = true ]; then
            log_verbose "Compressing schema backup..."
            gzip "$schema_file"
            schema_file="${schema_file}.gz"
            log_success "Schema backup compressed"
        fi
        
        # Encrypt if enabled
        if [ "$ENABLE_ENCRYPTION" = true ]; then
            encrypt_file "$schema_file"
        fi
        
        echo "$schema_file"
    else
        log_error "Schema backup failed. Check logs: $backup_dir/logs/backup_${TIMESTAMP}.log"
        return 1
    fi
}

# Backup application data
backup_data() {
    local backup_dir="$1"
    local data_file="$backup_dir/database/data_${TIMESTAMP}.sql"
    
    log_info "Backing up application data..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "Would backup data to: $data_file"
        return 0
    fi
    
    log_verbose "Exporting data from Supabase project: $PROJECT_ID"
    
    # Export data excluding sensitive auth tables
    if supabase db dump \
        --project-ref "$PROJECT_ID" \
        --data-only \
        --exclude-table-data="auth.users" \
        --exclude-table-data="auth.sessions" \
        --exclude-table-data="auth.refresh_tokens" \
        --file "$data_file" 2>>"$backup_dir/logs/backup_${TIMESTAMP}.log"; then
        
        local file_size=$(stat -f%z "$data_file" 2>/dev/null || stat -c%s "$data_file")
        log_success "Data backup completed: $(basename "$data_file") ($(($file_size / 1024))KB)"
        
        # Compress if enabled
        if [ "$ENABLE_COMPRESSION" = true ]; then
            log_verbose "Compressing data backup..."
            gzip "$data_file"
            data_file="${data_file}.gz"
            log_success "Data backup compressed"
        fi
        
        # Encrypt if enabled
        if [ "$ENABLE_ENCRYPTION" = true ]; then
            encrypt_file "$data_file"
        fi
        
        echo "$data_file"
    else
        log_error "Data backup failed. Check logs: $backup_dir/logs/backup_${TIMESTAMP}.log"
        return 1
    fi
}

# Backup configuration files
backup_config() {
    local backup_dir="$1"
    local config_archive="$backup_dir/config/config_${TIMESTAMP}.tar.gz"
    
    log_info "Backing up configuration files..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "Would backup config to: $config_archive"
        return 0
    fi
    
    log_verbose "Creating configuration archive..."
    
    # Create temporary directory for config files
    local temp_config_dir=$(mktemp -d)
    
    # Copy configuration files
    cp "$PROJECT_ROOT/.env.example" "$temp_config_dir/" 2>/dev/null || true
    cp "$PROJECT_ROOT/.env.production.example" "$temp_config_dir/" 2>/dev/null || true
    cp "$PROJECT_ROOT/.env.staging.example" "$temp_config_dir/" 2>/dev/null || true
    cp "$PROJECT_ROOT/.env.test.example" "$temp_config_dir/" 2>/dev/null || true
    cp "$PROJECT_ROOT/package.json" "$temp_config_dir/"
    cp "$PROJECT_ROOT/package-lock.json" "$temp_config_dir/" 2>/dev/null || true
    cp "$PROJECT_ROOT/next.config.js" "$temp_config_dir/" 2>/dev/null || true
    cp "$PROJECT_ROOT/tailwind.config.ts" "$temp_config_dir/" 2>/dev/null || true
    cp "$PROJECT_ROOT/tsconfig.json" "$temp_config_dir/" 2>/dev/null || true
    
    # Copy Supabase configuration
    if [ -d "$PROJECT_ROOT/supabase/config" ]; then
        cp -r "$PROJECT_ROOT/supabase/config" "$temp_config_dir/"
    fi
    
    # Copy documentation
    if [ -d "$PROJECT_ROOT/docs" ]; then
        cp -r "$PROJECT_ROOT/docs" "$temp_config_dir/"
    fi
    
    # Create archive
    if tar -czf "$config_archive" -C "$temp_config_dir" . 2>>"$backup_dir/logs/backup_${TIMESTAMP}.log"; then
        local file_size=$(stat -f%z "$config_archive" 2>/dev/null || stat -c%s "$config_archive")
        log_success "Configuration backup completed: $(basename "$config_archive") ($(($file_size / 1024))KB)"
        
        # Encrypt if enabled
        if [ "$ENABLE_ENCRYPTION" = true ]; then
            encrypt_file "$config_archive"
        fi
        
        echo "$config_archive"
    else
        log_error "Configuration backup failed"
        return 1
    fi
    
    # Cleanup
    rm -rf "$temp_config_dir"
}

# Encrypt file using GPG
encrypt_file() {
    local file="$1"
    
    if [ -z "${BACKUP_ENCRYPTION_KEY:-}" ]; then
        log_warning "BACKUP_ENCRYPTION_KEY not set, using symmetric encryption"
        
        # Use symmetric encryption with passphrase
        if gpg --batch --yes --symmetric --cipher-algo AES256 --output "${file}.gpg" "$file" 2>/dev/null; then
            rm "$file"
            log_success "File encrypted: $(basename "${file}.gpg")"
            echo "${file}.gpg"
        else
            log_error "Encryption failed for: $(basename "$file")"
            return 1
        fi
    else
        log_verbose "Encrypting with GPG key: $BACKUP_ENCRYPTION_KEY"
        
        # Use public key encryption
        if gpg --batch --yes --encrypt --recipient "$BACKUP_ENCRYPTION_KEY" --output "${file}.gpg" "$file" 2>/dev/null; then
            rm "$file"
            log_success "File encrypted: $(basename "${file}.gpg")"
            echo "${file}.gpg"
        else
            log_error "Encryption failed for: $(basename "$file")"
            return 1
        fi
    fi
}

# Verify backup integrity
verify_backup() {
    local backup_dir="$1"
    local verification_log="$backup_dir/verification/verification_${TIMESTAMP}.log"
    
    log_info "Verifying backup integrity..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "Would verify backups in: $backup_dir"
        return 0
    fi
    
    local verification_passed=true
    
    # Check each backup file
    for backup_file in "$backup_dir"/database/* "$backup_dir"/config/*; do
        if [ -f "$backup_file" ]; then
            log_verbose "Verifying: $(basename "$backup_file")"
            
            # Check file size
            local file_size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file")
            if [ "$file_size" -eq 0 ]; then
                log_error "Zero-size backup file: $(basename "$backup_file")"
                verification_passed=false
                continue
            fi
            
            # Verify compressed files
            if [[ "$backup_file" == *.gz ]]; then
                if ! gzip -t "$backup_file" 2>/dev/null; then
                    log_error "Corrupted compressed file: $(basename "$backup_file")"
                    verification_passed=false
                    continue
                fi
            fi
            
            # Verify encrypted files
            if [[ "$backup_file" == *.gpg ]]; then
                if ! gpg --batch --yes --list-packets "$backup_file" &>/dev/null; then
                    log_error "Corrupted encrypted file: $(basename "$backup_file")"
                    verification_passed=false
                    continue
                fi
            fi
            
            # Verify SQL files (basic syntax check)
            if [[ "$backup_file" == *.sql ]]; then
                if ! head -1 "$backup_file" | grep -q "^--" 2>/dev/null; then
                    log_warning "SQL file may be corrupted: $(basename "$backup_file")"
                fi
            fi
            
            log_verbose "✓ $(basename "$backup_file") verified (${file_size} bytes)"
            echo "$(date): $(basename "$backup_file") verified (${file_size} bytes)" >> "$verification_log"
        fi
    done
    
    if [ "$verification_passed" = true ]; then
        log_success "All backup files verified successfully"
        echo "$(date): All backup files verified successfully" >> "$verification_log"
        return 0
    else
        log_error "Backup verification failed. Check: $verification_log"
        return 1
    fi
}

# Sync to remote storage
sync_to_remote() {
    local backup_dir="$1"
    
    if [ -z "${REMOTE_BACKUP_URL:-}" ]; then
        log_info "REMOTE_BACKUP_URL not set, skipping remote sync"
        return 0
    fi
    
    log_info "Syncing backups to remote storage..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "Would sync to: $REMOTE_BACKUP_URL"
        return 0
    fi
    
    log_verbose "Remote backup URL: $REMOTE_BACKUP_URL"
    
    # Use rsync for efficient synchronization
    if command -v rsync &> /dev/null; then
        if rsync -avz --progress "$backup_dir/" "$REMOTE_BACKUP_URL/$(basename "$backup_dir")/" 2>>"$backup_dir/logs/backup_${TIMESTAMP}.log"; then
            log_success "Remote sync completed"
        else
            log_error "Remote sync failed. Check logs: $backup_dir/logs/backup_${TIMESTAMP}.log"
            return 1
        fi
    else
        log_warning "rsync not available, attempting basic copy..."
        # Fallback to basic copy (implementation depends on remote storage type)
        log_error "Remote sync not implemented for this storage type"
        return 1
    fi
}

# Clean up old backups
cleanup_old_backups() {
    log_info "Cleaning up backups older than $RETENTION_DAYS days..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "Would remove backups older than $RETENTION_DAYS days from: $BACKUP_BASE_DIR"
        return 0
    fi
    
    local deleted_count=0
    
    # Find and remove old backup directories
    while IFS= read -r -d '' old_dir; do
        if [ -d "$old_dir" ]; then
            log_verbose "Removing old backup: $(basename "$old_dir")"
            rm -rf "$old_dir"
            ((deleted_count++))
        fi
    done < <(find "$BACKUP_BASE_DIR" -maxdepth 1 -type d -name "[0-9]*" -mtime +"$RETENTION_DAYS" -print0 2>/dev/null)
    
    if [ "$deleted_count" -gt 0 ]; then
        log_success "Removed $deleted_count old backup directories"
    else
        log_info "No old backups to remove"
    fi
}

# Generate backup report
generate_report() {
    local backup_dir="$1"
    local report_file="$backup_dir/backup_report_${TIMESTAMP}.txt"
    
    log_info "Generating backup report..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "Would generate report: $report_file"
        return 0
    fi
    
    cat > "$report_file" << EOF
CARE COLLECTIVE BACKUP REPORT
=============================
Date: $(date)
Backup Type: $BACKUP_TYPE
Timestamp: $TIMESTAMP
Project ID: $PROJECT_ID

Backup Configuration:
- Compression: $ENABLE_COMPRESSION
- Encryption: $ENABLE_ENCRYPTION
- Remote Sync: $ENABLE_REMOTE_SYNC
- Verification: $ENABLE_VERIFICATION
- Retention: $RETENTION_DAYS days

Backup Files:
EOF
    
    # List all backup files with sizes
    for backup_file in "$backup_dir"/database/* "$backup_dir"/config/*; do
        if [ -f "$backup_file" ]; then
            local file_size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file")
            echo "- $(basename "$backup_file"): $(($file_size / 1024))KB" >> "$report_file"
        fi
    done
    
    echo "" >> "$report_file"
    echo "Total Backup Size: $(du -sh "$backup_dir" | cut -f1)" >> "$report_file"
    echo "Backup Location: $backup_dir" >> "$report_file"
    
    log_success "Backup report generated: $(basename "$report_file")"
}

# Main backup orchestrator
main() {
    local start_time=$(date +%s)
    
    echo "🚀 Care Collective Automated Backup System v5.0"
    echo "================================================="
    echo "Starting backup process at $(date)"
    echo "Backup type: $BACKUP_TYPE"
    echo ""
    
    # Pre-flight checks
    check_dependencies
    
    # Setup backup directory
    local backup_dir
    backup_dir=$(setup_backup_directories)
    
    # Perform requested backups
    local backup_files=()
    
    case "$BACKUP_TYPE" in
        "schema")
            backup_files+=($(backup_schema "$backup_dir"))
            ;;
        "data")
            backup_files+=($(backup_data "$backup_dir"))
            ;;
        "config")
            backup_files+=($(backup_config "$backup_dir"))
            ;;
        "full")
            backup_files+=($(backup_schema "$backup_dir"))
            backup_files+=($(backup_data "$backup_dir"))
            ;;
        "all"|*)
            backup_files+=($(backup_schema "$backup_dir"))
            backup_files+=($(backup_data "$backup_dir"))
            backup_files+=($(backup_config "$backup_dir"))
            ;;
    esac
    
    # Verify backups
    if [ "$ENABLE_VERIFICATION" = true ]; then
        verify_backup "$backup_dir"
    fi
    
    # Sync to remote storage
    if [ "$ENABLE_REMOTE_SYNC" = true ]; then
        sync_to_remote "$backup_dir"
    fi
    
    # Generate report
    generate_report "$backup_dir"
    
    # Cleanup old backups
    cleanup_old_backups
    
    # Summary
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    echo ""
    echo "✅ Backup process completed successfully"
    echo "Duration: ${duration}s"
    echo "Files created: ${#backup_files[@]}"
    echo "Location: $backup_dir"
    echo ""
    
    log_success "Care Collective backup completed at $(date)"
}

# Parse arguments and run
parse_args "$@"
main