#!/bin/bash

# CARE COLLECTIVE MONITORING DAEMON
# Enterprise-grade continuous monitoring with real-time alerting
# Version: 5.0 (Enterprise Operations)
#
# Usage: ./scripts/monitoring-daemon.sh [options]
# Options:
#   --interval=SECONDS   Monitoring interval in seconds [default: 30]
#   --config=FILE        Configuration file [default: auto-detect]
#   --log-level=LEVEL    Log level (debug|info|warn|error) [default: info]
#   --dry-run           Show what would be monitored without sending alerts
#   --daemon            Run as background daemon
#   --stop              Stop running daemon
#   --status            Show daemon status
#   --help              Show help message

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="/var/log/care-collective"
PID_FILE="/var/run/care-collective-monitoring.pid"
LOCK_FILE="/var/lock/care-collective-monitoring.lock"

# Default settings
MONITORING_INTERVAL=30
LOG_LEVEL="info"
DRY_RUN=false
RUN_AS_DAEMON=false
CONFIG_FILE=""

# Performance thresholds
HEALTH_SCORE_CRITICAL=60
HEALTH_SCORE_WARNING=75
MAX_SLOW_QUERIES=3
MAX_ACTIVE_CONNECTIONS=20
MAX_CRITICAL_REQUESTS=8
MAX_UNCONFIRMED_EXCHANGES=5

# Alert cooldown (seconds) - prevent spam
declare -A ALERT_COOLDOWN
COOLDOWN_DURATION=300  # 5 minutes

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_debug() {
    [[ "$LOG_LEVEL" == "debug" ]] && echo -e "${BLUE}[DEBUG]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1" >&2
}

log_info() {
    [[ "$LOG_LEVEL" =~ ^(debug|info)$ ]] && echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1" >&2
}

log_warn() {
    [[ "$LOG_LEVEL" =~ ^(debug|info|warn)$ ]] && echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1" >&2
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1" >&2
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --interval=*)
                MONITORING_INTERVAL="${1#*=}"
                shift
                ;;
            --config=*)
                CONFIG_FILE="${1#*=}"
                shift
                ;;
            --log-level=*)
                LOG_LEVEL="${1#*=}"
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --daemon)
                RUN_AS_DAEMON=true
                shift
                ;;
            --stop)
                stop_daemon
                exit 0
                ;;
            --status)
                show_status
                exit 0
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
Care Collective Monitoring Daemon v5.0
Enterprise-grade continuous monitoring with real-time alerting

Usage: $0 [options]

Options:
  --interval=SECONDS   Monitoring interval in seconds [default: 30]
  --config=FILE        Configuration file [default: auto-detect]
  --log-level=LEVEL    Log level (debug|info|warn|error) [default: info]
  --dry-run           Show what would be monitored without sending alerts
  --daemon            Run as background daemon
  --stop              Stop running daemon
  --status            Show daemon status
  --help              Show help message

Monitoring Targets:
  • Database health score (target: >75)
  • Query performance (slow queries, connections)
  • Care Collective metrics (help requests, contact exchanges)
  • Security monitoring (RLS violations, failed operations)
  • Platform status (critical requests, moderation backlog)

Alert Channels:
  • Slack webhooks (if SLACK_WEBHOOK_URL configured)
  • Email notifications (if ALERT_EMAIL configured)
  • System logs (always enabled)
  • Database alert history (always enabled)

Environment Variables:
  SLACK_WEBHOOK_URL      Slack webhook for notifications
  ALERT_EMAIL           Email address for critical alerts
  DATABASE_URL          PostgreSQL connection string
  LOG_LEVEL             Override default log level

Examples:
  $0                              # Run monitoring with default settings
  $0 --daemon --interval=60       # Run as daemon with 1-minute intervals
  $0 --dry-run --log-level=debug  # Test mode with verbose output
  $0 --stop                       # Stop running daemon

EOF
}

# Check if daemon is already running
check_running() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            return 0  # Running
        else
            # Stale PID file
            rm -f "$PID_FILE"
            return 1  # Not running
        fi
    fi
    return 1  # Not running
}

# Stop running daemon
stop_daemon() {
    if check_running; then
        local pid=$(cat "$PID_FILE")
        log_info "Stopping monitoring daemon (PID: $pid)..."
        
        if kill "$pid" 2>/dev/null; then
            # Wait for process to stop
            local timeout=10
            while [ $timeout -gt 0 ] && kill -0 "$pid" 2>/dev/null; do
                sleep 1
                ((timeout--))
            done
            
            if kill -0 "$pid" 2>/dev/null; then
                log_warn "Daemon didn't stop gracefully, forcing termination"
                kill -9 "$pid" 2>/dev/null || true
            fi
        fi
        
        rm -f "$PID_FILE" "$LOCK_FILE"
        log_info "Monitoring daemon stopped"
    else
        log_info "Monitoring daemon is not running"
    fi
}

# Show daemon status
show_status() {
    if check_running; then
        local pid=$(cat "$PID_FILE")
        log_info "Monitoring daemon is running (PID: $pid)"
        
        # Show recent activity
        if [ -f "$LOG_DIR/monitoring.log" ]; then
            echo ""
            echo "Recent activity:"
            tail -5 "$LOG_DIR/monitoring.log"
        fi
    else
        log_info "Monitoring daemon is not running"
    fi
}

# Initialize environment
initialize_environment() {
    log_info "Initializing monitoring environment..."
    
    # Create log directory
    if [ ! -d "$LOG_DIR" ]; then
        mkdir -p "$LOG_DIR"
        log_debug "Created log directory: $LOG_DIR"
    fi
    
    # Check database connectivity
    if ! psql -c "SELECT 1;" &>/dev/null; then
        log_error "Cannot connect to database. Check DATABASE_URL environment variable."
        exit 1
    fi
    
    # Verify monitoring infrastructure
    if ! psql -c "SELECT calculate_health_score();" &>/dev/null; then
        log_error "Monitoring functions not found. Run 'psql -f scripts/monitoring-setup.sql' first."
        exit 1
    fi
    
    log_info "Environment initialization complete"
}

# Check if alert is in cooldown period
is_alert_in_cooldown() {
    local alert_key="$1"
    local current_time=$(date +%s)
    local last_alert=${ALERT_COOLDOWN[$alert_key]:-0}
    
    if [ $((current_time - last_alert)) -lt $COOLDOWN_DURATION ]; then
        return 0  # In cooldown
    else
        return 1  # Not in cooldown
    fi
}

# Mark alert as sent (for cooldown tracking)
mark_alert_sent() {
    local alert_key="$1"
    ALERT_COOLDOWN[$alert_key]=$(date +%s)
}

# Send alert notification
send_alert() {
    local severity="$1"
    local message="$2"
    local alert_key="$3"
    local metric_value="${4:-}"
    local threshold="${5:-}"
    
    # Check cooldown
    if is_alert_in_cooldown "$alert_key"; then
        log_debug "Alert in cooldown, skipping: $alert_key"
        return 0
    fi
    
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local full_message="[$severity] $message"
    
    if [ -n "$metric_value" ] && [ -n "$threshold" ]; then
        full_message="$full_message (Value: $metric_value, Threshold: $threshold)"
    fi
    
    log_warn "ALERT: $full_message"
    
    # Log to file
    echo "$timestamp [$severity] $message" >> "$LOG_DIR/monitoring.log"
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Would send alert - $full_message"
        return 0
    fi
    
    # Log to database
    psql -c "SELECT log_alert('${alert_key}', '${severity}', '${message}', ${metric_value:-NULL}, ${threshold:-NULL});" &>/dev/null || log_warn "Failed to log alert to database"
    
    # Send Slack notification
    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        local slack_emoji=""
        case "$severity" in
            "CRITICAL") slack_emoji="🚨" ;;
            "HIGH") slack_emoji="⚠️" ;;
            "MEDIUM") slack_emoji="📊" ;;
            *) slack_emoji="ℹ️" ;;
        esac
        
        local slack_payload=$(cat << EOF
{
  "text": "${slack_emoji} Care Collective Alert",
  "attachments": [
    {
      "color": "$( case "$severity" in CRITICAL) echo "danger" ;; HIGH) echo "warning" ;; *) echo "good" ;; esac )",
      "fields": [
        {"title": "Severity", "value": "$severity", "short": true},
        {"title": "Timestamp", "value": "$timestamp", "short": true},
        {"title": "Message", "value": "$message", "short": false}
      ]
    }
  ]
}
EOF
        )
        
        if curl -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-type: application/json' \
            -d "$slack_payload" \
            --silent --max-time 10 &>/dev/null; then
            log_debug "Slack notification sent"
        else
            log_warn "Failed to send Slack notification"
        fi
    fi
    
    # Send email notification for critical alerts
    if [ "$severity" = "CRITICAL" ] && [ -n "${ALERT_EMAIL:-}" ]; then
        if command -v mail &>/dev/null; then
            echo "$full_message" | mail -s "Care Collective Critical Alert" "$ALERT_EMAIL" &>/dev/null || \
                log_warn "Failed to send email notification"
        fi
    fi
    
    # Mark alert as sent
    mark_alert_sent "$alert_key"
}

# Check database health score
check_health_score() {
    log_debug "Checking database health score..."
    
    local health_score
    health_score=$(psql -t -c "SELECT calculate_health_score();" 2>/dev/null | tr -d ' ')
    
    if [ -z "$health_score" ] || ! [[ "$health_score" =~ ^[0-9]+$ ]]; then
        send_alert "CRITICAL" "Unable to calculate database health score" "health_score_error"
        return 1
    fi
    
    log_debug "Health score: $health_score/100"
    
    if [ "$health_score" -lt $HEALTH_SCORE_CRITICAL ]; then
        send_alert "CRITICAL" "Database health score critical: $health_score/100" "health_score_critical" "$health_score" "$HEALTH_SCORE_CRITICAL"
    elif [ "$health_score" -lt $HEALTH_SCORE_WARNING ]; then
        send_alert "HIGH" "Database health score warning: $health_score/100" "health_score_warning" "$health_score" "$HEALTH_SCORE_WARNING"
    fi
    
    # Store metric for dashboard
    echo "$health_score" > "$LOG_DIR/health_score.metric"
}

# Check database performance
check_database_performance() {
    log_debug "Checking database performance..."
    
    # Check slow queries
    local slow_queries
    slow_queries=$(psql -t -c "SELECT COUNT(*) FROM pg_stat_activity WHERE query_start < NOW() - INTERVAL '30 seconds' AND state = 'active';" 2>/dev/null | tr -d ' ')
    
    if [ -n "$slow_queries" ] && [ "$slow_queries" -gt $MAX_SLOW_QUERIES ]; then
        send_alert "CRITICAL" "Multiple slow queries detected: $slow_queries queries >30s" "slow_queries" "$slow_queries" "$MAX_SLOW_QUERIES"
    fi
    
    # Check active connections
    local active_connections
    active_connections=$(psql -t -c "SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active';" 2>/dev/null | tr -d ' ')
    
    if [ -n "$active_connections" ] && [ "$active_connections" -gt $MAX_ACTIVE_CONNECTIONS ]; then
        send_alert "HIGH" "High number of active connections: $active_connections" "active_connections" "$active_connections" "$MAX_ACTIVE_CONNECTIONS"
    fi
    
    # Check lock contention
    local waiting_locks
    waiting_locks=$(psql -t -c "SELECT COUNT(*) FROM pg_locks WHERE NOT granted;" 2>/dev/null | tr -d ' ')
    
    if [ -n "$waiting_locks" ] && [ "$waiting_locks" -gt 3 ]; then
        send_alert "HIGH" "Lock contention detected: $waiting_locks waiting locks" "lock_contention" "$waiting_locks" "3"
    fi
    
    log_debug "Performance check complete: slow_queries=$slow_queries, active_connections=$active_connections, waiting_locks=$waiting_locks"
}

# Check Care Collective specific metrics
check_platform_metrics() {
    log_debug "Checking Care Collective platform metrics..."
    
    # Check critical help requests
    local critical_requests
    critical_requests=$(psql -t -c "SELECT COUNT(*) FROM help_requests WHERE status = 'open' AND urgency = 'critical';" 2>/dev/null | tr -d ' ')
    
    if [ -n "$critical_requests" ] && [ "$critical_requests" -gt $MAX_CRITICAL_REQUESTS ]; then
        send_alert "HIGH" "High number of critical help requests: $critical_requests" "critical_requests" "$critical_requests" "$MAX_CRITICAL_REQUESTS"
    fi
    
    # Check unconfirmed contact exchanges (privacy concern)
    local unconfirmed_exchanges
    unconfirmed_exchanges=$(psql -t -c "SELECT COUNT(*) FROM contact_exchanges WHERE confirmed_at IS NULL AND exchanged_at < NOW() - INTERVAL '24 hours';" 2>/dev/null | tr -d ' ')
    
    if [ -n "$unconfirmed_exchanges" ] && [ "$unconfirmed_exchanges" -gt $MAX_UNCONFIRMED_EXCHANGES ]; then
        send_alert "HIGH" "Privacy concern: $unconfirmed_exchanges unconfirmed contact exchanges" "privacy_concern" "$unconfirmed_exchanges" "$MAX_UNCONFIRMED_EXCHANGES"
    fi
    
    # Check moderation backlog
    local pending_moderation
    pending_moderation=$(psql -t -c "SELECT COUNT(*) FROM messages WHERE is_flagged = true AND moderation_status = 'pending';" 2>/dev/null | tr -d ' ')
    
    if [ -n "$pending_moderation" ] && [ "$pending_moderation" -gt 10 ]; then
        send_alert "MEDIUM" "Moderation backlog: $pending_moderation messages pending review" "moderation_backlog" "$pending_moderation" "10"
    fi
    
    log_debug "Platform check complete: critical_requests=$critical_requests, unconfirmed_exchanges=$unconfirmed_exchanges, pending_moderation=$pending_moderation"
}

# Check critical alerts from database
check_critical_alerts() {
    log_debug "Checking for critical alerts..."
    
    local critical_alerts
    critical_alerts=$(psql -t -c "SELECT COUNT(*) FROM check_critical_alerts() WHERE severity = 'CRITICAL';" 2>/dev/null | tr -d ' ')
    
    if [ -n "$critical_alerts" ] && [ "$critical_alerts" -gt 0 ]; then
        # Get alert details
        local alert_details
        alert_details=$(psql -t -c "SELECT alert_type || ': ' || message FROM check_critical_alerts() WHERE severity = 'CRITICAL' LIMIT 3;" 2>/dev/null)
        
        send_alert "CRITICAL" "Database critical alerts detected: $alert_details" "db_critical_alerts" "$critical_alerts" "0"
    fi
    
    log_debug "Critical alerts check complete: $critical_alerts alerts"
}

# Run automated maintenance if needed
run_automated_maintenance() {
    log_debug "Checking if automated maintenance is needed..."
    
    # Check for tables needing vacuum
    local tables_needing_vacuum
    tables_needing_vacuum=$(psql -t -c "SELECT COUNT(*) FROM pg_stat_user_tables WHERE schemaname = 'public' AND n_dead_tup::numeric / GREATEST(n_live_tup, 1) > 0.3;" 2>/dev/null | tr -d ' ')
    
    if [ -n "$tables_needing_vacuum" ] && [ "$tables_needing_vacuum" -gt 0 ]; then
        log_info "Running automated maintenance for $tables_needing_vacuum tables..."
        
        if [ "$DRY_RUN" = false ]; then
            local maintenance_result
            maintenance_result=$(psql -t -c "SELECT automated_maintenance_response();" 2>/dev/null)
            log_info "Maintenance completed: $maintenance_result"
        else
            log_info "DRY RUN: Would run automated maintenance"
        fi
    fi
}

# Main monitoring loop
monitoring_loop() {
    log_info "Starting monitoring loop (interval: ${MONITORING_INTERVAL}s)"
    
    local iteration=0
    while true; do
        ((iteration++))
        log_debug "Monitoring iteration #$iteration"
        
        # Core checks
        check_health_score
        check_database_performance
        check_platform_metrics
        check_critical_alerts
        
        # Run maintenance every 10 iterations (reduce frequency)
        if [ $((iteration % 10)) -eq 0 ]; then
            run_automated_maintenance
        fi
        
        # Store last check timestamp
        date +%s > "$LOG_DIR/last_check.timestamp"
        
        sleep "$MONITORING_INTERVAL"
    done
}

# Setup daemon mode
setup_daemon() {
    # Check if already running
    if check_running; then
        log_error "Monitoring daemon is already running"
        exit 1
    fi
    
    # Create lock file
    (
        flock -n 9 || { log_error "Another instance is starting"; exit 1; }
        
        # Redirect output to log file
        exec >> "$LOG_DIR/daemon.log" 2>&1
        
        # Write PID file
        echo $$ > "$PID_FILE"
        
        # Setup signal handlers
        trap 'log_info "Received SIGTERM, shutting down..."; rm -f "$PID_FILE" "$LOCK_FILE"; exit 0' TERM
        trap 'log_info "Received SIGINT, shutting down..."; rm -f "$PID_FILE" "$LOCK_FILE"; exit 0' INT
        
        log_info "Monitoring daemon started (PID: $$)"
        
        # Run monitoring loop
        monitoring_loop
        
    ) 9>"$LOCK_FILE"
}

# Main function
main() {
    echo "🔍 Care Collective Monitoring Daemon v5.0"
    echo "========================================"
    
    if [ "$DRY_RUN" = true ]; then
        echo "Running in DRY RUN mode - no alerts will be sent"
    fi
    
    # Initialize environment
    initialize_environment
    
    if [ "$RUN_AS_DAEMON" = true ]; then
        setup_daemon
    else
        log_info "Running monitoring checks (not as daemon)..."
        check_health_score
        check_database_performance
        check_platform_metrics
        check_critical_alerts
        log_info "Monitoring checks completed"
    fi
}

# Parse arguments and run
parse_args "$@"
main