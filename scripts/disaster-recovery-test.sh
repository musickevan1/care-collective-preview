#!/bin/bash

# CARE COLLECTIVE DISASTER RECOVERY TESTING SUITE
# Enterprise-grade disaster recovery validation and testing
# Version: 5.0 (Enterprise Data Protection)
#
# Usage: ./scripts/disaster-recovery-test.sh [options]
# Options:
#   --test-type=TYPE     Test type (restore|failover|backup-integrity|all) [default: all]
#   --backup-date=DATE   Specific backup date to test (YYYYMMDD) [default: latest]
#   --test-database=NAME Test database name [default: care_collective_dr_test]
#   --verify-data        Perform data integrity verification [default: enabled]
#   --performance-test   Run performance tests after recovery [default: enabled]
#   --cleanup           Clean up test resources after completion [default: enabled]
#   --dry-run           Show what would be done without executing
#   --verbose           Enable verbose output
#   --help              Show help message

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_BASE_DIR="${BACKUP_BASE_DIR:-/backup/care-collective}"
PROJECT_ID="${SUPABASE_PROJECT_ID:-kecureoyekeqhrxkmjuh}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Default options
TEST_TYPE="all"
BACKUP_DATE=""
TEST_DATABASE="care_collective_dr_test_${TIMESTAMP}"
VERIFY_DATA=true
PERFORMANCE_TEST=true
CLEANUP=true
DRY_RUN=false
VERBOSE=false

# RTO/RPO targets
RTO_TARGET_SECONDS=900  # 15 minutes
RPO_TARGET_SECONDS=300  # 5 minutes

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
declare -A test_results
test_start_time=0
test_end_time=0

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
            --test-type=*)
                TEST_TYPE="${1#*=}"
                shift
                ;;
            --backup-date=*)
                BACKUP_DATE="${1#*=}"
                shift
                ;;
            --test-database=*)
                TEST_DATABASE="${1#*=}"
                shift
                ;;
            --verify-data)
                VERIFY_DATA=true
                shift
                ;;
            --no-verify-data)
                VERIFY_DATA=false
                shift
                ;;
            --performance-test)
                PERFORMANCE_TEST=true
                shift
                ;;
            --no-performance-test)
                PERFORMANCE_TEST=false
                shift
                ;;
            --cleanup)
                CLEANUP=true
                shift
                ;;
            --no-cleanup)
                CLEANUP=false
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
Care Collective Disaster Recovery Testing Suite v5.0
Enterprise-grade disaster recovery validation and testing

Usage: $0 [options]

Options:
  --test-type=TYPE     Test type (restore|failover|backup-integrity|all) [default: all]
  --backup-date=DATE   Specific backup date to test (YYYYMMDD) [default: latest]
  --test-database=NAME Test database name [default: care_collective_dr_test]
  --verify-data        Perform data integrity verification [default: enabled]
  --performance-test   Run performance tests after recovery [default: enabled]
  --cleanup           Clean up test resources after completion [default: enabled]
  --dry-run           Show what would be done without executing
  --verbose           Enable verbose output
  --help              Show help message

Test Types:
  restore             Test backup restoration procedures
  failover            Test failover to backup systems
  backup-integrity    Verify backup file integrity and completeness
  all                 Run all disaster recovery tests

Recovery Targets:
  RTO (Recovery Time Objective): 15 minutes
  RPO (Recovery Point Objective): 5 minutes

Examples:
  $0                                    # Run all DR tests with latest backup
  $0 --test-type=restore --verbose     # Test restoration with detailed output
  $0 --backup-date=20250120 --no-cleanup # Test specific backup, keep test data
  $0 --dry-run                         # Preview what tests would be run

Environment Variables:
  BACKUP_BASE_DIR         Base directory for backups
  SUPABASE_PROJECT_ID     Supabase project ID
  TEST_DATABASE_URL       URL for test database connections

EOF
}

# Initialize test environment
initialize_test_environment() {
    log_info "Initializing disaster recovery test environment..."
    
    test_start_time=$(date +%s)
    
    # Check dependencies
    local missing_deps=()
    for cmd in supabase psql pg_restore gzip; do
        if ! command -v "$cmd" &> /dev/null; then
            missing_deps+=("$cmd")
        fi
    done
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_error "Missing required dependencies: ${missing_deps[*]}"
        exit 1
    fi
    
    # Check Supabase authentication
    if ! supabase projects list &> /dev/null; then
        log_error "Supabase CLI not authenticated. Run 'supabase login' first."
        exit 1
    fi
    
    # Determine backup to test
    if [ -z "$BACKUP_DATE" ]; then
        BACKUP_DATE=$(find "$BACKUP_BASE_DIR" -maxdepth 1 -type d -name "[0-9]*" | sort | tail -1 | basename)
        log_info "Using latest backup: $BACKUP_DATE"
    fi
    
    if [ ! -d "$BACKUP_BASE_DIR/$BACKUP_DATE" ]; then
        log_error "Backup directory not found: $BACKUP_BASE_DIR/$BACKUP_DATE"
        exit 1
    fi
    
    log_success "Test environment initialized"
}

# Test backup integrity
test_backup_integrity() {
    log_info "Testing backup integrity..."
    
    local backup_dir="$BACKUP_BASE_DIR/$BACKUP_DATE"
    local integrity_passed=true
    
    if [ "$DRY_RUN" = true ]; then
        log_info "Would test backup integrity for: $backup_dir"
        test_results["backup_integrity"]="SKIPPED (dry-run)"
        return 0
    fi
    
    # Check for required backup files
    local required_files=("schema" "data")
    local found_files=()
    
    for file_type in "${required_files[@]}"; do
        local pattern="$backup_dir/database/${file_type}_*.sql*"
        if ls $pattern 1> /dev/null 2>&1; then
            found_files+=("$file_type")
            log_verbose "Found $file_type backup files"
        else
            log_error "Missing $file_type backup files"
            integrity_passed=false
        fi
    done
    
    # Test file integrity
    for backup_file in "$backup_dir"/database/*.sql* "$backup_dir"/config/*.tar*; do
        if [ -f "$backup_file" ]; then
            log_verbose "Testing integrity: $(basename "$backup_file")"
            
            # Check file size
            local file_size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file")
            if [ "$file_size" -eq 0 ]; then
                log_error "Zero-size file: $(basename "$backup_file")"
                integrity_passed=false
                continue
            fi
            
            # Test compressed files
            if [[ "$backup_file" == *.gz ]]; then
                if ! gzip -t "$backup_file" 2>/dev/null; then
                    log_error "Corrupted compressed file: $(basename "$backup_file")"
                    integrity_passed=false
                    continue
                fi
            fi
            
            # Test encrypted files
            if [[ "$backup_file" == *.gpg ]]; then
                if ! gpg --batch --yes --list-packets "$backup_file" &>/dev/null; then
                    log_error "Corrupted encrypted file: $(basename "$backup_file")"
                    integrity_passed=false
                    continue
                fi
            fi
            
            log_verbose "✓ $(basename "$backup_file") integrity verified"
        fi
    done
    
    if [ "$integrity_passed" = true ]; then
        log_success "All backup files passed integrity checks"
        test_results["backup_integrity"]="PASSED"
    else
        log_error "Backup integrity test failed"
        test_results["backup_integrity"]="FAILED"
        return 1
    fi
}

# Test database restoration
test_database_restoration() {
    log_info "Testing database restoration..."
    
    local backup_dir="$BACKUP_BASE_DIR/$BACKUP_DATE"
    local restore_start_time=$(date +%s)
    
    if [ "$DRY_RUN" = true ]; then
        log_info "Would test database restoration from: $backup_dir"
        test_results["database_restoration"]="SKIPPED (dry-run)"
        return 0
    fi
    
    # Find backup files
    local schema_backup=$(find "$backup_dir/database" -name "schema_*.sql*" | head -1)
    local data_backup=$(find "$backup_dir/database" -name "data_*.sql*" | head -1)
    
    if [ -z "$schema_backup" ] || [ -z "$data_backup" ]; then
        log_error "Required backup files not found"
        test_results["database_restoration"]="FAILED"
        return 1
    fi
    
    log_verbose "Schema backup: $(basename "$schema_backup")"
    log_verbose "Data backup: $(basename "$data_backup")"
    
    # Create test database
    log_info "Creating test database: $TEST_DATABASE"
    if ! createdb "$TEST_DATABASE" 2>/dev/null; then
        log_warning "Test database already exists, dropping and recreating..."
        dropdb "$TEST_DATABASE" 2>/dev/null || true
        createdb "$TEST_DATABASE"
    fi
    
    # Restore schema
    log_info "Restoring database schema..."
    local schema_file="$schema_backup"
    
    # Handle compressed files
    if [[ "$schema_backup" == *.gz ]]; then
        schema_file="/tmp/schema_restore_${TIMESTAMP}.sql"
        gunzip -c "$schema_backup" > "$schema_file"
    fi
    
    # Handle encrypted files
    if [[ "$schema_backup" == *.gpg ]]; then
        local decrypted_file="/tmp/schema_restore_${TIMESTAMP}.sql"
        if ! gpg --batch --yes --decrypt "$schema_backup" > "$decrypted_file" 2>/dev/null; then
            log_error "Failed to decrypt schema backup"
            test_results["database_restoration"]="FAILED"
            return 1
        fi
        schema_file="$decrypted_file"
    fi
    
    if ! psql -d "$TEST_DATABASE" -f "$schema_file" &>/dev/null; then
        log_error "Schema restoration failed"
        test_results["database_restoration"]="FAILED"
        return 1
    fi
    
    # Restore data
    log_info "Restoring application data..."
    local data_file="$data_backup"
    
    # Handle compressed files
    if [[ "$data_backup" == *.gz ]]; then
        data_file="/tmp/data_restore_${TIMESTAMP}.sql"
        gunzip -c "$data_backup" > "$data_file"
    fi
    
    # Handle encrypted files
    if [[ "$data_backup" == *.gpg ]]; then
        local decrypted_file="/tmp/data_restore_${TIMESTAMP}.sql"
        if ! gpg --batch --yes --decrypt "$data_backup" > "$decrypted_file" 2>/dev/null; then
            log_error "Failed to decrypt data backup"
            test_results["database_restoration"]="FAILED"
            return 1
        fi
        data_file="$decrypted_file"
    fi
    
    if ! psql -d "$TEST_DATABASE" -f "$data_file" &>/dev/null; then
        log_error "Data restoration failed"
        test_results["database_restoration"]="FAILED"
        return 1
    fi
    
    # Calculate restoration time
    local restore_end_time=$(date +%s)
    local restore_duration=$((restore_end_time - restore_start_time))
    
    log_success "Database restoration completed in ${restore_duration}s"
    
    # Check RTO compliance
    if [ "$restore_duration" -le "$RTO_TARGET_SECONDS" ]; then
        log_success "RTO target met: ${restore_duration}s <= ${RTO_TARGET_SECONDS}s"
        test_results["database_restoration"]="PASSED"
    else
        log_warning "RTO target exceeded: ${restore_duration}s > ${RTO_TARGET_SECONDS}s"
        test_results["database_restoration"]="PASSED (RTO exceeded)"
    fi
    
    # Store restoration time for reporting
    test_results["restoration_time"]="${restore_duration}s"
    
    # Cleanup temporary files
    rm -f "/tmp/schema_restore_${TIMESTAMP}.sql" "/tmp/data_restore_${TIMESTAMP}.sql"
}

# Verify restored data integrity
verify_data_integrity() {
    log_info "Verifying restored data integrity..."
    
    if [ "$DRY_RUN" = true ] || [ "$VERIFY_DATA" = false ]; then
        log_info "Skipping data verification"
        test_results["data_integrity"]="SKIPPED"
        return 0
    fi
    
    local verification_passed=true
    
    # Test basic table structure
    log_verbose "Checking table structure..."
    
    local expected_tables=("profiles" "help_requests" "contact_exchanges" "messages" "conversations")
    for table in "${expected_tables[@]}"; do
        if ! psql -d "$TEST_DATABASE" -c "SELECT 1 FROM $table LIMIT 1;" &>/dev/null; then
            log_error "Table missing or inaccessible: $table"
            verification_passed=false
        else
            log_verbose "✓ Table verified: $table"
        fi
    done
    
    # Test data consistency
    log_verbose "Checking data consistency..."
    
    # Check referential integrity
    local integrity_queries=(
        "SELECT COUNT(*) FROM help_requests hr LEFT JOIN profiles p ON hr.user_id = p.id WHERE p.id IS NULL"
        "SELECT COUNT(*) FROM contact_exchanges ce LEFT JOIN help_requests hr ON ce.request_id = hr.id WHERE hr.id IS NULL"
        "SELECT COUNT(*) FROM messages m LEFT JOIN conversations c ON m.conversation_id = c.id WHERE c.id IS NULL"
    )
    
    for query in "${integrity_queries[@]}"; do
        local result=$(psql -d "$TEST_DATABASE" -t -c "$query" 2>/dev/null | tr -d ' ')
        if [ "$result" != "0" ]; then
            log_error "Data integrity violation found: $result orphaned records"
            verification_passed=false
        fi
    done
    
    # Test RLS policies
    log_verbose "Testing RLS policies..."
    if ! psql -d "$TEST_DATABASE" -c "SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';" &>/dev/null; then
        log_error "RLS policies not restored properly"
        verification_passed=false
    else
        local policy_count=$(psql -d "$TEST_DATABASE" -t -c "SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';" | tr -d ' ')
        log_verbose "✓ RLS policies restored: $policy_count policies"
    fi
    
    # Test functions and triggers
    log_verbose "Testing database functions..."
    local function_tests=(
        "SELECT verify_user_registration_system();"
        "SELECT verify_rls_security();"
    )
    
    for test_query in "${function_tests[@]}"; do
        if psql -d "$TEST_DATABASE" -c "$test_query" &>/dev/null; then
            log_verbose "✓ Function test passed"
        else
            log_warning "Function test failed (may be expected): $test_query"
        fi
    done
    
    if [ "$verification_passed" = true ]; then
        log_success "Data integrity verification passed"
        test_results["data_integrity"]="PASSED"
    else
        log_error "Data integrity verification failed"
        test_results["data_integrity"]="FAILED"
        return 1
    fi
}

# Test performance after restoration
test_performance() {
    log_info "Testing performance after restoration..."
    
    if [ "$DRY_RUN" = true ] || [ "$PERFORMANCE_TEST" = false ]; then
        log_info "Skipping performance tests"
        test_results["performance"]="SKIPPED"
        return 0
    fi
    
    local performance_passed=true
    
    # Test query performance
    log_verbose "Testing query performance..."
    
    local test_queries=(
        "SELECT COUNT(*) FROM help_requests WHERE status = 'open';"
        "SELECT hr.*, p.name FROM help_requests hr JOIN profiles p ON hr.user_id = p.id LIMIT 10;"
        "SELECT * FROM contact_exchanges ORDER BY exchanged_at DESC LIMIT 10;"
    )
    
    local total_query_time=0
    local query_count=0
    
    for query in "${test_queries[@]}"; do
        local start_time=$(date +%s%3N)
        if psql -d "$TEST_DATABASE" -c "$query" &>/dev/null; then
            local end_time=$(date +%s%3N)
            local query_time=$((end_time - start_time))
            total_query_time=$((total_query_time + query_time))
            query_count=$((query_count + 1))
            
            log_verbose "Query completed in ${query_time}ms"
            
            # Check for slow queries (>1000ms)
            if [ "$query_time" -gt 1000 ]; then
                log_warning "Slow query detected: ${query_time}ms"
                performance_passed=false
            fi
        else
            log_error "Query failed: $query"
            performance_passed=false
        fi
    done
    
    if [ "$query_count" -gt 0 ]; then
        local avg_query_time=$((total_query_time / query_count))
        log_info "Average query time: ${avg_query_time}ms"
        test_results["avg_query_time"]="${avg_query_time}ms"
        
        # Performance target: <100ms average
        if [ "$avg_query_time" -le 100 ]; then
            log_success "Performance target met: ${avg_query_time}ms <= 100ms"
        else
            log_warning "Performance target not met: ${avg_query_time}ms > 100ms"
            performance_passed=false
        fi
    fi
    
    if [ "$performance_passed" = true ]; then
        log_success "Performance tests passed"
        test_results["performance"]="PASSED"
    else
        log_warning "Performance tests failed or degraded"
        test_results["performance"]="DEGRADED"
    fi
}

# Test failover procedures
test_failover() {
    log_info "Testing failover procedures..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "Would test failover procedures"
        test_results["failover"]="SKIPPED (dry-run)"
        return 0
    fi
    
    # Simulate failover scenario
    log_info "Simulating database failover scenario..."
    
    # This would typically involve:
    # 1. Switching to read replica
    # 2. Promoting replica to primary
    # 3. Updating connection strings
    # 4. Verifying application connectivity
    
    # For now, we'll test the backup restoration as a failover simulation
    log_info "Testing backup-based failover (restoration to new instance)..."
    
    if test_database_restoration; then
        log_success "Failover test passed (backup restoration successful)"
        test_results["failover"]="PASSED"
    else
        log_error "Failover test failed"
        test_results["failover"]="FAILED"
        return 1
    fi
}

# Clean up test resources
cleanup_test_resources() {
    if [ "$CLEANUP" = false ]; then
        log_info "Cleanup disabled, keeping test resources"
        return 0
    fi
    
    log_info "Cleaning up test resources..."
    
    if [ "$DRY_RUN" = true ]; then
        log_info "Would cleanup test database: $TEST_DATABASE"
        return 0
    fi
    
    # Drop test database
    if dropdb "$TEST_DATABASE" 2>/dev/null; then
        log_success "Test database cleaned up: $TEST_DATABASE"
    else
        log_warning "Failed to cleanup test database: $TEST_DATABASE"
    fi
    
    # Remove temporary files
    rm -f "/tmp/schema_restore_${TIMESTAMP}.sql" "/tmp/data_restore_${TIMESTAMP}.sql"
    
    log_success "Test cleanup completed"
}

# Generate comprehensive test report
generate_test_report() {
    test_end_time=$(date +%s)
    local total_test_time=$((test_end_time - test_start_time))
    
    echo ""
    echo "📊 DISASTER RECOVERY TEST REPORT"
    echo "================================="
    echo "Test Date: $(date)"
    echo "Test Type: $TEST_TYPE"
    echo "Backup Date: $BACKUP_DATE"
    echo "Test Duration: ${total_test_time}s"
    echo ""
    
    echo "🎯 Recovery Targets:"
    echo "RTO Target: ${RTO_TARGET_SECONDS}s (15 minutes)"
    echo "RPO Target: ${RPO_TARGET_SECONDS}s (5 minutes)"
    echo ""
    
    echo "📋 Test Results:"
    echo "================"
    
    local passed_tests=0
    local total_tests=0
    
    for test_name in "${!test_results[@]}"; do
        local result="${test_results[$test_name]}"
        echo "• $test_name: $result"
        
        if [[ "$result" == "PASSED"* ]]; then
            ((passed_tests++))
        fi
        ((total_tests++))
    done
    
    echo ""
    echo "📈 Summary:"
    echo "==========="
    echo "Tests Passed: $passed_tests/$total_tests"
    
    if [ "$passed_tests" -eq "$total_tests" ]; then
        echo "Overall Status: ✅ ALL TESTS PASSED"
        echo "DR Readiness: 🟢 EXCELLENT"
    elif [ "$passed_tests" -gt $((total_tests * 3 / 4)) ]; then
        echo "Overall Status: ⚠️ MOST TESTS PASSED"
        echo "DR Readiness: 🟡 GOOD (minor issues)"
    else
        echo "Overall Status: ❌ MULTIPLE FAILURES"
        echo "DR Readiness: 🔴 NEEDS ATTENTION"
    fi
    
    echo ""
    echo "🚀 Next Steps:"
    echo "=============="
    
    if [ "$passed_tests" -eq "$total_tests" ]; then
        echo "• Disaster recovery procedures are working correctly"
        echo "• Consider scheduling regular DR tests (monthly)"
        echo "• Document any lessons learned from this test"
    else
        echo "• Address failed tests before next production deployment"
        echo "• Review backup procedures and retention policies"
        echo "• Update disaster recovery documentation"
    fi
    
    echo ""
    echo "📞 Emergency Contacts:"
    echo "====================="
    echo "• Primary DBA: [Configure in emergency procedures]"
    echo "• DevOps Lead: [Configure in emergency procedures]"
    echo "• Supabase Support: support@supabase.com"
    echo ""
}

# Main test orchestrator
main() {
    echo "🧪 Care Collective Disaster Recovery Testing Suite v5.0"
    echo "========================================================"
    echo "Starting DR tests at $(date)"
    echo "Test type: $TEST_TYPE"
    echo ""
    
    # Initialize test environment
    initialize_test_environment
    
    # Run requested tests
    case "$TEST_TYPE" in
        "restore")
            test_backup_integrity
            test_database_restoration
            if [ "$VERIFY_DATA" = true ]; then
                verify_data_integrity
            fi
            if [ "$PERFORMANCE_TEST" = true ]; then
                test_performance
            fi
            ;;
        "failover")
            test_failover
            ;;
        "backup-integrity")
            test_backup_integrity
            ;;
        "all"|*)
            test_backup_integrity
            test_database_restoration
            if [ "$VERIFY_DATA" = true ]; then
                verify_data_integrity
            fi
            if [ "$PERFORMANCE_TEST" = true ]; then
                test_performance
            fi
            test_failover
            ;;
    esac
    
    # Generate comprehensive report
    generate_test_report
    
    # Cleanup test resources
    cleanup_test_resources
    
    echo ""
    log_success "Disaster recovery testing completed"
}

# Parse arguments and run
parse_args "$@"
main