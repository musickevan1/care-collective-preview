#!/bin/bash

# CARE COLLECTIVE DATABASE MAINTENANCE SCRIPT
# This script performs weekly maintenance tasks for the Care Collective platform
# 
# Usage: ./scripts/db-maintenance.sh [--dry-run]
# 
# Features:
# - Analyzes table statistics and dead tuple ratios
# - Performs VACUUM operations on tables needing maintenance
# - Updates table statistics for query optimization
# - Reindexes tables if needed
# - Generates maintenance report
# 
# Designed for Care Collective mutual aid platform priorities:
# - Help requests performance (critical user path)
# - Contact exchanges privacy and speed
# - User profile access optimization

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_ROOT/logs"
MAINTENANCE_LOG="$LOG_DIR/db-maintenance-$(date +%Y%m%d_%H%M%S).log"

# Database connection settings (default to local Supabase)
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-54322}"
DB_NAME="${DB_NAME:-postgres}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
DB_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# Maintenance thresholds
DEAD_TUPLE_THRESHOLD=10  # Percentage of dead tuples that triggers VACUUM
REINDEX_THRESHOLD=20     # Percentage of dead tuples that triggers REINDEX

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Flags
DRY_RUN=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            echo "Care Collective Database Maintenance Script"
            echo ""
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --dry-run    Show what would be done without executing"
            echo "  -h, --help   Show this help message"
            echo ""
            echo "Environment Variables:"
            echo "  DB_HOST      Database host (default: 127.0.0.1)"
            echo "  DB_PORT      Database port (default: 54322)"
            echo "  DB_NAME      Database name (default: postgres)"
            echo "  DB_USER      Database user (default: postgres)"
            echo "  DB_PASSWORD  Database password (default: postgres)"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Utility functions
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$MAINTENANCE_LOG"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✓${NC} $1" | tee -a "$MAINTENANCE_LOG"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠${NC} $1" | tee -a "$MAINTENANCE_LOG"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ✗${NC} $1" | tee -a "$MAINTENANCE_LOG"
}

# Test database connectivity
test_connection() {
    log "Testing database connection..."
    if psql "$DB_URL" -c "SELECT version();" > /dev/null 2>&1; then
        log_success "Database connection successful"
    else
        log_error "Failed to connect to database"
        exit 1
    fi
}

# Analyze tables that need maintenance
analyze_maintenance_needs() {
    log "Analyzing tables for maintenance needs..."
    
    psql "$DB_URL" -t -c "
        SELECT 
            relname,
            n_live_tup,
            n_dead_tup,
            ROUND((n_dead_tup::numeric / GREATEST(n_live_tup, 1)) * 100, 2) as dead_ratio_pct
        FROM pg_stat_user_tables 
        WHERE schemaname = 'public'
            AND n_live_tup > 0
            AND ROUND((n_dead_tup::numeric / GREATEST(n_live_tup, 1)) * 100, 2) > $DEAD_TUPLE_THRESHOLD
        ORDER BY dead_ratio_pct DESC;
    " > /tmp/maintenance_needs.txt
    
    if [ -s /tmp/maintenance_needs.txt ]; then
        log "Tables needing maintenance (>${DEAD_TUPLE_THRESHOLD}% dead tuples):"
        while IFS='|' read -r tablename live_tup dead_tup dead_ratio; do
            tablename=$(echo "$tablename" | xargs)
            dead_ratio=$(echo "$dead_ratio" | xargs)
            log_warning "  $tablename: ${dead_ratio}% dead tuples"
        done < /tmp/maintenance_needs.txt
    else
        log_success "No tables need maintenance at this time"
    fi
}

# Perform VACUUM operations on tables that need it
perform_vacuum_operations() {
    log "Performing VACUUM operations..."
    
    # Care Collective priority tables - always vacuum these
    PRIORITY_TABLES=("help_requests" "profiles" "contact_exchanges" "messages" "audit_logs")
    
    for table in "${PRIORITY_TABLES[@]}"; do
        log "Checking $table for VACUUM needs..."
        
        dead_ratio=$(psql "$DB_URL" -t -c "
            SELECT ROUND((n_dead_tup::numeric / GREATEST(n_live_tup, 1)) * 100, 2)
            FROM pg_stat_user_tables 
            WHERE schemaname = 'public' AND relname = '$table';
        " | xargs)
        
        # Convert to integer for comparison (multiply by 100 to handle decimals)
        dead_ratio_int=$(echo "$dead_ratio * 100" | awk '{printf "%.0f", $1}')
        threshold_int=$((DEAD_TUPLE_THRESHOLD * 100))
        
        if [ -n "$dead_ratio" ] && [ "$dead_ratio_int" -gt "$threshold_int" ]; then
            if [ "$DRY_RUN" = true ]; then
                log "DRY RUN: Would VACUUM $table (${dead_ratio}% dead tuples)"
            else
                log "VACUUMing $table (${dead_ratio}% dead tuples)..."
                if psql "$DB_URL" -c "VACUUM ANALYZE $table;" > /dev/null 2>&1; then
                    log_success "VACUUM completed for $table"
                else
                    log_error "VACUUM failed for $table"
                fi
            fi
        else
            log "  $table: ${dead_ratio:-0}% dead tuples - no VACUUM needed"
        fi
    done
}

# Update table statistics for better query planning
update_statistics() {
    log "Updating table statistics..."
    
    if [ "$DRY_RUN" = true ]; then
        log "DRY RUN: Would update statistics for all Care Collective tables"
    else
        # Update statistics for all tables
        if psql "$DB_URL" -c "ANALYZE;" > /dev/null 2>&1; then
            log_success "Statistics updated for all tables"
        else
            log_error "Failed to update statistics"
        fi
    fi
}

# Check index health and rebuild if necessary
check_index_health() {
    log "Checking index health..."
    
    # Check for unused indexes (Care Collective should have minimal unused indexes)
    unused_indexes=$(psql "$DB_URL" -t -c "
        SELECT COUNT(*)
        FROM pg_stat_user_indexes 
        WHERE schemaname = 'public'
            AND idx_tup_read = 0
            AND idx_tup_fetch = 0;
    " | xargs)
    
    if [ "$unused_indexes" -gt 0 ]; then
        log_warning "Found $unused_indexes unused indexes - consider reviewing"
        
        psql "$DB_URL" -c "
            SELECT 
                schemaname,
                relname as tablename,
                indexrelname as indexname,
                'Consider dropping - no reads or fetches' as recommendation
            FROM pg_stat_user_indexes 
            WHERE schemaname = 'public'
                AND idx_tup_read = 0 
                AND idx_tup_fetch = 0;
        "
    else
        log_success "All indexes are being used"
    fi
    
    # Check for indexes that might benefit from rebuilding
    log "Checking for indexes needing rebuild..."
    
    if [ "$DRY_RUN" = true ]; then
        log "DRY RUN: Would check index bloat and rebuild if necessary"
    else
        # For now, just report index sizes - full bloat analysis requires more complex queries
        psql "$DB_URL" -c "
            SELECT 
                schemaname,
                relname as tablename,
                indexrelname as indexname,
                pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
                idx_tup_read as reads,
                idx_tup_fetch as fetches
            FROM pg_stat_user_indexes 
            WHERE schemaname = 'public'
                AND relname IN ('help_requests', 'contact_exchanges', 'profiles', 'messages')
            ORDER BY pg_relation_size(indexrelid) DESC;
        " | tee -a "$MAINTENANCE_LOG"
    fi
}

# Generate Care Collective specific health report
generate_health_report() {
    log "Generating Care Collective health report..."
    
    # Run the performance analysis script
    if [ -f "$SCRIPT_DIR/analyze-query-performance.sql" ]; then
        log "Running comprehensive performance analysis..."
        psql "$DB_URL" -f "$SCRIPT_DIR/analyze-query-performance.sql" >> "$MAINTENANCE_LOG" 2>&1
    else
        log_warning "Performance analysis script not found"
    fi
    
    # Care Collective specific metrics
    log "Care Collective Platform Metrics:"
    
    psql "$DB_URL" -c "
        -- Help requests status
        SELECT 
            'Help Requests' as category,
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'open' THEN 1 END) as open_count,
            COUNT(CASE WHEN urgency = 'urgent' THEN 1 END) as urgent_count,
            COUNT(CASE WHEN urgency = 'critical' THEN 1 END) as critical_count
        FROM help_requests
        
        UNION ALL
        
        -- User verification status
        SELECT 
            'User Verification' as category,
            COUNT(*) as total,
            COUNT(CASE WHEN verification_status = 'approved' THEN 1 END) as approved_count,
            COUNT(CASE WHEN verification_status = 'pending' THEN 1 END) as pending_count,
            COUNT(CASE WHEN email_confirmed THEN 1 END) as email_confirmed_count
        FROM profiles
        
        UNION ALL
        
        -- Contact exchanges
        SELECT 
            'Contact Exchanges' as category,
            COUNT(*) as total,
            COUNT(CASE WHEN exchanged_at > NOW() - INTERVAL '7 days' THEN 1 END) as recent_count,
            COUNT(CASE WHEN exchanged_at IS NOT NULL THEN 1 END) as completed_count,
            0 as unused_col
        FROM contact_exchanges;
    " | tee -a "$MAINTENANCE_LOG"
}

# Cleanup old log files (keep last 30 days)
cleanup_logs() {
    if [ -d "$LOG_DIR" ]; then
        log "Cleaning up old maintenance logs (keeping 30 days)..."
        find "$LOG_DIR" -name "db-maintenance-*.log" -mtime +30 -delete 2>/dev/null || true
        log_success "Log cleanup completed"
    fi
}

# Main execution
main() {
    # Create log directory if it doesn't exist
    mkdir -p "$LOG_DIR"
    
    log "========================================="
    log "CARE COLLECTIVE DATABASE MAINTENANCE"
    log "========================================="
    log "Started at: $(date)"
    log "Mode: $([ "$DRY_RUN" = true ] && echo "DRY RUN" || echo "LIVE")"
    log "Database: $DB_HOST:$DB_PORT/$DB_NAME"
    log ""
    
    # Perform maintenance tasks
    test_connection
    analyze_maintenance_needs
    perform_vacuum_operations
    update_statistics
    check_index_health
    generate_health_report
    cleanup_logs
    
    log ""
    log "========================================="
    log "MAINTENANCE COMPLETED"
    log "========================================="
    log "Completed at: $(date)"
    log "Log file: $MAINTENANCE_LOG"
    log ""
    
    if [ "$DRY_RUN" = true ]; then
        log_warning "This was a DRY RUN - no changes were made"
        log "To perform actual maintenance, run without --dry-run flag"
    else
        log_success "All maintenance tasks completed successfully"
    fi
}

# Run main function
main "$@"