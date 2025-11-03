#!/bin/bash

# Container Health Check Script for Saler
# ========================================

set -e

# Configuration
PROJECT_NAME="saler"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
TIMEOUT=30
MAX_RETRIES=3
HEALTH_LOG="/var/log/saler/health/health-check.log"
ALERT_EMAIL="admin@yourdomain.com"
SLACK_WEBHOOK=""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Functions
log_info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO:${NC} $1" | tee -a "$HEALTH_LOG"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS:${NC} $1" | tee -a "$HEALTH_LOG"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$HEALTH_LOG"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$HEALTH_LOG"
}

# Create health log directory
mkdir -p /var/log/saler/health

# Health check endpoints
BACKEND_HEALTH_URL="http://localhost:8000/health"
FRONTEND_HEALTH_URL="http://localhost:80/health"
NGINX_HEALTH_URL="http://localhost/health"

# Test HTTP endpoint
test_endpoint() {
    local url="$1"
    local service_name="$2"
    local timeout="${3:-$TIMEOUT}"
    
    log_info "Testing $service_name health endpoint: $url"
    
    local start_time=$(date +%s.%N)
    
    if curl -f -s --max-time "$timeout" "$url" > /dev/null 2>&1; then
        local end_time=$(date +%s.%N)
        local response_time=$(echo "$end_time - $start_time" | bc)
        log_success "$service_name health check passed (${response_time}s)"
        return 0
    else
        log_error "$service_name health check failed"
        return 1
    fi
}

# Test database connectivity
test_database() {
    log_info "Testing database connectivity..."
    
    if docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres pg_isready -U saler &>/dev/null; then
        log_success "Database health check passed"
        return 0
    else
        log_error "Database health check failed"
        return 1
    fi
}

# Test Redis connectivity
test_redis() {
    log_info "Testing Redis connectivity..."
    
    if docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T redis redis-cli ping | grep -q PONG; then
        log_success "Redis health check passed"
        return 0
    else
        log_error "Redis health check failed"
        return 1
    fi
}

# Test container status
test_container_status() {
    local service="$1"
    local container_name="$2"
    
    log_info "Testing container status: $service"
    
    if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "$container_name.*Up"; then
        log_success "$service container is running"
        return 0
    else
        log_error "$service container is not running"
        return 1
    fi
}

# Check disk space
check_disk_space() {
    log_info "Checking disk space..."
    
    local disk_usage=$(df / | awk 'NR==2 {print $(NF-1)}' | sed 's/%//')
    
    if [ "$disk_usage" -gt 90 ]; then
        log_error "Critical disk usage: ${disk_usage}%"
        return 1
    elif [ "$disk_usage" -gt 80 ]; then
        log_warning "High disk usage: ${disk_usage}%"
        return 1
    else
        log_success "Disk usage: ${disk_usage}%"
        return 0
    fi
}

# Check memory usage
check_memory() {
    log_info "Checking memory usage..."
    
    local memory_usage=$(free | awk 'NR==2{printf "%.0f", $3/($3+$4)*100}')
    
    if [ "$memory_usage" -gt 90 ]; then
        log_error "Critical memory usage: ${memory_usage}%"
        return 1
    elif [ "$memory_usage" -gt 80 ]; then
        log_warning "High memory usage: ${memory_usage}%"
        return 1
    else
        log_success "Memory usage: ${memory_usage}%"
        return 0
    fi
}

# Check load average
check_load_average() {
    log_info "Checking system load..."
    
    local load_1min=$(uptime | awk '{print $NF}' | cut -d, -f1)
    local load_5min=$(uptime | awk '{print $NF}' | cut -d, -f2)
    local cpu_cores=$(nproc)
    
    # Check if load is too high (more than number of cores)
    local load_int=$(echo "$load_1min" | cut -d. -f1)
    
    if [ "$load_int" -gt "$cpu_cores" ]; then
        log_warning "High system load: $load_1min (1min), $load_5min (5min)"
        return 1
    else
        log_success "System load: $load_1min (1min), $load_5min (5min)"
        return 0
    fi
}

# Check SSL certificate expiry
check_ssl_certificates() {
    log_info "Checking SSL certificates..."
    
    local cert_file="/etc/nginx/ssl/cert.pem"
    
    if [ -f "$cert_file" ]; then
        local expiry_date=$(openssl x509 -enddate -noout -in "$cert_file" | cut -d= -f2)
        local expiry_timestamp=$(date -d "$expiry_date" +%s)
        local current_timestamp=$(date +%s)
        local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
        
        if [ "$days_until_expiry" -lt 7 ]; then
            log_error "SSL certificate expires in $days_until_expiry days"
            return 1
        elif [ "$days_until_expiry" -lt 30 ]; then
            log_warning "SSL certificate expires in $days_until_expiry days"
            return 1
        else
            log_success "SSL certificate valid for $days_until_expiry days"
            return 0
        fi
    else
        log_warning "SSL certificate file not found"
        return 1
    fi
}

# Check log file sizes
check_log_files() {
    log_info "Checking log file sizes..."
    
    local log_dir="/var/log/saler"
    local max_log_size=100  # MB
    
    if [ -d "$log_dir" ]; then
        local large_logs=$(find "$log_dir" -name "*.log" -size +${max_log_size}M -print)
        
        if [ ! -z "$large_logs" ]; then
            log_warning "Found large log files (>${max_log_size}MB):"
            echo "$large_logs" | while read log_file; do
                local size=$(du -h "$log_file" | cut -f1)
                log_warning "  $log_file ($size)"
            done
            return 1
        else
            log_success "All log files are within size limits"
            return 0
        fi
    else
        log_warning "Log directory not found"
        return 1
    fi
}

# Send alerts
send_alert() {
    local severity="$1"
    local message="$2"
    
    # Email alert
    if [ ! -z "$ALERT_EMAIL" ] && command -v mail &> /dev/null; then
        echo "$message" | mail -s "[$PROJECT_NAME] $severity Alert - $(date)" "$ALERT_EMAIL" 2>/dev/null || true
    fi
    
    # Slack alert
    if [ ! -z "$SLACK_WEBHOOK" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 $PROJECT_NAME $severity Alert: $message\"}" \
            "$SLACK_WEBHOOK" 2>/dev/null || true
    fi
    
    # System notification
    if command -v wall &> /dev/null; then
        echo "ALERT: $message" | wall 2>/dev/null || true
    fi
}

# Comprehensive health check
comprehensive_health_check() {
    local failed_checks=0
    local warnings=0
    
    log_info "Starting comprehensive health check..."
    
    # Check container status
    test_container_status "PostgreSQL" "saler-postgres-prod" || ((failed_checks++))
    test_container_status "Redis" "saler-redis-prod" || ((failed_checks++))
    test_container_status "Backend" "saler-backend-prod" || ((failed_checks++))
    test_container_status "Frontend" "saler-frontend-prod" || ((failed_checks++))
    test_container_status "Nginx" "saler-nginx-prod" || ((failed_checks++))
    
    # Test service endpoints
    test_endpoint "$BACKEND_HEALTH_URL" "Backend API" || ((failed_checks++))
    test_endpoint "$FRONTEND_HEALTH_URL" "Frontend" || ((failed_checks++))
    
    # Test database connectivity
    test_database || ((failed_checks++))
    
    # Test Redis connectivity
    test_redis || ((failed_checks++))
    
    # Check system resources
    check_disk_space || ((warnings++))
    check_memory || ((warnings++))
    check_load_average || ((warnings++))
    
    # Check SSL certificates
    check_ssl_certificates || ((warnings++))
    
    # Check log files
    check_log_files || ((warnings++))
    
    # Report results
    log_info "Health check completed:"
    log_info "  Failed checks: $failed_checks"
    log_info "  Warnings: $warnings"
    
    # Send alerts if needed
    if [ "$failed_checks" -gt 0 ]; then
        log_error "Health check failed with $failed_checks critical issues"
        send_alert "CRITICAL" "Health check failed with $failed_checks critical issues"
        return 1
    elif [ "$warnings" -gt 0 ]; then
        log_warning "Health check completed with $warnings warnings"
        send_alert "WARNING" "Health check completed with $warnings warnings"
        return 0
    else
        log_success "All health checks passed"
        return 0
    fi
}

# Quick health check
quick_health_check() {
    log_info "Running quick health check..."
    
    # Just test the main endpoints
    local failed=0
    
    test_endpoint "$BACKEND_HEALTH_URL" "Backend API" || ((failed++))
    test_endpoint "$FRONTEND_HEALTH_URL" "Frontend" || ((failed++))
    
    if [ "$failed" -eq 0 ]; then
        log_success "Quick health check passed"
        return 0
    else
        log_error "Quick health check failed"
        return 1
    fi
}

# Detailed health report
detailed_health_report() {
    log_info "Generating detailed health report..."
    
    local report_file="/var/log/saler/health/detailed-report-$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "Saler Health Check Report"
        echo "========================="
        echo "Date: $(date)"
        echo "Hostname: $(hostname)"
        echo "Uptime: $(uptime)"
        echo
        
        echo "Container Status:"
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep saler
        echo
        
        echo "System Resources:"
        echo "CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d% -f1)%"
        echo "Memory Usage: $(free | awk 'NR==2{printf "%.2f%%", $3/($3+$4)*100}')"
        echo "Disk Usage: $(df -h / | awk 'NR==2{print $5}')"
        echo "Load Average: $(uptime | awk '{print $NF}')"
        echo
        
        echo "Database Status:"
        docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres pg_isready -U saler 2>/dev/null || echo "Database not ready"
        echo
        
        echo "Redis Status:"
        docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T redis redis-cli ping 2>/dev/null || echo "Redis not ready"
        echo
        
        echo "Recent Logs (last 10 lines):"
        echo "Backend:"
        docker-compose -f "$DOCKER_COMPOSE_FILE" logs --tail=10 backend 2>/dev/null | tail -10
        echo
        
        echo "Recent Errors:"
        journalctl -u docker --since "1 hour ago" --no-pager | grep -i error | tail -5 || echo "No recent errors"
        
    } > "$report_file"
    
    log_success "Detailed health report saved to: $report_file"
}

# Monitor specific service
monitor_service() {
    local service="$1"
    local max_failures="${2:-3}"
    local failures=0
    
    log_info "Starting monitoring for $service (max failures: $max_failures)"
    
    while true; do
        case "$service" in
            "backend")
                if ! test_endpoint "$BACKEND_HEALTH_URL" "Backend API" 10; then
                    ((failures++))
                    log_error "Backend health check failed (attempt $failures/$max_failures)"
                    
                    if [ "$failures" -ge "$max_failures" ]; then
                        send_alert "CRITICAL" "Backend service health check failed $max_failures times"
                        
                        # Try to restart backend
                        log_info "Attempting to restart backend service..."
                        docker-compose -f "$DOCKER_COMPOSE_FILE" restart backend
                        
                        # Reset failure counter after restart attempt
                        failures=0
                    fi
                else
                    if [ "$failures" -gt 0 ]; then
                        log_success "Backend service recovered"
                        failures=0
                    fi
                fi
                ;;
            "frontend")
                if ! test_endpoint "$FRONTEND_HEALTH_URL" "Frontend" 10; then
                    ((failures++))
                    log_error "Frontend health check failed (attempt $failures/$max_failures)"
                    
                    if [ "$failures" -ge "$max_failures" ]; then
                        send_alert "CRITICAL" "Frontend service health check failed $max_failures times"
                        failures=0
                    fi
                else
                    if [ "$failures" -gt 0 ]; then
                        log_success "Frontend service recovered"
                        failures=0
                    fi
                fi
                ;;
            *)
                log_error "Unknown service: $service"
                break
                ;;
        esac
        
        sleep 30  # Check every 30 seconds
    done
}

# Cleanup old log files
cleanup_logs() {
    log_info "Cleaning up old health check logs..."
    
    find /var/log/saler/health/ -name "*.log" -mtime +7 -delete 2>/dev/null || true
    find /var/log/saler/health/ -name "detailed-report-*" -mtime +30 -delete 2>/dev/null || true
    
    log_success "Log cleanup completed"
}

# Main function
main() {
    echo "============================================"
    echo "     SALER CONTAINER HEALTH CHECK SCRIPT"
    echo "============================================"
    echo
    
    # Parse command line arguments
    COMMAND="check"
    SERVICE=""
    MAX_FAILURES=3
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            check|comprehensive)
                COMMAND="check"
                shift
                ;;
            quick)
                COMMAND="quick"
                shift
                ;;
            monitor)
                COMMAND="monitor"
                shift
                if [[ $# -gt 0 ]]; then
                    SERVICE="$1"
                    shift
                fi
                ;;
            report)
                COMMAND="report"
                shift
                ;;
            cleanup)
                COMMAND="cleanup"
                shift
                ;;
            --max-failures)
                MAX_FAILURES="$2"
                shift 2
                ;;
            --help|-h)
                echo "Usage: $0 [command] [options]"
                echo
                echo "Commands:"
                echo "  check, comprehensive    Run comprehensive health check"
                echo "  quick                   Run quick health check"
                echo "  monitor <service>       Monitor specific service continuously"
                echo "  report                  Generate detailed health report"
                echo "  cleanup                 Clean up old log files"
                echo
                echo "Options:"
                echo "  --max-failures N        Max failures before alert (default: 3)"
                echo "  --help, -h             Show this help"
                echo
                echo "Examples:"
                echo "  $0 check"
                echo "  $0 quick"
                echo "  $0 monitor backend"
                echo "  $0 monitor backend --max-failures 5"
                echo "  $0 report"
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Execute command
    case $COMMAND in
        check)
            comprehensive_health_check
            ;;
        quick)
            quick_health_check
            ;;
        monitor)
            if [ -z "$SERVICE" ]; then
                log_error "Service name required for monitoring"
                echo "Usage: $0 monitor <service>"
                exit 1
            fi
            monitor_service "$SERVICE" "$MAX_FAILURES"
            ;;
        report)
            detailed_health_report
            ;;
        cleanup)
            cleanup_logs
            ;;
    esac
}

# Run main function
main "$@"